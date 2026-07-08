import type { ShortsConfig, ShortsScript, ShortsSegment } from "@/lib/types";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
/** Keeps responses well within typical context/cost limits ("hata payı" guard). */
const MAX_OUTPUT_TOKENS = 1600;

export class ShortsGeneratorError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ShortsGeneratorError";
    this.status = status;
  }
}

/** Tone-specific writing guidance, mirrors the master prompt's tone rules. */
const TONE_GUIDANCE: Record<string, string> = {
  Eğitici:
    "Teknik terimleri sadeleştir, adım adım anlaşılır bir dille anlat, izleyiciye 'bunu ben de yapabilirim' hissi ver.",
  Kışkırtıcı:
    "Sektördeki yaygın tabuları, yanlış inanışları veya 'herkesin bildiği yalanları' cesurca sorgula; iddialı ama gerçeklere dayalı bir üslup kullan.",
  Komik:
    "Şaşırtıcı benzetmeler ve hafif abartılı bir mizah kullan; bilgi vermeyi eğlenceden ödün vermeden yap.",
  Minimalist: "Gereksiz süslemelerden kaçın, az sözle çok şey anlat, sade ve vurucu cümleler kur.",
  Teknik:
    "Doğru terminolojiyi kullan, veriye/mekanizmaya odaklan, uzman bir izleyiciye hitap eden derinlikte anlat.",
};

/**
 * Builds the "Master Shorts AI Generator" system prompt for the given
 * configuration. Kept as a pure function so it can be unit-tested and reused
 * from both the API route and any future background jobs.
 */
export function buildShortsSystemPrompt(config: ShortsConfig): string {
  const toneNote = TONE_GUIDANCE[config.tone] ?? "Seçilen tona sadık kal.";

  return `Sen, profesyonel bir video içerik stratejisti ve senaristsin. Görevin, "${config.niche}" nişinde, ${config.audience} hedef kitlesine yönelik, viral potansiyeli yüksek ve izleyiciyi elde tutan bir YouTube Shorts senaryosu üretmektir.

Konfigürasyon:
- Niş Konu: ${config.niche}
- Hedef Kitle: ${config.audience}
- Tonlama: ${config.tone} (${toneNote})
- Video Süresi Hedefi: ${config.duration}
- Dil: ${config.language}

Üretim Kuralları:
1. Kanca (Hook, 0-3sn): İzleyiciyi durduracak, merak uyandıran, çelişkili veya doğrudan fayda odaklı bir "pattern interrupt" cümlesi.
2. Gövde (Body, 4-40sn): Niş konuya dair TAM OLARAK 3 değerli ipucu/adım. Her adım kısa, vurucu ve harekete geçirici olmalı.
3. CTA (Kapanış, 40-60sn): İzleyiciyi yorum yapmaya, abone olmaya veya açıklamadaki linke tıklamaya yönlendiren net, samimi bir çağrı.
4. Hook, her body adımı ve CTA için ayrı ayrı şu üç alanı üret:
   - "voiceover": ${config.language} dilinde, tamamen doğal ve konuşma diliyle yazılmış, nefes payı bırakılmış seslendirme cümlesi/cümleleri.
   - "visualPrompt": Runway/Pika/Sora gibi AI video araçlarına doğrudan gönderilebilecek, sanatsal stil ve kamera açısını belirten DETAYLI İNGİLİZCE görsel/B-roll betimlemesi.
   - "textOverlay": Videonun üzerine yerleştirilecek, en fazla 5-6 kelimelik, ${config.language} dilinde çarpıcı bir metin.
5. "fullVoiceoverScript": Hook + 3 body adımı + CTA seslendirmelerinin, doğal geçişlerle birleştirilmiş TAM metni.
6. "textOverlays": Tüm segmentlerdeki metin üstü yazıların sırayla listelendiği bir dizi (tam olarak 5 öğe: hook, 3x body, cta).

Teknik Gereksinimler:
- SADECE geçerli bir JSON nesnesi döndür; JSON dışında hiçbir açıklama, markdown işareti veya kod bloğu ekleme.
- JSON şu şemaya birebir uymalı:
{
  "hook": { "voiceover": string, "visualPrompt": string, "textOverlay": string },
  "body": [ { "voiceover": string, "visualPrompt": string, "textOverlay": string }, ... (tam olarak 3 öğe) ],
  "cta": { "voiceover": string, "visualPrompt": string, "textOverlay": string },
  "fullVoiceoverScript": string,
  "textOverlays": string[]
}
- Görsel promptların ve içeriğin, "${config.niche}" nişinin etik değerlerine ve YouTube topluluk kurallarına tam uyumlu olmasına özen göster; yanıltıcı, tehlikeli veya taahhüt edilemeyecek (ör. "kesin zengin olursun") iddialardan kaçın.
- ${config.tone} tonuna sadık kal: ${toneNote}
- Cevapları her zaman max_tokens sınırını aşmayacak şekilde optimize et; gereksiz tekrar ve dolgu cümlelerinden kaçın.`;
}

function buildUserPrompt(config: ShortsConfig): string {
  return `Aşağıdaki JSON konfigürasyonuna göre bir YouTube Shorts senaryosu üret:\n${JSON.stringify(config, null, 2)}`;
}

/**
 * Calls OpenRouter with the master prompt and returns a validated
 * ShortsScript. Reads OPENROUTER_API_KEY (and optionally OPENROUTER_MODEL)
 * from the server environment - never expose these to the client.
 */
export async function generateShortsScript(config: ShortsConfig): Promise<ShortsScript> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ShortsGeneratorError(
      "OPENROUTER_API_KEY tanımlı değil. .env.local dosyanıza ekleyin (Vercel'de ise Environment Variables kısmına) ve sunucuyu yeniden başlatın.",
      500
    );
  }

  if (!config.niche.trim() || !config.audience.trim() || !config.tone.trim() || !config.duration.trim() || !config.language.trim()) {
    throw new ShortsGeneratorError("Niş, hedef kitle, ton, süre ve dil alanlarının tümü zorunludur.", 400);
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000",
        "X-Title": "Shorts AI Generator",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildShortsSystemPrompt(config) },
          { role: "user", content: buildUserPrompt(config) },
        ],
      }),
    });
  } catch {
    throw new ShortsGeneratorError("OpenRouter'a bağlanılamadı. İnternet bağlantınızı kontrol edin.", 502);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new ShortsGeneratorError(
      `OpenRouter isteği başarısız oldu (${response.status}): ${errorBody.slice(0, 300)}`,
      502
    );
  }

  const payload = await response.json();
  const rawContent: string | undefined = payload?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new ShortsGeneratorError("Model boş bir yanıt döndürdü.", 502);
  }

  return parseShortsScript(rawContent);
}

function parseShortsScript(rawContent: string): ShortsScript {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(rawContent));
  } catch {
    throw new ShortsGeneratorError("Model geçerli bir JSON döndürmedi.", 502);
  }

  if (!isValidShortsScript(parsed)) {
    throw new ShortsGeneratorError("Model yanıtı beklenen şemaya uymuyor.", 502);
  }

  return parsed;
}

/** Defensively strips any stray prose/markdown fences around the JSON body. */
function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return trimmed;
  return trimmed.slice(start, end + 1);
}

function isSegment(value: unknown): value is ShortsSegment {
  if (!value || typeof value !== "object") return false;
  const segment = value as Record<string, unknown>;
  return (
    typeof segment.voiceover === "string" &&
    typeof segment.visualPrompt === "string" &&
    typeof segment.textOverlay === "string"
  );
}

function isValidShortsScript(value: unknown): value is ShortsScript {
  if (!value || typeof value !== "object") return false;
  const script = value as Record<string, unknown>;
  return (
    isSegment(script.hook) &&
    Array.isArray(script.body) &&
    script.body.length > 0 &&
    script.body.every(isSegment) &&
    isSegment(script.cta) &&
    typeof script.fullVoiceoverScript === "string" &&
    Array.isArray(script.textOverlays) &&
    script.textOverlays.every((item) => typeof item === "string")
  );
}
