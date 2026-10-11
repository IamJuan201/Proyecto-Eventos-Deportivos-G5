import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/shared/components/site-footer";
import { SiteHeader } from "@/shared/components/site-header";
import { LocaleProvider } from "@/shared/i18n/locale-provider";
import { getLocale } from "@/shared/i18n/locale.server";

export const metadata: Metadata = {
  title: "Élite Club | Deporte y bienestar",
  description: "Reserva tu próximo espacio deportivo en Élite Club.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initialLocale={locale}>
          <SiteHeader />
          <div className="site-main">{children}</div>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
