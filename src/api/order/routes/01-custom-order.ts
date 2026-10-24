/**
 * Rutas personalizadas de pedidos.
 * El prefijo "01-" hace que se carguen antes que las rutas automáticas
 * (/orders/:id), para que "mine" y "checkout" no se confundan con un id.
 */
export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/checkout',
      handler: 'order.checkout',
    },
    {
      method: 'GET',
      path: '/orders/mine',
      handler: 'order.mine',
    },
    {
      method: 'GET',
      path: '/orders/verify/:transactionId',
      handler: 'order.verify',
    },
    {
      // Wompi llama a esta ruta sin sesión; se valida con la firma del evento.
      method: 'POST',
      path: '/orders/wompi-webhook',
      handler: 'order.wompiWebhook',
      config: {
        auth: false,
      },
    },
  ],
};
