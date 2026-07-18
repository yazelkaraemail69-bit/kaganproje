import { getModelLabel, getPaidModelChain, resolvePaidModel } from "../config/paidModels";
import { languagePromptName } from "../config/languages";
import { callOpenRouterChatChain } from "../services/openrouter";
import type { TableData } from "../types/documentConvert";

function buildTableTranslatePrompt(sourceLang: string, targetLang: string): string {
  const targetName = languagePromptName(targetLang);
  const sourceName =
    sourceLang === "auto" ? "kaynak dil" : languagePromptName(sourceLang);
  return `Sen profesyonel bir cevirmensin. Verilen tablo verisini ${sourceName} dilinden ${targetName} diline cevir.

KURALLAR:
1. JSON yapisini BIREBIR koru: ayni sheet sayisi, ayni sutun sayisi, ayni satir sayisi.
2. Yalnizca insan dilindeki hucre metinlerini cevir; sayilar, tarihler, kodlar, URL'ler, formuller ayni kalsin.
3. Baslik satirlarini (headers) da cevir.
4. Cevabini YALNIZCA gecerli JSON olarak ver; markdown veya aciklama ekleme.
5. JSON semasi: {"tables":[{"name":"...","headers":["..."],"rows":[["..."]]}]}`;
}

function parseTranslatedTables(raw: string, fallback: TableData[]): TableData[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { tables?: TableData[] };
    if (!Array.isArray(parsed.tables) || parsed.tables.length === 0) return fallback;
    return parsed.tables.map((t, i) => ({
      name: String(t.name ?? fallback[i]?.name ?? `Sheet${i + 1}`),
      headers: Array.isArray(t.headers) ? t.headers.map(String) : (fallback[i]?.headers ?? []),
      rows: Array.isArray(t.rows)
        ? t.rows.map((row) => (Array.isArray(row) ? row.map(String) : []))
        : (fallback[i]?.rows ?? []),
    }));
  } catch {
    return fallback;
  }
}

export async function translateTables(input: {
  tables: TableData[];
  sourceLang: string;
  targetLang: string;
  model?: string;
}): Promise<{ tables: TableData[]; modelUsed: string; modelLabel: string }> {
  const selectedModel = resolvePaidModel(input.model);
  const modelChain = getPaidModelChain(selectedModel);
  const payload = JSON.stringify({ tables: input.tables });

  const result = await callOpenRouterChatChain({
    modelChain,
    temperature: 0.2,
    messages: [
      { role: "system", content: buildTableTranslatePrompt(input.sourceLang, input.targetLang) },
      { role: "user", content: payload },
    ],
    context: "translate",
    maxTokens: 8192,
  });

  return {
    tables: parseTranslatedTables(result.text, input.tables),
    modelUsed: result.modelUsed,
    modelLabel: getModelLabel(result.modelUsed),
  };
}
