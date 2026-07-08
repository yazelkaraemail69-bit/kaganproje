export interface ThemePreset {
  id: string;
  name: string;
  from: string;
  to: string;
  text: string;
  accent: string;
  isLight?: boolean;
}

/**
 * Curated brand-color presets shared by the business card and menu previews.
 * Each preset carries everything needed to theme a preview without further
 * contrast math: a header gradient, a readable header text color, and an
 * accent color tuned to stay legible on the white preview body.
 */
export const THEME_PRESETS: ThemePreset[] = [
  { id: "indigo", name: "İndigo", from: "#4f46e5", to: "#312e81", text: "#ffffff", accent: "#4f46e5" },
  { id: "midnight", name: "Gece Lacivert", from: "#1e293b", to: "#020617", text: "#ffffff", accent: "#334155" },
  { id: "emerald", name: "Zümrüt", from: "#10b981", to: "#065f46", text: "#ffffff", accent: "#059669" },
  { id: "sunset", name: "Gün Batımı", from: "#f97316", to: "#db2777", text: "#ffffff", accent: "#ea580c" },
  { id: "ocean", name: "Okyanus", from: "#0ea5e9", to: "#1e3a8a", text: "#ffffff", accent: "#0284c7" },
  { id: "rose", name: "Mercan", from: "#fb7185", to: "#a21caf", text: "#ffffff", accent: "#e11d48" },
  { id: "gold", name: "Siyah & Altın", from: "#18181b", to: "#78350f", text: "#fde68a", accent: "#b45309" },
  { id: "cloud", name: "Bulut", from: "#f8fafc", to: "#e2e8f0", text: "#0f172a", accent: "#475569", isLight: true },
];

export const DEFAULT_CARD_THEME_ID = "indigo";
export const DEFAULT_MENU_THEME_ID = "sunset";
/** Special menu-only theme id: derive the palette from the uploaded logo instead of a preset. */
export const AUTO_THEME_ID = "auto";

export function getThemePreset(id: string | undefined, fallbackId: string): ThemePreset {
  return (
    THEME_PRESETS.find((theme) => theme.id === id) ??
    THEME_PRESETS.find((theme) => theme.id === fallbackId) ??
    THEME_PRESETS[0]
  );
}
