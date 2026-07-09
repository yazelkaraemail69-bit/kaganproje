"use client";

import { ThemeSwatch } from "@/components/ui/ThemeSwatch";
import { LayoutPicker } from "@/components/ui/LayoutPicker";
import { THEME_PRESETS } from "@/lib/themes";
import { CARD_LAYOUTS } from "@/lib/layouts";
import type { BusinessCardData } from "@/lib/types";
import type { CardLayoutId } from "@/lib/layouts";

/** Kartvizit için önerilen temalar (2025: executive, minimal, bakır) */
const CARD_THEME_IDS = [
  "executive",
  "charcoal",
  "copper",
  "midnight",
  "indigo",
  "gold",
  "blush",
  "emerald",
  "ocean",
  "rose",
  "cloud",
  "sunset",
];

interface StepThemeProps {
  data: BusinessCardData;
  onChange: (patch: Partial<BusinessCardData>) => void;
}

export function StepTheme({ data, onChange }: StepThemeProps) {
  const cardThemes = THEME_PRESETS.filter((t) => CARD_THEME_IDS.includes(t.id));

  return (
    <div className="flex flex-col gap-6">
      <LayoutPicker
        label="Kartvizit düzeni"
        hint="2025 profesyonel kartvizit trendlerine göre şablonlar."
        options={CARD_LAYOUTS}
        selectedId={(data.layoutId as CardLayoutId) || "classic"}
        onSelect={(layoutId) => onChange({ layoutId })}
      />

      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Kurumsal görünüm için Executive veya Charcoal; yaratıcı sektörler için Bold düzeni ile Mercan
          veya Gün Batımı paletlerini deneyin.
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {cardThemes.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              name={theme.name}
              from={theme.from}
              to={theme.to}
              selected={data.themeId === theme.id}
              onClick={() => onChange({ themeId: theme.id })}
              ringColor={theme.accent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
