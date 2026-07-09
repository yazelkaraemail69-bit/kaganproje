/**
 * Onaylanan A modeli (15 aboneye kadar):
 * - Aylık / 3 aylık abonelik + AI kredisi
 * - İyzico Link / manuel aktivasyon (şirket yok)
 * - Shorts video kapalı
 */

export type PaidPlanId = "starter" | "business" | "pro";
export type PlanId = "free" | PaidPlanId;
export type BillingPeriod = "monthly" | "quarterly";

export interface PlanDefinition {
  id: PaidPlanId;
  name: string;
  tagline: string;
  highlighted?: boolean;
  prices: Record<BillingPeriod, number>;
  monthlyCredits: number;
  maxProfiles: number;
  removeWatermark: boolean;
  analyticsDays: number;
  crmWebhook: boolean;
  teams: boolean;
  features: string[];
}

export interface CreditPack {
  id: string;
  credits: number;
  priceTry: number;
  label: string;
}

export interface CreditCosts {
  ocrPhoto: number;
  translatePage: number;
  aiImage: number;
  shortsScript: number;
  /** Kapalı — ileride ~3 USD maliyeti karşılar */
  shortsVideo: number;
}

/** Shorts video üretimi (video başına ~3 USD) — geliştirme aşamasında kapalı */
export const SHORTS_VIDEO_ENABLED = false;
export const SHORTS_VIDEO_STATUS_MESSAGE =
  "Shorts video üretimi geliştirme aşamasındadır ve şimdilik kullanıma kapalıdır. Senaryo metni üretimi açıktır.";

export const INVITE_BONUS_CREDITS = 50;
export const COMPANY_THRESHOLD_SUBSCRIBERS = 15;

/**
 * Kurucu üye kampanyası: ilk N kayıt Başlangıç planını ücretsiz kullanır.
 * Koltuk sayısı atomik dosya kilidi ile korunur (31. kişi alamaz).
 *
 * Süre: 7 gün ücretsiz. 1 arkadaş kayıt olunca (tek sefer) toplam 10 güne uzar.
 */
export const FOUNDING_MEMBER_LIMIT = 30;
export const FOUNDING_PLAN_ID: PaidPlanId = "starter";
export const FOUNDING_FREE_DAYS = 7;
/** 1 başarılı davet sonrası toplam ücretsiz gün (tek seferlik) */
export const FOUNDING_REFERRAL_TOTAL_DAYS = 10;

export const CREDIT_COSTS: CreditCosts = {
  ocrPhoto: 8,
  translatePage: 5,
  aiImage: 15,
  shortsScript: 10,
  shortsVideo: 100,
};

export const PLANS: PlanDefinition[] = [
  {
    id: "starter",
    name: "Başlangıç",
    tagline: "Tek işletme, QR yayın, temel AI",
    prices: { monthly: 149, quarterly: 399 },
    monthlyCredits: 100,
    maxProfiles: 2,
    removeWatermark: false,
    analyticsDays: 30,
    crmWebhook: false,
    teams: false,
    features: [
      "1 kartvizit + 1 menü yayını",
      "Aylık 100 AI kredi",
      "OCR ve çeviri (krediden)",
      "Temel analitik",
    ],
  },
  {
    id: "business",
    name: "İşletme",
    tagline: "En çok tercih edilen — KOBİ paketi",
    highlighted: true,
    prices: { monthly: 299, quarterly: 799 },
    monthlyCredits: 400,
    maxProfiles: 6,
    removeWatermark: true,
    analyticsDays: 90,
    crmWebhook: false,
    teams: false,
    features: [
      "3 kartvizit + 3 menü",
      "Aylık 400 AI kredi",
      "Markasız yayın",
      "Gelişmiş analitik",
      "Öncelikli destek",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Çoklu şube ve yüksek kredi",
    prices: { monthly: 549, quarterly: 1449 },
    monthlyCredits: 1200,
    maxProfiles: 20,
    removeWatermark: true,
    analyticsDays: 365,
    crmWebhook: true,
    teams: true,
    features: [
      "10 kartvizit + 10 menü",
      "Aylık 1.200 AI kredisi",
      "Takım / çok şube",
      "CRM webhook",
      "Analitik dışa aktarım",
    ],
  },
];

export const CREDIT_PACKS: CreditPack[] = [
  { id: "credits_100", credits: 100, priceTry: 79, label: "100 kredi" },
  { id: "credits_300", credits: 300, priceTry: 199, label: "300 kredi" },
  { id: "credits_800", credits: 800, priceTry: 449, label: "800 kredi" },
];

export function getPlan(id: PlanId): PlanDefinition | null {
  if (id === "free") return null;
  return PLANS.find((p) => p.id === id) ?? null;
}

export function formatTry(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function periodLabel(period: BillingPeriod): string {
  return period === "monthly" ? "Aylık" : "3 Aylık";
}

export function planDisplayName(plan: PlanId): string {
  if (plan === "free") return "Ücretsiz";
  return getPlan(plan)?.name ?? plan;
}
