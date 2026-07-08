import { AUTO_THEME_ID, DEFAULT_CARD_THEME_ID } from "@/lib/themes";
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
  restaurantName: string;
  description: string;
  logoUrl: string;
  categories: MenuCategory[];
  themeId: string;
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
    restaurantName: "",
    description: "",
    logoUrl: "",
    categories: [createMenuCategory("Başlangıçlar")],
    themeId: AUTO_THEME_ID,
  };
}

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
