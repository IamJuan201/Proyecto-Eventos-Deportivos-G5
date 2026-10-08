import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/shared/components/site-footer";
import { SiteHeader } from "@/shared/components/site-header";

export const metadata: Metadata = {
  title: "Élite Club | Deporte y bienestar",
  description: "Reserva tu próximo espacio deportivo en Élite Club.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        <div className="site-main">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
