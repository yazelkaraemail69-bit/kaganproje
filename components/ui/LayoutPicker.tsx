"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayoutOption } from "@/lib/layouts";

interface LayoutPickerProps<T extends string> {
  label: string;
  hint?: string;
  options: LayoutOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
}

export function LayoutPicker<T extends string>({
  label,
  hint,
  options,
  selectedId,
  onSelect,
}: LayoutPickerProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border-2 p-3 text-left transition-all",
                selected
                  ? "border-brand-500 bg-brand-50/50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span
                className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl shadow-inner"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${option.previewFrom}, ${option.previewTo})`,
                }}
              >
                {selected ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow">
                    <Check className="h-3.5 w-3.5 text-slate-900" />
                  </span>
                ) : null}
              </span>
              <span className="text-xs font-bold text-slate-800">{option.name}</span>
              <span className="text-[10px] leading-tight text-slate-400">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
