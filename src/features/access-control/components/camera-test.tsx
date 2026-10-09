'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslate } from '@/shared/i18n/locale-provider';

export function CameraTest() {
  const t = useTranslate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('Activa la cámara para leer un código QR.');
  const [decodedValue, setDecodedValue] = useState('');

  async function startCamera() {
    setMessage(t('Solicitando permiso para usar la cámara…'));
    setDecodedValue('');
    const scanner = new Html5Qrcode('camera-test-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (value) => {
          setDecodedValue(value);
          setMessage(t('Código QR leído correctamente.'));
        },
        () => undefined,
      );
      setActive(true);
      setMessage(t('Cámara activa. Enfoca un código QR para comprobar también la lectura.'));
    } catch (error) {
      setMessage(error instanceof Error ? t(error.message) : t('No se pudo abrir la cámara. Revisa el permiso del navegador.'));
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
    setMessage(t('Cámara apagada.'));
  }

  useEffect(() => () => { void scannerRef.current?.stop().catch(() => undefined); }, []);

  return (
    <main className="club-container scanner-wrap">
      <section className="page-heading compact-page-heading">
        <span className="eyebrow">{t('LECTOR QR')}</span>
        <h1>{t('Diagnóstico del escáner.')}</h1>
        <p>{t('Verifica el acceso a la cámara y la lectura de códigos QR. El código leído se muestra solo en esta página.')}</p>
      </section>
      <section className="glass-panel scanner-card">
        <div className="scanner-heading"><div><h2>{t('Cámara trasera')}</h2><p>{t(message)}</p></div><span className="scanner-live"><i /> {active ? t('ACTIVA') : t('LISTA')}</span></div>
        <div id="camera-test-reader" className="camera-test-reader" />
        <div className="camera-test-actions">
          {!active ? <button className="club-button" type="button" onClick={() => void startCamera()}>{t('Activar cámara')}</button> : <button className="club-button" type="button" onClick={() => void stopCamera()}>{t('Apagar cámara')}</button>}
        </div>
        {decodedValue && <div role="status" className="scanner-result result-permitido"><strong>{t('QR LEÍDO')}</strong><p className="camera-test-code">{decodedValue}</p></div>}
      </section>
      <p className="scanner-footnote">{t('Si bloqueaste el permiso, habilita Cámara para este sitio en los ajustes del navegador y vuelve a intentarlo.')}</p>
    </main>
  );
}
