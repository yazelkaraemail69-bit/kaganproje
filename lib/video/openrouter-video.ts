import { VideoGeneratorError } from "@/lib/video/errors";

/**
 * OpenRouter's unified video generation API (`/api/v1/videos`). Reuses the
 * same OPENROUTER_API_KEY already required for script/image generation, so
 * it needs zero extra account setup - the trade-off is per-second pricing
 * that's noticeably higher than calling Alibaba's Wan directly (DashScope,
 * see lib/video/wan.ts). Default model is Kling v3 Standard (Kuaishou,
 * China): the cheapest OpenRouter video model with clear per-second pricing
 * that also supports vertical 9:16 output and flexible 3-15s durations.
 *
 * Docs: https://openrouter.ai/docs/guides/overview/multimodal/video-generation
 */
const OPENROUTER_VIDEOS_ENDPOINT = "https://openrouter.ai/api/v1/videos";
const DEFAULT_MODEL = "kwaivgi/kling-v3.0-std";

const POLL_INTERVAL_MS = 7000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function openrouterHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000",
    "X-Title": "Shorts AI Generator - Video",
  };
}

/** Default model (Kling v3 Std) accepts an integer duration between 3 and 15 seconds. */
export function clampOpenRouterVideoDuration(seconds: number): number {
  return Math.min(15, Math.max(3, Math.round(seconds)));
}

interface SubmitResponse {
  id: string;
  polling_url: string;
  status: string;
}

async function submitVideoJob(
  apiKey: string,
  imageDataUri: string,
  prompt: string,
  durationSeconds: number
): Promise<SubmitResponse> {
  let response: Response;
  try {
    response = await fetch(OPENROUTER_VIDEOS_ENDPOINT, {
      method: "POST",
      headers: openrouterHeaders(apiKey),
      body: JSON.stringify({
        model: process.env.OPENROUTER_VIDEO_MODEL || DEFAULT_MODEL,
        prompt: prompt.slice(0, 1500),
        duration: clampOpenRouterVideoDuration(durationSeconds),
        resolution: "720p",
        aspect_ratio: "9:16",
        generate_audio: false,
        frame_images: [
          {
            type: "image_url",
            image_url: { url: imageDataUri },
            frame_type: "first_frame",
          },
        ],
      }),
    });
  } catch {
    throw new VideoGeneratorError("OpenRouter video API'sine bağlanılamadı. İnternet bağlantınızı kontrol edin.", 502);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.id || !payload?.polling_url) {
    const message = payload?.error?.message || payload?.error || (await safeText(response));
    throw new VideoGeneratorError(`OpenRouter video görevi başlatılamadı (${response.status}): ${message}`, 502);
  }

  return payload as SubmitResponse;
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return "bilinmeyen hata";
  }
}

async function pollJobUntilDone(apiKey: string, pollingUrl: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    let response: Response;
    try {
      response = await fetch(pollingUrl, { headers: openrouterHeaders(apiKey) });
    } catch {
      continue; // transient network hiccup, keep polling until deadline
    }

    const job = await response.json().catch(() => null);
    const status = job?.status;

    if (status === "completed") {
      const videoUrl: string | undefined = job.unsigned_urls?.[0];
      if (!videoUrl) {
        throw new VideoGeneratorError("OpenRouter video görevi tamamlandı ama video adresi bulunamadı.", 502);
      }
      return videoUrl;
    }

    if (status === "failed" || status === "cancelled" || status === "expired") {
      throw new VideoGeneratorError(`OpenRouter video üretimi başarısız oldu: ${job?.error ?? "bilinmeyen hata"}`, 502);
    }
    // "pending" / "in_progress" -> keep polling
  }

  throw new VideoGeneratorError("OpenRouter video üretimi zaman aşımına uğradı.", 504);
}

async function downloadVideo(url: string, apiKey: string): Promise<Buffer> {
  // Despite the "unsigned_urls" naming, these still point at OpenRouter's own
  // /content endpoint and return 401 without the same Bearer token used to
  // submit/poll the job (confirmed empirically - the docs' auth-less example
  // does not work in practice).
  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  } catch {
    throw new VideoGeneratorError("Üretilen video klibi indirilemedi.", 502);
  }
  if (!response.ok) {
    throw new VideoGeneratorError(`Video klibi indirilemedi (${response.status}).`, 502);
  }
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Turns a still image + motion prompt into a short vertical video clip via
 * OpenRouter's video generation API (Kling v3 Standard by default). Submits
 * the async job, polls until it succeeds, and returns the downloaded mp4.
 */
export async function generateVideoClip(
  promptImageDataUri: string,
  promptText: string,
  targetDurationSeconds: number
): Promise<Buffer> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new VideoGeneratorError("OPENROUTER_API_KEY tanımlı değil.", 500);
  }

  const job = await submitVideoJob(apiKey, promptImageDataUri, promptText, targetDurationSeconds);
  const videoUrl = await pollJobUntilDone(apiKey, job.polling_url);
  return downloadVideo(videoUrl, apiKey);
}
