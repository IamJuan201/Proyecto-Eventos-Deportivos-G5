import "server-only";

/**
 * Cloudflare Turnstile verification endpoint.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Checks whether server-side Turnstile verification is configured.
 *
 * @returns True when TURNSTILE_SECRET_KEY looks usable.
 */
export function isTurnstileEnforced(): boolean {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? "";
  return secret.length > 5 && !secret.includes("<");
}

/**
 * Verifies a Turnstile client token with Cloudflare.
 * Never throws: network or parsing failures resolve as false so the
 * caller can fail closed with a friendly message.
 *
 * @param token Token produced by the Turnstile widget.
 * @returns True when Cloudflare accepts the token.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response: token }),
    });
    if (!response.ok) {
      console.error(`[turnstile] siteverify answered ${response.status}; failing closed.`);
      return false;
    }
    const payload = (await response.json().catch(() => null)) as { success?: boolean; ["error-codes"]?: string[] } | null;
    if (!payload?.success) {
      console.warn(`[turnstile] token rejected: ${(payload?.["error-codes"] ?? []).join(",") || "unknown"}.`);
    }
    return payload?.success === true;
  } catch (error) {
    console.error("[turnstile] siteverify request failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
