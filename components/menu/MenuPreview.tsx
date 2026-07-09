"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QrCodeCard } from "@/components/ui/QrCode";
import { MenuPreviewBody } from "@/components/menu/MenuPreviewBody";
import { MenuOrderBar } from "@/components/menu/MenuOrderBar";
import { BakanlikExportCard } from "@/components/menu/BakanlikExportCard";
import { ProfileAnalyticsCard } from "@/components/shared/ProfileAnalyticsCard";
import { getBusinessConfig } from "@/lib/business-config";
import type { MenuData } from "@/lib/types";
import { useDominantColors } from "@/lib/useDominantColors";
import { resolveMenuVisualStyle } from "@/lib/menu-visual";
import { publishProfile } from "@/lib/share/publish";
import { prepareCatalogPayload } from "@/lib/share/prepare-publish";
import { getStoredProfileSlug, setStoredProfileSlug } from "@/lib/profile-slug-storage";
import { AUTO_THEME_ID } from "@/lib/themes";
import type { CartLine } from "@/lib/menu-cart";
import { DEFAULT_MENU_LOCALE, type MenuLocaleCode } from "@/lib/menu-locales";
import { cn } from "@/lib/utils";

interface MenuPreviewProps {
  data: MenuData;
  onEdit?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
  shareUrl?: string;
}

export function MenuPreview({ data, onEdit, onReset, readOnly = false, shareUrl: shareUrlProp }: MenuPreviewProps) {
  const config = getBusinessConfig(data.businessType);
  const isAuto = data.themeId === AUTO_THEME_ID || !data.themeId;
  const extractedColors = useDominantColors(
    isAuto && !data.customThemeColors?.length ? data.logoUrl : "",
    3
  );
  const autoColors =
    data.customThemeColors && data.customThemeColors.length >= 2
      ? data.customThemeColors
      : extractedColors;
  const style = resolveMenuVisualStyle(data, autoColors);
  const hasAutoColors = isAuto && autoColors.length >= 2;

  const [shareUrl, setShareUrl] = useState(shareUrlProp ?? "");
  const [publishedSlug, setPublishedSlug] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [publishing, setPublishing] = useState(!readOnly && !shareUrlProp);
  const [locale, setLocale] = useState<MenuLocaleCode>(DEFAULT_MENU_LOCALE);
  const [cart, setCart] = useState<CartLine[]>([]);

  const orderMode = readOnly && Boolean(data.contactPhone?.trim());
  const showBakanlikExport =
    !readOnly && (data.businessType === "restaurant" || data.businessType === "cafe");

  const cartQtyByItem = useMemo(() => {
    const map: Record<string, number> = {};
    for (const line of cart) map[line.itemId] = line.quantity;
    return map;
  }, [cart]);

  const handleAddToCart = useCallback(
    (item: { id: string; name: string; price: string }) => {
      setCart((prev) => {
        const existing = prev.find((line) => line.itemId === item.id);
        if (existing) {
          return prev.map((line) =>
            line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line
          );
        }
        return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];
      });
    },
    []
  );

  const handleUpdateCartQty = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((line) =>
          line.itemId === itemId ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0);
      return next;
    });
  }, []);

  useEffect(() => {
    if (readOnly || shareUrlProp) return;
    let cancelled = false;
    setPublishing(true);

    const slugHint = (getStoredProfileSlug("catalog") ?? data.restaurantName.trim().toLowerCase()) || "katalog";
    const existingSlug = getStoredProfileSlug("catalog");
    const colors = hasAutoColors ? autoColors : undefined;

    prepareCatalogPayload(data, slugHint, colors)
      .then((payload) =>
        publishProfile({
          type: "catalog",
          displayName: data.restaurantName.trim() || "Katalog",
          payload,
          existingSlug,
        })
      )
      .then((result) => {
        if (!cancelled) {
          setShareUrl(result.url);
          setPublishedSlug(result.slug);
          setIsUpdate(result.isUpdate);
          setStoredProfileSlug("catalog", result.slug);
        }
      })
      .catch(() => {
        if (!cancelled) setShareUrl("");
      })
      .finally(() => {
        if (!cancelled) setPublishing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data, readOnly, shareUrlProp, hasAutoColors, autoColors]);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col items-center gap-6",
        orderMode && cart.length > 0 && "pb-36"
      )}
    >
      <MenuPreviewBody
        data={data}
        style={style}
        locale={locale}
        onLocaleChange={setLocale}
        orderMode={orderMode}
        cartQtyByItem={cartQtyByItem}
        onAddToCart={orderMode ? handleAddToCart : undefined}
      />

      {readOnly ? (
        <Link
          href="/menu"
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          Kendi dijital {config.shareCtaLabel} oluşturun <ArrowRight className="h-4 w-4" />
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

          {showBakanlikExport ? <BakanlikExportCard data={data} accentColor={style.accentColor} /> : null}

          {publishing ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Görseller yükleniyor ve paylaşım linki hazırlanıyor...
            </div>
          ) : shareUrl ? (
            <>
              {publishedSlug ? (
                <ProfileAnalyticsCard slug={publishedSlug} accentColor={style.accentColor} isUpdate={isUpdate} />
              ) : null}
              <QrCodeCard
                value={shareUrl}
                title="QR ile Paylaş"
                description={config.shareDescription}
                fileName={`${data.restaurantName || "menu"}-qr`}
                accentColor={style.accentColor}
              />
            </>
          ) : null}
        </>
      )}

      {orderMode ? (
        <MenuOrderBar data={data} cart={cart} locale={locale} onUpdateQty={handleUpdateCartQty} />
      ) : null}
    </div>
  );
}
