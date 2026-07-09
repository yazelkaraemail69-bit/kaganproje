import { promises as fs } from "fs";
import path from "path";
import { createTeamId } from "@/lib/domains/account/plan";
import type { TeamBranch, TeamRecord } from "@/lib/domains/account/types";
import { getAccountById, saveAccount } from "@/lib/account-store";

const DATA_DIR = path.join(process.cwd(), ".data", "teams");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(id: string): string {
  const safe = id.replace(/[^a-z0-9_-]/gi, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function saveTeam(team: TeamRecord): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(team.id), JSON.stringify(team, null, 2), "utf-8");
}

export async function getTeamById(id: string): Promise<TeamRecord | null> {
  try {
    const raw = await fs.readFile(filePath(id), "utf-8");
    return JSON.parse(raw) as TeamRecord;
  } catch {
    return null;
  }
}

export async function createTeam(input: {
  name: string;
  ownerId: string;
}): Promise<TeamRecord> {
  const now = new Date().toISOString();
  const team: TeamRecord = {
    id: createTeamId(input.name),
    name: input.name.trim(),
    ownerId: input.ownerId,
    memberIds: [input.ownerId],
    profileSlugs: [],
    branches: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveTeam(team);

  const owner = await getAccountById(input.ownerId);
  if (owner && !owner.teamIds.includes(team.id)) {
    owner.teamIds = [...owner.teamIds, team.id];
    owner.updatedAt = now;
    await saveAccount(owner);
  }

  return team;
}

export async function listTeamsForAccount(accountId: string): Promise<TeamRecord[]> {
  const account = await getAccountById(accountId);
  if (!account) return [];
  const teams: TeamRecord[] = [];
  for (const teamId of account.teamIds) {
    const team = await getTeamById(teamId);
    if (team) teams.push(team);
  }
  return teams;
}

export async function addTeamMember(teamId: string, memberId: string): Promise<TeamRecord | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;
  if (!team.memberIds.includes(memberId)) {
    team.memberIds = [...team.memberIds, memberId];
    team.updatedAt = new Date().toISOString();
    await saveTeam(team);
  }
  const member = await getAccountById(memberId);
  if (member && !member.teamIds.includes(teamId)) {
    member.teamIds = [...member.teamIds, teamId];
    member.updatedAt = new Date().toISOString();
    await saveAccount(member);
  }
  return team;
}

export async function attachProfileToTeam(teamId: string, slug: string): Promise<TeamRecord | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;
  if (!team.profileSlugs.includes(slug)) {
    team.profileSlugs = [...team.profileSlugs, slug];
    team.updatedAt = new Date().toISOString();
    await saveTeam(team);
  }
  return team;
}

export async function upsertTeamBranch(
  teamId: string,
  branch: Omit<TeamBranch, "id"> & { id?: string }
): Promise<TeamRecord | null> {
  const team = await getTeamById(teamId);
  if (!team) return null;

  const id = branch.id ?? `br_${Date.now().toString(36)}`;
  const nextBranch: TeamBranch = {
    id,
    label: branch.label.trim(),
    profileSlug: branch.profileSlug,
  };

  const idx = team.branches.findIndex((b) => b.id === id);
  if (idx >= 0) team.branches[idx] = nextBranch;
  else team.branches = [...team.branches, nextBranch];

  if (branch.profileSlug && !team.profileSlugs.includes(branch.profileSlug)) {
    team.profileSlugs = [...team.profileSlugs, branch.profileSlug];
  }

  team.updatedAt = new Date().toISOString();
  await saveTeam(team);
  return team;
}

export function isTeamMember(team: TeamRecord, accountId: string): boolean {
  return team.memberIds.includes(accountId) || team.ownerId === accountId;
}
