import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/lib/session";
import { getProfile } from "@/features/auth/services/account.service";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getLocale } from "@/shared/i18n/locale.server";
import { translate } from "@/shared/i18n/messages";

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", empleado: "Empleado", cliente: "Cliente" };
const PROVIDER_LABELS: Record<string, string> = { email: "Correo y contraseña", google: "Google", github: "GitHub" };

export default async function ProfilePage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  if (!user) redirect("/login?next=%2Fprofile");
  const profile = await getProfile(user.id);
  if (!profile) notFound();
  const t = (text: string) => translate(text, locale);
  const since = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(profile.memberSince));
  const rows = [
    { label: "Nombre", value: profile.fullName },
    { label: "Correo", value: profile.email },
    { label: "Rol", value: t(ROLE_LABELS[profile.role] ?? profile.role) },
    ...(profile.serviceName ? [{ label: "Servicio asignado", value: t(profile.serviceName) }] : []),
    { label: "Acceso con", value: t(PROVIDER_LABELS[profile.provider] ?? profile.provider) },
    { label: "Correo confirmado", value: t(profile.emailConfirmed ? "Sí" : "No") },
    { label: "Miembro desde", value: since },
  ];
  return (
    <main className="club-container profile-wrap">
      <section className="page-heading compact-page-heading"><span className="eyebrow">{t("TU CUENTA")}</span><h1>{t("Mi perfil.")}</h1><p>{t("Consulta tus datos, cambia tu contraseña o cierra tu sesión.")}</p></section>
      <div className="profile-layout">
        <section className="glass-panel profile-card" aria-labelledby="profile-data-title">
          <div className="profile-identity"><span className="profile-avatar" aria-hidden="true">{profile.fullName.trim().charAt(0).toUpperCase()}</span><div><h2 id="profile-data-title">{profile.fullName}</h2><small>{profile.email}</small></div></div>
          <dl className="profile-data">
            {rows.map((row) => <div key={row.label}><dt>{t(row.label)}</dt><dd>{row.value}</dd></div>)}
          </dl>
          <LogoutButton />
        </section>
        <section className="glass-panel profile-card" aria-labelledby="profile-password-title">
          <h2 id="profile-password-title">{t(profile.hasPassword ? "Cambiar contraseña" : "Crear una contraseña")}</h2>
          <p className="profile-hint">{t(profile.hasPassword ? "Por seguridad, al cambiarla se cierran tus sesiones en otros dispositivos." : "Tu cuenta entra con Google o GitHub. Puedes crear una contraseña para entrar también con tu correo.")}</p>
          <ChangePasswordForm hasPassword={profile.hasPassword} />
        </section>
      </div>
    </main>
  );
}
