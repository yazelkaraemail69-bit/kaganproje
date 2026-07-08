export interface PaidModelOption {
  id: string;
  label: string;
  hint: string;
}

/** El yazisi OCR ve ceviri icin en iyi 5 ucretli model. */
export const PAID_MODELS: readonly PaidModelOption[] = [
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    hint: "Hizli ve dengeli — varsayilan oneri",
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    hint: "En yuksek gorsel dogruluk",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    hint: "Uzun ve karmasik metinler",
  },
  {
    id: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    hint: "Guvenilir yedek model",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    hint: "Ekonomik secenek",
  },
] as const;

export const DEFAULT_PAID_MODEL = PAID_MODELS[0].id;

const PAID_MODEL_IDS = new Set(PAID_MODELS.map((m) => m.id));

export function isAllowedPaidModel(model: string): boolean {
  return PAID_MODEL_IDS.has(model);
}

export function resolvePaidModel(requested?: string): string {
  if (requested && isAllowedPaidModel(requested)) return requested;
  return DEFAULT_PAID_MODEL;
}

/** Secilen model once denenir, sonra diger 4 ucretli modele gecilir. */
export function getPaidModelChain(preferredModel?: string): string[] {
  const primary = resolvePaidModel(preferredModel);
  const others = PAID_MODELS.map((m) => m.id).filter((id) => id !== primary);
  return [primary, ...others];
}

export function getModelLabel(modelId: string): string {
  return PAID_MODELS.find((m) => m.id === modelId)?.label ?? modelId;
}
