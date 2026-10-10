import { NextResponse, type NextRequest } from "next/server";
import { PasswordResetError, resetPassword } from "@/features/auth/services/password-reset.service";

/**
 * Sets a new password from a reset link (PEDG-23).
 *
 * @param request JSON body with the link token and the new password.
 * @returns `{ reset: true }`, or 400 with a message when the link or password is invalid.
 */
export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as { token?: string; password?: string };
  try {
    await resetPassword(String(input.token ?? ""), String(input.password ?? ""));
    return NextResponse.json({ reset: true });
  } catch (error) {
    if (error instanceof PasswordResetError) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("[password-reset] reset failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "No se pudo completar la solicitud." }, { status: 500 });
  }
}
