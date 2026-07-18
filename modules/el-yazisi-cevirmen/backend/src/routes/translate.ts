import { Router } from "express";
import { z } from "zod";
import { isAllowedPaidModel } from "../config/paidModels";
import { runTranslatePipeline } from "../pipeline/runTranslate";
import { translateTables } from "../pipeline/runTranslateTables";
import { translateSegments } from "../pipeline/runTranslateSegments";
import { friendlyOpenRouterError } from "../utils/openRouterErrors";
import type { OcrDocument } from "../types/ocrDocument";

export const translateRouter = Router();

const ocrLineSchema = z.object({
  id: z.string(),
  text: z.string(),
  confidence: z.number(),
  uncertain: z.boolean(),
  isBlank: z.boolean().optional(),
});

const ocrDocumentSchema = z
  .object({
    languageHint: z.string().optional(),
    averageConfidence: z.number(),
    lines: z.array(ocrLineSchema),
    paragraphs: z
      .array(
        z.object({
          id: z.string(),
          lineIds: z.array(z.string()),
          text: z.string(),
          confidence: z.number(),
        })
      )
      .optional(),
  })
  .optional();

const tableSchema = z.object({
  name: z.string(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const segmentSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  speaker: z.string().optional(),
  text: z.string(),
});

const translateRequestSchema = z.object({
  text: z.string().min(1, "text zorunludur"),
  sourceLang: z.string().min(1, "sourceLang zorunludur"),
  targetLang: z.string().min(1, "targetLang zorunludur"),
  model: z.string().optional(),
  document: ocrDocumentSchema,
  tables: z.array(tableSchema).optional(),
  segments: z.array(segmentSchema).optional(),
});

translateRouter.post("/", async (req, res) => {
  const parsed = translateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const {
    text,
    sourceLang,
    targetLang,
    model: requestedModel,
    document,
    tables,
    segments,
  } = parsed.data;

  if (requestedModel && !isAllowedPaidModel(requestedModel)) {
    res.status(400).json({ error: "Gecersiz model secimi." });
    return;
  }

  try {
    const result = await runTranslatePipeline({
      text,
      sourceLang,
      targetLang,
      model: requestedModel,
      document: document
        ? ({
            ...document,
            paragraphs: document.paragraphs ?? [],
          } as OcrDocument)
        : undefined,
    });

    let translatedTables = tables;
    let translatedSegments = segments;
    let tableModelLabel: string | undefined;
    let segmentModelLabel: string | undefined;

    if (tables?.length) {
      const tableResult = await translateTables({
        tables,
        sourceLang,
        targetLang,
        model: requestedModel,
      });
      translatedTables = tableResult.tables;
      tableModelLabel = tableResult.modelLabel;
    }

    if (segments?.length) {
      const segmentResult = await translateSegments({
        segments,
        sourceLang,
        targetLang,
        model: requestedModel,
      });
      translatedSegments = segmentResult.segments;
      segmentModelLabel = segmentResult.modelLabel;
    }

    res.json({
      translatedText: result.translatedText,
      document: result.document,
      translatedTables,
      translatedSegments,
      modelUsed: result.modelUsed,
      modelLabel: result.modelLabel,
      tableModelLabel,
      segmentModelLabel,
      selectedModel: result.selectedModel,
    });
  } catch (error) {
    console.error("Ceviri hatasi:", error);
    const raw = error instanceof Error ? error.message : "Ceviri islemi basarisiz oldu.";
    res.status(502).json({ error: friendlyOpenRouterError(raw, { context: "translate" }) });
  }
});
