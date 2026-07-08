import { Router } from "express";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { z } from "zod";

export const exportRouter = Router();

const exportRequestSchema = z.object({
  originalText: z.string().default(""),
  translatedText: z.string().default(""),
  sourceLang: z.string().optional(),
  targetLang: z.string().optional(),
  title: z.string().default("El Yazisi Cevirmen"),
});

function textToParagraphs(text: string): Paragraph[] {
  const lines = text.length > 0 ? text.split(/\r?\n/) : [""];
  return lines.map((line) => new Paragraph({ children: [new TextRun(line)] }));
}

exportRouter.post("/docx", async (req, res) => {
  const parsed = exportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { originalText, translatedText, sourceLang, targetLang, title } = parsed.data;

  try {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
            new Paragraph({
              text: `Orijinal Metin${sourceLang ? ` (${sourceLang})` : ""}`,
              heading: HeadingLevel.HEADING_1,
            }),
            ...textToParagraphs(originalText),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: `Ceviri${targetLang ? ` (${targetLang})` : ""}`,
              heading: HeadingLevel.HEADING_1,
            }),
            ...textToParagraphs(translatedText),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Base64 JSON olarak donuyoruz (binary response yerine); React Native
    // tarafinda btoa/Blob destegi tutarsiz oldugundan bu yaklasim daha
    // guvenilir ve dogrudan expo-file-system ile dosyaya yazilabilir.
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
