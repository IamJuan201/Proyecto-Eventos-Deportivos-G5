'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function CameraTest() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('Pulsa “Probar cámara” y permite el acceso en el navegador.');
  const [decodedValue, setDecodedValue] = useState('');

  async function startCamera() {
    setMessage('Solicitando permiso para usar la cámara…');
    setDecodedValue('');
    const scanner = new Html5Qrcode('camera-test-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (value) => {
          setDecodedValue(value);
          setMessage('La cámara y el lector QR están funcionando. El código se queda en esta página de prueba.');
        },
        () => undefined,
      );
      setActive(true);
      setMessage('Cámara activa. Enfoca un código QR para comprobar también la lectura.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir la cámara. Revisa el permiso del navegador.');
      scannerRef.current = null;
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;
    if (scanner) {
      try { await scanner.stop(); scanner.clear(); } catch { /* puede haberse cerrado desde el navegador */ }
      scannerRef.current = null;
    }
    setActive(false);
    setMessage('Cámara apagada.');
  }

  useEffect(() => () => { void scannerRef.current?.stop().catch(() => undefined); }, []);

  return (
    <main className="club-container scanner-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">PRUEBA DE DISPOSITIVO</span>
        <h1>Prueba la cámara.</h1>
        <p>Esta página solo comprueba que el celular pueda abrir la cámara y leer un QR. No inicia sesión ni envía o guarda el contenido escaneado.</p>
      </section>
      <section className="glass-panel scanner-card">
        <div className="scanner-heading"><div><h2>Cámara trasera</h2><p>{message}</p></div><span className="scanner-live"><i /> {active ? 'ACTIVA' : 'LISTA PARA PROBAR'}</span></div>
        <div id="camera-test-reader" className="camera-test-reader" />
        <div className="camera-test-actions">
          {!active ? <button className="club-button" type="button" onClick={() => void startCamera()}>Probar cámara</button> : <button className="club-button" type="button" onClick={() => void stopCamera()}>Apagar cámara</button>}
        </div>
        {decodedValue && <div role="status" className="scanner-result result-permitido"><strong>QR LEÍDO</strong><p className="camera-test-code">{decodedValue}</p></div>}
      </section>
      <p className="scanner-footnote">Si bloqueaste el permiso, habilita Cámara para este sitio en los ajustes del navegador y vuelve a intentarlo.</p>
    </main>
  );
}
