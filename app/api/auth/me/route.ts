import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth/session";
import { getPlanLimits } from "@/lib/domains/account/plan";
import { listTeamsForAccount } from "@/lib/team-store";
import { getPublishedProfile } from "@/lib/profile-store";
import {
  COMPANY_THRESHOLD_SUBSCRIBERS,
  CREDIT_COSTS,
  CREDIT_PACKS,
  INVITE_BONUS_CREDITS,
  PLANS,
  SHORTS_VIDEO_ENABLED,
  planDisplayName,
} from "@/lib/billing/plans";
import { countActiveSubscribers } from "@/lib/account-store";

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
    },
  });
}
