"use client";

import { useEffect, useState, useTransition } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyDemoQrAction } from "@/features/reservations/api/reservation.actions";
import type { DemoService } from "@/shared/lib/demo-store";

type ScanState = { result: string; message: string } | null;

export default function ScanPage({ service, stats }: { service: DemoService; stats: { today: number; allowedToday: number; rejectedToday: number } }) {
  const [code, setCode] = useState("");
  const [scanState, setScanState] = useState<ScanState>(null);
  const [cameraMessage, setCameraMessage] = useState("Permite el acceso a la cámara o escribe el código manualmente.");
  const [pending, startTransition] = useTransition();
  const isPoolService = service.categoryId === "piscinas" || service.name.toLowerCase().includes("piscina");

  useEffect(() => {
    const element = document.getElementById("reader");
    if (!element) return;
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 230, height: 230 }, rememberLastUsedCamera: true }, false);
    scanner.render((decodedText) => {
      setCode(decodedText);
      setCameraMessage("Código detectado. Se validará contra tu espacio asignado.");
      scanner.clear().catch(() => undefined);
    }, () => undefined);
    return () => { scanner.clear().catch(() => undefined); };
  }, []);

  function submit(formData: FormData) {
    setScanState(null);
    startTransition(async () => {
      const result = await verifyDemoQrAction(formData);
      setScanState(result);
    });
  }

  return (
    <main className="club-container scanner-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">CONTROL DE ACCESO · PERSONAL ÉLITE</span>
        <h1>Valida. Da la bienvenida.</h1>
        <p>Escanea el QR o escribe el código. Tu cuenta solo puede validar ingresos para {service.name}; un QR de otro espacio no se consume.</p>
      </section>
      <section className="glass-panel scanner-card">
        <div className="scanner-heading"><div><h2>Escáner · {service.name}</h2><p>{cameraMessage} Hoy: {stats.allowedToday} autorizados de {stats.today} lecturas.</p></div><span className="scanner-live"><i /> TU ESPACIO</span></div>
        <div id="reader" />
        <form action={submit} className="scanner-form">
          <div className="booking-field"><label htmlFor="scan-code">Código de reserva</label><input className="club-input scan-code-input" name="code" id="scan-code" autoComplete="off" placeholder="ELITE-…" value={code} onChange={(event) => setCode(event.target.value)} required /></div>
          <button className="club-button" type="submit" disabled={pending}>{pending ? "Validando…" : "Validar acceso"}</button>
          {isPoolService && <label className="terms-label scan-minor-check"><input type="checkbox" name="minorUnderOneMeter" /><span>Tras revisión manual: menor de 1 m</span></label>}
        </form>
        {scanState && <div role="status" className={"scanner-result " + (scanState.result === "permitido" ? "result-permitido" : "result-error")}><strong>{scanState.result.replaceAll("_", " ").toUpperCase()}</strong><p>{scanState.message}</p></div>}
        <div className="scanner-rules"><strong>Validaciones activas</strong><span>Pago aprobado</span><span>Servicio correcto</span><span>Fecha y turno vigentes</span><span>QR sin usos previos</span></div>
      </section>
      <p className="scanner-footnote">La cámara necesita permiso del navegador. Para la presentación también puedes pegar un código QR emitido por una reserva de prueba.</p>
    </main>
  );
}
