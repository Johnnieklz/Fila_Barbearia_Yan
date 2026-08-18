"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";

interface QRCodePanelProps {
  publicUrl: string;
  barbershopName: string;
}

export function QRCodePanel({ publicUrl, barbershopName }: QRCodePanelProps) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=480,height=640");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code — ${barbershopName}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            h1 { font-size: 20px; margin-bottom: 24px; }
            p { color: #555; margin-top: 24px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>${barbershopName}</h1>
          ${content.innerHTML}
          <p>Escaneie para entrar na fila</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="surface-card flex flex-col items-center gap-4 text-center">
      <div ref={printRef} className="rounded-2xl bg-cream p-4">
        <QRCodeSVG value={publicUrl} size={200} bgColor="#F3ECDF" fgColor="#0E0D0C" />
      </div>
      <p className="break-all text-sm text-muted">{publicUrl}</p>
      <div className="flex w-full gap-3">
        <button
          className="btn-secondary"
          onClick={() => navigator.clipboard?.writeText(publicUrl)}
        >
          Copiar link
        </button>
        <button className="btn-primary" onClick={handlePrint}>
          Imprimir QR
        </button>
      </div>
    </div>
  );
}
