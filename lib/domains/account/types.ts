import type { BillingPeriod, PlanId } from "@/lib/billing/plans";

/** Geriye uyumluluk: eski "pro" kayıtları geçerli kalır */
export type AccountPlan = PlanId;

export type PaymentMethod = "iyzico_link" | "manual";

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  /** scrypt hash: salt:hash (hex) */
  passwordHash: string;
  plan: AccountPlan;
  billingPeriod?: BillingPeriod;
  /** AI kontör bakiyesi */
  credits: number;
  /** Bu hesabın paylaştığı davet kodu */
  inviteCode: string;
  /** Bu hesap hangi kodla geldi (tek sefer) */
  referredByCode?: string;
  /** Davet bonusu alındı mı */
  inviteBonusGranted?: boolean;
  planExpiresAt?: string;
  paymentMethod?: PaymentMethod;
  /** Eski Stripe alanları (opsiyonel, kullanılmıyor) */
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none" | "pending_payment";
  /** CRM outbound webhook URL (Pro) */
  crmWebhookUrl?: string;
  crmEvents?: Array<"view" | "publish" | "contact_save">;
  teamIds: string[];
  profileSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicAccount {
  id: string;
  email: string;
  name: string;
  plan: AccountPlan;
  billingPeriod?: BillingPeriod;
  credits: number;
  inviteCode: string;
  planExpiresAt?: string;
  subscriptionStatus?: AccountRecord["subscriptionStatus"];
  crmWebhookUrl?: string;
  crmEvents?: AccountRecord["crmEvents"];
  teamIds: string[];
  profileSlugs: string[];
  createdAt: string;
}

export interface TeamBranch {
  id: string;
  label: string;
  profileSlug?: string;
}

export interface TeamRecord {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  profileSlugs: string[];
  branches: TeamBranch[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionPayload {
  accountId: string;
  email: string;
  exp: number;
}

export function toPublicAccount(account: AccountRecord): PublicAccount {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    plan: account.plan,
    billingPeriod: account.billingPeriod,
    credits: account.credits ?? 0,
    inviteCode: account.inviteCode ?? "",
    planExpiresAt: account.planExpiresAt,
    subscriptionStatus: account.subscriptionStatus,
    crmWebhookUrl: account.crmWebhookUrl,
    crmEvents: account.crmEvents,
    teamIds: account.teamIds,
    profileSlugs: account.profileSlugs,
    createdAt: account.createdAt,
  };
}
