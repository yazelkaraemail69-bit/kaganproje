import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccountByEmail } from "@/lib/account-store";
import { getSessionAccount } from "@/lib/auth/session";
import { getPlanLimits } from "@/lib/domains/account/plan";
import {
  addTeamMember,
  attachProfileToTeam,
  createTeam,
  isTeamMember,
  listTeamsForAccount,
  upsertTeamBranch,
  getTeamById,
} from "@/lib/team-store";
import { getPublishedProfile, savePublishedProfile } from "@/lib/profile-store";

export async function GET() {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }
  const teams = await listTeamsForAccount(session.id);
  return NextResponse.json({ teams, enabled: getPlanLimits(session.plan).teams });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const limits = getPlanLimits(session.plan);
  if (!limits.teams) {
    return NextResponse.json({ error: "Takım yönetimi Pro plana özeldir." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Takım adı gerekli." }, { status: 400 });
  }

  const team = await createTeam({ name: parsed.data.name, ownerId: session.id });
  return NextResponse.json({ team });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    teamId: z.string(),
    email: z.string().email(),
  }),
  z.object({
    action: z.literal("attach_profile"),
    teamId: z.string(),
    slug: z.string(),
  }),
  z.object({
    action: z.literal("upsert_branch"),
    teamId: z.string(),
    label: z.string().min(1),
    profileSlug: z.string().optional(),
    branchId: z.string().optional(),
  }),
]);

export async function PATCH(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const limits = getPlanLimits(session.plan);
  if (!limits.teams) {
    return NextResponse.json({ error: "Takım yönetimi Pro plana özeldir." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const team = await getTeamById(parsed.data.teamId);
  if (!team || !isTeamMember(team, session.id)) {
    return NextResponse.json({ error: "Takım bulunamadı veya yetkiniz yok." }, { status: 404 });
  }

  if (parsed.data.action === "invite") {
    const invitee = await getAccountByEmail(parsed.data.email);
    if (!invitee) {
      return NextResponse.json(
        { error: "Bu e-posta ile kayıtlı hesap bulunamadı. Önce kayıt olmalı." },
        { status: 404 }
      );
    }
    const updated = await addTeamMember(team.id, invitee.id);
    return NextResponse.json({ team: updated });
  }

  if (parsed.data.action === "attach_profile") {
    const profile = await getPublishedProfile(parsed.data.slug);
    if (!profile) {
      return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
    }
    if (profile.ownerId && profile.ownerId !== session.id && !isTeamMember(team, session.id)) {
      return NextResponse.json({ error: "Bu profili takıma ekleyemezsiniz." }, { status: 403 });
    }
    profile.teamId = team.id;
    await savePublishedProfile(profile);
    const updated = await attachProfileToTeam(team.id, profile.slug);
    return NextResponse.json({ team: updated, profile });
  }

  if (!limits.multiBranch) {
    return NextResponse.json({ error: "Çok şube Pro plana özeldir." }, { status: 403 });
  }

  const updated = await upsertTeamBranch(team.id, {
    id: parsed.data.branchId,
    label: parsed.data.label,
    profileSlug: parsed.data.profileSlug,
  });

  if (parsed.data.profileSlug) {
    const profile = await getPublishedProfile(parsed.data.profileSlug);
    if (profile) {
      profile.teamId = team.id;
      profile.branchLabel = parsed.data.label;
      await savePublishedProfile(profile);
    }
  }

  return NextResponse.json({ team: updated });
}
