import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
import { isPlaceholderApiKey } from "../utils/openRouterErrors";

// Yerel gelistirme: once kaganproje kokundeki .env.local, sonra backend/.env
if (!process.env.VERCEL) {
  const backendRoot = path.resolve(__dirname, "../..");
  const kaganProjeRoot = path.resolve(backendRoot, "../..");
  dotenv.config({ path: path.join(kaganProjeRoot, ".env.local") });
  dotenv.config({ path: path.join(kaganProjeRoot, ".env") });
  dotenv.config({ path: path.join(backendRoot, ".env") });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  OPENROUTER_API_KEY: z.string().min(1).default("sk-or-v1-BURAYA-GERCEK-ANAHTARINIZI-YAZIN"),
  OPENROUTER_SITE_URL: z.string().default("https://example.com"),
  OPENROUTER_APP_NAME: z.string().default("El Yazisi Cevirmen"),
  APP_SHARED_SECRET: z.string().min(1).default("change-this-to-a-long-random-string"),
  CORS_ORIGINS: z.string().default("*"),
});

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Ortam degiskenleri gecersiz:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Gecersiz ortam degiskenleri. Lutfen .env dosyanizi kontrol edin (.env.example'a bakin).");
  }
  const data = parsed.data;
  data.APP_SHARED_SECRET = stripBom(data.APP_SHARED_SECRET);
  data.OPENROUTER_API_KEY = stripBom(data.OPENROUTER_API_KEY);
  data.OPENROUTER_SITE_URL = stripBom(data.OPENROUTER_SITE_URL);
  data.OPENROUTER_APP_NAME = stripBom(data.OPENROUTER_APP_NAME);
  data.CORS_ORIGINS = stripBom(data.CORS_ORIGINS);
  return data;
}

export const env = loadEnv();

export const corsOrigins =
  env.CORS_ORIGINS === "*" ? true : env.CORS_ORIGINS.split(",").map((o) => o.trim());

export function isOpenRouterConfigured(): boolean {
  return !isPlaceholderApiKey(env.OPENROUTER_API_KEY);
}

export function logStartupWarnings(): void {
  if (!isOpenRouterConfigured()) {
    console.warn("");
    console.warn("⚠️  UYARI: OPENROUTER_API_KEY henuz ayarlanmamis (ornek deger kullaniliyor).");
    console.warn("   Vercel: Project Settings → Environment Variables");
    console.warn("   Yerel: kaganproje/.env.local veya backend/.env");
    console.warn("   https://openrouter.ai/keys");
    console.warn("");
  }

  if (env.APP_SHARED_SECRET === "change-this-to-a-long-random-string") {
    console.warn("⚠️  UYARI: APP_SHARED_SECRET varsayilan degerde. Yerel test icin sorun degil,");
    console.warn("   ancak internete acarsaniz guclu bir sifre belirleyin.");
  }
}
