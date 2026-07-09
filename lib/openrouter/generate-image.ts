import { requireOpenRouterApiKey } from "@/lib/env/openrouter";
import type { DesignImageType } from "@/lib/design-prompts";
import { aspectRatioForType, buildDesignImagePrompt, type DesignImageContext } from "@/lib/design-prompts";

const IMAGES_ENDPOINT = "https://openrouter.ai/api/v1/images";
const CHAT_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** FLUX Klein — hızlı ve uygun maliyetli; Seedream yedek. */
const PRIMARY_IMAGE_MODEL =
  process.env.OPENROUTER_DESIGN_IMAGE_MODEL || "black-forest-labs/flux.2-klein-4b";
const FALLBACK_IMAGE_MODEL = process.env.OPENROUTER_DESIGN_IMAGE_FALLBACK || "bytedance-seed/seedream-4.5";
const CHAT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image";

export class DesignImageError extends Error {
  constructor(
    message: string,
    public status = 502
  ) {
    super(message);
    this.name = "DesignImageError";
  }
}

function appHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "KaganProje Design Studio",
  };
}

async function remoteUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new DesignImageError("Görsel indirilemedi.", 502);
  const buffer = Buffer.from(await response.arrayBuffer());
  const mime = response.headers.get("content-type")?.split(";")[0] || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function normalizeImageOutput(raw: string): string {
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    throw new DesignImageError("REMOTE_URL");
  }
  return `data:image/png;base64,${raw}`;
}

async function parseImagesApiResponse(payload: unknown): Promise<string | null> {
  const data = payload as {
    data?: Array<{ url?: string; b64_json?: string }>;
    images?: Array<{ url?: string }>;
    error?: { message?: string };
  };

  if (data?.error?.message) {
    throw new DesignImageError(data.error.message, 502);
  }

  const entry = data?.data?.[0] ?? data?.images?.[0];
  if (!entry) return null;

  if (entry.url) {
    if (entry.url.startsWith("data:")) return entry.url;
    return remoteUrlToDataUrl(entry.url);
  }

  const b64 = (entry as { b64_json?: string }).b64_json;
  if (b64) return normalizeImageOutput(b64);

  return null;
}

async function generateViaImagesApi(
  apiKey: string,
  prompt: string,
  aspectRatio: string,
  model: string
): Promise<string | null> {
  const response = await fetch(IMAGES_ENDPOINT, {
    method: "POST",
    headers: appHeaders(apiKey),
    body: JSON.stringify({
      model,
      prompt,
      aspect_ratio: aspectRatio,
      resolution: "1K",
      output_format: "png",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DesignImageError(`Görsel API hatası (${response.status}): ${text.slice(0, 200)}`, 502);
  }

  const payload = await response.json();
  return parseImagesApiResponse(payload);
}

async function generateViaChatApi(apiKey: string, prompt: string, aspectRatio: string): Promise<string> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: appHeaders(apiKey),
    body: JSON.stringify({
      model: CHAT_IMAGE_MODEL,
      modalities: ["image"],
      image_config: { aspect_ratio: aspectRatio },
      messages: [
        {
          role: "user",
          content: `${prompt} Ultra sharp, professional commercial quality. No text, no watermark.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new DesignImageError(`Görsel üretimi başarısız (${response.status}): ${text.slice(0, 200)}`, 502);
  }

  const payload = await response.json();
  const imageUrl: string | undefined = payload?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) {
    const detail = payload?.error?.message || payload?.choices?.[0]?.message?.content || "Model yanıt vermedi.";
    throw new DesignImageError(String(detail).slice(0, 300), 502);
  }

  if (imageUrl.startsWith("data:")) return imageUrl;
  if (imageUrl.startsWith("http")) return remoteUrlToDataUrl(imageUrl);
  return normalizeImageOutput(imageUrl);
}

export async function generateDesignImage(params: {
  type: DesignImageType;
  context: DesignImageContext;
}): Promise<{ dataUrl: string; modelUsed: string }> {
  const apiKey = requireOpenRouterApiKey("AI görsel üretimi");
  const prompt = buildDesignImagePrompt(params.type, params.context);
  const aspectRatio = aspectRatioForType(params.type);

  for (const model of [PRIMARY_IMAGE_MODEL, FALLBACK_IMAGE_MODEL]) {
    try {
      const result = await generateViaImagesApi(apiKey, prompt, aspectRatio, model);
      if (result) return { dataUrl: result, modelUsed: model };
    } catch (error) {
      if (error instanceof DesignImageError && error.message === "REMOTE_URL") continue;
      console.warn(`Images API (${model}) failed:`, error);
    }
  }

  const chatResult = await generateViaChatApi(apiKey, prompt, aspectRatio);
  return { dataUrl: chatResult, modelUsed: CHAT_IMAGE_MODEL };
}
