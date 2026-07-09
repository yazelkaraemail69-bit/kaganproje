import type { ProfileType, ShareableCard, ShareableCatalog } from "@/lib/domains/profile/types";

export interface PublishProfileRequest {
  type: ProfileType;
  displayName: string;
  payload: ShareableCard | ShareableCatalog;
  existingSlug?: string | null;
}

export interface PublishProfileResponse {
  slug: string;
  url: string;
  type: ProfileType;
  isUpdate: boolean;
}

export async function publishProfile(request: PublishProfileRequest): Promise<PublishProfileResponse> {
  const response = await fetch("/api/profile/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: request.type,
      displayName: request.displayName,
      existingSlug: request.existingSlug ?? undefined,
      payload: request.payload,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Profil yayınlanamadı.");
  }

  return data as PublishProfileResponse;
}

export function buildCardPublicUrl(slug: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/kartvizit/c/${slug}`;
}

export function buildCatalogPublicUrl(slug: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/menu/m/${slug}`;
}

export async function fetchProfileAnalytics(slug: string) {
  const response = await fetch(`/api/profile/${slug}/analytics`);
  if (!response.ok) return null;
  return response.json();
}
