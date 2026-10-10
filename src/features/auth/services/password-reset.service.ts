import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { hashPassword } from "@/features/auth/lib/password";
import { findUserByEmail } from "@/features/auth/services/user.service";
import { sendEmail } from "@/shared/lib/email";
import { getPrisma, isUuid } from "@/shared/lib/prisma";

/**
 * Password reset with signed, single-use links (PEDG-23). No table needed:
 * the token is `<base64url payload>.<HMAC-SHA256>` signed with SESSION_SECRET and
 * carries a fingerprint of the current password hash, so it stops working as soon
 * as the password changes. Updates Usuario.contrasena_hash, which is what login checks.
 */
const RESET_TTL_MINUTES = 30;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

type ResetPayload = { uid: string; exp: number; fp: string };

export class PasswordResetError extends Error {}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET no está configurada (mínimo 32 caracteres).");
  return value;
}

/** Domain-separated from the session signature so a reset token never works as a session. */
const sign = (data: string) => createHmac("sha256", secret()).update("password-reset:" + data).digest("base64url");

const fingerprint = (passwordHash: string | null) => createHash("sha256").update(passwordHash ?? "none").digest("hex").slice(0, 16);

function encode(payload: ResetPayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(token: string): ResetPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as ResetPayload;
    return isUuid(payload.uid) && typeof payload.fp === "string" && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function buildResetEmailHtml(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:32px 12px;background-color:#0b0f15;font-family:Arial,Helvetica,sans-serif;color:#f7f9fc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#121824;border:1px solid rgba(255,255,255,0.09);border-radius:16px;">
      <tr><td style="padding:28px 28px 8px 28px;font-size:13px;letter-spacing:2px;color:#38bdf8;font-weight:bold;">ÉLITE CLUB</td></tr>
      <tr><td style="padding:0 28px;font-size:22px;font-weight:bold;">Restablece tu contraseña</td></tr>
      <tr><td style="padding:14px 28px;font-size:14px;line-height:1.6;color:#cbd5e1;">Hola ${escapeHtml(name)}, recibimos una solicitud para cambiar la contraseña de tu cuenta. El enlace vence en ${RESET_TTL_MINUTES} minutos y solo se puede usar una vez.</td></tr>
      <tr><td style="padding:8px 28px 20px 28px;"><a href="${resetUrl}" style="display:inline-block;background-color:#0ea5e9;color:#0b0f15;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;">Crear contraseña nueva</a></td></tr>
      <tr><td style="padding:0 28px 28px 28px;font-size:12px;line-height:1.6;color:#94a3b8;">Si no pediste este cambio, ignora este correo: tu contraseña actual sigue funcionando.</td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

/**
 * Emails a reset link when the account exists and is active.
 * Always resolves the same way so the response does not reveal which emails are registered.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user || !user.activo) return;
  const token = encode({ uid: user.id, exp: Date.now() + RESET_TTL_MINUTES * 60_000, fp: fingerprint(user.contrasenaHash) });
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: user.correo,
    subject: "Restablece tu contraseña de Élite Club",
    html: buildResetEmailHtml(user.nombre, resetUrl),
    text: `Restablece tu contraseña de Élite Club (vence en ${RESET_TTL_MINUTES} minutos): ${resetUrl}`,
  });
}

/** Replaces the password if the link is valid, unexpired and not used yet. */
export async function resetPassword(token: string, password: string): Promise<void> {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw new PasswordResetError("La contraseña debe tener entre 8 y 128 caracteres.");
  }
  const payload = decode(token);
  const invalid = new PasswordResetError("El enlace no es válido o ya venció. Solicita uno nuevo.");
  if (!payload) throw invalid;
  const prisma = getPrisma();
  const user = await prisma.usuario.findUnique({ where: { id: payload.uid }, select: { activo: true, contrasenaHash: true } });
  if (!user?.activo || fingerprint(user.contrasenaHash) !== payload.fp) throw invalid;
  // Proving access to the inbox also confirms the email.
  const { count } = await prisma.usuario.updateMany({
    where: { id: payload.uid, contrasenaHash: user.contrasenaHash },
    data: { contrasenaHash: await hashPassword(password), correoConfirmado: true },
  });
  if (!count) throw invalid; // Used concurrently by another request.
}

/** True when a reset link can still be used (for the reset page to show the form or an error). */
export async function isResetTokenUsable(token: string): Promise<boolean> {
  const payload = decode(token);
  if (!payload) return false;
  const user = await getPrisma().usuario.findUnique({ where: { id: payload.uid }, select: { activo: true, contrasenaHash: true } });
  return Boolean(user?.activo && fingerprint(user.contrasenaHash) === payload.fp);
}
