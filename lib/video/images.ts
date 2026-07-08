import { VideoGeneratorError } from "@/lib/video/errors";
import { requireOpenRouterApiKey } from "@/lib/env/openrouter";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
/** Reused from the script generator: reuses OPENROUTER_API_KEY, no extra provider needed. */
const DEFAULT_IMAGE_MODEL = "google/gemini-2.5-flash-image";

/**
 * Generates a single vertical (9:16) still image from an English visual
 * prompt via OpenRouter's unified Image API, returning a `data:image/...`
 * URI ready to hand straight to Runway's `promptImage` field.
 */
export async function generateSegmentImage(visualPrompt: string): Promise<string> {
  let apiKey: string;
  try {
    apiKey = requireOpenRouterApiKey("Shorts video gorselleri");
  } catch (error) {
    throw new VideoGeneratorError(
      error instanceof Error ? error.message : "OPENROUTER_API_KEY tanimli degil.",
      500
    );
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000",
        "X-Title": "Shorts AI Generator - Video",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
        modalities: ["image"],
        image_config: {
          aspect_ratio: "9:16",
        },
        messages: [
          {
            role: "user",
            content: `Vertical 9:16 cinematic still frame for a YouTube Short. ${visualPrompt} High detail, sharp focus, professional color grading, no text, no watermark, no captions.`,
          },
        ],
      }),
    });
  } catch {
    throw new VideoGeneratorError("OpenRouter görsel üretim isteği gönderilemedi.", 502);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new VideoGeneratorError(
      `Görsel üretimi başarısız oldu (${response.status}): ${errorBody.slice(0, 300)}`,
      502
    );
  }

  const payload = await response.json();
  const imageUrl: string | undefined = payload?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl || !imageUrl.startsWith("data:")) {
    // Surface *why* - e.g. a content-policy refusal, an OpenRouter error
    // object embedded in a 200 response, or a rate/spend-limit message -
    // instead of a generic message that hides the real cause.
    const refusalText: string | undefined = payload?.choices?.[0]?.message?.content;
    const embeddedError = payload?.error?.message;
    const debugDetail = embeddedError || refusalText || JSON.stringify(payload).slice(0, 400);
    throw new VideoGeneratorError(`Model bir görsel döndürmedi: ${debugDetail}`, 502);
  }

  return imageUrl;
}
