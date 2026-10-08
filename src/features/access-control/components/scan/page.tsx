"use client";

import { useEffect, useState, useTransition } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyQrAction } from "@/features/reservations/api/reservation.actions";
import { useTranslate } from "@/shared/i18n/locale-provider";

type ScanState = { result: string; message: string } | null;

export default function ScanPage({ serviceName, isPoolService, stats }: { serviceName: string; isPoolService: boolean; stats: { today: number; allowedToday: number; rejectedToday: number } }) {
  const t = useTranslate();
  const [code, setCode] = useState("");
  const [scanState, setScanState] = useState<ScanState>(null);
  const [cameraMessage, setCameraMessage] = useState("Permite el acceso a la cámara o escribe el código manualmente.");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const element = document.getElementById("reader");
    if (!element) return;
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 230, height: 230 }, rememberLastUsedCamera: true }, false);
    scanner.render((decodedText) => {
      setCode(decodedText);
      setCameraMessage(t("Código detectado. Se validará contra tu espacio asignado."));
      scanner.clear().catch(() => undefined);
    }, () => undefined);
    return () => { scanner.clear().catch(() => undefined); };
  }, []);

  function submit(formData: FormData) {
    setScanState(null);
    startTransition(async () => {
      const result = await verifyQrAction(formData);
      setScanState(result);
    });
  }

  return (
    <main className="club-container scanner-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">{t("CONTROL DE ACCESO · PERSONAL ÉLITE")}</span>
        <h1>{t("Valida. Da la bienvenida.")}</h1>
        <p>{t("Escanea el QR o escribe el código. Tu cuenta solo puede validar ingresos para")} {t(serviceName)}; {t("un QR de otro espacio no se consume.")}</p>
      </section>
      <section className="glass-panel scanner-card">
        <div className="scanner-heading"><div><h2>{t("Escáner")} · {t(serviceName)}</h2><p>{t(cameraMessage)} {t("Hoy:")} {stats.allowedToday} {t("autorizados de")} {stats.today} {t("lecturas.")}</p></div><span className="scanner-live"><i /> {t("TU ESPACIO")}</span></div>
        <div id="reader" />
        <form action={submit} className="scanner-form">
          <div className="booking-field"><label htmlFor="scan-code">{t("Código de reserva")}</label><input className="club-input scan-code-input" name="code" id="scan-code" autoComplete="off" placeholder="ELITE-…" value={code} onChange={(event) => setCode(event.target.value)} required /></div>
          <button className="club-button" type="submit" disabled={pending}>{pending ? t("Validando…") : t("Validar acceso")}</button>
          {isPoolService && <label className="terms-label scan-minor-check"><input type="checkbox" name="minorUnderOneMeter" /><span>{t("Tras revisión manual: menor de 1 m")}</span></label>}
        </form>
        {scanState && <div role="status" className={"scanner-result " + (scanState.result === "permitido" ? "result-permitido" : "result-error")}><strong>{t(scanState.result.replaceAll("_", " ")).toUpperCase()}</strong><p>{t(scanState.message)}</p></div>}
        <div className="scanner-rules"><strong>{t("Validaciones activas")}</strong><span>{t("Pago aprobado")}</span><span>{t("Servicio correcto")}</span><span>{t("Fecha y turno vigentes")}</span><span>{t("QR sin usos previos")}</span></div>
      </section>
      <p className="scanner-footnote">{t("La cámara necesita permiso del navegador. Para la presentación también puedes pegar un código QR emitido por una reserva de prueba.")}</p>
    </main>
  );
}
