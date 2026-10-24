/**
 * order controller
 *
 * Acciones propias:
 *   checkout       crea el pedido (precios calculados en el servidor) y devuelve la dirección de pago
 *   mine           lista los pedidos del cliente con sesión iniciada
 *   verify         consulta a Wompi el resultado de un pago y actualiza el pedido
 *   wompiWebhook   confirmación automática de Wompi (validada con firma)
 */

import { factories } from '@strapi/strapi';
import {
  buildCheckoutUrl,
  fetchTransaction,
  isWompiConfigured,
  paymentStatusFromWompi,
  verifyEventChecksum,
} from '../../../utils/wompi';

const PRODUCT_UID = 'api::product.product';
const ORDER_UID = 'api::order.order';

// Reglas de envío (se pueden cambiar con variables de entorno)
const SHIPPING_FREE_FROM = Number(process.env.SHIPPING_FREE_FROM ?? 150000);
const SHIPPING_COST = Number(process.env.SHIPPING_COST ?? 12000);
const MAX_QTY_PER_LINE = 20;
const MAX_LINES = 50;

// Las tallas y colores pueden venir como lista o como texto JSON (así los guarda el seed).
function toList(value: any): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toItems(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Resumen del pedido que se le muestra al cliente (sin datos internos).
function publicOrder(order: any) {
  return {
    orderNumber: order.orderNumber,
    statusOrder: order.statusOrder,
    paymentStatus: order.paymentStatus,
    subtotal: Number(order.subtotal ?? 0),
    shippingCost: Number(order.shippingCost ?? 0),
    total: Number(order.total ?? 0),
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    items: toItems(order.items),
    createdAt: order.createdAt,
  };
}

// Baja el stock de forma atómica y recalcula la alerta de stock bajo.
async function decrementStock(strapi: any, items: any[]) {
  const meta = strapi.db.metadata.get(PRODUCT_UID);
  const table = meta.tableName;
  const stockColumn = meta.attributes.stock?.columnName ?? 'stock';
  const documentColumn = meta.attributes.documentId?.columnName ?? 'document_id';
  const query = strapi.db.query(PRODUCT_UID);

  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (!item?.productId || !Number.isInteger(quantity) || quantity < 1) continue;

    await strapi.db
      .connection(table)
      .where(documentColumn, item.productId)
      .decrement(stockColumn, quantity);

    // Nunca dejar el stock en negativo
    await query.updateMany({
      where: { documentId: item.productId, stock: { $lt: 0 } },
      data: { stock: 0 },
    });

    const product = await query.findOne({ where: { documentId: item.productId } });
    if (product) {
      await query.updateMany({
        where: { documentId: item.productId },
        data: { alerta_stock: Number(product.stock ?? 0) <= Number(product.stock_minimo ?? 10) },
      });
    }
  }
}

// Aplica el resultado de un pago al pedido. Es seguro llamarla varias veces:
// el stock solo baja la primera vez que el pedido pasa a "approved".
async function applyPaymentResult(strapi: any, order: any, transaction: any) {
  const paymentStatus = paymentStatusFromWompi(transaction.status);
  const approved = paymentStatus === 'approved';

  const data: any = { paymentStatus, wompiTransactionId: String(transaction.id) };
  if (approved) data.statusOrder = 'paid';

  const result = await strapi.db.query(ORDER_UID).updateMany({
    where: {
      documentId: order.documentId,
      $or: [{ paymentStatus: { $ne: 'approved' } }, { paymentStatus: null }],
    },
    data,
  });

  if (approved && result?.count > 0) {
    await decrementStock(strapi, toItems(order.items));
  }
}

function amountMatches(order: any, transaction: any): boolean {
  return Math.round(Number(order.total) * 100) === Number(transaction.amount_in_cents);
}

export default factories.createCoreController(ORDER_UID, ({ strapi }) => ({
  async checkout(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Debes iniciar sesión para comprar.');

    if (!isWompiConfigured()) {
      strapi.log.error('Wompi no está configurado: faltan WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET en .env');
      return ctx.internalServerError('La pasarela de pagos no está configurada.');
    }

    const { items, shipping } = (ctx.request.body ?? {}) as any;

    if (!Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('El carrito está vacío.');
    }
    if (items.length > MAX_LINES) {
      return ctx.badRequest('El carrito tiene demasiadas prendas.');
    }

    const name = String(shipping?.name ?? '').trim();
    const phone = String(shipping?.phone ?? '').trim();
    const address = String(shipping?.address ?? '').trim();
    const city = String(shipping?.city ?? '').trim();
    if (!name || !phone || !address || !city) {
      return ctx.badRequest('Faltan datos de envío: nombre, teléfono, dirección y ciudad.');
    }

    // 1. Armar las líneas con datos y precios leídos de la base de datos (nunca del navegador)
    const lines: any[] = [];
    const requestedByProduct = new Map<string, number>();

    for (const raw of items) {
      const quantity = Number(raw?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
        return ctx.badRequest('La cantidad de una prenda no es válida.');
      }

      const product: any = await (strapi as any).documents(PRODUCT_UID).findOne({
        documentId: String(raw?.productId ?? ''),
        status: 'published',
      });
      if (!product) {
        return ctx.badRequest('Una de las prendas ya no está disponible.');
      }

      const sizes = toList(product.sizes);
      const colors = toList(product.colors);
      const size = raw?.size ? String(raw.size) : null;
      const color = raw?.color ? String(raw.color) : null;

      if (sizes.length > 0 && (!size || !sizes.includes(size))) {
        return ctx.badRequest(`Elige una talla válida para ${product.name}.`);
      }
      if (colors.length > 0 && (!color || !colors.includes(color))) {
        return ctx.badRequest(`Elige un color válido para ${product.name}.`);
      }

      const totalRequested = (requestedByProduct.get(product.documentId) ?? 0) + quantity;
      requestedByProduct.set(product.documentId, totalRequested);
      if (Number(product.stock ?? 0) < totalRequested) {
        return ctx.badRequest(`No hay suficiente stock de ${product.name}.`);
      }

      const price = Number(product.price);
      if (!Number.isFinite(price) || price <= 0) {
        return ctx.badRequest(`${product.name} no tiene un precio válido.`);
      }

      lines.push({
        productId: product.documentId,
        name: product.name,
        price,
        quantity,
        size,
        color,
      });
    }

    // 2. Totales
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const shippingCost = subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost;

    // 3. Crear el pedido (queda pendiente de pago)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 100)}`;

    await (strapi as any).documents(ORDER_UID).create({
      data: {
        orderNumber,
        reference: orderNumber,
        statusOrder: 'pending',
        paymentStatus: 'pending',
        subtotal,
        shippingCost,
        total,
        customerName: name,
        customerEmail: user.email,
        customerPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        items: lines,
        user: user.documentId,
      },
      status: 'published',
    });

    // 4. Dirección de pago en Wompi
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const checkoutUrl = buildCheckoutUrl({
      reference: orderNumber,
      totalCop: total,
      redirectUrl: `${frontendUrl}/gracias?ref=${encodeURIComponent(orderNumber)}`,
    });

    return ctx.send({ orderNumber, subtotal, shippingCost, total, checkoutUrl });
  },

  async mine(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Debes iniciar sesión.');

    const orders: any[] = await (strapi as any).documents(ORDER_UID).findMany({
      filters: { user: { id: user.id } },
      sort: 'createdAt:desc',
      status: 'published',
      limit: 100,
    });

    return ctx.send({ data: orders.map(publicOrder) });
  },

  async verify(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Debes iniciar sesión.');

    let transaction: any;
    try {
      transaction = await fetchTransaction(String(ctx.params.transactionId));
    } catch (error) {
      strapi.log.error(`No se pudo consultar la transacción en Wompi: ${error}`);
      return ctx.internalServerError('No se pudo consultar el pago. Intenta de nuevo en unos segundos.');
    }
    if (!transaction?.reference) return ctx.notFound('No se encontró el pago.');

    const order: any = await (strapi as any).documents(ORDER_UID).findFirst({
      filters: { reference: transaction.reference },
      status: 'published',
      populate: { user: true },
    });
    if (!order) return ctx.notFound('No se encontró el pedido de este pago.');
    if (order.user?.id !== user.id) return ctx.forbidden('Este pedido no es tuyo.');

    if (!amountMatches(order, transaction)) {
      strapi.log.error(`El monto del pago no coincide con el pedido ${order.orderNumber}`);
      return ctx.badRequest('El monto del pago no coincide con el pedido.');
    }

    await applyPaymentResult(strapi, order, transaction);

    const updated: any = await (strapi as any).documents(ORDER_UID).findOne({
      documentId: order.documentId,
      status: 'published',
    });
    return ctx.send({ data: publicOrder(updated) });
  },

  async wompiWebhook(ctx) {
    const event: any = ctx.request.body;

    if (!verifyEventChecksum(event)) {
      strapi.log.warn('Evento de Wompi rechazado: la firma no es válida.');
      return ctx.unauthorized('Firma no válida.');
    }

    if (event.event === 'transaction.updated' && event.data?.transaction?.reference) {
      const transaction = event.data.transaction;
      const order: any = await (strapi as any).documents(ORDER_UID).findFirst({
        filters: { reference: transaction.reference },
        status: 'published',
      });

      if (order && amountMatches(order, transaction)) {
        await applyPaymentResult(strapi, order, transaction);
      } else {
        strapi.log.warn(`Evento de Wompi sin pedido o con monto distinto: ${transaction.reference}`);
      }
    }

    // Wompi solo necesita un 200 para dejar de reintentar
    return ctx.send({ ok: true });
  },
}));
