import type { BusinessCardData, MenuData } from "@/lib/types";
import { decodeShareableCard } from "@/lib/share/card";
import { decodeMenuShareData } from "@/lib/share";
import { getPublishedProfile, recordProfileView } from "@/lib/profile-store";
import {
  isShareableCard,
  type PublishedProfile,
  type ShareableCatalog,
} from "@/lib/domains/profile/types";
import { DEFAULT_BUSINESS_TYPE } from "@/lib/business-config";
import { AUTO_THEME_ID } from "@/lib/themes";
import { DEFAULT_MENU_LOCALE } from "@/lib/menu-locales";

export async function loadPublishedProfile(
  slug: string,
  options?: { trackView?: boolean; userAgent?: string; referer?: string; origin?: string }
): Promise<PublishedProfile | null> {
  if (options?.trackView) {
    return recordProfileView(slug, {
      userAgent: options.userAgent,
      referer: options.referer,
      origin: options.origin,
    });
  }
  return getPublishedProfile(slug);
}

export function catalogPayloadToMenuData(payload: ShareableCatalog): MenuData {
  return {
    businessType: payload.businessType ?? DEFAULT_BUSINESS_TYPE,
    restaurantName: payload.restaurantName,
    description: payload.description ?? "",
    logoUrl: payload.logoUrl ?? "",
    themeId: payload.themeId ?? AUTO_THEME_ID,
    customThemeColors: payload.colors,
    layoutId: payload.layoutId ?? "classic",
    contactPhone: payload.contactPhone ?? "",
    enabledLocales: payload.enabledLocales?.length ? payload.enabledLocales : [DEFAULT_MENU_LOCALE],
    translations: payload.translations,
    categories: payload.categories.map((category) => ({
      id: category.id ?? crypto.randomUUID(),
      name: category.name ?? "",
      items: (category.items ?? []).map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        name: item.name ?? "",
        price: item.price ?? "",
        description: item.description ?? "",
        imageUrl: item.imageUrl ?? "",
      })),
    })),
  };
}

export function publishedProfileToCardData(profile: PublishedProfile): BusinessCardData | null {
  if (!isShareableCard(profile.payload)) return null;
  return decodeShareableCard(profile.payload);
}

export function publishedProfileToMenuData(profile: PublishedProfile): MenuData | null {
  if (isShareableCard(profile.payload)) return null;
  return catalogPayloadToMenuData(profile.payload);
}

export function tryDecodeLegacyMenu(encoded: string | null): MenuData | null {
  if (!encoded) return null;
  try {
    return decodeMenuShareData(encoded);
  } catch {
    return null;
  }
}
