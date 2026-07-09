"use client";

import {
  Briefcase,
  Coffee,
  Flower2,
  HeartPulse,
  Scissors,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPE_OPTIONS, getBusinessConfig, type BusinessType } from "@/lib/business-config";
import { createMenuCategory } from "@/lib/types";
import type { MenuData } from "@/lib/types";

const ICONS: Record<BusinessType, React.ComponentType<{ className?: string }>> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  salon: Scissors,
  spa: Flower2,
  shop: ShoppingBag,
  service: Briefcase,
  clinic: HeartPulse,
  other: Sparkles,
};

interface StepBusinessTypeProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

export function StepBusinessType({ data, onChange }: StepBusinessTypeProps) {
  const selected = getBusinessConfig(data.businessType);

  function selectType(type: BusinessType) {
    if (type === data.businessType) return;
    const config = getBusinessConfig(type);
    onChange({
      businessType: type,
      categories: [createMenuCategory(config.defaultCategory)],
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-500">
        İşletme türünü seçin. Logo, kategori önerileri, AI görselleri ve katalog metinleri buna göre
        uyarlanır.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BUSINESS_TYPE_OPTIONS.map((option) => {
          const Icon = ICONS[option.id];
          const isSelected = data.businessType === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectType(option.id)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                isSelected
                  ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isSelected ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">{option.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Seçili: <strong className="text-slate-700">{selected.catalogTitle}</strong> formatında katalog
        oluşturulacak. Sonraki adımda <strong className="text-slate-700">{selected.businessNameLabel}</strong>{" "}
        gireceksiniz.
      </p>
    </div>
  );
}
