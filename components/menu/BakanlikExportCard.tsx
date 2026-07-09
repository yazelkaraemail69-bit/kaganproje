"use client";

import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  downloadBakanlikCsv,
  downloadBakanlikJson,
  openPrintablePriceList,
} from "@/lib/export/bakanlik";
import type { MenuData } from "@/lib/types";

interface BakanlikExportCardProps {
  data: MenuData;
  accentColor: string;
}

export function BakanlikExportCard({ data, accentColor }: BakanlikExportCardProps) {
  const hasItems = data.categories.some((category) => category.items.some((item) => item.name.trim()));
  if (!hasItems) return null;

  return (
    <div
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      style={{ borderTopColor: accentColor, borderTopWidth: 3 }}
    >
      <p className="text-sm font-bold text-slate-900">Bakanlık Fiyat Listesi</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Fiyat Etiketi Yönetmeliği (Ekim 2025) için hazırlık formatında JSON/CSV dışa aktarım ve basılı liste.
        Resmî elektronik sistem yayımlanınca format güncellenecektir.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" className="text-xs" onClick={() => downloadBakanlikJson(data)}>
          <Download className="h-3.5 w-3.5" /> JSON
        </Button>
        <Button variant="secondary" className="text-xs" onClick={() => downloadBakanlikCsv(data)}>
          <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
        </Button>
        <Button variant="ghost" className="text-xs" onClick={() => openPrintablePriceList(data)}>
          <Printer className="h-3.5 w-3.5" /> Basılı Liste
        </Button>
      </div>
    </div>
  );
}
