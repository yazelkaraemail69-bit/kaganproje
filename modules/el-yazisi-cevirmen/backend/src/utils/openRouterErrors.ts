const AUTH_ERROR_PATTERNS = [
  "user not found",
  "invalid api key",
  "invalid authentication",
  "unauthorized",
  "authentication failed",
  "no auth credentials",
  "incorrect api key",
];

const RATE_LIMIT_PATTERNS = ["rate", "limit", "too many requests", "quota"];

const PROVIDER_ERROR_PATTERNS = ["provider returned error"];

export function isOpenRouterAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return AUTH_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isPlaceholderApiKey(apiKey: string): boolean {
  const trimmed = apiKey.trim();
  const lower = trimmed.toLowerCase();

  if (trimmed.length < 30) return true;
  if (trimmed.includes("xxxxxxxx")) return true;
  if (lower.includes("buraya")) return true;
  if (lower.includes("your-key") || lower.includes("your_key")) return true;
  if (lower.includes("example") || lower.includes("placeholder")) return true;
  if (trimmed === "sk-or-v1-your-key-here") return true;

  return false;
}

export function friendlyOpenRouterError(
  message: string,
  options: { context?: "ocr" | "translate" } = {}
): string {
  const { context = "ocr" } = options;
  const lower = message.toLowerCase();

  if (isOpenRouterAuthError(message)) {
    return [
      "OpenRouter API anahtari gecersiz veya eksik.",
      "backend/.env dosyasindaki OPENROUTER_API_KEY degerini https://openrouter.ai/keys adresinden aldiginiz gercek anahtarla degistirin.",
      "Degisiklikten sonra sunucuyu yeniden baslatin (npm run dev).",
    ].join(" ");
  }

  if (RATE_LIMIT_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return "Istek limiti asildi. Bir kac dakika bekleyip tekrar deneyin.";
  }

  if (PROVIDER_ERROR_PATTERNS.some((pattern) => lower.includes(pattern))) {
    return context === "ocr"
      ? "Secilen model su an yanit veremedi. Baska bir model secip tekrar deneyin."
      : "Secilen ceviri modeli su an yanit veremedi. Baska bir model secip tekrar deneyin.";
  }

  if (lower.includes("insufficient credits") || lower.includes("payment required") || lower.includes("billing")) {
    return "OpenRouter hesabinizda yeterli kredi yok. https://openrouter.ai/credits adresinden kredi yukleyin.";
  }

  if (lower.includes("requires more credits") || lower.includes("add credits")) {
    return "OpenRouter hesabinizda yeterli kredi yok. https://openrouter.ai/credits adresinden kredi yukleyin.";
  }

  if (lower.includes("model not found") || lower.includes("no endpoints") || lower.includes("no provider")) {
    return "Secilen model su an kullanilamiyor. Listeden baska bir AI modeli deneyin.";
  }

  if (lower.includes("metin dondurmedi") || lower.includes("yanitinda metin bulunamadi")) {
    return "AI modeli fotograftan metin cikaramadi. Daha net bir fotograf veya farkli bir model deneyin.";
  }

  if (lower.includes("at most 3") || lower.includes("en fazla 3")) {
    return "Model limiti asildi. Lutfen tekrar deneyin.";
  }

  return message;
}
