import { NextResponse, type NextRequest } from "next/server";
import { verifyPassword } from "@/features/auth/lib/password";
import { startSession } from "@/features/auth/lib/session";
import { findUserByEmail, isActiveEmployee, toAppUser } from "@/features/auth/services/user.service";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { email?: string; password?: string };
    if (!input.email || !input.password) return NextResponse.json({ message: "Escribe tu correo y contraseña." }, { status: 400 });
    const row = await findUserByEmail(input.email);
    if (!row || !row.activo || !(await verifyPassword(input.password, row.contrasenaHash))) return NextResponse.json({ message: "El correo o la contraseña no son correctos." }, { status: 401 });
    const user = toAppUser(row);
    if (user.role === "empleado" && !(await isActiveEmployee(user.id))) return NextResponse.json({ message: "Tu cuenta de empleado está inactiva. Contacta al administrador." }, { status: 403 });
    await startSession(user.id);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "No se pudo iniciar sesión. Inténtalo de nuevo." }, { status: 500 });
  }
}
