import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getPlan, type PlanId } from "@/lib/billing/plans";
import type { AccountPlan } from "@/lib/domains/account/types";

export interface PlanLimits {
  maxProfiles: number;
  analyticsDays: number;
  crmWebhook: boolean;
  teams: boolean;
  multiBranch: boolean;
  monthlyCredits: number;
  removeWatermark: boolean;
}

export function getPlanLimits(plan: AccountPlan): PlanLimits {
  const def = getPlan(plan as PlanId);
  if (def) {
    return {
      maxProfiles: def.maxProfiles,
      analyticsDays: def.analyticsDays,
      crmWebhook: def.crmWebhook,
      teams: def.teams,
      multiBranch: def.teams,
      monthlyCredits: def.monthlyCredits,
      removeWatermark: def.removeWatermark,
    };
  }
  // free / taslak
  return {
    maxProfiles: 1,
    analyticsDays: 7,
    crmWebhook: false,
    teams: false,
    multiBranch: false,
    monthlyCredits: 0,
    removeWatermark: false,
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
  const digest = createHash("sha256")
    .update(`${normalizeEmail(email)}:${stamp}`)
    .digest("hex")
    .slice(0, 10);
  return `acc_${digest}`;
}

export function createTeamId(name: string): string {
  const stamp = Date.now().toString(36);
  const digest = createHash("sha256").update(`${name}:${stamp}`).digest("hex").slice(0, 8);
  return `team_${digest}`;
}

export function createInviteCode(seed: string): string {
  const digest = createHash("sha256")
    .update(`${seed}:${Date.now()}:${randomBytes(4).toString("hex")}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `KG${digest}`;
}
