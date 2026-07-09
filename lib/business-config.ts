import type { MenuLayoutId } from "@/lib/layouts";
import { MENU_LAYOUTS } from "@/lib/layouts";

export type BusinessType =
  | "restaurant"
  | "cafe"
  | "salon"
  | "spa"
  | "shop"
  | "service"
  | "clinic"
  | "other";

export interface BusinessTypeOption {
  id: BusinessType;
  name: string;
  description: string;
}

export interface BusinessTypeConfig {
  id: BusinessType;
  businessNameLabel: string;
  businessNamePlaceholder: string;
  descriptionPlaceholder: string;
  logoHint: string;
  catalogTitle: string;
  businessNameFallback: string;
  itemLabel: string;
  itemLabelPlural: string;
  categoryPlaceholder: string;
  categorySuggestions: string[];
  defaultCategory: string;
  featuredBadge: string;
  popularBadge: string;
  footer: string;
  shareDescription: string;
  shareCtaLabel: string;
  themeHint: string;
  layoutHint: string;
  emptyItemsMessage: string;
  aiLogoIndustry: string;
  aiItemStyle: "food" | "product" | "service" | "beauty" | "generic";
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { id: "restaurant", name: "Restoran & Lokanta", description: "Yemek menüsü, QR menü, lokanta vitrini" },
  { id: "cafe", name: "Kafe & Pastane", description: "İçecekler, tatlılar, atıştırmalıklar" },
  { id: "salon", name: "Kuaför & Güzellik", description: "Saç, makyaj, bakım hizmetleri" },
  { id: "spa", name: "Spa & Wellness", description: "Masaj, bakım paketleri, wellness" },
  { id: "shop", name: "Mağaza & Perakende", description: "Ürün kataloğu, fiyat listesi" },
  { id: "service", name: "Hizmet & Tamirat", description: "Teknik servis, usta işleri, danışmanlık" },
  { id: "clinic", name: "Klinik & Sağlık", description: "Muayene, tedavi, sağlık hizmetleri" },
  { id: "other", name: "Diğer İşletme", description: "Her türlü işletme için esnek katalog" },
];

const CONFIGS: Record<BusinessType, BusinessTypeConfig> = {
  restaurant: {
    id: "restaurant",
    businessNameLabel: "Restoran Adı",
    businessNamePlaceholder: "Örn. Lezzet Durağı",
    descriptionPlaceholder: "Örn. Ev yapımı lezzetler, taze malzemeler.",
    logoHint: "AI logo oluştururken işletme adınızı sorar ve restoran kimliğine göre tasarlar.",
    catalogTitle: "Menü",
    businessNameFallback: "Restoran Adı",
    itemLabel: "Ürün",
    itemLabelPlural: "Ürünler",
    categoryPlaceholder: "Kategori Adı (Örn. Ana Yemekler)",
    categorySuggestions: ["Başlangıçlar", "Ana Yemekler", "Salatalar", "Tatlılar", "İçecekler"],
    defaultCategory: "Ana Yemekler",
    featuredBadge: "Şefin Önerisi",
    popularBadge: "Popüler",
    footer: "Fiyatlarımıza KDV dahildir · Afiyet olsun",
    shareDescription: "Müşterileriniz bu kodu taratarak menüyü telefonlarında görüntüleyebilir.",
    shareCtaLabel: "menünüzü",
    themeHint: "Gerçek restoran menüsü gibi: noktalı fiyat satırları, kategori bölümleri ve kâğıt dokusu.",
    layoutHint: "Lokanta tarzı için fotoğraflı düzeni seçin.",
    emptyItemsMessage: "Henüz ürün eklenmedi.",
    aiLogoIndustry: "Turkish restaurant and hospitality",
    aiItemStyle: "food",
  },
  cafe: {
    id: "cafe",
    businessNameLabel: "Kafe Adı",
    businessNamePlaceholder: "Örn. Kahve Durağı",
    descriptionPlaceholder: "Örn. Özel kahve çekirdekleri, ev yapımı tatlılar.",
    logoHint: "AI logo oluştururken kafe adınızı sorar ve sıcak içecek / kafe atmosferine göre tasarlar.",
    catalogTitle: "Menü",
    businessNameFallback: "Kafe Adı",
    itemLabel: "Ürün",
    itemLabelPlural: "Ürünler",
    categoryPlaceholder: "Kategori Adı (Örn. Kahveler)",
    categorySuggestions: ["Kahveler", "Soğuk İçecekler", "Tatlılar", "Sandviçler", "Kahvaltı"],
    defaultCategory: "Kahveler",
    featuredBadge: "Öne Çıkan",
    popularBadge: "Favori",
    footer: "Fiyatlarımıza KDV dahildir",
    shareDescription: "Müşterileriniz bu kodu taratarak menüyü görüntüleyebilir.",
    shareCtaLabel: "menünüzü",
    themeHint: "Sıcak kafe menüsü: içecek ve tatlı kategorileri, okunaklı fiyat satırları.",
    layoutHint: "Fotoğraflı menü düzeni kafe vitrinine uygundur.",
    emptyItemsMessage: "Henüz ürün eklenmedi.",
    aiLogoIndustry: "cozy specialty coffee shop and bakery cafe",
    aiItemStyle: "food",
  },
  salon: {
    id: "salon",
    businessNameLabel: "Salon Adı",
    businessNamePlaceholder: "Örn. Güzellik Stüdyosu",
    descriptionPlaceholder: "Örn. Profesyonel saç ve cilt bakımı.",
    logoHint: "AI logo oluştururken salon adınızı sorar ve güzellik / kuaför kimliğine göre tasarlar.",
    catalogTitle: "Hizmetler",
    businessNameFallback: "Salon Adı",
    itemLabel: "Hizmet",
    itemLabelPlural: "Hizmetler",
    categoryPlaceholder: "Kategori Adı (Örn. Saç Bakımı)",
    categorySuggestions: ["Saç Bakımı", "Saç Kesimi", "Makyaj", "Cilt Bakımı", "Manikür & Pedikür"],
    defaultCategory: "Saç Bakımı",
    featuredBadge: "Öne Çıkan",
    popularBadge: "Popüler",
    footer: "Fiyatlarımıza KDV dahildir · Randevu için iletişime geçin",
    shareDescription: "Müşterileriniz bu kodu taratarak hizmet listesini görüntüleyebilir.",
    shareCtaLabel: "hizmet listenizi",
    themeHint: "Şık hizmet kataloğu: kategori başlıkları ve net fiyat satırları.",
    layoutHint: "Minimal düzen lüks salon vitrinine uygundur.",
    emptyItemsMessage: "Henüz hizmet eklenmedi.",
    aiLogoIndustry: "hair salon and beauty studio",
    aiItemStyle: "beauty",
  },
  spa: {
    id: "spa",
    businessNameLabel: "Spa Adı",
    businessNamePlaceholder: "Örn. Zen Wellness",
    descriptionPlaceholder: "Örn. Masaj, hamam ve rahatlama paketleri.",
    logoHint: "AI logo oluştururken spa adınızı sorar ve wellness / sakinlik temasına göre tasarlar.",
    catalogTitle: "Paketler",
    businessNameFallback: "Spa Adı",
    itemLabel: "Paket",
    itemLabelPlural: "Paketler",
    categoryPlaceholder: "Kategori Adı (Örn. Masaj)",
    categorySuggestions: ["Masaj", "Cilt Bakımı", "Hamam & Sauna", "Paketler", "Ek Hizmetler"],
    defaultCategory: "Masaj",
    featuredBadge: "Önerilen",
    popularBadge: "Çok Tercih Edilen",
    footer: "Fiyatlarımıza KDV dahildir · Randevu için iletişime geçin",
    shareDescription: "Müşterileriniz bu kodu taratarak paket listesini görüntüleyebilir.",
    shareCtaLabel: "paket listenizi",
    themeHint: "Sakin spa kataloğu: paket isimleri ve süre/fiyat bilgisi.",
    layoutHint: "Fine dining tarzı minimal düzen spa vitrinine uygundur.",
    emptyItemsMessage: "Henüz paket eklenmedi.",
    aiLogoIndustry: "luxury spa and wellness center",
    aiItemStyle: "service",
  },
  shop: {
    id: "shop",
    businessNameLabel: "Mağaza Adı",
    businessNamePlaceholder: "Örn. Moda Butik",
    descriptionPlaceholder: "Örn. Sezonluk koleksiyonlar, özel indirimler.",
    logoHint: "AI logo oluştururken mağaza adınızı sorar ve perakende marka kimliğine göre tasarlar.",
    catalogTitle: "Katalog",
    businessNameFallback: "Mağaza Adı",
    itemLabel: "Ürün",
    itemLabelPlural: "Ürünler",
    categoryPlaceholder: "Kategori Adı (Örn. Giyim)",
    categorySuggestions: ["Yeni Gelenler", "Giyim", "Aksesuar", "Ayakkabı", "İndirimli"],
    defaultCategory: "Ürünler",
    featuredBadge: "Yeni",
    popularBadge: "Çok Satan",
    footer: "Fiyatlarımıza KDV dahildir · Stok durumu için iletişime geçin",
    shareDescription: "Müşterileriniz bu kodu taratarak ürün kataloğunu görüntüleyebilir.",
    shareCtaLabel: "kataloğunuzu",
    themeHint: "Ürün kataloğu: kategori grupları ve net fiyat listesi.",
    layoutHint: "Fotoğraflı düzen ürün vitrinine uygundur.",
    emptyItemsMessage: "Henüz ürün eklenmedi.",
    aiLogoIndustry: "retail shop and boutique store",
    aiItemStyle: "product",
  },
  service: {
    id: "service",
    businessNameLabel: "İşletme Adı",
    businessNamePlaceholder: "Örn. Usta Tamir Servisi",
    descriptionPlaceholder: "Örn. Elektrik, tesisat ve beyaz eşya tamiri.",
    logoHint: "AI logo oluştururken işletme adınızı sorar ve hizmet sektörüne uygun tasarlar.",
    catalogTitle: "Hizmetler",
    businessNameFallback: "İşletme Adı",
    itemLabel: "Hizmet",
    itemLabelPlural: "Hizmetler",
    categoryPlaceholder: "Kategori Adı (Örn. Tamirat)",
    categorySuggestions: ["Tamirat", "Bakım", "Montaj", "Acil Servis", "Danışmanlık"],
    defaultCategory: "Hizmetler",
    featuredBadge: "Öne Çıkan",
    popularBadge: "Popüler",
    footer: "Fiyatlarımıza KDV dahildir · Keşif için iletişime geçin",
    shareDescription: "Müşterileriniz bu kodu taratarak hizmet listesini görüntüleyebilir.",
    shareCtaLabel: "hizmet listenizi",
    themeHint: "Hizmet fiyat listesi: kategori başlıkları ve açıklamalı satırlar.",
    layoutHint: "Klasik liste düzeni hizmet kataloğuna uygundur.",
    emptyItemsMessage: "Henüz hizmet eklenmedi.",
    aiLogoIndustry: "professional service and repair business",
    aiItemStyle: "service",
  },
  clinic: {
    id: "clinic",
    businessNameLabel: "Klinik Adı",
    businessNamePlaceholder: "Örn. Sağlık Merkezi",
    descriptionPlaceholder: "Örn. Genel muayene, check-up ve tedavi hizmetleri.",
    logoHint: "AI logo oluştururken klinik adınızı sorar ve sağlık sektörüne uygun tasarlar.",
    catalogTitle: "Hizmetler",
    businessNameFallback: "Klinik Adı",
    itemLabel: "Hizmet",
    itemLabelPlural: "Hizmetler",
    categoryPlaceholder: "Kategori Adı (Örn. Muayene)",
    categorySuggestions: ["Muayene", "Tedavi", "Check-up", "Görüntüleme", "Laboratuvar"],
    defaultCategory: "Muayene",
    featuredBadge: "Önerilen",
    popularBadge: "Sık Tercih Edilen",
    footer: "Fiyatlarımıza KDV dahildir · Randevu için iletişime geçin",
    shareDescription: "Hastalarınız bu kodu taratarak hizmet listesini görüntüleyebilir.",
    shareCtaLabel: "hizmet listenizi",
    themeHint: "Temiz ve güven veren hizmet listesi: kategori ve fiyat düzeni.",
    layoutHint: "Minimal düzen klinik vitrinine uygundur.",
    emptyItemsMessage: "Henüz hizmet eklenmedi.",
    aiLogoIndustry: "medical clinic and healthcare center",
    aiItemStyle: "service",
  },
  other: {
    id: "other",
    businessNameLabel: "İşletme Adı",
    businessNamePlaceholder: "Örn. İşletmeniz",
    descriptionPlaceholder: "Örn. Kısa tanıtım cümlesi.",
    logoHint: "AI logo oluştururken işletme adınızı sorar ve markanıza göre tasarlar.",
    catalogTitle: "Katalog",
    businessNameFallback: "İşletme Adı",
    itemLabel: "Kalem",
    itemLabelPlural: "Kalemler",
    categoryPlaceholder: "Kategori Adı",
    categorySuggestions: ["Kategori 1", "Kategori 2", "Kategori 3", "Özel", "Diğer"],
    defaultCategory: "Kategori",
    featuredBadge: "Öne Çıkan",
    popularBadge: "Popüler",
    footer: "Fiyatlarımıza KDV dahildir",
    shareDescription: "Müşterileriniz bu kodu taratarak kataloğu görüntüleyebilir.",
    shareCtaLabel: "kataloğunuzu",
    themeHint: "Esnek katalog düzeni: kategoriler ve fiyat satırları.",
    layoutHint: "İhtiyacınıza göre bir düzen seçin.",
    emptyItemsMessage: "Henüz kalem eklenmedi.",
    aiLogoIndustry: "local Turkish business",
    aiItemStyle: "generic",
  },
};

const LAYOUT_DESCRIPTIONS: Partial<Record<BusinessType, Partial<Record<MenuLayoutId, string>>>> = {
  restaurant: {
    classic: "Gerçek restoran menüsü: isim ······ fiyat, kategori başlıkları.",
    bistro: "Büyük yemek fotoğrafları — kebapçı, esnaf lokantası tarzı.",
    gallery: "Her yemek kartında fotoğraf — modern kafe tarzı.",
    minimal: "Ortalanmış zarif tipografi — fine dining.",
  },
  cafe: {
    classic: "İçecek ve tatlı listesi — noktalı fiyat satırları.",
    bistro: "Büyük ürün fotoğrafları — vitrin tarzı kafe menüsü.",
    gallery: "Her ürün kartında fotoğraf — modern kafe.",
    minimal: "Sade tipografi — özel kahve dükkanı.",
  },
  salon: {
    classic: "Hizmet listesi: isim ······ fiyat, kategori başlıkları.",
    gallery: "Hizmet kartlarında görsel — salon vitrini.",
    minimal: "Zarif hizmet listesi — lüks salon.",
  },
  shop: {
    classic: "Ürün listesi: isim ······ fiyat.",
    gallery: "Ürün fotoğraflı katalog — e-ticaret vitrini.",
    bistro: "Öne çıkan ürün kartları — mağaza vitrini.",
  },
  service: {
    classic: "Hizmet fiyat listesi — net kategori düzeni.",
    minimal: "Sade hizmet kataloğu.",
  },
  clinic: {
    classic: "Hizmet ve muayene fiyat listesi.",
    minimal: "Güven veren sade klinik listesi.",
  },
};

export const DEFAULT_BUSINESS_TYPE: BusinessType = "restaurant";

export function getBusinessConfig(type: BusinessType | undefined): BusinessTypeConfig {
  return CONFIGS[type ?? DEFAULT_BUSINESS_TYPE] ?? CONFIGS.restaurant;
}

export function getCategorySuggestions(type: BusinessType | undefined): string[] {
  return getBusinessConfig(type).categorySuggestions;
}

export function getMenuLayoutsForBusiness(type: BusinessType | undefined) {
  const overrides = LAYOUT_DESCRIPTIONS[type ?? DEFAULT_BUSINESS_TYPE] ?? {};
  return MENU_LAYOUTS.map((layout) => ({
    ...layout,
    description: overrides[layout.id] ?? layout.description,
  }));
}
