import { NextResponse, type NextRequest } from "next/server";
import { requestPasswordReset } from "@/features/auth/services/password-reset.service";

/**
 * Starts the password reset (PEDG-23). Answers the same for registered and unknown emails.
 *
 * @param request JSON body with the account email.
 * @returns `{ sent: true }`, or 400 when the email is missing.
 */
export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as { email?: string };
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (!email) return NextResponse.json({ message: "Escribe tu correo." }, { status: 400 });
  try {
    await requestPasswordReset(email);
  } catch (error) {
    console.error("[password-reset] request failed:", error instanceof Error ? error.message : error);
  }
  return NextResponse.json({ sent: true });
}
