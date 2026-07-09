import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { AccountPlan } from "@/lib/domains/account/types";

export const FREE_PROFILE_LIMIT = 1;
export const PRO_PROFILE_LIMIT = 50;

export interface PlanLimits {
  maxProfiles: number;
  analyticsDays: number;
  crmWebhook: boolean;
  teams: boolean;
  multiBranch: boolean;
}

export function getPlanLimits(plan: AccountPlan): PlanLimits {
  if (plan === "pro") {
    return {
      maxProfiles: PRO_PROFILE_LIMIT,
      analyticsDays: 365,
      crmWebhook: true,
      teams: true,
      multiBranch: true,
    };
  }
  return {
    maxProfiles: FREE_PROFILE_LIMIT,
    analyticsDays: 7,
    crmWebhook: false,
    teams: false,
    multiBranch: false,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (next.length !== expected.length) return false;
  return timingSafeEqual(next, expected);
}

export function createAccountId(email: string): string {
  const stamp = Date.now().toString(36);
  const digest = createHash("sha256").update(`${normalizeEmail(email)}:${stamp}`).digest("hex").slice(0, 10);
  return `acc_${digest}`;
}

export function createTeamId(name: string): string {
  const stamp = Date.now().toString(36);
  const digest = createHash("sha256").update(`${name}:${stamp}`).digest("hex").slice(0, 8);
  return `team_${digest}`;
}
