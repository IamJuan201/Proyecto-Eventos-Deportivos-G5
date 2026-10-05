import Link from "next/link";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";

export default function ResetPasswordPage() {
  return <main className="club-container auth-wrap"><section className="glass-panel auth-card"><span className="eyebrow">ACTUALIZA TU ACCESO</span><h1>Una contraseña nueva.</h1><p>Elige una contraseña de al menos ocho caracteres.</p><PasswordResetForm mode="update" /><Link className="small-link" href="/login">← Volver a iniciar sesión</Link></section></main>;
}
