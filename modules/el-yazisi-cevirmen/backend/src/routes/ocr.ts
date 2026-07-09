import { Router } from "express";
import { z } from "zod";
import { isAllowedPaidModel } from "../config/paidModels";
import { runOcrPipeline } from "../pipeline/runOcr";
import { friendlyOpenRouterError, isOpenRouterAuthError } from "../utils/openRouterErrors";

export const ocrRouter = Router();

const ocrRequestSchema = z.object({
  imageBase64: z.string().min(1, "imageBase64 zorunludur"),
  mimeType: z.string().default("image/jpeg"),
  sourceLangHint: z.string().optional(),
  model: z.string().optional(),
  /** Varsayilan true — sharp normalize + kontrast */
  preprocess: z.boolean().optional(),
  enhanceContrast: z.boolean().optional(),
  binarize: z.boolean().optional(),
});

/**
 * POST /api/ocr
 * Geriye uyumlu: { text }
 * Yapilandirilmis: { text, document: OcrDocument, ... }
 */
ocrRouter.post("/", async (req, res) => {
  const parsed = ocrRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const {
    imageBase64,
    mimeType,
    sourceLangHint,
    model: requestedModel,
    preprocess,
    enhanceContrast,
    binarize,
  } = parsed.data;

  if (requestedModel && !isAllowedPaidModel(requestedModel)) {
    res.status(400).json({ error: "Gecersiz model secimi." });
    return;
  }

  try {
    const result = await runOcrPipeline({
      imageBase64,
      mimeType,
      sourceLangHint,
      model: requestedModel,
      preprocess,
      enhanceContrast,
      binarize,
    });

    res.json({
      // Geriye uyumluluk: duz string
      text: result.text,
      // Adim 2: satir + guven skoru belgesi
      document: {
        languageHint: result.document.languageHint,
        averageConfidence: result.document.averageConfidence,
        lines: result.document.lines,
        paragraphs: result.document.paragraphs,
        preprocessApplied: result.document.preprocessApplied,
        fallbackUsed: result.document.fallbackUsed,
      },
      modelUsed: result.modelUsed,
      modelLabel: result.modelLabel,
      selectedModel: result.selectedModel,
      preprocessApplied: result.preprocessApplied,
      fallbackUsed: result.fallbackUsed,
    });
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error("OCR islemi basarisiz oldu.");
    console.error(`OCR hatasi:`, lastError.message);

    if (isOpenRouterAuthError(lastError.message)) {
      res.status(401).json({ error: friendlyOpenRouterError(lastError.message, { context: "ocr" }) });
      return;
    }

    res.status(502).json({
      error: friendlyOpenRouterError(lastError.message, { context: "ocr" }),
    });
  }
});
