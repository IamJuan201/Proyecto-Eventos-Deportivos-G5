import { NextResponse, type NextRequest } from "next/server";
import { registerAccount } from "@/features/auth/lib/session";
import { isTurnstileEnforced, verifyTurnstileToken } from "@/shared/lib/turnstile";
import { issueOtpCode } from "@/features/auth/services/otp.service";

/**
 * Registers an email account without starting a session.
 * Issues an 8-digit OTP and tells the client to open the verify page.
 *
 * @param request JSON body with fullName, email, documentNumber, password and acceptedTerms.
 * @returns Created user with the emailConfirmationRequired flag.
 */
export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { fullName?: string; email?: string; documentNumber?: string; password?: string; acceptedTerms?: boolean; nextPath?: string; turnstileToken?: string };
    if (!input.fullName?.trim() || !input.email || !input.documentNumber?.trim() || !input.password) return NextResponse.json({ message: "Completa nombre, documento, correo y contraseña." }, { status: 400 });
    if (input.acceptedTerms !== true) return NextResponse.json({ message: "Acepta los términos y condiciones para crear tu cuenta." }, { status: 400 });
    if (isTurnstileEnforced() && !(await verifyTurnstileToken(input.turnstileToken ?? ""))) return NextResponse.json({ message: "La verificación de seguridad falló. Inténtalo de nuevo." }, { status: 403 });
    const user = await registerAccount({ fullName: input.fullName, email: input.email, documentNumber: input.documentNumber, password: input.password });
    await issueOtpCode(user.id);
    return NextResponse.json({ ...user, emailConfirmationRequired: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
    return NextResponse.json({ message }, { status: message.startsWith("Ya existe") ? 409 : 400 });
  }
}
