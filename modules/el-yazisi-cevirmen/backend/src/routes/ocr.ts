import { Router } from "express";
import { z } from "zod";
import { getModelLabel, getPaidModelChain, isAllowedPaidModel, resolvePaidModel } from "../config/paidModels";
import { buildImageContent, callOpenRouterChatChain } from "../services/openrouter";
import { cleanOcrResponse } from "../utils/ocrText";
import { friendlyOpenRouterError, isOpenRouterAuthError } from "../utils/openRouterErrors";

export const ocrRouter = Router();

const ocrRequestSchema = z.object({
  imageBase64: z.string().min(1, "imageBase64 zorunludur"),
  mimeType: z.string().default("image/jpeg"),
  sourceLangHint: z.string().optional(),
  model: z.string().optional(),
});

const OCR_SYSTEM_PROMPT = `Sen bir el yazisi tanima (HTR) uzmanisin. Tek gorevin: fotograftaki el yazisini
GORDUGUN GIBI, harfi harfi dijital metne cevirmek.

KESIN KURALLAR:
1. SADECE fotografta gordugun karakterleri yaz. Asla tahmin etme, uydurma, tamamlama veya ornek metin uretme.
2. Metni ozetleme, yeniden yazma veya duzeltme. Yazim hatalarini bile oldugu gibi koru.
3. Soldan saga, yukaridan asagiya oku. Satir sonlarini ve paragraf bosluklarini koru.
4. Okuyamadigin her harf veya kelime icin [?] kullan; bosluk birakma veya tahmin yapma.
5. Fotografta olmayan baslik, aciklama, yorum veya "transkripsiyon:" gibi ek metin EKLEME.
6. Cevabinda YALNIZCA transkribe edilmis metin olsun — baska hicbir sey yazma.`;

const LANG_HINTS: Record<string, string> = {
  tr: "Turkce",
  en: "Ingilizce",
  de: "Almanca",
  fr: "Fransizca",
  es: "Ispanyolca",
  ar: "Arapca",
};

function buildLangHint(sourceLangHint?: string): string {
  if (!sourceLangHint) {
    return "Kaynak dil belirtilmedi. Goruntuye bakarak dili tespit et. Turkce ise ğ, ş, ı, ü, ö, ç harflerine dikkat et.";
  }

  const label = LANG_HINTS[sourceLangHint] ?? sourceLangHint;
  return `Bu el yazisi ${label} dilindedir. Bu dile ozgu karakterleri ve imlalari dogru oku.`;
}

function buildUserMessage(langHintText: string, imageBase64: string, mimeType: string) {
  const instruction = `${langHintText}

Asagidaki fotograftaki el yazisini harfi harfi oku ve transkribe et.
Fotografta gormedigin hicbir kelimeyi yazma.`;

  return [
    { role: "system" as const, content: OCR_SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: [
        buildImageContent(imageBase64, mimeType, true),
        { type: "text" as const, text: instruction },
      ],
    },
  ];
}

async function runOcrChain(
  modelChain: string[],
  messages: ReturnType<typeof buildUserMessage>
): Promise<{ text: string; modelUsed: string }> {
  const result = await callOpenRouterChatChain({
    modelChain,
    temperature: 0,
    maxTokens: 8192,
    messages,
    context: "ocr",
  });

  const text = cleanOcrResponse(result.text);
  if (!text) {
    throw new Error("Model bos veya okunamayan bir yanit dondurdu.");
  }

  return { text, modelUsed: result.modelUsed };
}

ocrRouter.post("/", async (req, res) => {
  const parsed = ocrRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { imageBase64, mimeType, sourceLangHint, model: requestedModel } = parsed.data;

  if (requestedModel && !isAllowedPaidModel(requestedModel)) {
    res.status(400).json({ error: "Gecersiz model secimi." });
    return;
  }

  const selectedModel = resolvePaidModel(requestedModel);
  const langHintText = buildLangHint(sourceLangHint);
  const messages = buildUserMessage(langHintText, imageBase64, mimeType);

  try {
    // Secilen model once, basarisizsa digerleri tek tek denenir.
    const modelChain = getPaidModelChain(selectedModel);
    const result = await runOcrChain(modelChain, messages);

    res.json({
      text: result.text,
      modelUsed: result.modelUsed,
      modelLabel: getModelLabel(result.modelUsed),
      selectedModel,
    });
  } catch (error) {
    const lastError = error instanceof Error ? error : new Error("OCR islemi basarisiz oldu.");
    console.error(`OCR hatasi (${selectedModel}):`, lastError.message);

    if (isOpenRouterAuthError(lastError.message)) {
      res.status(401).json({ error: friendlyOpenRouterError(lastError.message, { context: "ocr" }) });
      return;
    }

    res.status(502).json({
      error: friendlyOpenRouterError(lastError.message, { context: "ocr" }),
    });
  }
});
