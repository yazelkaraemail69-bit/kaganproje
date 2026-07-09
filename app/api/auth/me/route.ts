import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth/session";
import { getPlanLimits } from "@/lib/domains/account/plan";
import { listTeamsForAccount } from "@/lib/team-store";
import { getPublishedProfile } from "@/lib/profile-store";
import {
  COMPANY_THRESHOLD_SUBSCRIBERS,
  CREDIT_COSTS,
  CREDIT_PACKS,
  FOUNDING_FREE_DAYS,
  FOUNDING_MEMBER_LIMIT,
  FOUNDING_REFERRAL_TOTAL_DAYS,
  INVITE_BONUS_CREDITS,
  PLANS,
  SHORTS_VIDEO_ENABLED,
  planDisplayName,
} from "@/lib/billing/plans";
import { countActiveSubscribers } from "@/lib/account-store";
import { getFoundingStatus } from "@/lib/billing/founding";

export async function GET() {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ account: null });
  }

  const limits = getPlanLimits(account.plan);
  const teams = await listTeamsForAccount(account.id);
  const profiles = [];
  for (const slug of account.profileSlugs) {
    const profile = await getPublishedProfile(slug);
    if (profile) {
      profiles.push({
        slug: profile.slug,
        type: profile.type,
        displayName: profile.displayName,
        viewCount: profile.viewCount,
        updatedAt: profile.updatedAt,
        teamId: profile.teamId,
        branchLabel: profile.branchLabel,
      });
    }
  }

  const activeSubscribers = await countActiveSubscribers();
  const founding = await getFoundingStatus();

  return NextResponse.json({
    account,
    limits,
    teams,
    profiles,
    billing: {
      mode: "iyzico_link_manual",
      plans: PLANS,
      creditPacks: CREDIT_PACKS,
      creditCosts: CREDIT_COSTS,
      inviteBonusCredits: INVITE_BONUS_CREDITS,
      shortsVideoEnabled: SHORTS_VIDEO_ENABLED,
      planDisplayName: planDisplayName(account.plan),
      activeSubscribers,
      companyThreshold: COMPANY_THRESHOLD_SUBSCRIBERS,
      founding: {
        ...founding,
        memberLimit: FOUNDING_MEMBER_LIMIT,
        freeDays: FOUNDING_FREE_DAYS,
        referralTotalDays: FOUNDING_REFERRAL_TOTAL_DAYS,
      },
    },
  });
}
