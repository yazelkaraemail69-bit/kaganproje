"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, Link2, QrCode as QrCodeIcon } from "lucide-react";
import {
  QR_DEFAULT_SIZE,
  QR_ERROR_CORRECTION_LEVEL,
  QR_MARGIN_MODULES,
  QR_SAFE_MAX_LENGTH,
} from "@/lib/qr/constants";

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
  const [copied, setCopied] = useState(false);
  const canRenderQr = value.length <= QR_SAFE_MAX_LENGTH;

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Bağlantıyı kopyalayın:", value);
    }
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
            {canRenderQr ? <QrCodeIcon className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          </span>
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        {description ? <p className="max-w-xs text-xs leading-5 text-slate-400">{description}</p> : null}

        {canRenderQr ? (
          <>
            <div
              className="rounded-2xl border-2 bg-white p-4"
              style={{ borderColor: `${accentColor}33` }}
            >
              <QRCodeCanvas
                ref={canvasRef}
                value={value}
                size={QR_DEFAULT_SIZE}
                level={QR_ERROR_CORRECTION_LEVEL}
                marginSize={QR_MARGIN_MODULES}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            <p className="text-[10px] text-slate-400">ECC Level H · Baskı ve logo için yüksek tarama güvenilirliği</p>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 active:scale-[0.98] sm:w-auto"
              style={{ borderColor: `${accentColor}40`, color: accentColor, backgroundColor: `${accentColor}0d` }}
            >
              <Download className="h-4 w-4" /> QR Kodu İndir
            </button>
          </>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            Bağlantı çok uzun olduğu için QR kod oluşturulamadı. Bağlantıyı kopyalayıp paylaşabilirsiniz.
          </p>
        )}

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] sm:w-auto"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Kopyalandı" : "Bağlantıyı Kopyala"}
        </button>
      </div>
    </div>
  );
}
