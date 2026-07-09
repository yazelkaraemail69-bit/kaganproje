"use client";

import { Smartphone } from "lucide-react";

export function ContactSaveHint() {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
        <Smartphone className="h-3.5 w-3.5" /> Rehbere kaydetme ipucu
      </div>
      <p>
        iPhone: <strong>Rehbere Kaydet</strong> butonuna dokunun veya .vcf dosyasını açın. Android: indirilen
        .vcf dosyasına dokunarak kişiyi ekleyin. QR kodu tarayanlar doğrudan bu sayfadan iletişim kurabilir.
      </p>
    </div>
  );
}
