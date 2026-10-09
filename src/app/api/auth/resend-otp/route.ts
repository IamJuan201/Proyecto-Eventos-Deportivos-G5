import { NextResponse, type NextRequest } from "next/server";
import { findUserByEmail } from "@/features/auth/services/user.service";
import { OtpCooldownError, resendOtpCode } from "@/features/auth/services/otp.service";

/**
 * Resends the verification OTP honoring the cooldown window.
 *
 * @param request JSON body with the account email and optional reason.
 * @returns Success flag, or 429 with retryAfterSeconds inside the cooldown.
 */
export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { email?: string; reason?: string };
    if (!input.email) return NextResponse.json({ message: "Escribe tu correo." }, { status: 400 });
    const row = await findUserByEmail(input.email);
    if (!row || !row.activo) return NextResponse.json({ message: "No encontramos esa cuenta." }, { status: 404 });
    if (row.correoConfirmado) return NextResponse.json({ message: "Tu correo ya está confirmado. Inicia sesión." }, { status: 400 });
    await resendOtpCode(row.id, input.reason === "login" ? "login" : "register");
    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof OtpCooldownError) {
      return NextResponse.json({ message: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "No se pudo enviar el código.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
