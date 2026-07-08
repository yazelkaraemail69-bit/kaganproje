export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formats a raw price string as Turkish Lira for the preview template. */
export function formatPrice(rawPrice: string): string {
  const trimmed = rawPrice.trim();
  if (!trimmed) return "";
  const numeric = Number(trimmed.replace(",", "."));
  if (Number.isNaN(numeric)) return trimmed;
  return `${numeric.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;
}
