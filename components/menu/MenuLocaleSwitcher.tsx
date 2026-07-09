"use client";

import type { MenuLocaleCode } from "@/lib/menu-locales";
import { getLocaleOption } from "@/lib/menu-locales";
import { cn } from "@/lib/utils";

interface MenuLocaleSwitcherProps {
  locales: MenuLocaleCode[];
  active: MenuLocaleCode;
  onChange: (locale: MenuLocaleCode) => void;
  accentColor: string;
}

export function MenuLocaleSwitcher({ locales, active, onChange, accentColor }: MenuLocaleSwitcherProps) {
  if (locales.length <= 1) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 border-b border-[#e8dfd0] bg-[#fffef9]/95 px-4 py-2.5">
      {locales.map((code) => {
        const option = getLocaleOption(code);
        const isActive = code === active;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              isActive ? "text-white shadow-sm" : "bg-[#f5efe6] text-[#6b5d4f] hover:bg-[#ebe3d8]"
            )}
            style={isActive ? { backgroundColor: accentColor } : undefined}
            aria-pressed={isActive}
          >
            {option.flag} {option.nativeLabel}
          </button>
        );
      })}
    </div>
  );
}
