/** Yapılandırılmış OCR / çeviri belge modeli (satır + güven skoru). */

export interface OcrLine {
  id: string;
  text: string;
  /** 0–1 arası model güveni */
  confidence: number;
  /** Düşük güven veya [?] içeren satır */
  uncertain: boolean;
  /** Boş satır = paragraf ayracı */
  isBlank?: boolean;
}

export interface OcrParagraph {
  id: string;
  lineIds: string[];
  text: string;
  confidence: number;
}

export interface OcrDocument {
  languageHint?: string;
  averageConfidence: number;
  lines: OcrLine[];
  paragraphs: OcrParagraph[];
  /** Ham model çıktısı (debug) */
  rawModelText?: string;
  preprocessApplied?: boolean;
  fallbackUsed?: boolean;
}

export interface TranslateLine {
  id: string;
  sourceText: string;
  translatedText: string;
  uncertain: boolean;
}

export interface TranslateDocument {
  sourceLang: string;
  targetLang: string;
  averageConfidence?: number;
  lines: TranslateLine[];
  /** Düz metin (satır sonları korunmuş) */
  text: string;
}

export const LOW_CONFIDENCE_THRESHOLD = 0.55;
export const DOCUMENT_FALLBACK_THRESHOLD = 0.6;
