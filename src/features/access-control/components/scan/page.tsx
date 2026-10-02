"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScanPage() {
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setResult(decodedText);

        // Detener el lector después de detectar el QR
        scanner.clear().catch((error) => {
          console.error("Error al detener el scanner:", error);
        });
      },
      (errorMessage) => {
        // Errores normales mientras busca un QR.
        // No es necesario mostrarlos.
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <main>
      <h1>Lector QR</h1>

      <div id="reader"></div>

      {result && (
        <div>
          <h2>Resultado:</h2>
          <p>{result}</p>
        </div>
      )}
    </main>
  );
}