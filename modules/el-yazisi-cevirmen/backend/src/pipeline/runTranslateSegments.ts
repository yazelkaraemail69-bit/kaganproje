import { getModelLabel, getPaidModelChain, resolvePaidModel } from "../config/paidModels";
import { languagePromptName } from "../config/languages";
import { callOpenRouterChatChain } from "../services/openrouter";
import type { TranscriptSegment } from "../types/documentConvert";

function buildSegmentTranslatePrompt(sourceLang: string, targetLang: string): string {
  const targetName = languagePromptName(targetLang);
  const sourceName =
    sourceLang === "auto" ? "kaynak dil" : languagePromptName(sourceLang);
  return `Asagidaki altyazi/transkript segmentlerini ${sourceName} dilinden ${targetName} diline cevir.
Zaman damgalari ve konusmaci adlarini DEGISTIRME; yalnizca "text" alanlarini cevir.
Cevabi YALNIZCA JSON olarak ver: {"segments":[{"start":"...","end":"...","speaker":"...","text":"..."}]}`;
}

function parseTranslatedSegments(raw: string, fallback: TranscriptSegment[]): TranscriptSegment[] {
  const jsonMatch = raw.trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { segments?: TranscriptSegment[] };
    if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) return fallback;
    return parsed.segments.map((seg, i) => ({
      start: seg.start ?? fallback[i]?.start,
      end: seg.end ?? fallback[i]?.end,
      speaker: seg.speaker ?? fallback[i]?.speaker,
      text: String(seg.text ?? fallback[i]?.text ?? ""),
    }));
  } catch {
    return fallback;
  }
}

export async function translateSegments(input: {
  segments: TranscriptSegment[];
  sourceLang: string;
  targetLang: string;
  model?: string;
}): Promise<{ segments: TranscriptSegment[]; modelUsed: string; modelLabel: string }> {
  const selectedModel = resolvePaidModel(input.model);
  const modelChain = getPaidModelChain(selectedModel);
  const payload = JSON.stringify({ segments: input.segments });

  const result = await callOpenRouterChatChain({
    modelChain,
    temperature: 0.2,
    messages: [
      { role: "system", content: buildSegmentTranslatePrompt(input.sourceLang, input.targetLang) },
      { role: "user", content: payload },
    ],
    context: "translate",
    maxTokens: 8192,
  });

  return {
    segments: parseTranslatedSegments(result.text, input.segments),
    modelUsed: result.modelUsed,
    modelLabel: getModelLabel(result.modelUsed),
  };
}
