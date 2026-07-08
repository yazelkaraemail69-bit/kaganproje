"use client";

import { Wand2 } from "lucide-react";
import { ThemeSwatch } from "@/components/ui/ThemeSwatch";
import { AUTO_THEME_ID, THEME_PRESETS } from "@/lib/themes";
import { useDominantColors } from "@/lib/useDominantColors";
import type { MenuData } from "@/lib/types";

interface StepThemeProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

export function StepTheme({ data, onChange }: StepThemeProps) {
  const autoColors = useDominantColors(data.logoUrl, 3);
  const hasAutoColors = autoColors.length >= 2;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Menünüzün rengini seçin. Logonuzdan otomatik renk çıkarabilir ya da hazır bir tema kullanabilirsiniz.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <ThemeSwatch
          name="Logomdan Otomatik"
          from={hasAutoColors ? autoColors[0] : "#f97316"}
          to={hasAutoColors ? autoColors[1] : "#ea580c"}
          selected={data.themeId === AUTO_THEME_ID}
          onClick={() => onChange({ themeId: AUTO_THEME_ID })}
          disabled={!hasAutoColors}
          hint={hasAutoColors ? undefined : "Önce logo ekleyin"}
        />
        {THEME_PRESETS.map((theme) => (
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
      {hasAutoColors && data.themeId === AUTO_THEME_ID ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Wand2 className="h-3.5 w-3.5" /> Renkler logonuzdan otomatik olarak çıkarıldı.
        </p>
      ) : null}
    </div>
  );
}
