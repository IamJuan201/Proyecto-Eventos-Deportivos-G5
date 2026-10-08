import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/features/auth/lib/password";
import { startSession } from "@/features/auth/lib/session";
import { getPrisma } from "@/shared/lib/prisma";
import { findUserByEmail, isActiveEmployee, toAppUser } from "@/features/auth/services/user.service";
import { issueOtpCode } from "@/features/auth/services/otp.service";

/**
 * Signs in with email and password.
 * Accounts with an unconfirmed email never get a session here; instead the
 * client receives the emailConfirmationRequired flag and shows the verify page.
 * A missing OTP (expired or never sent) is reissued outside the cooldown.
 *
 * @param request JSON body with email and password.
 * @returns Session user, or 403 with the verification flag.
 */
export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { email?: string; password?: string };
    if (!input.email || !input.password) return NextResponse.json({ message: "Escribe tu correo y contraseña." }, { status: 400 });
    const row = await findUserByEmail(input.email);
    if (!row || !row.activo || !(await verifyPassword(input.password, row.contrasenaHash))) return NextResponse.json({ message: "El correo o la contraseña no son correctos." }, { status: 401 });
    const user = toAppUser(row);
    if (user.role === "empleado" && !(await isActiveEmployee(user.id))) return NextResponse.json({ message: "Tu cuenta de empleado está inactiva. Contacta al administrador." }, { status: 403 });
    if (!row.correoConfirmado) {
      const pending = await getPrisma().codigoOtp.findUnique({ where: { usuarioId: row.id } });
      if (!pending) await issueOtpCode(row.id, "login");
      return NextResponse.json({ message: "Tu correo aún no está confirmado. Revisa tu correo e ingresa el código.", emailConfirmationRequired: true, email: user.email }, { status: 403 });
    }
    await startSession(user.id);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "No se pudo iniciar sesión. Inténtalo de nuevo." }, { status: 500 });
  }
}
