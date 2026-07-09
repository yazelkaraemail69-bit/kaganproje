import type { BusinessType } from "@/lib/business-config";
import type { SocialLinks } from "@/lib/types";
import type { ViewEvent } from "@/lib/domains/profile/analytics";
import type { MenuLocaleCode, MenuTranslations } from "@/lib/menu-locales";

export type ProfileType = "card" | "catalog";

/** Ortak profil meta — kartvizit ve katalog paylaşımı için. */
export interface ProfileMeta {
  slug: string;
  type: ProfileType;
  displayName: string;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  viewEvents?: ViewEvent[];
  /** Hesap sahibi (oturum açmış yayın). */
  ownerId?: string;
  /** Takım / zincir bağlantısı. */
  teamId?: string;
  /** Şube etiketi (ör. Kadıköy). */
  branchLabel?: string;
}

export interface ShareableCard {
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  social: SocialLinks;
  themeId: string;
  layoutId: string;
  photoUrl?: string;
}

export interface ShareableCatalogItem {
  id?: string;
  name: string;
  price: string;
  description: string;
  imageUrl?: string;
}

export interface ShareableCatalog {
  businessType?: BusinessType;
  restaurantName: string;
  description: string;
  themeId?: string;
  colors?: string[];
  layoutId?: string;
  logoUrl?: string;
  contactPhone?: string;
  enabledLocales?: MenuLocaleCode[];
  translations?: MenuTranslations;
  categories: Array<{
    id?: string;
    name: string;
    items: ShareableCatalogItem[];
  }>;
}

export interface PublishedProfile extends ProfileMeta {
  payload: ShareableCard | ShareableCatalog;
}

export function isShareableCard(payload: ShareableCard | ShareableCatalog): payload is ShareableCard {
  return "fullName" in payload && !("categories" in payload);
}
