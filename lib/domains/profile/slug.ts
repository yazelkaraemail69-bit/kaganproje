const TR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

function transliterate(input: string): string {
  return input.replace(/[çğıöşüÇĞİÖŞÜ]/g, (ch) => TR_MAP[ch] ?? ch);
}

/** URL-safe slug: isim + kısa rastgele suffix (çakışma riskini azaltır). */
export function createProfileSlug(displayName: string): string {
  const base = transliterate(displayName.trim().toLowerCase())
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "profil"}-${suffix}`;
}
