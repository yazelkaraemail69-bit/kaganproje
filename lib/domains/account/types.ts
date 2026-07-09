export type AccountPlan = "free" | "pro";

export interface AccountRecord {
  id: string;
  email: string;
  name: string;
  /** scrypt hash: salt:hash (hex) */
  passwordHash: string;
  plan: AccountPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
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
    subscriptionStatus: account.subscriptionStatus,
    crmWebhookUrl: account.crmWebhookUrl,
    crmEvents: account.crmEvents,
    teamIds: account.teamIds,
    profileSlugs: account.profileSlugs,
    createdAt: account.createdAt,
  };
}
