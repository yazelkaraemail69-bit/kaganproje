"use client";

import { Input, Textarea } from "@/components/ui/Field";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import type { MenuData } from "@/lib/types";

interface StepRestaurantInfoProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

export function StepRestaurantInfo({ data, onChange }: StepRestaurantInfoProps) {
  return (
    <div className="flex flex-col gap-5">
      <PhotoUpload
        label="Logo / Kapak Görseli"
        hint="Menünün üst kısmında gösterilecek."
        shape="square"
        value={data.logoUrl}
        onChange={(logoUrl) => onChange({ logoUrl })}
      />
      <Input
        label="Restoran Adı"
        required
        placeholder="Örn. Lezzet Durağı"
        value={data.restaurantName}
        onChange={(event) => onChange({ restaurantName: event.target.value })}
      />
      <Textarea
        label="Kısa Açıklama"
        placeholder="Örn. Ev yapımı lezzetler, taze malzemeler."
        value={data.description}
        onChange={(event) => onChange({ description: event.target.value })}
      />
    </div>
  );
}
