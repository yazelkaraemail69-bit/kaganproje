import { Router } from "express";
import { z } from "zod";
import { getModelLabel, getPaidModelChain, isAllowedPaidModel, resolvePaidModel } from "../config/paidModels";
import { callOpenRouterChatChain } from "../services/openrouter";
import { friendlyOpenRouterError } from "../utils/openRouterErrors";

export const translateRouter = Router();

const translateRequestSchema = z.object({
  text: z.string().min(1, "text zorunludur"),
  sourceLang: z.string().min(1, "sourceLang zorunludur"),
  targetLang: z.string().min(1, "targetLang zorunludur"),
  model: z.string().optional(),
});

function buildTranslatePrompt(sourceLang: string, targetLang: string) {
  const sourceDescription =
    sourceLang === "auto" ? "otomatik olarak tespit ettigin kaynak dilden" : `"${sourceLang}" dilinden`;

  return `Sen profesyonel bir cevirmensin. Sana verilen metni ${sourceDescription}
"${targetLang}" diline cevir.

Kurallar:
- Anlami koruyarak dogal ve akici bir ceviri yap.
- Orijinal paragraf ve satir yapisini mumkun oldugunca koru.
- Metindeki [?] isaretli belirsiz kelimeleri, baglamdan en olasi anlamla cevir ama
  cevrilen kelimeyi de [?] ile isaretli birak.
- SADECE cevrilen metni dondur; aciklama, not veya orijinal metni tekrar etme.`;
}

translateRouter.post("/", async (req, res) => {
  const parsed = translateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { text, sourceLang, targetLang, model: requestedModel } = parsed.data;

  if (requestedModel && !isAllowedPaidModel(requestedModel)) {
    res.status(400).json({ error: "Gecersiz model secimi." });
    return;
  }

  const selectedModel = resolvePaidModel(requestedModel);
  const modelChain = getPaidModelChain(selectedModel);

  try {
    const result = await callOpenRouterChatChain({
      modelChain,
      temperature: 0.3,
      messages: [
        { role: "system", content: buildTranslatePrompt(sourceLang, targetLang) },
        { role: "user", content: text },
      ],
      context: "translate",
    });

    res.json({
      translatedText: result.text,
      modelUsed: result.modelUsed,
      modelLabel: getModelLabel(result.modelUsed),
      selectedModel,
    });
  } catch (error) {
    console.error("Ceviri hatasi:", error);
    const raw = error instanceof Error ? error.message : "Ceviri islemi basarisiz oldu.";
    res.status(502).json({ error: friendlyOpenRouterError(raw, { context: "translate" }) });
  }
});
