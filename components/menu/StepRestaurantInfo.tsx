"use client";

import { Input, Textarea } from "@/components/ui/Field";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { getBusinessConfig } from "@/lib/business-config";
import type { MenuData } from "@/lib/types";

interface StepRestaurantInfoProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

export function StepRestaurantInfo({ data, onChange }: StepRestaurantInfoProps) {
  const config = getBusinessConfig(data.businessType);

  return (
    <div className="flex flex-col gap-5">
      <Input
        label={config.businessNameLabel}
        required
        placeholder={config.businessNamePlaceholder}
        value={data.restaurantName}
        onChange={(event) => onChange({ restaurantName: event.target.value })}
      />
      <Textarea
        label="Kısa Açıklama"
        placeholder={config.descriptionPlaceholder}
        value={data.description}
        onChange={(event) => onChange({ description: event.target.value })}
      />
      <PhotoUpload
        label="Logo / Kapak Görseli"
        hint={config.logoHint}
        shape="square"
        value={data.logoUrl}
        onChange={(logoUrl) => onChange({ logoUrl })}
        aiType="menu-logo"
        aiLabel="AI ile Logo Oluştur"
        promptBusinessName
        businessNamePromptTitle={`Logo hangi ${config.businessNameLabel.toLowerCase().replace(" adı", "")} için?`}
        businessNamePlaceholder={config.businessNamePlaceholder}
        onBusinessNameConfirm={(restaurantName) => onChange({ restaurantName })}
        aiContext={{
          businessType: data.businessType,
          restaurantName: data.restaurantName,
          restaurantDescription: data.description,
          themeHint: data.themeId,
        }}
      />
    </div>
  );
}
