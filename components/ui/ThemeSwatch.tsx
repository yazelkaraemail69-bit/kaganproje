"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSwatchProps {
  name: string;
  from: string;
  to: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  ringColor?: string;
}

export function ThemeSwatch({ name, from, to, selected, onClick, disabled, hint, ringColor }: ThemeSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all",
        selected ? "border-brand-500 bg-brand-50/60 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300",
        disabled && "cursor-not-allowed opacity-40 hover:border-slate-200"
      )}
    >
      <span
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-inner ring-1 ring-black/5"
        style={{
          backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          boxShadow: selected && ringColor ? `0 0 0 3px ${ringColor}33` : undefined,
        }}
      >
        {selected ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow">
            <Check className="h-3.5 w-3.5 text-slate-900" />
          </span>
        ) : null}
      </span>
      <span className="text-xs font-semibold leading-tight text-slate-700">{name}</span>
      {hint ? <span className="text-[10px] leading-tight text-slate-400">{hint}</span> : null}
    </button>
  );
}
