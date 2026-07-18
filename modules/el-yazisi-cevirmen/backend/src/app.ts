import path from "path";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { PAID_MODELS, DEFAULT_PAID_MODEL } from "./config/paidModels";
import {
  MAX_UPLOAD_IMAGES,
  MAX_PDF_PAGES,
  SUPPORTED_LANGUAGES,
} from "./config/languages";
import { corsOrigins, env, isOpenRouterConfigured } from "./config/env";
import { requireAppSecret } from "./middleware/auth";
import { exportRouter } from "./routes/export";
import { ocrRouter } from "./routes/ocr";
import { translateRouter } from "./routes/translate";
import { convertRouter } from "./routes/convert";

/**
 * Vercel'de HTML/CSS/JS static (public/) olarak sunulur.
 * Bu Express app yalnizca /health, /config.js ve /api/* icin kullanilir.
 */
export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
    })
  );
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "8mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      openRouterConfigured: isOpenRouterConfigured(),
      vercel: Boolean(process.env.VERCEL),
    });
  });

  app.get("/config.js", (_req, res) => {
    const sharedSecret = env.APP_SHARED_SECRET.replace(/^\uFEFF/, "").trim();
    res.type("application/javascript");
    res.send(
      `window.APP_CONFIG=${JSON.stringify({
        sharedSecret,
        models: PAID_MODELS,
        defaultModel: DEFAULT_PAID_MODEL,
        maxImages: MAX_UPLOAD_IMAGES,
        maxPdfPages: MAX_PDF_PAGES,
        languages: SUPPORTED_LANGUAGES.map((l) => ({
          code: l.code,
          label: l.label,
          ocrHint: Boolean(l.ocrHint),
          rtl: Boolean(l.rtl),
        })),
      })};`
    );
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  app.use("/api", apiLimiter, requireAppSecret);
  app.use("/api/ocr", ocrRouter);
  app.use("/api/translate", translateRouter);
  app.use("/api/export", exportRouter);
  app.use("/api/convert", convertRouter);

  // Yerel: public/ dosyalarini Express sunar (Vercel'de static route kullanilir).
  if (!process.env.VERCEL) {
    const publicDir = path.join(process.cwd(), "public");
    app.use(express.static(publicDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    });
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Beklenmeyen hata:", err);
    res.status(500).json({ error: "Sunucu hatasi olustu." });
  });

  return app;
}
