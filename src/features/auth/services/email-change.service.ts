import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { verifyPassword } from "@/features/auth/lib/password";
import { normalizeEmail } from "@/features/auth/services/user.service";
import { sendEmail } from "@/shared/lib/email";
import { getPrisma, isPrismaError, isUuid } from "@/shared/lib/prisma";

/**
 * Email change confirmed from the new inbox. The address only changes after the owner of the
 * new inbox opens the link: Google/GitHub sign-in matches accounts by email, so an unverified
 * change would let someone attach another person's address to their account. No table needed:
 * the token is `<base64url payload>.<HMAC-SHA256>` signed with SESSION_SECRET and carries a
 * fingerprint of the current email, so it stops working once the email changes (single use).
 */
const CHANGE_TTL_MINUTES = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ChangePayload = { uid: string; email: string; old: string; exp: number };

export class EmailChangeError extends Error {}

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET no está configurada (mínimo 32 caracteres).");
  return value;
}

/** Domain-separated from the session and password-reset signatures. */
const sign = (data: string) => createHmac("sha256", secret()).update("email-change:" + data).digest("base64url");
const emailFingerprint = (email: string) => createHash("sha256").update(email).digest("hex").slice(0, 16);

function encode(payload: ChangePayload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(token: string): ChangePayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as ChangePayload;
    return isUuid(payload.uid) && EMAIL.test(payload.email) && typeof payload.old === "string" && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function buildConfirmEmailHtml(name: string, newEmail: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:32px 12px;background-color:#0b0f15;font-family:Arial,Helvetica,sans-serif;color:#f7f9fc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#121824;border:1px solid rgba(255,255,255,0.09);border-radius:16px;">
      <tr><td style="padding:28px 28px 8px 28px;font-size:13px;letter-spacing:2px;color:#38bdf8;font-weight:bold;">ÉLITE CLUB</td></tr>
      <tr><td style="padding:0 28px;font-size:22px;font-weight:bold;">Confirma tu nuevo correo</td></tr>
      <tr><td style="padding:14px 28px;font-size:14px;line-height:1.6;color:#cbd5e1;">Hola ${escapeHtml(name)}, pediste usar ${escapeHtml(newEmail)} en tu cuenta de Élite Club. El enlace vence en ${CHANGE_TTL_MINUTES} minutos y solo se puede usar una vez.</td></tr>
      <tr><td style="padding:8px 28px 20px 28px;"><a href="${confirmUrl}" style="display:inline-block;background-color:#0ea5e9;color:#0b0f15;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;">Confirmar correo</a></td></tr>
      <tr><td style="padding:0 28px 28px 28px;font-size:12px;line-height:1.6;color:#94a3b8;">Si no pediste este cambio, ignora este correo: la cuenta sigue con su correo actual.</td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

/**
 * Emails a confirmation link to the new address. Accounts with a password must type it;
 * Google/GitHub accounts must create one first, because their sign-in is tied to the current email.
 */
export async function requestEmailChange(userId: string, rawEmail: string, currentPassword: string): Promise<string> {
  const email = normalizeEmail(rawEmail);
  if (!EMAIL.test(email) || email.length > 254) throw new EmailChangeError("Escribe un correo válido.");
  const prisma = getPrisma();
  const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { nombre: true, correo: true, contrasenaHash: true, activo: true } });
  if (!user?.activo) throw new EmailChangeError("No encontramos tu cuenta.");
  if (email === user.correo) throw new EmailChangeError("Ese ya es el correo de tu cuenta.");
  if (!user.contrasenaHash) throw new EmailChangeError("Tu cuenta entra con Google o GitHub. Crea una contraseña antes de cambiar el correo.");
  if (!(await verifyPassword(currentPassword, user.contrasenaHash))) throw new EmailChangeError("La contraseña actual no es correcta.");
  if (await prisma.usuario.count({ where: { correo: email } })) throw new EmailChangeError("Ya existe una cuenta con ese correo.");
  const token = encode({ uid: userId, email, old: emailFingerprint(user.correo), exp: Date.now() + CHANGE_TTL_MINUTES * 60_000 });
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const confirmUrl = `${appUrl}/confirm-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Confirma tu nuevo correo de Élite Club",
    html: buildConfirmEmailHtml(user.nombre, email, confirmUrl),
    text: `Confirma tu nuevo correo de Élite Club (vence en ${CHANGE_TTL_MINUTES} minutos): ${confirmUrl}`,
  });
  return email;
}

/** The new email of a link that can still be used, or null (for the page to show the button or an error). */
export async function getUsableEmailChange(token: string): Promise<string | null> {
  const payload = decode(token);
  if (!payload) return null;
  const user = await getPrisma().usuario.findUnique({ where: { id: payload.uid }, select: { activo: true, correo: true } });
  return user?.activo && emailFingerprint(user.correo) === payload.old ? payload.email : null;
}

/** Applies the change if the link is valid, unexpired, unused and the address is still free. */
export async function confirmEmailChange(token: string): Promise<void> {
  const payload = decode(token);
  const invalid = new EmailChangeError("El enlace no es válido o ya venció. Pide el cambio de nuevo desde tu perfil.");
  if (!payload) throw invalid;
  const prisma = getPrisma();
  const user = await prisma.usuario.findUnique({ where: { id: payload.uid }, select: { activo: true, correo: true } });
  if (!user?.activo || emailFingerprint(user.correo) !== payload.old) throw invalid;
  try {
    // Compare-and-swap on the old address so the same link cannot apply twice.
    const { count } = await prisma.usuario.updateMany({
      where: { id: payload.uid, correo: user.correo },
      data: { correo: payload.email, correoConfirmado: true },
    });
    if (!count) throw invalid;
  } catch (error) {
    if (isPrismaError(error, "P2002")) throw new EmailChangeError("Ya existe una cuenta con ese correo.");
    throw error;
  }
  // The new address is confirmed, so a pending verification code is no longer needed.
  await prisma.codigoOtp.deleteMany({ where: { usuarioId: payload.uid } });
}
