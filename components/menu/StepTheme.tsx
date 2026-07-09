"use client";

import { useState } from "react";
import { ChevronDown, Globe, MessageCircle, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { ThemeSwatch } from "@/components/ui/ThemeSwatch";
import { LayoutPicker } from "@/components/ui/LayoutPicker";
import { AUTO_THEME_ID, THEME_PRESETS } from "@/lib/themes";
import { getBusinessConfig, getMenuLayoutsForBusiness } from "@/lib/business-config";
import { useDominantColors } from "@/lib/useDominantColors";
import type { MenuData } from "@/lib/types";
import type { MenuLayoutId } from "@/lib/layouts";
import {
  DEFAULT_MENU_LOCALE,
  MENU_LOCALE_OPTIONS,
  type MenuLocaleCode,
  type MenuTranslations,
} from "@/lib/menu-locales";
import { cn } from "@/lib/utils";

const MENU_THEME_IDS = [
  "amber",
  "sunset",
  "truffle",
  "sage",
  "espresso",
  "emerald",
  "ocean",
  "midnight",
  "gold",
  "indigo",
  "rose",
  "cloud",
];

interface StepThemeProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

function updateTranslations(
  current: MenuTranslations | undefined,
  patch: Partial<MenuTranslations>
): MenuTranslations {
  return { ...current, ...patch };
}

export function StepTheme({ data, onChange }: StepThemeProps) {
  const config = getBusinessConfig(data.businessType);
  const layoutOptions = getMenuLayoutsForBusiness(data.businessType);
  const autoColors = useDominantColors(data.logoUrl, 3);
  const hasAutoColors = autoColors.length >= 2;
  const menuThemes = THEME_PRESETS.filter((t) => MENU_THEME_IDS.includes(t.id));

  const enabledLocales = data.enabledLocales?.length ? data.enabledLocales : [DEFAULT_MENU_LOCALE];
  const extraLocales = enabledLocales.filter((l) => l !== DEFAULT_MENU_LOCALE);
  const [showTranslations, setShowTranslations] = useState(extraLocales.length > 0);

  function toggleLocale(code: MenuLocaleCode) {
    if (code === DEFAULT_MENU_LOCALE) return;
    const next = enabledLocales.includes(code)
      ? enabledLocales.filter((l) => l !== code)
      : [...enabledLocales, code];
    onChange({ enabledLocales: next });
    if (!next.includes(code)) return;
    setShowTranslations(true);
  }

  function setTranslationField(
    field: "restaurantName" | "description",
    locale: MenuLocaleCode,
    value: string
  ) {
    const translations = updateTranslations(data.translations, {
      [field]: { ...data.translations?.[field], [locale]: value },
    });
    onChange({ translations });
  }

  function setCategoryTranslation(categoryId: string, locale: MenuLocaleCode, value: string) {
    const categories = {
      ...data.translations?.categories,
      [categoryId]: { ...data.translations?.categories?.[categoryId], [locale]: value },
    };
    onChange({ translations: updateTranslations(data.translations, { categories }) });
  }

  const showBakanlikHint = data.businessType === "restaurant" || data.businessType === "cafe";

  return (
    <div className="flex flex-col gap-6">
      <LayoutPicker
        label={`${config.catalogTitle} düzeni`}
        hint="İşletme türünüze uygun şablonlar."
        options={layoutOptions}
        selectedId={(data.layoutId as MenuLayoutId) || "classic"}
        onSelect={(layoutId) => onChange({ layoutId })}
      />

      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          {config.themeHint} {config.layoutHint}
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <ThemeSwatch
            name="Logomdan Otomatik"
            from={hasAutoColors ? autoColors[0] : "#f97316"}
            to={hasAutoColors ? autoColors[1] : "#ea580c"}
            selected={hasAutoColors && data.themeId === AUTO_THEME_ID}
            onClick={() => onChange({ themeId: AUTO_THEME_ID })}
            disabled={!hasAutoColors}
            hint={hasAutoColors ? undefined : "Önce logo ekleyin"}
          />
          {menuThemes.map((theme) => (
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

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <MessageCircle className="h-4 w-4 text-[#25D366]" /> Yayın Ayarları
        </p>
        <p className="mt-1 text-xs text-slate-500">
          WhatsApp sipariş ve çoklu dil menü için iletişim ve dil seçenekleri.
        </p>

        <div className="mt-4">
          <Input
            label="WhatsApp Sipariş Telefonu"
            placeholder="05xx xxx xx xx"
            hint="Müşteriler menüden sepet oluşturup bu numaraya sipariş gönderebilir."
            value={data.contactPhone ?? ""}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Globe className="h-3.5 w-3.5" /> Menü Dilleri
          </p>
          <div className="flex flex-wrap gap-2">
            {MENU_LOCALE_OPTIONS.map((option) => {
              const isTr = option.code === DEFAULT_MENU_LOCALE;
              const checked = enabledLocales.includes(option.code);
              return (
                <label
                  key={option.code}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    checked ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600",
                    isTr && "cursor-default opacity-80"
                  )}
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={checked}
                    disabled={isTr}
                    onChange={() => toggleLocale(option.code)}
                  />
                  {option.flag} {option.label}
                </label>
              );
            })}
          </div>
        </div>

        {extraLocales.length > 0 ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowTranslations((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700"
            >
              Çeviri alanları ({extraLocales.length} dil)
              <ChevronDown className={cn("h-4 w-4 transition-transform", showTranslations && "rotate-180")} />
            </button>

            {showTranslations ? (
              <div className="mt-3 flex flex-col gap-4">
                {extraLocales.map((locale) => {
                  const option = MENU_LOCALE_OPTIONS.find((l) => l.code === locale)!;
                  return (
                    <div key={locale} className="rounded-xl border border-slate-200 bg-white p-3.5">
                      <p className="mb-3 text-xs font-bold text-slate-800">
                        {option.flag} {option.nativeLabel}
                      </p>
                      <div className="flex flex-col gap-2.5">
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                          placeholder={`${config.businessNameLabel} (${option.label})`}
                          value={data.translations?.restaurantName?.[locale] ?? ""}
                          onChange={(e) => setTranslationField("restaurantName", locale, e.target.value)}
                        />
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                          placeholder={`Açıklama (${option.label})`}
                          value={data.translations?.description?.[locale] ?? ""}
                          onChange={(e) => setTranslationField("description", locale, e.target.value)}
                        />
                        {data.categories.map((category) => (
                          <input
                            key={category.id}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                            placeholder={`Kategori: ${category.name || "…"} (${option.label})`}
                            value={data.translations?.categories?.[category.id]?.[locale] ?? ""}
                            onChange={(e) => setCategoryTranslation(category.id, locale, e.target.value)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="text-[11px] text-slate-400">
                  Ürün çevirileri bir sonraki adımda (Ürünler & Hizmetler) görünür.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {showBakanlikHint ? (
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Yayınladıktan sonra Bakanlık fiyat listesi JSON/CSV dışa aktarımı ve basılı liste seçenekleri
            önizleme ekranında sunulur.
          </p>
        ) : null}
      </div>
    </div>
  );
}
