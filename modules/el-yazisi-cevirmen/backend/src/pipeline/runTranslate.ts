import { getModelLabel, getPaidModelChain, resolvePaidModel } from "../config/paidModels";
import { languagePromptName } from "../config/languages";
import { callOpenRouterChatChain } from "../services/openrouter";
import {
  alignTranslatedLines,
  documentFromPlainText,
  textFromDocument,
  translateDocumentFromLines,
} from "../utils/ocrDocument";
import type { OcrDocument, TranslateDocument } from "../types/ocrDocument";

export function buildContextAwareTranslatePrompt(sourceLang: string, targetLang: string): string {
  const targetName = languagePromptName(targetLang);
  const sourceDescription =
    sourceLang === "auto"
      ? "otomatik tespit ettigin kaynak dilden"
      : `"${languagePromptName(sourceLang)}" dilinden`;

  return `Sen ana dili seviyesinde profesyonel bir cevirmensin. El yazisindan cikarilmis, resmi olmayan / konusma diline yakin metinleri ceviriyorsun.

Gorev: Metni ${sourceDescription} "${targetName}" diline cevir.

Baglamsal kurallar:
- Kelimesi kelimesine degil; cumlenin ruhuna, kulturel baglama ve dogal dil bilgisine uygun cevir.
- Yerel deyimler, argo, kisaltmalar (orn. "slm", "nbr", "tsk", "kib") hedef dilde esdeger dogal ifadelerle ver; aciklama ekleme.
- Resmi olmayan tonu koru; gereksiz resmiyete veya edebi abartiya cekme.
- Ciktiyi YALNIZCA ${targetName} dilinde yaz; kaynak dilde aciklama, dipnot veya "Ceviri:" etiketi ekleme.
- Orijinal metni tekrar etme; yan yana iki dil gosterme.
- Orijinal satir ve paragraf yapisini BIREBIR koru (ayni satir sayisi, bos satirlari koru).
- Metindeki [?] belirsiz kelimeleri baglamdan en olasi anlamla cevir; cevrilen kelimeyi de [?] ile isaretli birak.
- Hedef dil Arapca veya Farsca ise dogru yazim ve baglam kullan; Cince/Japonca/Korece ise uygun yazim sistemini koru.
- SADECE cevrilen metni dondur.`;
}

export interface RunTranslateInput {
  text: string;
  sourceLang: string;
  targetLang: string;
  model?: string;
  /** Varsa satır korumalı çeviri için kaynak belge */
  document?: OcrDocument;
}

export interface RunTranslateResult {
  translatedText: string;
  document: TranslateDocument;
  modelUsed: string;
  modelLabel: string;
  selectedModel: string;
}

export async function runTranslatePipeline(input: RunTranslateInput): Promise<RunTranslateResult> {
  const selectedModel = resolvePaidModel(input.model);
  const modelChain = getPaidModelChain(selectedModel);
  const sourceDoc =
    input.document ??
    documentFromPlainText(input.text, { languageHint: input.sourceLang });

  const sourceText = input.document ? textFromDocument(input.document) : input.text;

  const result = await callOpenRouterChatChain({
    modelChain,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content: buildContextAwareTranslatePrompt(input.sourceLang, input.targetLang),
      },
      {
        role: "user",
        content: `Asagidaki metni cevir. Satir sayisini ve bos satirlari koru.\n\n${sourceText}`,
      },
    ],
    context: "translate",
  });

  const aligned = alignTranslatedLines(sourceDoc.lines.length, result.text.trim());
  const document = translateDocumentFromLines(
    sourceDoc.lines,
    aligned,
    input.sourceLang,
    input.targetLang
  );

  return {
    translatedText: document.text,
    document,
    modelUsed: result.modelUsed,
    modelLabel: getModelLabel(result.modelUsed),
    selectedModel,
  };
}
