import type { MenuData } from "@/lib/types";
import { AUTO_THEME_ID } from "@/lib/themes";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/business-config";
import type { ShareableCatalog } from "@/lib/domains/profile/types";
import { QR_SAFE_MAX_LENGTH } from "@/lib/qr/constants";
import { DEFAULT_MENU_LOCALE } from "@/lib/menu-locales";

/** @deprecated Use QR_SAFE_MAX_LENGTH from lib/qr/constants */
export const QR_SAFE_MAX_LENGTH_LEGACY = QR_SAFE_MAX_LENGTH;
export { QR_SAFE_MAX_LENGTH };

/**
 * Compact, URL-safe representation of a menu used for the QR/share link.
 * Logos and item photos are omitted to keep the link short enough to scan.
 * Auto-theme colors (3 hex values) are embedded instead of the logo image.
 */
interface ShareableMenu extends ShareableCatalog {}

function toBase64Url(input: string): string {
  const base64 = btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=");
  return decodeURIComponent(escape(atob(base64)));
}

export function encodeMenuShareData(shareable: ShareableMenu): string {
  return toBase64Url(JSON.stringify(shareable));
}

export function decodeMenuShareData(encoded: string): MenuData {
  const parsed = JSON.parse(fromBase64Url(encoded)) as Partial<ShareableMenu>;
  if (!parsed || typeof parsed.restaurantName !== "string" || !Array.isArray(parsed.categories)) {
    throw new Error("Geçersiz menü verisi");
  }

  return {
    businessType: parsed.businessType ?? DEFAULT_BUSINESS_TYPE,
    restaurantName: parsed.restaurantName,
    description: parsed.description ?? "",
    logoUrl: "",
    themeId: parsed.themeId ?? AUTO_THEME_ID,
    customThemeColors: parsed.colors,
    layoutId: parsed.layoutId ?? "classic",
    contactPhone: parsed.contactPhone ?? "",
    enabledLocales: parsed.enabledLocales?.length ? parsed.enabledLocales : [DEFAULT_MENU_LOCALE],
    translations: parsed.translations,
    categories: parsed.categories.map((category) => ({
      id: category.id ?? crypto.randomUUID(),
      name: category.name ?? "",
      items: (category.items ?? []).map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        name: item.name ?? "",
        price: item.price ?? "",
        description: item.description ?? "",
        imageUrl: "",
      })),
    })),
  };
}

export function toShareableMenu(data: MenuData, colors?: string[]): ShareableCatalog {
  return toShareable(data, colors);
}

function toShareable(data: MenuData, colors?: string[]): ShareableMenu {
  const enabledLocales = data.enabledLocales?.length ? data.enabledLocales : undefined;
  return {
    businessType: data.businessType,
    restaurantName: data.restaurantName.trim(),
    description: data.description.trim().slice(0, 160),
    themeId: data.themeId,
    layoutId: data.layoutId,
    colors: colors && colors.length >= 2 ? colors.slice(0, 3) : undefined,
    logoUrl: data.logoUrl?.startsWith("http") ? data.logoUrl : undefined,
    contactPhone: data.contactPhone?.trim() || undefined,
    enabledLocales,
    translations: data.translations,
    categories: data.categories
      .map((category) => ({
        id: category.id,
        name: category.name.trim(),
        items: category.items
          .filter((item) => item.name.trim())
          .map((item) => ({
            id: item.id,
            name: item.name.trim(),
            price: item.price.trim(),
            description: item.description.trim().slice(0, 100),
            imageUrl: item.imageUrl?.startsWith("http") ? item.imageUrl : undefined,
          })),
      }))
      .filter((category) => category.items.length > 0),
  };
}

export function isQrSafeUrl(url: string): boolean {
  return url.length <= QR_SAFE_MAX_LENGTH;
}

/** Builds a self-contained link (data encoded in the URL) that renders a read-only menu preview. */
export async function buildMenuShareUrl(
  data: MenuData,
  options?: { colors?: string[] }
): Promise<string> {
  const encoded = encodeMenuShareData(toShareable(data, options?.colors));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/menu/view?d=${encoded}`;
}
