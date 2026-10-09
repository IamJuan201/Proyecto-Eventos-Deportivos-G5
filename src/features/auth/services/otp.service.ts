import "server-only";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { sendEmail } from "@/shared/lib/email";
import { getPrisma } from "@/shared/lib/prisma";

/**
 * Number of digits of the verification code.
 */
export const OTP_LENGTH = 8;

/**
 * Failed attempts allowed before the active code is voided.
 */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Error thrown when a resend is requested inside the cooldown window.
 */
export class OtpCooldownError extends Error {
  /**
   * Seconds the client must wait before requesting a new code.
   */
  retryAfterSeconds: number;

  /**
   * Creates a cooldown error with the remaining wait time.
   *
   * @param retryAfterSeconds Seconds left until a new code can be sent.
   */
  constructor(retryAfterSeconds: number) {
    super(`Espera ${Math.ceil(retryAfterSeconds / 60)} min antes de pedir otro código.`);
    this.name = "OtpCooldownError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Reads the OTP lifetime from the environment.
 *
 * @returns Lifetime in minutes, defaulting to 15 on missing or invalid values.
 */
export function getOtpExpiryMinutes(): number {
  const parsed = Number.parseInt(process.env.OTP_EXPIRY_MINUTES ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 15;
}

/**
 * Reads the resend cooldown from the environment.
 *
 * @returns Cooldown in minutes, defaulting to 4 on missing or invalid values.
 */
export function getOtpResendCooldownMinutes(): number {
  const parsed = Number.parseInt(process.env.OTP_RESEND_COOLDOWN_MINUTES ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 4;
}

/**
 * Hashes a code with SHA256 so only hashes are stored.
 *
 * @param code Plain 8-digit code.
 * @returns Lowercase hex digest.
 */
function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Compares two hashes in constant time.
 *
 * @param left First hex digest.
 * @param right Second hex digest.
 * @returns True when both digests match.
 */
function hashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Builds the verification code email using the Elite Club palette..
 *
 * @param name Recipient first display name.
 * @param code Plain 8-digit code to show.
 * @param expiryMinutes Minutes until the code expires.
 * @param verifyUrl Link opening the verify page with the email prefilled.
 * @returns Full HTML document for the email.
 */
function buildOtpEmailHtml(name: string, code: string, expiryMinutes: number, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#0b0f15;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu código de Elite Club es ${code}. Vence en ${expiryMinutes} minutos.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f15;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#121824;border:1px solid rgba(255,255,255,0.09);border-radius:16px;">
          <tr>
            <td align="center" style="padding:28px 24px 0 24px;">
              <div style="display:inline-block;background:linear-gradient(145deg,#1d9bff,#0064d8);border-radius:10px;color:#ffffff;font-size:19px;font-weight:bold;padding:8px 12px;">É</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 24px 0 24px;color:#8fcbff;font-size:11px;font-weight:bold;letter-spacing:2px;">ELITE CLUB · VERIFICA TU CORREO</td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 32px 0 32px;color:#f7f9fc;font-size:22px;font-weight:bold;">Hola ${name}, ya casi terminas.</td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 32px 0 32px;color:#94a3b8;font-size:13px;line-height:1.6;">Ingresa este código en la app para activar tu cuenta. Vence en ${expiryMinutes} minutos.</td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 24px 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background:rgba(0,133,255,0.10);border:1px solid rgba(0,133,255,0.45);border-radius:14px;">
                <tr>
                  <td align="center" style="padding:18px 34px;color:#f7f9fc;font-size:38px;font-weight:bold;letter-spacing:10px;">${code}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 24px 0 24px;">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#0085ff,#0070d8);color:#ffffff;font-size:12px;font-weight:bold;letter-spacing:1px;text-decoration:none;padding:13px 28px;border-radius:10px;">VERIFICAR MI CORREO</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:14px 32px 0 32px;color:#748198;font-size:11px;line-height:1.6;">Si no creaste esta cuenta, ignora este correo. Nunca compartas este código con nadie.</td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(255,255,255,0.08);"></td></tr></table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 32px 26px 32px;color:#5b6b82;font-size:10px;line-height:1.6;">¿No funciona el botón? Copia este enlace en tu navegador:<br /><span style="word-break:break-all;color:#8fcbff;">${verifyUrl}</span></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Entry point shown by the verify page link.
 */
export type OtpContext = "register" | "login";

/**
 * Issues (or replaces) the active OTP for a user and emails it.
 * Registration succeeds even when delivery fails; the user can resend.
 *
 * @param userId Owner of the code.
 * @param context Page copy shown when the email CTA is opened.
 * @returns Expiration date of the new code.
 */
export async function issueOtpCode(userId: string, context: OtpContext = "register"): Promise<{ expiresAt: Date }> {
  const prisma = getPrisma();
  const user = await prisma.usuario.findUniqueOrThrow({ where: { id: userId } });
  const code = String(randomInt(10_000_000, 100_000_000));
  const expiresAt = new Date(Date.now() + getOtpExpiryMinutes() * 60_000);
  await prisma.codigoOtp.upsert({
    where: { usuarioId: userId },
    create: { usuarioId: userId, codigoHash: hashCode(code), expiraEn: expiresAt },
    update: { codigoHash: hashCode(code), expiraEn: expiresAt, intentos: 0, ultimoEnvioEn: new Date() },
  });
  const firstName = user.nombre.split(" ")[0] || user.nombre;
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const verifyUrl = `${appUrl}/verify-email?email=${encodeURIComponent(user.correo)}&reason=${context}`;
  const result = await sendEmail({
    to: user.correo,
    subject: `Tu código de verificación: ${code}`,
    html: buildOtpEmailHtml(firstName, code, getOtpExpiryMinutes(), verifyUrl),
    text: `Hola ${firstName}, tu código de verificación de Elite Club es ${code}. Vence en ${getOtpExpiryMinutes()} minutos. Verifícalo aquí: ${verifyUrl}`,
  });
  if (!result.delivered) {
    console.error(`[otp] Verification email for user ${userId} was not delivered; the code stays active for resend.`);
  }
  return { expiresAt };
}

/**
 * Verifies an OTP and confirms the user email on success.
 * Consumes the code (single use) and voids it after too many failures.
 *
 * @param userId Owner of the code.
 * @param code Code typed by the user.
 */
export async function verifyOtpCode(userId: string, code: string): Promise<void> {
  const clean = code.trim();
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(clean)) throw new Error("Escribe el código de 8 dígitos.");
  const prisma = getPrisma();
  const row = await prisma.codigoOtp.findUnique({ where: { usuarioId: userId } });
  if (!row) throw new Error("No hay un código activo. Solicita uno nuevo.");
  if (row.expiraEn <= new Date()) {
    await prisma.codigoOtp.deleteMany({ where: { usuarioId: userId } });
    throw new Error("El código venció. Solicita uno nuevo.");
  }
  if (row.intentos >= OTP_MAX_ATTEMPTS) {
    await prisma.codigoOtp.deleteMany({ where: { usuarioId: userId } });
    throw new Error("Demasiados intentos. Solicita un código nuevo.");
  }
  if (!hashesMatch(row.codigoHash, hashCode(clean))) {
    const left = OTP_MAX_ATTEMPTS - (row.intentos + 1);
    await prisma.codigoOtp.update({ where: { usuarioId: userId }, data: { intentos: row.intentos + 1 } });
    throw new Error(left > 0 ? `Código incorrecto. Te quedan ${left} intentos.` : "Código incorrecto. Solicita un código nuevo.");
  }
  await prisma.$transaction([
    prisma.codigoOtp.deleteMany({ where: { usuarioId: userId } }),
    prisma.usuario.update({ where: { id: userId }, data: { correoConfirmado: true } }),
  ]);
}

/**
 * Resends the OTP honoring the cooldown window.
 *
 * @param userId Owner of the code.
 * @param context Page copy shown when the email CTA is opened.
 * @returns Expiration date of the new code.
 */
export async function resendOtpCode(userId: string, context: OtpContext = "register"): Promise<{ expiresAt: Date }> {
  const row = await getPrisma().codigoOtp.findUnique({ where: { usuarioId: userId } });
  if (row) {
    const elapsedMs = Date.now() - row.ultimoEnvioEn.getTime();
    const cooldownMs = getOtpResendCooldownMinutes() * 60_000;
    if (elapsedMs < cooldownMs) {
      throw new OtpCooldownError(Math.ceil((cooldownMs - elapsedMs) / 1000));
    }
  }
  return issueOtpCode(userId, context);
}

/**
 * Reads the public verification state for the verify page.
 *
 * @param email Account email address.
 * @returns Seconds until expiry and until resend, or null without an active code.
 */
export async function getVerificationState(email: string): Promise<{ expiresInSeconds: number; resendInSeconds: number } | null> {
  const prisma = getPrisma();
  const user = await prisma.usuario.findUnique({ where: { correo: email.trim().toLowerCase() } });
  if (!user) return null;
  const row = await prisma.codigoOtp.findUnique({ where: { usuarioId: user.id } });
  if (!row) return null;
  const now = Date.now();
  return {
    expiresInSeconds: Math.max(0, Math.floor((row.expiraEn.getTime() - now) / 1000)),
    resendInSeconds: Math.max(0, Math.ceil((row.ultimoEnvioEn.getTime() + getOtpResendCooldownMinutes() * 60_000 - now) / 1000)),
  };
}
