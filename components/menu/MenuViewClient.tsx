"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuPreview } from "@/components/menu/MenuPreview";
import { getBusinessConfig } from "@/lib/business-config";
import { decodeMenuShareData } from "@/lib/share";
import type { MenuData } from "@/lib/types";

function parseMenuData(encoded: string | null): MenuData | null {
  if (!encoded) return null;
  try {
    return decodeMenuShareData(encoded);
  } catch {
    return null;
  }
}

export function MenuViewClient() {
  const searchParams = useSearchParams();
  const data = parseMenuData(searchParams.get("d"));
  const title = data ? getBusinessConfig(data.businessType).catalogTitle : "Dijital Katalog";

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title={`Dijital ${title}`} />
      {data ? (
        <div className="container-app py-10 sm:py-14">
          <MenuPreview data={data} readOnly />
        </div>
      ) : (
        <div className="container-app flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center text-slate-400">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">Geçersiz veya bozuk menü bağlantısı.</p>
        </div>
      )}
    </main>
  );
}
