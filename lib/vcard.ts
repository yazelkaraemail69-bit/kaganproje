import type { BusinessCardData } from "@/lib/types";

/** Builds a downloadable .vcf contact file so the preview can be saved to a phone's address book. */
export function buildVCard(data: BusinessCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.fullName}`,
    `TITLE:${data.title}`,
  ];

  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.website) lines.push(`URL:${data.website}`);

  lines.push("END:VCARD");
  return lines.join("\n");
}

export function downloadVCard(data: BusinessCardData): void {
  const vcard = buildVCard(data);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.fullName || "kartvizit"}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
