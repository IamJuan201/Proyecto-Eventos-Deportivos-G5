"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [result, setResult] = useState("");

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();

    const startScanner = async () => {
      try {
        controlsRef.current = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, error) => {
            console.log("RESULTADO:", result);
            console.log("ERROR:", error);

            if (result) {
              console.log("QR ENCONTRADO:", result.getText());

              setResult(result.getText());

              controlsRef.current?.stop();
            }
          }
        );
      } catch (error) {
        console.error("Error con la cámara:", error);
      }
    };

    startScanner();

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} />
      <p>Escanea el código QR</p>
      {result && <p>QR: {result}</p>}
    </div>
  );
}