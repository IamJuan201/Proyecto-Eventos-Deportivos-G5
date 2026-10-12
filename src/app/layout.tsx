import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SiteFooter } from "@/shared/components/site-footer";
import { SiteHeader } from "@/shared/components/site-header";
import { LocaleProvider } from "@/shared/i18n/locale-provider";
import { getLocale } from "@/shared/i18n/locale.server";
import { NetworkStatus } from "@/shared/components/network-status";
import { SiteHeaderLoadingSkeleton } from "@/shared/components/page-loading-skeleton";
import { ToastProvider } from "@/shared/components/toast-provider";

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
          <ToastProvider>
            <a className="skip-to-content" href="#main-content">{locale === "es" ? "Saltar al contenido" : "Skip to content"}</a>
            <NetworkStatus />
            <Suspense fallback={<SiteHeaderLoadingSkeleton />}>
              <SiteHeader />
            </Suspense>
            <div className="site-main" id="main-content" tabIndex={-1}>{children}</div>
            <SiteFooter />
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
