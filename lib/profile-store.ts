import { promises as fs } from "fs";
import path from "path";
import {
  buildAnalyticsSummary,
  createViewEvent,
  trimViewEvents,
  type ProfileAnalyticsSummary,
} from "@/lib/domains/profile/analytics";
import type { PublishedProfile } from "@/lib/domains/profile/types";
import { getAccountById } from "@/lib/account-store";
import { dispatchCrmWebhook } from "@/lib/integrations/crm/dispatch";

const DATA_DIR = path.join(process.cwd(), ".data", "profiles");

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-]/gi, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export async function savePublishedProfile(profile: PublishedProfile): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(profile.slug), JSON.stringify(profile), "utf-8");
}

export async function getPublishedProfile(slug: string): Promise<PublishedProfile | null> {
  try {
    const raw = await fs.readFile(filePath(slug), "utf-8");
    const parsed = JSON.parse(raw) as PublishedProfile;
    if (!parsed.viewEvents) parsed.viewEvents = [];
    return parsed;
  } catch {
    return null;
  }
}

export async function recordProfileView(
  slug: string,
  meta?: { userAgent?: string; referer?: string; origin?: string }
): Promise<PublishedProfile | null> {
  const profile = await getPublishedProfile(slug);
  if (!profile) return null;

  const event = createViewEvent(meta);
  profile.viewCount = (profile.viewCount ?? 0) + 1;
  profile.viewEvents = trimViewEvents([...(profile.viewEvents ?? []), event]);
  profile.updatedAt = new Date().toISOString();

  await savePublishedProfile(profile);

  if (profile.ownerId) {
    const account = await getAccountById(profile.ownerId);
    void dispatchCrmWebhook(account, {
      event: "view",
      occurredAt: event.at,
      profile: {
        slug: profile.slug,
        type: profile.type,
        displayName: profile.displayName,
      },
      meta: {
        device: event.device,
        source: event.source,
        viewCount: profile.viewCount,
      },
    });
  }

  return profile;
}

/** @deprecated Use recordProfileView */
export async function incrementProfileViews(slug: string): Promise<PublishedProfile | null> {
  return recordProfileView(slug);
}

export async function getProfileAnalytics(slug: string): Promise<ProfileAnalyticsSummary | null> {
  const profile = await getPublishedProfile(slug);
  if (!profile) return null;
  return buildAnalyticsSummary(profile);
}
