import { Router } from "express";
import { z } from "zod";
import { extractDocument } from "../services/documentExtract";
import {
  buildCsvBase64,
  buildDocxBase64,
  buildHtmlBase64,
  buildMarkdownBase64,
  buildPdfBase64,
  buildSrtBase64,
  buildVttBase64,
  buildXlsxBase64,
} from "../services/documentExport";

export const convertRouter = Router();

const extractSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  base64: z.string().min(1),
});

convertRouter.post("/extract", async (req, res) => {
  const parsed = extractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const doc = await extractDocument(parsed.data);
    res.json(doc);
  } catch (error) {
    console.error("Extract hatasi:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Dosya okunamadi.",
    });
  }
});

const exportSchema = z.object({
  format: z.enum(["docx", "xlsx", "csv", "md", "html", "srt", "vtt", "txt", "pdf"]),
  title: z.string().default("Ceviri"),
  originalText: z.string().optional(),
  translatedText: z.string().optional(),
  sourceLang: z.string().optional(),
  targetLang: z.string().optional(),
  tables: z
    .array(
      z.object({
        name: z.string(),
        headers: z.array(z.string()),
        rows: z.array(z.array(z.string())),
      })
    )
    .optional(),
  segments: z
    .array(
      z.object({
        start: z.string().optional(),
        end: z.string().optional(),
        speaker: z.string().optional(),
        text: z.string(),
      })
    )
    .optional(),
});

convertRouter.post("/export", async (req, res) => {
  const parsed = exportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;
  try {
    let result: { filename: string; mimeType: string; base64: string };

    switch (data.format) {
      case "docx":
        result = await buildDocxBase64(data);
        break;
      case "xlsx":
        result = buildXlsxBase64(data);
        break;
      case "csv":
        result = buildCsvBase64(data);
        break;
      case "md":
        result = buildMarkdownBase64(data);
        break;
      case "html":
        result = buildHtmlBase64(data);
        break;
      case "srt":
        result = buildSrtBase64(data);
        break;
      case "vtt":
        result = buildVttBase64(data);
        break;
      case "txt": {
        const parts = [`# ${data.title}`, ""];
        if (data.originalText?.trim()) parts.push("## Orijinal", data.originalText, "");
        if (data.translatedText?.trim()) parts.push("## Ceviri", data.translatedText, "");
        const body = parts.join("\n");
        result = {
          filename: "ceviri.txt",
          mimeType: "text/plain;charset=utf-8",
          base64: Buffer.from(body, "utf-8").toString("base64"),
        };
        break;
      }
      case "pdf":
        result = buildPdfBase64(data);
        break;
      default:
        res.status(400).json({ error: "Desteklenmeyen format." });
        return;
    }

    res.json(result);
  } catch (error) {
    console.error("Convert export hatasi:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Disa aktarma basarisiz.",
    });
  }
});
