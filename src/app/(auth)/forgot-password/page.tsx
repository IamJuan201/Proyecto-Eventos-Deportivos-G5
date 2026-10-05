import Link from "next/link";
import { PasswordResetForm } from "@/features/auth/components/password-reset-form";

export default function ForgotPasswordPage() {
  return <main className="club-container auth-wrap"><section className="glass-panel auth-card"><span className="eyebrow">RECUPERA TU ACCESO</span><h1>Volvamos a entrar.</h1><p>Te enviaremos un enlace para crear una contraseña nueva.</p><PasswordResetForm mode="request" /><Link className="small-link" href="/login">← Volver a iniciar sesión</Link></section></main>;
}
