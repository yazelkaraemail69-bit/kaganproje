"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ItemImageButton } from "@/components/ui/ItemImageButton";
import { getBusinessConfig, getCategorySuggestions } from "@/lib/business-config";
import {
  createMenuCategory,
  createMenuItem,
  type MenuCategory,
  type MenuData,
  type MenuItem,
} from "@/lib/types";
import {
  DEFAULT_MENU_LOCALE,
  MENU_LOCALE_OPTIONS,
  type MenuLocaleCode,
} from "@/lib/menu-locales";

interface StepMenuItemsProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

export function StepMenuItems({ data, onChange }: StepMenuItemsProps) {
  const config = getBusinessConfig(data.businessType);
  const categorySuggestions = getCategorySuggestions(data.businessType);
  const extraLocales = (data.enabledLocales ?? [DEFAULT_MENU_LOCALE]).filter(
    (l) => l !== DEFAULT_MENU_LOCALE
  );

  function setItemTranslation(
    itemId: string,
    locale: MenuLocaleCode,
    field: "name" | "description",
    value: string
  ) {
    const items = {
      ...data.translations?.items,
      [itemId]: {
        ...data.translations?.items?.[itemId],
        [locale]: {
          ...data.translations?.items?.[itemId]?.[locale],
          [field]: value,
        },
      },
    };
    onChange({ translations: { ...data.translations, items } });
  }

  function setCategories(categories: MenuCategory[]) {
    onChange({ categories });
  }

  function addCategory() {
    setCategories([...data.categories, createMenuCategory()]);
  }

  function removeCategory(categoryId: string) {
    setCategories(data.categories.filter((category) => category.id !== categoryId));
  }

  function updateCategoryName(categoryId: string, name: string) {
    setCategories(
      data.categories.map((category) => (category.id === categoryId ? { ...category, name } : category))
    );
  }

  function addItem(categoryId: string) {
    setCategories(
      data.categories.map((category) =>
        category.id === categoryId ? { ...category, items: [...category.items, createMenuItem()] } : category
      )
    );
  }

  function removeItem(categoryId: string, itemId: string) {
    setCategories(
      data.categories.map((category) =>
        category.id === categoryId
          ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
          : category
      )
    );
  }

  function updateItem(categoryId: string, itemId: string, patch: Partial<MenuItem>) {
    setCategories(
      data.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : category
      )
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <datalist id="category-suggestions">
        {categorySuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      {data.categories.map((category) => (
        <div key={category.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              placeholder={config.categoryPlaceholder}
              list="category-suggestions"
              value={category.name}
              onChange={(event) => updateCategoryName(category.id, event.target.value)}
            />
            {data.categories.length > 1 ? (
              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                aria-label="Kategoriyi sil"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {category.items.map((item, itemIndex) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <ItemImageButton
                  value={item.imageUrl}
                  onChange={(imageUrl) => updateItem(category.id, item.id, { imageUrl })}
                  label={`${config.itemLabel} ${itemIndex + 1} görseli ekle`}
                  aiContext={{
                    businessType: data.businessType,
                    itemName: item.name,
                    itemDescription: item.description,
                    restaurantName: data.restaurantName,
                  }}
                />
                <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-start">
                  <div className="flex flex-1 flex-col gap-2.5">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      placeholder={`${config.itemLabel} adı ${itemIndex + 1}`}
                      value={item.name}
                      onChange={(event) => updateItem(category.id, item.id, { name: event.target.value })}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      placeholder="Açıklama (opsiyonel)"
                      value={item.description}
                      onChange={(event) => updateItem(category.id, item.id, { description: event.target.value })}
                    />
                    {extraLocales.length > 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-2.5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Çeviriler
                        </p>
                        {extraLocales.map((locale) => {
                          const option = MENU_LOCALE_OPTIONS.find((l) => l.code === locale)!;
                          return (
                            <div key={locale} className="mb-2 flex flex-col gap-1.5 last:mb-0">
                              <span className="text-[10px] font-semibold text-slate-500">
                                {option.flag} {option.nativeLabel}
                              </span>
                              <input
                                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
                                placeholder={`${config.itemLabel} adı`}
                                value={data.translations?.items?.[item.id]?.[locale]?.name ?? ""}
                                onChange={(e) => setItemTranslation(item.id, locale, "name", e.target.value)}
                              />
                              <input
                                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
                                placeholder="Açıklama"
                                value={data.translations?.items?.[item.id]?.[locale]?.description ?? ""}
                                onChange={(e) =>
                                  setItemTranslation(item.id, locale, "description", e.target.value)
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:w-28"
                    placeholder="Fiyat"
                    inputMode="decimal"
                    value={item.price}
                    onChange={(event) => updateItem(category.id, item.id, { price: event.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(category.id, item.id)}
                  disabled={category.items.length === 1}
                  aria-label={`${config.itemLabel} sil`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItem(category.id)}
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            <Plus className="h-4 w-4" /> {config.itemLabel} Ekle
          </button>
        </div>
      ))}

      <Button variant="secondary" onClick={addCategory} className="self-start">
        <Plus className="h-4 w-4" /> Kategori Ekle
      </Button>
    </div>
  );
}
