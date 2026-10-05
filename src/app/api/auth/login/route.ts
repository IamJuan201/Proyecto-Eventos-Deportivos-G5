import { NextResponse, type NextRequest } from "next/server";
import { getJsonUserByEmail, listDemoEmployees } from "@/shared/lib/demo-store";
import { startJsonSession, verifyPassword } from "@/features/auth/lib/json-auth";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { email?: string; password?: string };
    if (!input.email || !input.password) return NextResponse.json({ message: "Escribe tu correo y contraseña." }, { status: 400 });
    const user = await getJsonUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) return NextResponse.json({ message: "El correo o la contraseña no son correctos." }, { status: 401 });
    if (user.role === "empleado") {
      const employees = await listDemoEmployees();
      if (!employees.some((employee) => employee.email.toLowerCase() === user.email.toLowerCase() && employee.isActive)) return NextResponse.json({ message: "Tu cuenta de empleado está inactiva. Contacta al administrador." }, { status: 403 });
    }
    await startJsonSession(user.id);
    return NextResponse.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role ?? "cliente" });
  } catch {
    return NextResponse.json({ message: "No se pudo iniciar sesión. Inténtalo de nuevo." }, { status: 500 });
  }
}
