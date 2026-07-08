"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode as QrCodeIcon } from "lucide-react";

interface QrCodeCardProps {
  value: string;
  title: string;
  description?: string;
  fileName?: string;
  accentColor?: string;
}

export function QrCodeCard({
  value,
  title,
  description,
  fileName = "qr-kod",
  accentColor = "#4f46e5",
}: QrCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="card-shadow relative w-full overflow-hidden rounded-2xl border border-slate-100 bg-white p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accentColor }} />

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
          >
            <QrCodeIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        {description ? <p className="max-w-xs text-xs leading-5 text-slate-400">{description}</p> : null}

        <div
          className="rounded-2xl border-2 bg-white p-3"
          style={{ borderColor: `${accentColor}33` }}
        >
          <QRCodeCanvas ref={canvasRef} value={value} size={160} level="M" marginSize={2} />
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 active:scale-[0.98] sm:w-auto"
          style={{ borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}0d` }}
        >
          <Download className="h-4 w-4" /> QR Kodu İndir
        </button>
      </div>
    </div>
  );
}
