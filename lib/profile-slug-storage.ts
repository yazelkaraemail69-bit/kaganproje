import type { ProfileType } from "@/lib/domains/profile/types";

const CARD_SLUG_KEY = "kaganproje-published-card-slug";
const CATALOG_SLUG_KEY = "kaganproje-published-catalog-slug";

function storageKey(type: ProfileType): string {
  return type === "card" ? CARD_SLUG_KEY : CATALOG_SLUG_KEY;
}

export function getStoredProfileSlug(type: ProfileType): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(storageKey(type));
}

export function setStoredProfileSlug(type: ProfileType, slug: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(type), slug);
}

export function clearStoredProfileSlug(type: ProfileType): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(type));
}
