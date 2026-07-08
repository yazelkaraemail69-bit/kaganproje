import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { PAID_MODELS, DEFAULT_PAID_MODEL } from "./config/paidModels";
import { corsOrigins, env, isOpenRouterConfigured, logStartupWarnings } from "./config/env";
import { requireAppSecret } from "./middleware/auth";
import { exportRouter } from "./routes/export";
import { ocrRouter } from "./routes/ocr";
import { translateRouter } from "./routes/translate";

const app = express();
const publicDir = path.join(__dirname, "../public");

app.use(
  helmet({
    contentSecurityPolicy: false,
    // KaganProje (localhost:3000) icinden iframe ile gomulebilmesi icin
    frameguard: false,
  })
);
app.use(cors({ origin: corsOrigins }));
// Base64 goruntuler icin JSON govde limiti yukseltildi.
app.use(express.json({ limit: "15mb" }));

// Health check - auth gerektirmez, deploy/monitoring ve kurulum kontrolu icin kullanilir.
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    openRouterConfigured: isOpenRouterConfigured(),
  });
});

// Web arayuzu icin paylasilan sır (sadece ayni origin'den yuklenir).
app.get("/config.js", (_req, res) => {
  res.type("application/javascript");
  res.send(
    `window.APP_CONFIG=${JSON.stringify({
      sharedSecret: env.APP_SHARED_SECRET,
      models: PAID_MODELS,
      defaultModel: DEFAULT_PAID_MODEL,
    })};`
  );
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter, requireAppSecret);
app.use("/api/ocr", ocrRouter);
app.use("/api/translate", translateRouter);
app.use("/api/export", exportRouter);

app.use(express.static(publicDir));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Beklenmeyen hata:", err);
  res.status(500).json({ error: "Sunucu hatasi olustu." });
});

app.listen(env.PORT, () => {
  console.log(`El Yazisi Cevirmen backend ${env.PORT} portunda calisiyor.`);
  console.log(`Web arayuzu: http://localhost:${env.PORT}`);
  logStartupWarnings();
});