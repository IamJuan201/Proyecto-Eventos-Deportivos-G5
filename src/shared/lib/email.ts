import "server-only";

/**
 * Result of a transactional email attempt.
 */
export interface EmailResult {
  delivered: boolean;
  skipped: boolean;
  id?: string;
}

/**
 * Checks whether Resend email delivery is configured.
 *
 * @returns True when RESEND_API_KEY and EMAIL_FROM look usable.
 */
export function isEmailEnabled(): boolean {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "";
  return apiKey.length > 5 && !apiKey.includes("<") && from.includes("@");
}

/**
 * Sends a transactional email through the Resend REST API.
 * Uses native fetch so no extra SDK dependency is required.
 * Never throws: delivery failures resolve as `{ delivered: false }`
 * so a mail problem can never revert an approved payment.
 *
 * @param input Recipient, subject and HTML body (plus optional plain text).
 * @returns Delivery result with the Resend message id when available.
 */
export async function sendEmail(input: { to: string; subject: string; html: string; text?: string }): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.warn(`[email] Resend is not configured; skipping email to ${input.to} (${input.subject}).`);
    return { delivered: false, skipped: true };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text ?? input.subject,
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] Resend rejected the message for ${input.to}: ${response.status} ${detail.slice(0, 300)}`);
      return { delivered: false, skipped: false };
    }
    const payload = (await response.json().catch(() => ({}))) as { id?: string };
    return { delivered: true, skipped: false, id: payload.id };
  } catch (error) {
    console.error(`[email] Failed to send email to ${input.to}:`, error instanceof Error ? error.message : error);
    return { delivered: false, skipped: false };
  }
}
