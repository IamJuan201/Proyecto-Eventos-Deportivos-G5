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
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-12">
  <div className="mx-auto w-full max-w-md md:max-w-lg">

    <h1 className="mb-6 text-center text-2xl font-bold md:text-4xl">
      Lector QR
    </h1>

    <div
      id="reader"
      className="w-full overflow-hidden rounded-xl"
    />

    {result && (
      <div className="mt-6 rounded-xl p-4">
        <h2 className="text-lg font-bold md:text-xl">
          Resultado
        </h2>

        <p className="mt-2 break-all text-sm md:text-base">
          {result}
        </p>
      </div>
    )}

  </div>
</main>
  );
}