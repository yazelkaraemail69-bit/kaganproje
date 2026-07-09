import type { MenuData } from "@/lib/types";
import { getReadableTextColor } from "@/lib/colors";
import { AUTO_THEME_ID, DEFAULT_MENU_THEME_ID, getThemePreset } from "@/lib/themes";
import type { MenuLayoutId } from "@/lib/layouts";

export interface MenuVisualStyle {
  headerFrom: string;
  headerTo: string;
  accentColor: string;
  headerTextColor: string;
  isLight: boolean;
  overlay: string;
  panelBorder: string;
  mutedText: string;
  layoutId: MenuLayoutId;
}

export function resolveMenuVisualStyle(
  data: MenuData,
  autoColors: string[]
): MenuVisualStyle {
  const isAuto = data.themeId === AUTO_THEME_ID || !data.themeId;
  const hasAutoColors = isAuto && autoColors.length >= 2;
  const fallbackTheme = getThemePreset(DEFAULT_MENU_THEME_ID, DEFAULT_MENU_THEME_ID);
  const preset = isAuto ? fallbackTheme : getThemePreset(data.themeId, DEFAULT_MENU_THEME_ID);

  const headerFrom = hasAutoColors ? autoColors[0] : preset.from;
  const headerTo = hasAutoColors ? autoColors[1] : preset.to;
  const accentColor = hasAutoColors ? autoColors[2] ?? autoColors[1] : preset.accent;
  const headerTextColor = hasAutoColors ? getReadableTextColor(headerFrom) : preset.text;
  const isLight = hasAutoColors ? headerTextColor === "#0f172a" : Boolean(preset.isLight);

  return {
    headerFrom,
    headerTo,
    accentColor,
    headerTextColor,
    isLight,
    overlay: isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.12)",
    panelBorder: isLight ? "rgba(15,23,42,0.15)" : "rgba(255,255,255,0.3)",
    mutedText: isLight ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.85)",
    layoutId: (data.layoutId as MenuLayoutId) || "classic",
  };
}
