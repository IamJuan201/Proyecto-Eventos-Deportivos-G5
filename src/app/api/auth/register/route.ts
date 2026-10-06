import { NextResponse, type NextRequest } from "next/server";
import { registerAccount } from "@/features/auth/lib/session";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json() as { fullName?: string; email?: string; password?: string; nextPath?: string };
    if (!input.fullName?.trim() || !input.email || !input.password) return NextResponse.json({ message: "Completa nombre, correo y contraseña." }, { status: 400 });
    const user = await registerAccount({ fullName: input.fullName, email: input.email, password: input.password });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la cuenta.";
    return NextResponse.json({ message }, { status: message.startsWith("Ya existe") ? 409 : 400 });
  }
}
