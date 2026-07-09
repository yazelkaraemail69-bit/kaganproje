export type MenuLocaleCode = "tr" | "en" | "de" | "ar" | "ru";

export interface MenuLocaleOption {
  code: MenuLocaleCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const MENU_LOCALE_OPTIONS: MenuLocaleOption[] = [
  { code: "tr", label: "Türkçe", nativeLabel: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "İngilizce", nativeLabel: "English", flag: "🇬🇧" },
  { code: "de", label: "Almanca", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "Arapça", nativeLabel: "العربية", flag: "🇸🇦" },
  { code: "ru", label: "Rusça", nativeLabel: "Русский", flag: "🇷🇺" },
];

export interface MenuItemTranslation {
  name?: string;
  description?: string;
}

export interface MenuTranslations {
  restaurantName?: Partial<Record<MenuLocaleCode, string>>;
  description?: Partial<Record<MenuLocaleCode, string>>;
  categories?: Record<string, Partial<Record<MenuLocaleCode, string>>>;
  items?: Record<string, Partial<Record<MenuLocaleCode, MenuItemTranslation>>>;
}

export const DEFAULT_MENU_LOCALE: MenuLocaleCode = "tr";

export function getLocaleOption(code: MenuLocaleCode): MenuLocaleOption {
  return MENU_LOCALE_OPTIONS.find((l) => l.code === code) ?? MENU_LOCALE_OPTIONS[0];
}

export function resolveEnabledLocales(enabled?: MenuLocaleCode[]): MenuLocaleCode[] {
  const list = enabled?.length ? enabled : [DEFAULT_MENU_LOCALE];
  if (!list.includes(DEFAULT_MENU_LOCALE)) return [DEFAULT_MENU_LOCALE, ...list];
  return list;
}
