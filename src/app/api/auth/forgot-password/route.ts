import { after, NextResponse, type NextRequest } from "next/server";
import { requestPasswordReset } from "@/features/auth/services/password-reset.service";
import { isTurnstileEnforced, verifyTurnstileToken } from "@/shared/lib/turnstile";

/**
 * Starts the password reset (PEDG-23). Answers the same for registered and unknown emails,
 * and sends the email after responding so the timing does not reveal which accounts exist.
 *
 * @param request JSON body with the account email and the Turnstile token.
 * @returns `{ sent: true }`, 400 when the email is missing or 403 when the security check fails.
 */
export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as { email?: string; turnstileToken?: string };
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email) return NextResponse.json({ message: "Escribe tu correo." }, { status: 400 });
  if (isTurnstileEnforced() && !(await verifyTurnstileToken(input.turnstileToken ?? ""))) {
    return NextResponse.json({ message: "La verificación de seguridad falló. Inténtalo de nuevo." }, { status: 403 });
  }
  after(async () => {
    try {
      await requestPasswordReset(email);
    } catch (error) {
      console.error("[password-reset] request failed:", error instanceof Error ? error.message : error);
    }
  });
  return NextResponse.json({ sent: true });
}
