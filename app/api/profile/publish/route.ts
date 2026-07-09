import { NextResponse } from "next/server";
import { z } from "zod";
import { createProfileSlug } from "@/lib/domains/profile/slug";
import type { PublishedProfile, ShareableCard, ShareableCatalog } from "@/lib/domains/profile/types";
import { getPublishedProfile, savePublishedProfile } from "@/lib/profile-store";
import { buildCardPublicUrl, buildCatalogPublicUrl } from "@/lib/share/publish";
import { getSessionAccount } from "@/lib/auth/session";
import { attachProfileToAccount, getAccountById } from "@/lib/account-store";
import { getPlanLimits } from "@/lib/domains/account/plan";
import { dispatchCrmWebhook } from "@/lib/integrations/crm/dispatch";
import { attachProfileToTeam, getTeamById, isTeamMember } from "@/lib/team-store";

const socialSchema = z.object({
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
});

const cardPayloadSchema = z.object({
  fullName: z.string().min(1),
  title: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  social: socialSchema.optional(),
  themeId: z.string().optional(),
  layoutId: z.string().optional(),
  photoUrl: z.string().optional(),
});

const catalogItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  price: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const menuLocaleSchema = z.enum(["tr", "en", "de", "ar", "ru"]);

const menuTranslationsSchema = z
  .object({
    restaurantName: z.record(menuLocaleSchema, z.string()).optional(),
    description: z.record(menuLocaleSchema, z.string()).optional(),
    categories: z.record(z.string(), z.record(menuLocaleSchema, z.string())).optional(),
    items: z
      .record(
        z.string(),
        z.record(
          menuLocaleSchema,
          z.object({
            name: z.string().optional(),
            description: z.string().optional(),
          })
        )
      )
      .optional(),
  })
  .optional();

const catalogPayloadSchema = z.object({
  businessType: z
    .enum(["restaurant", "cafe", "salon", "spa", "shop", "service", "clinic", "other"])
    .optional(),
  restaurantName: z.string().min(1),
  description: z.string().optional(),
  themeId: z.string().optional(),
  colors: z.array(z.string()).optional(),
  layoutId: z.string().optional(),
  logoUrl: z.string().optional(),
  contactPhone: z.string().optional(),
  enabledLocales: z.array(menuLocaleSchema).optional(),
  translations: menuTranslationsSchema,
  categories: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      items: z.array(catalogItemSchema),
    })
  ),
});

const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("card"),
    displayName: z.string().min(1),
    existingSlug: z.string().optional(),
    teamId: z.string().optional(),
    branchLabel: z.string().optional(),
    payload: cardPayloadSchema,
  }),
  z.object({
    type: z.literal("catalog"),
    displayName: z.string().min(1),
    existingSlug: z.string().optional(),
    teamId: z.string().optional(),
    branchLabel: z.string().optional(),
    payload: catalogPayloadSchema,
  }),
]);

function normalizeCardPayload(payload: z.infer<typeof cardPayloadSchema>): ShareableCard {
  return {
    fullName: payload.fullName,
    title: payload.title ?? "",
    company: payload.company ?? "",
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    website: payload.website ?? "",
    social: {
      instagram: payload.social?.instagram ?? "",
      linkedin: payload.social?.linkedin ?? "",
      twitter: payload.social?.twitter ?? "",
      facebook: payload.social?.facebook ?? "",
    },
    themeId: payload.themeId ?? "indigo",
    layoutId: payload.layoutId ?? "classic",
    photoUrl: payload.photoUrl || undefined,
  };
}

function normalizeCatalogPayload(payload: z.infer<typeof catalogPayloadSchema>): ShareableCatalog {
  return {
    businessType: payload.businessType,
    restaurantName: payload.restaurantName,
    description: payload.description ?? "",
    themeId: payload.themeId,
    colors: payload.colors,
    layoutId: payload.layoutId,
    logoUrl: payload.logoUrl || undefined,
    contactPhone: payload.contactPhone || undefined,
    enabledLocales: payload.enabledLocales,
    translations: payload.translations,
    categories: payload.categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: category.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price ?? "",
        description: item.description ?? "",
        imageUrl: item.imageUrl || undefined,
      })),
    })),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz profil verisi." }, { status: 400 });
  }

  const { type, displayName, existingSlug, payload, teamId, branchLabel } = parsed.data;
  const now = new Date().toISOString();
  const normalizedPayload =
    type === "card" ? normalizeCardPayload(payload) : normalizeCatalogPayload(payload);

  const session = await getSessionAccount();
  const existing =
    existingSlug?.trim() ? await getPublishedProfile(existingSlug.trim()) : null;
  const isUpdate = Boolean(existing && existing.type === type);

  if (existing?.ownerId) {
    if (!session || existing.ownerId !== session.id) {
      return NextResponse.json(
        { error: "Bu profil başka bir hesaba ait. Güncellemek için giriş yapın." },
        { status: 403 }
      );
    }
  }

  if (session && !isUpdate) {
    const account = await getAccountById(session.id);
    if (account) {
      const limits = getPlanLimits(account.plan);
      if (account.profileSlugs.length >= limits.maxProfiles) {
        return NextResponse.json(
          {
            error: `Ücretsiz planda en fazla ${limits.maxProfiles} profil yayınlayabilirsiniz. Pro'ya yükseltin.`,
            code: "PLAN_LIMIT",
          },
          { status: 402 }
        );
      }
    }
  }

  let resolvedTeamId = teamId || existing?.teamId;
  let resolvedBranchLabel = branchLabel?.trim() || existing?.branchLabel;

  if (resolvedTeamId && session) {
    const team = await getTeamById(resolvedTeamId);
    if (!team || !isTeamMember(team, session.id)) {
      return NextResponse.json({ error: "Takım bulunamadı veya yetkiniz yok." }, { status: 403 });
    }
    const limits = getPlanLimits(session.plan);
    if (!limits.teams) {
      return NextResponse.json({ error: "Takım özelliği Pro plana özeldir." }, { status: 403 });
    }
  } else if (resolvedTeamId && !session) {
    resolvedTeamId = undefined;
    resolvedBranchLabel = undefined;
  }

  const slug = isUpdate && existing ? existing.slug : createProfileSlug(displayName);

  const profile: PublishedProfile = {
    slug,
    type,
    displayName: displayName.trim(),
    publishedAt: isUpdate && existing ? existing.publishedAt : now,
    updatedAt: now,
    viewCount: isUpdate && existing ? existing.viewCount : 0,
    viewEvents: isUpdate && existing ? existing.viewEvents ?? [] : [],
    ownerId: session?.id ?? existing?.ownerId,
    teamId: resolvedTeamId,
    branchLabel: resolvedBranchLabel,
    payload: normalizedPayload,
  };

  try {
    await savePublishedProfile(profile);
    if (session) {
      await attachProfileToAccount(session.id, slug);
      if (resolvedTeamId) {
        await attachProfileToTeam(resolvedTeamId, slug);
      }
      const account = await getAccountById(session.id);
      void dispatchCrmWebhook(account, {
        event: "publish",
        occurredAt: now,
        profile: { slug, type, displayName: profile.displayName },
        meta: { isUpdate },
      });
    }
  } catch (error) {
    console.error("Profile save error:", error);
    return NextResponse.json({ error: "Profil kaydedilemedi." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const url = type === "card" ? buildCardPublicUrl(slug, origin) : buildCatalogPublicUrl(slug, origin);

  return NextResponse.json({ slug, url, type, isUpdate, ownerId: profile.ownerId ?? null });
}
