"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ItemImageButton } from "@/components/ui/ItemImageButton";
import {
  createMenuCategory,
  createMenuItem,
  MENU_CATEGORY_SUGGESTIONS,
  type MenuCategory,
  type MenuData,
  type MenuItem,
} from "@/lib/types";

interface StepMenuItemsProps {
  data: MenuData;
  onChange: (patch: Partial<MenuData>) => void;
}

export function StepMenuItems({ data, onChange }: StepMenuItemsProps) {
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
        {MENU_CATEGORY_SUGGESTIONS.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      {data.categories.map((category) => (
        <div key={category.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              placeholder={`Kategori Adı (Örn. Ana Yemekler)`}
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
                  label={`Ürün ${itemIndex + 1} görseli ekle`}
                />
                <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-start">
                  <div className="flex flex-1 flex-col gap-2.5">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      placeholder={`Ürün adı ${itemIndex + 1}`}
                      value={item.name}
                      onChange={(event) => updateItem(category.id, item.id, { name: event.target.value })}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                      placeholder="Açıklama (opsiyonel)"
                      value={item.description}
                      onChange={(event) => updateItem(category.id, item.id, { description: event.target.value })}
                    />
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
                  aria-label="Ürünü sil"
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
            <Plus className="h-4 w-4" /> Ürün Ekle
          </button>
        </div>
      ))}

      <Button variant="secondary" onClick={addCategory} className="self-start">
        <Plus className="h-4 w-4" /> Kategori Ekle
      </Button>
    </div>
  );
}
