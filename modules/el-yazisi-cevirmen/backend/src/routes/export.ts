import { Router } from "express";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { z } from "zod";

export const exportRouter = Router();

const lineSchema = z.object({
  text: z.string(),
  translatedText: z.string().optional(),
});

const exportRequestSchema = z.object({
  originalText: z.string().default(""),
  translatedText: z.string().default(""),
  sourceLang: z.string().optional(),
  targetLang: z.string().optional(),
  title: z.string().default("El Yazisi Cevirmen"),
  /** Satır bazlı düzen koruması (opsiyonel) */
  lines: z.array(lineSchema).optional(),
});

function textToParagraphs(text: string): Paragraph[] {
  const lines = text.length > 0 ? text.split(/\r?\n/) : [""];
  return lines.map((line) => {
    if (line.length === 0) {
      return new Paragraph({ children: [] });
    }
    return new Paragraph({ children: [new TextRun(line)] });
  });
}

function structuredToParagraphs(
  lines: Array<{ text: string; translatedText?: string }>,
  field: "text" | "translatedText"
): Paragraph[] {
  return lines.map((line) => {
    const value = field === "text" ? line.text : (line.translatedText ?? "");
    if (!value) return new Paragraph({ children: [] });
    return new Paragraph({ children: [new TextRun(value)] });
  });
}

exportRouter.post("/docx", async (req, res) => {
  const parsed = exportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { originalText, translatedText, sourceLang, targetLang, title, lines } = parsed.data;
  const hasOriginal = originalText.trim().length > 0 || Boolean(lines?.some((l) => l.text.trim()));
  const hasTranslated =
    translatedText.trim().length > 0 || Boolean(lines?.some((l) => l.translatedText?.trim()));

  try {
    const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE })];

    if (hasOriginal) {
      children.push(
        new Paragraph({
          text: `Orijinal Metin${sourceLang ? ` (${sourceLang})` : ""}`,
          heading: HeadingLevel.HEADING_1,
        }),
        ...(lines?.length ? structuredToParagraphs(lines, "text") : textToParagraphs(originalText)),
        new Paragraph({ text: "" })
      );
    }

    if (hasTranslated) {
      children.push(
        new Paragraph({
          text: `Ceviri${targetLang ? ` (${targetLang})` : ""}`,
          heading: HeadingLevel.HEADING_1,
        }),
        ...(lines?.some((l) => l.translatedText !== undefined)
          ? structuredToParagraphs(lines!, "translatedText")
          : textToParagraphs(translatedText))
      );
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.json({
      filename: "el-yazisi-cevirisi.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      base64: buffer.toString("base64"),
    });
  } catch (error) {
    console.error("DOCX olusturma hatasi:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "DOCX olusturulamadi." });
  }
});

/** Düz metin export — satır sonları korunur */
exportRouter.post("/txt", (req, res) => {
  const parsed = exportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { originalText, translatedText, title, lines } = parsed.data;
  const parts: string[] = [`# ${title}`, ""];

  if (lines?.length) {
    parts.push("## Orijinal");
    parts.push(lines.map((l) => l.text).join("\n"));
    if (lines.some((l) => l.translatedText !== undefined)) {
      parts.push("", "## Ceviri");
      parts.push(lines.map((l) => l.translatedText ?? "").join("\n"));
    }
  } else {
    if (originalText.trim()) {
      parts.push("## Orijinal", originalText);
    }
    if (translatedText.trim()) {
      parts.push("", "## Ceviri", translatedText);
    }
  }

  const body = parts.join("\n");
  res.json({
    filename: "el-yazisi-cevirisi.txt",
    mimeType: "text/plain;charset=utf-8",
    base64: Buffer.from(body, "utf-8").toString("base64"),
  });
});
