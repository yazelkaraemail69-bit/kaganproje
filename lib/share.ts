import type { MenuData } from "@/lib/types";
import { downscaleDataUrl } from "@/lib/image";
import { AUTO_THEME_ID } from "@/lib/themes";

/**
 * Compact, URL-safe representation of a menu used for the QR/share link.
 * Per-item photos are intentionally left out — a menu can have many of them
 * and embedding all of that image data would make the link/QR too large to
 * scan reliably. The logo is kept (heavily downscaled) so the personalized
 * color theme still shows up for anyone opening the shared link.
 */
interface ShareableMenu {
  restaurantName: string;
  description: string;
  logoUrl?: string;
  themeId?: string;
  categories: Array<{
    name: string;
    items: Array<{ name: string; price: string; description: string }>;
  }>;
}

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
    restaurantName: parsed.restaurantName,
    description: parsed.description ?? "",
    logoUrl: parsed.logoUrl ?? "",
    themeId: parsed.themeId ?? AUTO_THEME_ID,
    categories: parsed.categories.map((category) => ({
      id: crypto.randomUUID(),
      name: category.name ?? "",
      items: (category.items ?? []).map((item) => ({
        id: crypto.randomUUID(),
        name: item.name ?? "",
        price: item.price ?? "",
        description: item.description ?? "",
        imageUrl: "",
      })),
    })),
  };
}

function toShareable(data: MenuData, logoUrl?: string): ShareableMenu {
  return {
    restaurantName: data.restaurantName,
    description: data.description,
    logoUrl,
    themeId: data.themeId,
    categories: data.categories
      .map((category) => ({
        name: category.name,
        items: category.items
          .filter((item) => item.name.trim())
          .map((item) => ({ name: item.name, price: item.price, description: item.description })),
      }))
      .filter((category) => category.items.length > 0),
  };
}

/** Builds a self-contained link (data encoded in the URL) that renders a read-only menu preview. */
export async function buildMenuShareUrl(data: MenuData): Promise<string> {
  let compactLogo: string | undefined;
  if (data.logoUrl) {
    try {
      compactLogo = await downscaleDataUrl(data.logoUrl, 96, 0.5);
    } catch {
      compactLogo = undefined;
    }
  }

  const encoded = encodeMenuShareData(toShareable(data, compactLogo));
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/menu/view?d=${encoded}`;
}
