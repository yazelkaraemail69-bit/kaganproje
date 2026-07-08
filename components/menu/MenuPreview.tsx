"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Pencil, RotateCcw, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QrCodeCard } from "@/components/ui/QrCode";
import type { MenuData } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useDominantColors } from "@/lib/useDominantColors";
import { getReadableTextColor } from "@/lib/colors";
import { AUTO_THEME_ID, DEFAULT_MENU_THEME_ID, getThemePreset } from "@/lib/themes";
import { buildMenuShareUrl } from "@/lib/share";

interface MenuPreviewProps {
  data: MenuData;
  onEdit?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
}

export function MenuPreview({ data, onEdit, onReset, readOnly = false }: MenuPreviewProps) {
  const visibleCategories = data.categories.filter((category) =>
    category.items.some((item) => item.name.trim())
  );

  const isAuto = data.themeId === AUTO_THEME_ID || !data.themeId;
  // Personalizes the menu's colors using the restaurant's own logo/cover photo
  // when "Otomatik" is selected; otherwise a curated preset is used.
  const autoColors = useDominantColors(isAuto ? data.logoUrl : "", 3);
  const hasAutoColors = isAuto && autoColors.length >= 2;
  const fallbackTheme = getThemePreset(DEFAULT_MENU_THEME_ID, DEFAULT_MENU_THEME_ID);
  const preset = isAuto ? fallbackTheme : getThemePreset(data.themeId, DEFAULT_MENU_THEME_ID);

  const headerFrom = hasAutoColors ? autoColors[0] : preset.from;
  const headerTo = hasAutoColors ? autoColors[1] : preset.to;
  const accentColor = hasAutoColors ? autoColors[2] ?? autoColors[1] : preset.accent;
  const headerTextColor = hasAutoColors ? getReadableTextColor(headerFrom) : preset.text;
  const isLight = hasAutoColors ? headerTextColor === "#0f172a" : Boolean(preset.isLight);
  const overlay = isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.12)";
  const panelBorder = isLight ? "rgba(15,23,42,0.15)" : "rgba(255,255,255,0.3)";
  const mutedText = isLight ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.85)";

  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (readOnly) return;
    let cancelled = false;
    buildMenuShareUrl(data).then((url) => {
      if (!cancelled) setShareUrl(url);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
      <div className="w-full overflow-hidden rounded-3xl border border-slate-100 bg-white card-shadow">
        <div
          className="relative flex flex-col items-center gap-3 overflow-hidden px-8 py-10 text-center"
          style={{ backgroundImage: `linear-gradient(135deg, ${headerFrom}, ${headerTo})`, color: headerTextColor }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full"
            style={{ backgroundColor: overlay }}
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full"
            style={{ backgroundColor: overlay }}
          />

          <div
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2"
            style={{ borderColor: panelBorder, backgroundColor: overlay }}
          >
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logoUrl} alt={data.restaurantName} className="h-full w-full object-cover" />
            ) : (
              <UtensilsCrossed className="h-7 w-7" style={{ color: mutedText }} />
            )}
          </div>
          <h2 className="relative text-2xl font-black sm:text-3xl" style={{ color: headerTextColor }}>
            {data.restaurantName || "Restoran Adı"}
          </h2>
          {data.description ? (
            <p className="relative max-w-md text-sm" style={{ color: mutedText }}>
              {data.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {visibleCategories.length === 0 ? (
            <p className="px-8 py-10 text-center text-sm text-slate-400">Henüz ürün eklenmedi.</p>
          ) : (
            visibleCategories.map((category) => (
              <div key={category.id} className="px-6 py-6 sm:px-8">
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
                  {category.name || "Kategori"}
                </h3>
                <div className="flex flex-col gap-4">
                  {category.items
                    .filter((item) => item.name.trim())
                    .map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : null}
                        <div className="flex flex-1 items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{item.name}</p>
                            {item.description ? (
                              <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                            ) : null}
                          </div>
                          {item.price ? (
                            <span
                              className="shrink-0 whitespace-nowrap text-sm font-bold"
                              style={{ color: accentColor }}
                            >
                              {formatPrice(item.price)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {readOnly ? (
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          Kendi dijital menünüzü oluşturun <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <>
          <div className="flex w-full flex-col gap-2.5 sm:flex-row">
            <Button variant="secondary" className="flex-1" onClick={onEdit}>
              <Pencil className="h-4 w-4" /> Düzenle
            </Button>
            <Button variant="ghost" onClick={onReset}>
              <RotateCcw className="h-4 w-4" /> Yeni Oluştur
            </Button>
          </div>

          {shareUrl ? (
            <QrCodeCard
              value={shareUrl}
              title="QR ile Paylaş"
              description="Müşterileriniz bu kodu taratarak menüyü telefonlarında görüntüleyebilir."
              fileName={`${data.restaurantName || "menu"}-qr`}
              accentColor={accentColor}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
