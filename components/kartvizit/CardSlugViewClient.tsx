"use client";

import { CardPreview } from "@/components/kartvizit/CardPreview";
import type { BusinessCardData } from "@/lib/types";

interface CardSlugViewClientProps {
  data: BusinessCardData;
  shareUrl: string;
}

export function CardSlugViewClient({ data, shareUrl }: CardSlugViewClientProps) {
  return (
    <div className="container-app py-10 sm:py-14">
      <CardPreview data={data} shareUrl={shareUrl} readOnly />
    </div>
  );
}
