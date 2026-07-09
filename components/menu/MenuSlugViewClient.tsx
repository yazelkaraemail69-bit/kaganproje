"use client";

import { MenuPreview } from "@/components/menu/MenuPreview";
import type { MenuData } from "@/lib/types";

interface MenuSlugViewClientProps {
  data: MenuData;
  shareUrl: string;
}

export function MenuSlugViewClient({ data, shareUrl }: MenuSlugViewClientProps) {
  return (
    <div className="container-app py-10 sm:py-14">
      <MenuPreview data={data} shareUrl={shareUrl} readOnly />
    </div>
  );
}
