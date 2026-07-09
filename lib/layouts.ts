export type MenuLayoutId = "classic" | "bistro" | "gallery" | "minimal";
export type CardLayoutId = "classic" | "executive" | "minimal" | "bold";

export interface LayoutOption<T extends string = string> {
  id: T;
  name: string;
  description: string;
  /** Tailwind preview gradient for picker thumbnail */
  previewFrom: string;
  previewTo: string;
}

export const MENU_LAYOUTS: LayoutOption<MenuLayoutId>[] = [
  {
    id: "classic",
    name: "Klasik Liste",
    description: "Gerçek restoran menüsü: isim ······ fiyat, kategori başlıkları, kâğıt dokusu.",
    previewFrom: "#faf6f0",
    previewTo: "#e8dfd0",
  },
  {
    id: "bistro",
    name: "Lokanta / Bistro",
    description: "Büyük yemek fotoğrafları, popüler rozeti — kebapçı, esnaf lokantası tarzı.",
    previewFrom: "#d97706",
    previewTo: "#92400e",
  },
  {
    id: "gallery",
    name: "Fotoğraflı Menü",
    description: "Her yemek kartında fotoğraf — modern kafe ve fast-casual tarzı.",
    previewFrom: "#fffef9",
    previewTo: "#f5efe6",
  },
  {
    id: "minimal",
    name: "Fine Dining",
    description: "Ortalanmış zarif tipografi — şık restoran ve tasting menu.",
    previewFrom: "#fffef9",
    previewTo: "#e8dfd0",
  },
];

export const CARD_LAYOUTS: LayoutOption<CardLayoutId>[] = [
  {
    id: "classic",
    name: "Klasik",
    description: "Ortalanmış fotoğraf, gradient arka plan — dengeli ve güvenilir.",
    previewFrom: "#4f46e5",
    previewTo: "#312e81",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Kurumsal yatay düzen, sol fotoğraf — danışmanlık ve finans.",
    previewFrom: "#1e3a5f",
    previewTo: "#0f172a",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Beyaz kart, ince çizgi aksan — 2025 minimal profesyonel trend.",
    previewFrom: "#ffffff",
    previewTo: "#f1f5f9",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Büyük isim, güçlü kontrast — yaratıcı sektörler.",
    previewFrom: "#db2777",
    previewTo: "#7c3aed",
  },
];

export const DEFAULT_MENU_LAYOUT: MenuLayoutId = "classic";
export const DEFAULT_CARD_LAYOUT: CardLayoutId = "classic";

export function getMenuLayout(id: string | undefined): LayoutOption<MenuLayoutId> {
  return MENU_LAYOUTS.find((l) => l.id === id) ?? MENU_LAYOUTS[0];
}

export function getCardLayout(id: string | undefined): LayoutOption<CardLayoutId> {
  return CARD_LAYOUTS.find((l) => l.id === id) ?? CARD_LAYOUTS[0];
}
