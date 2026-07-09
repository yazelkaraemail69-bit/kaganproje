import { promises as fs } from "fs";
import path from "path";
import {
  FOUNDING_FREE_DAYS,
  FOUNDING_MEMBER_LIMIT,
  FOUNDING_PLAN_ID,
  FOUNDING_REFERRAL_TOTAL_DAYS,
  getPlan,
} from "@/lib/billing/plans";
import type { AccountRecord } from "@/lib/domains/account/types";

const DATA_DIR = path.join(process.cwd(), ".data", "founding");
const STATE_FILE = path.join(DATA_DIR, "seats.json");
const LOCK_FILE = path.join(DATA_DIR, "seats.lock");

export interface FoundingSeat {
  seat: number;
  accountId: string;
  claimedAt: string;
}

interface FoundingState {
  claimed: number;
  seats: FoundingSeat[];
}

export interface FoundingClaimResult {
  granted: boolean;
  seat: number | null;
  remaining: number;
  limit: number;
  freeDays: number;
  referralTotalDays: number;
  planId: typeof FOUNDING_PLAN_ID;
  planExpiresAt: string | null;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readState(): Promise<FoundingState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as FoundingState;
    return {
      claimed: typeof parsed.claimed === "number" ? parsed.claimed : 0,
      seats: Array.isArray(parsed.seats) ? parsed.seats : [],
    };
  } catch {
    return { claimed: 0, seats: [] };
  }
}

async function writeState(state: FoundingState): Promise<void> {
  await ensureDir();
  const tmp = `${STATE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf-8");
  await fs.rename(tmp, STATE_FILE);
}

/** Exclusive lock (wx) — Windows/Linux uyumlu, yarışta 31. koltuğu engeller */
async function withFoundingLock<T>(fn: () => Promise<T>): Promise<T> {
  await ensureDir();
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const handle = await fs.open(LOCK_FILE, "wx");
      try {
        return await fn();
      } finally {
        await handle.close();
        await fs.unlink(LOCK_FILE).catch(() => undefined);
      }
    } catch {
      await new Promise((r) => setTimeout(r, 25 + Math.random() * 50));
    }
  }
  throw new Error("Kurucu üye kilidi alınamadı. Lütfen tekrar deneyin.");
}

export async function getFoundingStatus(): Promise<{
  limit: number;
  claimed: number;
  remaining: number;
  open: boolean;
  freeDays: number;
  referralTotalDays: number;
  planId: typeof FOUNDING_PLAN_ID;
}> {
  const state = await readState();
  const claimed = Math.min(state.claimed, FOUNDING_MEMBER_LIMIT);
  const remaining = Math.max(0, FOUNDING_MEMBER_LIMIT - claimed);
  return {
    limit: FOUNDING_MEMBER_LIMIT,
    claimed,
    remaining,
    open: remaining > 0,
    freeDays: FOUNDING_FREE_DAYS,
    referralTotalDays: FOUNDING_REFERRAL_TOTAL_DAYS,
    planId: FOUNDING_PLAN_ID,
  };
}

function claimPayload(
  granted: boolean,
  seat: number | null,
  claimed: number
): FoundingClaimResult {
  return {
    granted,
    seat,
    remaining: Math.max(0, FOUNDING_MEMBER_LIMIT - claimed),
    limit: FOUNDING_MEMBER_LIMIT,
    freeDays: FOUNDING_FREE_DAYS,
    referralTotalDays: FOUNDING_REFERRAL_TOTAL_DAYS,
    planId: FOUNDING_PLAN_ID,
    planExpiresAt: granted ? addDaysIso(FOUNDING_FREE_DAYS) : null,
  };
}

/**
 * İlk N kayıt için atomik koltuk rezervasyonu.
 * Aynı accountId ikinci kez çağrılırsa mevcut koltuğu döner (idempotent).
 */
export async function tryClaimFoundingSeat(accountId: string): Promise<FoundingClaimResult> {
  return withFoundingLock(async () => {
    const state = await readState();
    const existing = state.seats.find((s) => s.accountId === accountId);
    if (existing) {
      return claimPayload(true, existing.seat, state.claimed);
    }

    if (state.claimed >= FOUNDING_MEMBER_LIMIT) {
      return claimPayload(false, null, state.claimed);
    }

    const seat = state.claimed + 1;
    await writeState({
      claimed: seat,
      seats: [...state.seats, { seat, accountId, claimedAt: new Date().toISOString() }],
    });

    return claimPayload(true, seat, seat);
  });
}

export function addDaysIso(days: number, from = new Date()): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/** Kurucu üye hesabına Başlangıç planı + 7 gün kredi uygular */
export function applyFoundingBenefits(
  account: AccountRecord,
  claim: FoundingClaimResult
): AccountRecord {
  if (!claim.granted || claim.seat == null) return account;
  const plan = getPlan(FOUNDING_PLAN_ID);
  return {
    ...account,
    plan: FOUNDING_PLAN_ID,
    billingPeriod: "monthly",
    credits: plan?.monthlyCredits ?? 100,
    subscriptionStatus: "active",
    paymentMethod: "founding",
    planExpiresAt: claim.planExpiresAt ?? undefined,
    foundingMember: true,
    foundingSeat: claim.seat,
    foundingReferralExtended: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Davet eden kurucu üyenin süresini kayıt anından itibaren toplam 10 güne çeker.
 * Tek seferlik; zaten uzatılmışsa no-op.
 */
export function computeFoundingReferralExpiry(account: AccountRecord): string {
  const start = new Date(account.createdAt);
  return addDaysIso(FOUNDING_REFERRAL_TOTAL_DAYS, start);
}

export function isFoundingOfferOpen(remaining: number): boolean {
  return remaining > 0;
}
