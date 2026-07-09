import {
  DOCUMENT_FALLBACK_THRESHOLD,
  LOW_CONFIDENCE_THRESHOLD,
  type OcrDocument,
  type OcrLine,
  type OcrParagraph,
  type TranslateDocument,
  type TranslateLine,
} from "../types/ocrDocument";

const UNCERTAIN_TOKEN = /\[\?\]|\?\?\?|�/;

function clampConfidence(value: unknown, fallback = 0.75): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n > 1 && n <= 100) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

function lineId(index: number): string {
  return `L${index + 1}`;
}

export function isUncertainText(text: string): boolean {
  return UNCERTAIN_TOKEN.test(text);
}

export function averageConfidence(lines: OcrLine[]): number {
  const scored = lines.filter((l) => !l.isBlank && l.text.trim());
  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, l) => acc + l.confidence, 0);
  return Math.round((sum / scored.length) * 1000) / 1000;
}

export function textFromDocument(doc: OcrDocument): string {
  return doc.lines.map((l) => l.text).join("\n");
}

export function buildParagraphs(lines: OcrLine[]): OcrParagraph[] {
  const paragraphs: OcrParagraph[] = [];
  let bucket: OcrLine[] = [];
  let paraIndex = 0;

  const flush = () => {
    if (bucket.length === 0) return;
    const text = bucket.map((l) => l.text).join("\n");
    const confidence = averageConfidence(bucket);
    paragraphs.push({
      id: `P${++paraIndex}`,
      lineIds: bucket.map((l) => l.id),
      text,
      confidence,
    });
    bucket = [];
  };

  for (const line of lines) {
    if (line.isBlank || !line.text.trim()) {
      flush();
      continue;
    }
    bucket.push(line);
  }
  flush();
  return paragraphs;
}

/** Düz metinden satır bazlı belge üret (JSON yoksa geriye uyumluluk). */
export function documentFromPlainText(
  text: string,
  options?: { languageHint?: string; defaultConfidence?: number }
): OcrDocument {
  const defaultConfidence = options?.defaultConfidence ?? 0.75;
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines: OcrLine[] = rawLines.map((raw, index) => {
    const trimmedEmpty = raw.length === 0;
    const uncertain = isUncertainText(raw);
    const confidence = uncertain
      ? Math.min(defaultConfidence, LOW_CONFIDENCE_THRESHOLD - 0.05)
      : defaultConfidence;
    return {
      id: lineId(index),
      text: raw,
      confidence: clampConfidence(confidence),
      uncertain,
      isBlank: trimmedEmpty,
    };
  });

  return {
    languageHint: options?.languageHint,
    averageConfidence: averageConfidence(lines),
    lines,
    paragraphs: buildParagraphs(lines),
    rawModelText: text,
  };
}

interface RawLineJson {
  text?: unknown;
  confidence?: unknown;
  uncertain?: unknown;
}

interface RawDocumentJson {
  languageHint?: unknown;
  averageConfidence?: unknown;
  lines?: unknown;
  paragraphs?: unknown;
}

function parseLinesArray(raw: unknown): OcrLine[] | null {
  if (!Array.isArray(raw)) return null;
  const lines: OcrLine[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as RawLineJson | string;
    if (typeof item === "string") {
      const uncertain = isUncertainText(item);
      lines.push({
        id: lineId(i),
        text: item,
        confidence: uncertain ? 0.4 : 0.8,
        uncertain,
        isBlank: item.length === 0,
      });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const text = typeof item.text === "string" ? item.text : "";
    const uncertain =
      typeof item.uncertain === "boolean" ? item.uncertain : isUncertainText(text);
    const confidence = clampConfidence(
      item.confidence,
      uncertain ? 0.4 : 0.8
    );
    lines.push({
      id: lineId(i),
      text,
      confidence,
      uncertain: uncertain || confidence < LOW_CONFIDENCE_THRESHOLD,
      isBlank: text.length === 0,
    });
  }
  return lines;
}

/** Model JSON veya düz metni OcrDocument'e çevir. */
export function parseOcrModelOutput(
  raw: string,
  options?: { languageHint?: string }
): OcrDocument {
  const cleaned = raw.trim();
  if (!cleaned) {
    return documentFromPlainText("", options);
  }

  // Markdown fence temizliği
  let candidate = cleaned;
  const fenced = candidate.match(/^```(?:json|JSON)?\s*\n?([\s\S]*?)\n?```$/);
  if (fenced) candidate = fenced[1].trim();

  // JSON nesnesi dene
  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as RawDocumentJson;
      const lines = parseLinesArray(parsed.lines);
      if (lines && lines.length > 0) {
        const avg =
          typeof parsed.averageConfidence === "number"
            ? clampConfidence(parsed.averageConfidence)
            : averageConfidence(lines);
        return {
          languageHint:
            (typeof parsed.languageHint === "string" && parsed.languageHint) ||
            options?.languageHint,
          averageConfidence: avg,
          lines,
          paragraphs: buildParagraphs(lines),
          rawModelText: cleaned,
        };
      }
    } catch {
      // düz metne düş
    }
  }

  return documentFromPlainText(cleaned, options);
}

export function needsConfidenceFallback(doc: OcrDocument): boolean {
  if (doc.lines.every((l) => l.isBlank || !l.text.trim())) return true;
  return doc.averageConfidence < DOCUMENT_FALLBACK_THRESHOLD;
}

export function translateDocumentFromLines(
  sourceLines: OcrLine[],
  translatedLines: string[],
  sourceLang: string,
  targetLang: string
): TranslateDocument {
  const lines: TranslateLine[] = sourceLines.map((src, i) => {
    const translatedText =
      translatedLines[i] !== undefined ? translatedLines[i] : src.text;
    return {
      id: src.id,
      sourceText: src.text,
      translatedText,
      uncertain: src.uncertain,
    };
  });

  return {
    sourceLang,
    targetLang,
    averageConfidence: averageConfidence(sourceLines),
    lines,
    text: lines.map((l) => l.translatedText).join("\n"),
  };
}

/** Çeviri düz metnini kaynak satır sayısına hizala. */
export function alignTranslatedLines(
  sourceLineCount: number,
  translatedText: string
): string[] {
  const parts = translatedText.replace(/\r\n/g, "\n").split("\n");
  if (parts.length === sourceLineCount) return parts;
  if (parts.length > sourceLineCount) {
    const head = parts.slice(0, sourceLineCount - 1);
    const tail = parts.slice(sourceLineCount - 1).join("\n");
    return [...head, tail];
  }
  while (parts.length < sourceLineCount) parts.push("");
  return parts;
}
