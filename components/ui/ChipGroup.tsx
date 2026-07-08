"use client";

import { cn } from "@/lib/utils";

interface ChipGroupProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ChipGroup({ options, value, onChange, className }: ChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              selected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
