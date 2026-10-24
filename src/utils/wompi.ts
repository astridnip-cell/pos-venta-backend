/**
 * Utilidades para la pasarela de pagos Wompi (Colombia).
 *
 * Las llaves se leen de variables de entorno (archivo .env), nunca del código:
 *   WOMPI_PUBLIC_KEY        llave pública (pub_test_... en pruebas)
 *   WOMPI_INTEGRITY_SECRET  secreto de integridad (firma del pago)
 *   WOMPI_EVENTS_SECRET     secreto de eventos (valida la confirmación de Wompi)
 *   WOMPI_ENV               "sandbox" (por defecto) o "production"
 */
import crypto from 'crypto';

const CURRENCY = 'COP';

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function isWompiConfigured(): boolean {
  return Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET);
}

function apiBase(): string {
  return process.env.WOMPI_ENV === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

/** Firma de integridad: SHA256(referencia + monto en centavos + moneda + secreto). */
export function integritySignature(reference: string, amountInCents: number): string {
  return sha256(`${reference}${amountInCents}${CURRENCY}${process.env.WOMPI_INTEGRITY_SECRET}`);
}

/** Construye la dirección a la que se envía al cliente para pagar. */
export function buildCheckoutUrl(opts: {
  reference: string;
  totalCop: number;
  redirectUrl: string;
}): string {
  const amountInCents = Math.round(opts.totalCop * 100);
  const params = new URLSearchParams({
    'public-key': String(process.env.WOMPI_PUBLIC_KEY),
    currency: CURRENCY,
    'amount-in-cents': String(amountInCents),
    reference: opts.reference,
    'signature:integrity': integritySignature(opts.reference, amountInCents),
    'redirect-url': opts.redirectUrl,
  });
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

/** Consulta a Wompi el estado real de una transacción. */
export async function fetchTransaction(transactionId: string): Promise<any> {
  const res = await fetch(`${apiBase()}/transactions/${encodeURIComponent(transactionId)}`);
  if (!res.ok) throw new Error(`Wompi respondió ${res.status}`);
  const json: any = await res.json();
  return json?.data;
}

/**
 * Valida que un evento recibido realmente venga de Wompi.
 * checksum = SHA256(valores de signature.properties en orden + timestamp + secreto de eventos)
 */
export function verifyEventChecksum(event: any): boolean {
  const properties = event?.signature?.properties;
  const checksum = event?.signature?.checksum;
  if (!Array.isArray(properties) || !checksum || event?.timestamp === undefined) return false;
  if (!process.env.WOMPI_EVENTS_SECRET) return false;

  const values = properties
    .map((path: string) => path.split('.').reduce((obj: any, key: string) => obj?.[key], event.data))
    .map((v: any) => (v === undefined || v === null ? '' : String(v)))
    .join('');

  const expected = sha256(`${values}${event.timestamp}${process.env.WOMPI_EVENTS_SECRET}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(checksum));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Traduce el estado de Wompi al estado de pago de nuestros pedidos. */
export function paymentStatusFromWompi(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'DECLINED':
      return 'declined';
    case 'VOIDED':
      return 'voided';
    case 'ERROR':
      return 'error';
    default:
      return 'pending';
  }
}
