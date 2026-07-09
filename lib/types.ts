import { DEFAULT_CARD_THEME_ID, DEFAULT_MENU_THEME_ID } from "@/lib/themes";
import { DEFAULT_CARD_LAYOUT, DEFAULT_MENU_LAYOUT } from "@/lib/layouts";
import { DEFAULT_BUSINESS_TYPE, type BusinessType } from "@/lib/business-config";
import type { MenuLocaleCode, MenuTranslations } from "@/lib/menu-locales";
import {
  SHORTS_DURATION_OPTIONS,
  SHORTS_LANGUAGE_OPTIONS,
  SHORTS_TONE_OPTIONS,
} from "@/lib/shorts-options";

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export interface BusinessCardData {
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  social: SocialLinks;
  photoUrl: string;
  themeId: string;
  layoutId: string;
}

export function createEmptyBusinessCard(): BusinessCardData {
  return {
    fullName: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    website: "",
    social: {
      instagram: "",
      linkedin: "",
      twitter: "",
      facebook: "",
    },
    photoUrl: "",
    themeId: DEFAULT_CARD_THEME_ID,
    layoutId: DEFAULT_CARD_LAYOUT,
  };
}

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuData {
  businessType: BusinessType;
  restaurantName: string;
  description: string;
  logoUrl: string;
  categories: MenuCategory[];
  themeId: string;
  /** Paylaşım linkinden gelen otomatik tema renkleri (logo yerine). */
  customThemeColors?: string[];
  layoutId: string;
  /** WhatsApp sipariş için işletme telefonu (ör. 05xx xxx xx xx). */
  contactPhone?: string;
  /** Yayınlanan menüde gösterilecek diller (TR her zaman dahil). */
  enabledLocales?: MenuLocaleCode[];
  /** Kategori ve ürün çevirileri. */
  translations?: MenuTranslations;
}

export function createMenuItem(): MenuItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
    description: "",
    imageUrl: "",
  };
}

export function createMenuCategory(name = ""): MenuCategory {
  return {
    id: crypto.randomUUID(),
    name,
    items: [createMenuItem()],
  };
}

export function createEmptyMenu(): MenuData {
  return {
    businessType: DEFAULT_BUSINESS_TYPE,
    restaurantName: "",
    description: "",
    logoUrl: "",
    categories: [createMenuCategory("Ana Yemekler")],
    themeId: DEFAULT_MENU_THEME_ID,
    layoutId: DEFAULT_MENU_LAYOUT,
  };
}

/** @deprecated Use getCategorySuggestions(businessType) from business-config */
export const MENU_CATEGORY_SUGGESTIONS = [
  "Başlangıçlar",
  "Ana Yemekler",
  "Salatalar",
  "Tatlılar",
  "İçecekler",
];

/** User-facing configuration for the "Master Shorts AI Generator" prompt. */
export interface ShortsConfig {
  niche: string;
  audience: string;
  tone: string;
  duration: string;
  language: string;
}

export function createEmptyShortsConfig(): ShortsConfig {
  return {
    niche: "",
    audience: "",
    tone: SHORTS_TONE_OPTIONS[0],
    duration: SHORTS_DURATION_OPTIONS[0],
    language: SHORTS_LANGUAGE_OPTIONS[0],
  };
}

/** One beat of the short (hook, a body tip, or the CTA). */
export interface ShortsSegment {
  /** Natural, conversational voiceover line(s) for this beat. */
  voiceover: string;
  /** English, AI-video-tool-ready (Runway/Pika/Sora) visual/B-roll prompt. */
  visualPrompt: string;
  /** Punchy 5-6 word on-screen text overlay. */
  textOverlay: string;
}

export interface ShortsScript {
  hook: ShortsSegment;
  /** Exactly 3 value-packed tips/steps. */
  body: ShortsSegment[];
  cta: ShortsSegment;
  /** Hook + body + CTA voiceover lines merged into one natural script. */
  fullVoiceoverScript: string;
  /** All text overlays in order (hook, 3x body, cta). */
  textOverlays: string[];
}

/** Status of an async "script -> vertical AI video" render job. */
export type VideoJobStatus = "queued" | "processing" | "done" | "error";

export interface VideoJobStep {
  /** Human-readable (Turkish) label shown in the progress UI. */
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export interface VideoJob {
  id: string;
  status: VideoJobStatus;
  /** 0-100 */
  progress: number;
  steps: VideoJobStep[];
  /** Public URL of the rendered vertical mp4, once status is "done". */
  videoUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}
