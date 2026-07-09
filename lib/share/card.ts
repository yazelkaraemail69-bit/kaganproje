import { DEFAULT_CARD_LAYOUT } from "@/lib/layouts";
import { DEFAULT_CARD_THEME_ID } from "@/lib/themes";
import type { ShareableCard } from "@/lib/domains/profile/types";
import type { BusinessCardData } from "@/lib/types";

export function toShareableCard(data: BusinessCardData): ShareableCard {
  return {
    fullName: data.fullName.trim(),
    title: data.title.trim(),
    company: data.company.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    website: data.website.trim(),
    social: {
      instagram: data.social.instagram?.trim() ?? "",
      linkedin: data.social.linkedin?.trim() ?? "",
      twitter: data.social.twitter?.trim() ?? "",
      facebook: data.social.facebook?.trim() ?? "",
    },
    themeId: data.themeId,
    layoutId: data.layoutId,
    photoUrl: data.photoUrl?.startsWith("http") ? data.photoUrl : undefined,
  };
}

export function decodeShareableCard(payload: ShareableCard): BusinessCardData {
  return {
    fullName: payload.fullName,
    title: payload.title ?? "",
    company: payload.company ?? "",
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    website: payload.website ?? "",
    social: {
      instagram: payload.social?.instagram ?? "",
      linkedin: payload.social?.linkedin ?? "",
      twitter: payload.social?.twitter ?? "",
      facebook: payload.social?.facebook ?? "",
    },
    photoUrl: payload.photoUrl ?? "",
    themeId: payload.themeId ?? DEFAULT_CARD_THEME_ID,
    layoutId: payload.layoutId ?? DEFAULT_CARD_LAYOUT,
  };
}
