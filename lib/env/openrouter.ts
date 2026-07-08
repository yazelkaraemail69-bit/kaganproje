/**
 * Tek OPENROUTER_API_KEY — kaganproje/.env.local
 * Shorts (3. modul) ve diger Next.js API route'lari buradan okur.
 */

const PLACEHOLDER_MARKERS = [
  "buraya",
  "your-key",
  "your_key",
  "placeholder",
  "example",
  "xxxxxxxx",
];

export function isPlaceholderOpenRouterKey(apiKey: string | undefined): boolean {
  if (!apiKey) return true;
  const trimmed = apiKey.trim();
  if (!trimmed) return true;
  if (trimmed.length < 30) return true;

  const lower = trimmed.toLowerCase();
  if (trimmed === "sk-or-v1-your-key-here") return true;
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

export function getOpenRouterApiKey(): string | undefined {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key || isPlaceholderOpenRouterKey(key)) return undefined;
  return key;
}

export function isOpenRouterConfigured(): boolean {
  return !!getOpenRouterApiKey();
}

export function requireOpenRouterApiKey(featureLabel = "Bu ozellik"): string {
  const key = getOpenRouterApiKey();
  if (key) return key;

  throw new Error(
    `${featureLabel} icin OPENROUTER_API_KEY gerekli. kaganproje/.env.local dosyasina anahtarinizi ekleyin (https://openrouter.ai/keys), ardindan sunucuyu yeniden baslatin.`
  );
}

export const OPENROUTER_SETUP_HINT =
  "kaganproje/.env.local dosyasina OPENROUTER_API_KEY ekleyin ve sunucuyu yeniden baslatin.";
