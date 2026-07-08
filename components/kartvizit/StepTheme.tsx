"use client";

import { ThemeSwatch } from "@/components/ui/ThemeSwatch";
import { THEME_PRESETS } from "@/lib/themes";
import type { BusinessCardData } from "@/lib/types";

interface StepThemeProps {
  data: BusinessCardData;
  onChange: (patch: Partial<BusinessCardData>) => void;
}

export function StepTheme({ data, onChange }: StepThemeProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Kartvizitinizin rengini işletmenize uygun şekilde seçin. Önizlemede anında görebilirsiniz.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
    </div>
  );
}
