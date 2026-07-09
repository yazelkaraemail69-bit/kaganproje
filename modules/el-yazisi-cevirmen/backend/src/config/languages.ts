/** Desteklenen OCR / ceviri dilleri — Turkiye komsulari + CJK + yaygin diller. */

export interface LanguageOption {
  code: string;
  /** UI etiketi (ASCII-safe Turkce yazim) */
  label: string;
  /** Model promptlarinda kullanilan tam ad */
  promptName: string;
  /** Kaynak dil ipucu seciminde goster */
  ocrHint?: boolean;
  /** RTL metin (Arapca, Farsca) */
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: "tr", label: "Turkce", promptName: "Turkce", ocrHint: true },
  { code: "en", label: "Ingilizce", promptName: "Ingilizce", ocrHint: true },
  { code: "ar", label: "Arapca", promptName: "Arapca", ocrHint: true, rtl: true },
  { code: "fa", label: "Farsca (Persce)", promptName: "Farsca (Persce)", ocrHint: true, rtl: true },
  { code: "ru", label: "Rusca", promptName: "Rusca", ocrHint: true },
  { code: "az", label: "Azerbaycan Turkcesi", promptName: "Azerbaycan Turkcesi", ocrHint: true },
  { code: "el", label: "Yunanca", promptName: "Yunanca", ocrHint: true },
  { code: "bg", label: "Bulgarca", promptName: "Bulgarca", ocrHint: true },
  { code: "ka", label: "Gurcuce", promptName: "Gurcuce", ocrHint: true },
  { code: "hy", label: "Ermenice", promptName: "Ermenice", ocrHint: true },
  { code: "uk", label: "Ukraynaca", promptName: "Ukraynaca", ocrHint: true },
  { code: "ro", label: "Romence", promptName: "Romence", ocrHint: true },
  { code: "ku", label: "Kurtce", promptName: "Kurtce", ocrHint: true },
  { code: "de", label: "Almanca", promptName: "Almanca", ocrHint: true },
  { code: "fr", label: "Fransizca", promptName: "Fransizca", ocrHint: true },
  { code: "es", label: "Ispanyolca", promptName: "Ispanyolca", ocrHint: true },
  { code: "it", label: "Italyanca", promptName: "Italyanca", ocrHint: true },
  { code: "zh", label: "Cince", promptName: "Cince (Basitlestirilmis)", ocrHint: true },
  { code: "ja", label: "Japonca", promptName: "Japonca", ocrHint: true },
  { code: "ko", label: "Korece", promptName: "Korece", ocrHint: true },
] as const;

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

export function getLanguageOption(code: string): LanguageOption | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}

export function languagePromptName(code: string): string {
  return getLanguageOption(code)?.promptName ?? code;
}

export function languageLabel(code: string): string {
  if (code === "auto") return "Otomatik Algila";
  return getLanguageOption(code)?.label ?? code;
}

/** OCR languageHint alaninda kabul edilen kodlar */
export const OCR_LANGUAGE_HINT_CODES = [
  ...SUPPORTED_LANGUAGES.map((l) => l.code),
  "unknown",
] as const;

/** El yazisi is akisinda tek seferde yuklenebilecek max fotograf */
export const MAX_HANDWRITING_IMAGES = 25;

/** PDF ceviri akisinda islenebilecek max sayfa */
export const MAX_PDF_PAGES = 100;
