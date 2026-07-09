import type { BusinessCardData } from "@/lib/types";

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function splitName(fullName: string): { family: string; given: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { family: parts[0] ?? "", given: "" };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}

function socialUrl(platform: string, handle: string): string | null {
  const trimmed = handle.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const clean = trimmed.replace(/^@/, "");
  const urls: Record<string, string> = {
    instagram: `https://instagram.com/${clean}`,
    linkedin: `https://linkedin.com/in/${clean}`,
    twitter: `https://x.com/${clean}`,
    facebook: `https://facebook.com/${clean}`,
  };
  return urls[platform] ?? null;
}

function normalizeWebsite(url: string): string {
  if (!url.trim()) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

/** Builds a downloadable .vcf contact file (vCard 3.0, UTF-8). */
export function buildVCard(data: BusinessCardData): string {
  const { family, given } = splitName(data.fullName);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "CHARSET=UTF-8",
    `FN:${escapeVCard(data.fullName)}`,
    `N:${escapeVCard(family)};${escapeVCard(given)};;;`,
    `TITLE:${escapeVCard(data.title)}`,
  ];

  if (data.company) lines.push(`ORG:${escapeVCard(data.company)}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL,VOICE:${data.phone}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);

  const website = normalizeWebsite(data.website);
  if (website) lines.push(`URL:${website}`);

  if (data.photoUrl?.startsWith("http")) {
    lines.push(`PHOTO;VALUE=URI;TYPE=JPEG:${data.photoUrl}`);
  }

  const noteParts = [data.title, data.company].filter(Boolean);
  if (noteParts.length) {
    lines.push(`NOTE:${escapeVCard(noteParts.join(" · "))}`);
  }

  const socialEntries: Array<[string, string | undefined]> = [
    ["instagram", data.social.instagram],
    ["linkedin", data.social.linkedin],
    ["twitter", data.social.twitter],
    ["facebook", data.social.facebook],
  ];

  for (const [platform, handle] of socialEntries) {
    const url = handle ? socialUrl(platform, handle) : null;
    if (url) lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${url}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadVCard(data: BusinessCardData): void {
  const vcard = buildVCard(data);
  const blob = new Blob(["\uFEFF", vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.fullName || "kartvizit"}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
