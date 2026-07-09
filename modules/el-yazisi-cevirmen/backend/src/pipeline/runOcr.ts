import { getModelLabel, getPaidModelChain, resolvePaidModel } from "../config/paidModels";
import { languagePromptName, OCR_LANGUAGE_HINT_CODES } from "../config/languages";
import { buildImageContent, callOpenRouterChatChain, type ChatMessage } from "../services/openrouter";
import { preprocessHandwritingImage, type PreprocessOptions } from "../services/imagePreprocess";
import {
  needsConfidenceFallback,
  parseOcrModelOutput,
  textFromDocument,
} from "../utils/ocrDocument";
import { cleanOcrResponse } from "../utils/ocrText";
import type { OcrDocument } from "../types/ocrDocument";

export const OCR_JSON_SYSTEM_PROMPT = `Sen bir el yazisi tanima (HTR) uzmanisin. Fotograftaki el yazisini satir satir oku.

KESIN KURALLAR:
1. SADECE fotografta gordugun karakterleri yaz. Asla uydurma, tahminle tamamlama veya ornek metin uretme.
2. Yazim hatalarini oldugu gibi koru; ozetleme veya yeniden yazma.
3. Soldan saga (LTR) veya dil gerektiriyorsa sagdan sola (RTL: Arapca/Farsca) oku. Bos satirlar paragraf ayraci olarak lines icinde "" (bos string) olsun.
4. Okuyamadigin her harf veya kelime icin [?] kullan; uncertain:true ve dusuk confidence ver.
5. Cevabini YALNIZCA gecerli JSON olarak ver. Markdown kod blogu, aciklama veya etiket YAZMA.
6. JSON semasi tam olarak su olmali:
{
  "languageHint": "tr",
  "averageConfidence": 0.82,
  "lines": [
    { "text": "birinci satir", "confidence": 0.91, "uncertain": false },
    { "text": "okunamayan [?]", "confidence": 0.35, "uncertain": true }
  ]
}
7. languageHint: ${OCR_LANGUAGE_HINT_CODES.join("|")}
8. confidence ve averageConfidence: 0.0 ile 1.0 arasi sayi
9. Cince/Japonca/Korece icin karakterleri oldugu gibi koru; Latin'e cevirme.
10. JSON disinda hicbir karakter yazma.`;

function buildLangHint(sourceLangHint?: string): string {
  if (!sourceLangHint) {
    return "Kaynak dil belirtilmedi. Goruntuye bakarak dili tespit et. Turkce ise ğ, ş, ı, ü, ö, ç; Arapca/Farsca ise baglantili harflere; Kiril/Yunanca/Gurcu/Ermeni yazimlarina; CJK karakterlerine dikkat et.";
  }
  const label = languagePromptName(sourceLangHint);
  return `Bu el yazisi ${label} dilindedir. Bu dile ozgu karakterleri, yazim yonunu ve imlalari dogru oku.`;
}

function buildMessages(langHintText: string, imageBase64: string, mimeType: string): ChatMessage[] {
  const instruction = `${langHintText}

Asagidaki fotograftaki el yazisini satir satir JSON olarak transkribe et.
Fotografta gormedigin hicbir kelimeyi yazma.
Yanitin tek bir JSON nesnesi olsun.`;

  return [
    { role: "system", content: OCR_JSON_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        buildImageContent(imageBase64, mimeType, true),
        { type: "text", text: instruction },
      ],
    },
  ];
}

export interface RunOcrInput {
  imageBase64: string;
  mimeType: string;
  sourceLangHint?: string;
  model?: string;
  preprocess?: boolean;
  enhanceContrast?: boolean;
  binarize?: boolean;
}

export interface RunOcrResult {
  text: string;
  document: OcrDocument;
  modelUsed: string;
  modelLabel: string;
  selectedModel: string;
  preprocessApplied: boolean;
  fallbackUsed: boolean;
}

async function callOcrOnce(
  modelChain: string[],
  imageBase64: string,
  mimeType: string,
  langHint: string,
  languageHintCode?: string
): Promise<{ document: OcrDocument; modelUsed: string }> {
  const messages = buildMessages(langHint, imageBase64, mimeType);
  const result = await callOpenRouterChatChain({
    modelChain,
    temperature: 0,
    maxTokens: 8192,
    messages,
    context: "ocr",
  });

  const cleaned = cleanOcrResponse(result.text);
  if (!cleaned) {
    throw new Error("Model bos veya okunamayan bir yanit dondurdu.");
  }

  const document = parseOcrModelOutput(cleaned, { languageHint: languageHintCode });
  return { document, modelUsed: result.modelUsed };
}

export async function runOcrPipeline(input: RunOcrInput): Promise<RunOcrResult> {
  const selectedModel = resolvePaidModel(input.model);
  const modelChain = getPaidModelChain(selectedModel);
  const langHintText = buildLangHint(input.sourceLangHint);

  const preprocessOpts: PreprocessOptions = {
    normalize: input.preprocess !== false,
    enhanceContrast: Boolean(input.enhanceContrast) || input.preprocess !== false,
    binarize: Boolean(input.binarize),
    denoise: input.preprocess !== false,
  };

  const prepared = await preprocessHandwritingImage(
    input.imageBase64,
    input.mimeType || "image/jpeg",
    preprocessOpts
  );

  let { document, modelUsed } = await callOcrOnce(
    modelChain,
    prepared.base64,
    prepared.mimeType,
    langHintText,
    input.sourceLangHint
  );
  let fallbackUsed = false;

  // Dusuk guven: binarize + kalan modellerle ikinci gecis
  if (needsConfidenceFallback(document) && modelChain.length > 1) {
    const altPrep = await preprocessHandwritingImage(
      input.imageBase64,
      input.mimeType || "image/jpeg",
      { normalize: true, enhanceContrast: true, binarize: true, denoise: true }
    );
    try {
      const second = await callOcrOnce(
        modelChain.slice(1),
        altPrep.base64,
        altPrep.mimeType,
        langHintText,
        input.sourceLangHint
      );
      if (second.document.averageConfidence > document.averageConfidence) {
        document = second.document;
        modelUsed = second.modelUsed;
        fallbackUsed = true;
        document.preprocessApplied = true;
      }
    } catch {
      // ilk sonucu koru
    }
  }

  document.preprocessApplied = prepared.applied || document.preprocessApplied;
  document.fallbackUsed = fallbackUsed;

  return {
    text: textFromDocument(document),
    document,
    modelUsed,
    modelLabel: getModelLabel(modelUsed),
    selectedModel,
    preprocessApplied: Boolean(document.preprocessApplied),
    fallbackUsed,
  };
}
