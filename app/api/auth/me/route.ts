import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth/session";
import { getPlanLimits } from "@/lib/domains/account/plan";
import { listTeamsForAccount } from "@/lib/team-store";
import { getPublishedProfile } from "@/lib/profile-store";

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

  return NextResponse.json({
    account,
    limits,
    teams,
    profiles,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
  });
}
