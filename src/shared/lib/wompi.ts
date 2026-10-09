import "server-only";
import { createHash } from "node:crypto";

/**
 * Public Wompi checkout configuration for a pending payment.
 * The redirect URL is null for non-public app URLs (localhost over http),
 * which Wompi's edge firewall rejects as a redirect target.
 */
export interface WompiCheckoutConfig {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  integritySignature: string;
  redirectUrl: string | null;
}

/**
 * Minimal subset of a Wompi `transaction.updated` event.
 */
export interface WompiTransactionEvent {
  event: string;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
  data: {
    transaction: {
      id: string;
      reference?: string | null;
      status: string;
      amountInCents?: number;
      amount_in_cents?: number;
      currency?: string;
      paymentMethodType?: string;
      payment_method_type?: string;
      customerEmail?: string;
      customer_email?: string;
    };
  };
}

/**
 * Reads a nested value from an object using a camelCase or snake_case path.
 *
 * @param source Event payload to read from.
 * @param path Dot-separated path such as `transaction.id`.
 * @returns The found value or undefined.
 */
function readPath(source: unknown, path: string): unknown {
  const normalized = path.replace(/^transaction\./, "").replace(/^data\.transaction\./, "");
  const camelAliases: Record<string, string[]> = {
    id: ["id"],
    status: ["status"],
    amountInCents: ["amountInCents", "amount_in_cents"],
    currency: ["currency"],
  };
  const candidates = camelAliases[normalized] ?? [normalized];
  if (source === null || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const candidate of candidates) {
    if (record[candidate] !== undefined) return record[candidate];
  }
  return undefined;
}

/**
 * Builds the Widget integrity signature.
 * Wompi docs: SHA256("<reference><amountInCents><currency><integritySecret>").
 *
 * @param reference Unique payment reference stored in `Pago.referencia`.
 * @param amountInCents Total in cents (COP * 100).
 * @param currency Always COP for Colombia.
 * @param integritySecret Wompi integrity secret (dashboard, sandbox for now).
 * @returns Lowercase hex SHA256 digest.
 */
export function buildIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integritySecret}`)
    .digest("hex");
}

/**
 * Validates a Wompi event checksum.
 * Wompi docs: SHA256(concat(signature.properties values in order) + timestamp + eventsSecret).
 *
 * @param payload Parsed JSON body of the webhook event.
 * @param eventsSecret Wompi events secret configured in the dashboard.
 * @returns True when the checksum matches.
 */
export function isValidEventChecksum(payload: WompiTransactionEvent, eventsSecret: string): boolean {
  const properties = payload?.signature?.properties ?? [];
  const transaction = payload?.data?.transaction;
  if (!transaction || properties.length === 0) return false;
  const values = properties.map((property) => String(readPath(transaction, property) ?? ""));
  const base = `${values.join("")}${payload.timestamp}${eventsSecret}`;
  const computed = createHash("sha256").update(base).digest("hex");
  const expected = (payload.signature.checksum ?? "").toLowerCase();
  if (computed.length !== expected.length) return false;
  let matches = 0;
  for (let index = 0; index < computed.length; index += 1) {
    matches |= computed.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return matches === 0;
}

/**
 * Converts a COP total to integer cents for Wompi.
 *
 * @param total Total in pesos (may arrive as number or string from Prisma Decimal).
 * @returns Amount in cents, rounded to avoid float drift.
 */
export function toCents(total: number | string): number {
  return Math.round(Number(total) * 100);
}

/** Returns whether the Wompi public key and integrity secret are configured. */
export function isWompiConfigured(): boolean {
  const publicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  return Boolean(
    publicKey && integritySecret && eventsSecret &&
    !publicKey.includes("<") && !integritySecret.includes("<") && !eventsSecret.includes("<"),
  );
}

/**
 * Builds the checkout configuration for a pending payment when keys exist.
 * The redirect URL is only included for public https app URLs; Wompi's
 * edge firewall blocks localhost/http redirect targets with a 403.
 *
 * @param args Payment reference, total and customer email.
 * @returns Checkout config or null when Wompi is not configured (demo fallback).
 */
export function buildCheckoutConfig(args: {
  reference: string;
  total: number | string;
  customerEmail: string;
}): WompiCheckoutConfig | null {
  const publicKey = process.env.WOMPI_PUBLIC_KEY ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (!isWompiConfigured()) return null;
  const amountInCents = toCents(args.total);
  return {
    publicKey,
    currency: "COP",
    amountInCents,
    reference: args.reference,
    integritySignature: buildIntegritySignature(args.reference, amountInCents, "COP", integritySecret),
    redirectUrl: appUrl.startsWith("https://") ? `${appUrl}/api/wompi/return` : null,
  };
}
