"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScanPage() {
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    scanner.render(
      (decodedText) => {
        setResult(decodedText);
        scanner.clear(); 
      },
      () => {
        
      },
    );

    
    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div>
      <h1>Scan QR Code</h1>
      <div id="reader" />
      {result && <p>Código leído: {result}</p>}
    </div>
  );
}