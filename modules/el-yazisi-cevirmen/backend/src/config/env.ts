import "dotenv/config";
import { z } from "zod";
import { isPlaceholderApiKey } from "../utils/openRouterErrors";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY zorunludur"),
  OPENROUTER_SITE_URL: z.string().default("https://example.com"),
  OPENROUTER_APP_NAME: z.string().default("El Yazisi Cevirmen"),
  APP_SHARED_SECRET: z.string().min(1, "APP_SHARED_SECRET zorunludur"),
  CORS_ORIGINS: z.string().default("*"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Ortam degiskenleri gecersiz:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Gecersiz ortam degiskenleri. Lutfen .env dosyanizi kontrol edin (.env.example'a bakin).");
  }
  return parsed.data;
}

export const env = loadEnv();

export const corsOrigins = env.CORS_ORIGINS === "*" ? true : env.CORS_ORIGINS.split(",").map((o) => o.trim());

export function isOpenRouterConfigured(): boolean {
  return !isPlaceholderApiKey(env.OPENROUTER_API_KEY);
}

export function logStartupWarnings(): void {
  if (!isOpenRouterConfigured()) {
    console.warn("");
    console.warn("⚠️  UYARI: OPENROUTER_API_KEY henuz ayarlanmamis (ornek deger kullaniliyor).");
    console.warn("   OCR ve ceviri calismaz. backend/.env dosyasina gercek anahtarinizi yazin:");
    console.warn("   https://openrouter.ai/keys");
    console.warn("");
  }

  if (env.APP_SHARED_SECRET === "change-this-to-a-long-random-string") {
    console.warn("⚠️  UYARI: APP_SHARED_SECRET varsayilan degerde. Yerel test icin sorun degil,");
    console.warn("   ancak internete acarsaniz guclu bir sifre belirleyin.");
  }
}
