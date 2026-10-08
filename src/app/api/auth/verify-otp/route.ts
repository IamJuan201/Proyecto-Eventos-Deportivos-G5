import { NextResponse, type NextRequest } from "next/server";
import { startSession } from "@/features/auth/lib/session";
import { findUserByEmail, toAppUser } from "@/features/auth/services/user.service";
import { verifyOtpCode } from "@/features/auth/services/otp.service";

/**
 * Confirms an email with an 8-digit OTP and starts the session.
 *
 * @param request JSON body with email and code.
 * @returns Session user on success.
 */
export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { email?: string; code?: string };
    if (!input.email || !input.code) return NextResponse.json({ message: "Escribe tu correo y el código." }, { status: 400 });
    const row = await findUserByEmail(input.email);
    if (!row || !row.activo) return NextResponse.json({ message: "No encontramos esa cuenta." }, { status: 404 });
    if (row.correoConfirmado) {
      await startSession(row.id);
      return NextResponse.json(toAppUser(row));
    }
    await verifyOtpCode(row.id, input.code);
    await startSession(row.id);
    return NextResponse.json(toAppUser(row));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo verificar el código.";
    const status = message.startsWith("No hay") || message.startsWith("El código venció") || message.startsWith("Demasiados") ? 410 : 400;
    return NextResponse.json({ message }, { status });
  }
}
