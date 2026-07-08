import { VideoGeneratorError } from "@/lib/video/errors";

/**
 * Alibaba Cloud Model Studio (DashScope) - Wan 2.6 Flash image-to-video.
 * A much cheaper alternative to Runway (~$0.025/sec at 720p vs ~$0.05/sec),
 * from the same "Wan" family the master prompt already targets alongside
 * Runway/Pika/Sora. Async task API, same submit -> poll -> download shape.
 *
 * Docs: https://www.alibabacloud.com/help/en/model-studio/wan-image-to-video-guide
 */
const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";
const DEFAULT_MODEL = "wan2.6-i2v-flash";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function dashscopeHeaders(apiKey: string, extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function baseUrl(): string {
  return process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL;
}

/** wan2.6-i2v-flash accepts an integer duration between 2 and 15 seconds. */
export function clampWanDuration(seconds: number): number {
  return Math.min(15, Math.max(2, Math.round(seconds)));
}

async function submitImageToVideoTask(apiKey: string, imgUrl: string, prompt: string, durationSeconds: number): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/services/aigc/video-generation/video-synthesis`, {
      method: "POST",
      headers: dashscopeHeaders(apiKey, { "X-DashScope-Async": "enable" }),
      body: JSON.stringify({
        model: process.env.DASHSCOPE_VIDEO_MODEL || DEFAULT_MODEL,
        input: {
          prompt: prompt.slice(0, 1500),
          img_url: imgUrl,
        },
        parameters: {
          resolution: "720P",
          duration: clampWanDuration(durationSeconds),
          // We always dub our own ElevenLabs voiceover on top, so request a
          // silent clip - also meaningfully cheaper than the audio tier.
          audio: false,
          prompt_extend: true,
        },
      }),
    });
  } catch {
    throw new VideoGeneratorError("Alibaba Cloud (Wan) API'sine bağlanılamadı. İnternet bağlantınızı kontrol edin.", 502);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.output?.task_id) {
    const message = payload?.message || payload?.code || (await safeText(response));
    throw new VideoGeneratorError(`Wan görevi başlatılamadı (${response.status}): ${message}`, 502);
  }

  return payload.output.task_id as string;
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return "bilinmeyen hata";
  }
}

async function pollTaskUntilDone(apiKey: string, taskId: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    let response: Response;
    try {
      response = await fetch(`${baseUrl()}/tasks/${taskId}`, {
        headers: dashscopeHeaders(apiKey),
      });
    } catch {
      continue; // transient network hiccup, keep polling until deadline
    }

    const task = await response.json().catch(() => null);
    const status = task?.output?.task_status;

    if (status === "SUCCEEDED") {
      const videoUrl: string | undefined = task.output?.video_url;
      if (!videoUrl) {
        throw new VideoGeneratorError("Wan görevi tamamlandı ama video adresi bulunamadı.", 502);
      }
      return videoUrl;
    }

    if (status === "FAILED" || status === "UNKNOWN") {
      throw new VideoGeneratorError(`Wan video üretimi başarısız oldu: ${task?.output?.message ?? task?.message ?? "bilinmeyen hata"}`, 502);
    }
    // PENDING / RUNNING -> keep polling
  }

  throw new VideoGeneratorError("Wan video üretimi zaman aşımına uğradı.", 504);
}

async function downloadVideo(url: string): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url);
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
 * Alibaba's Wan 2.6 Flash (image-to-video). Submits the async task, polls
 * until it succeeds, and returns the downloaded mp4 bytes.
 */
export async function generateVideoClip(
  promptImageDataUri: string,
  promptText: string,
  targetDurationSeconds: number
): Promise<Buffer> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new VideoGeneratorError(
      "DASHSCOPE_API_KEY tanımlı değil. .env.local dosyanıza ekleyin (Vercel'de Environment Variables kısmına).",
      500
    );
  }

  const taskId = await submitImageToVideoTask(apiKey, promptImageDataUri, promptText, targetDurationSeconds);
  const videoUrl = await pollTaskUntilDone(apiKey, taskId);
  return downloadVideo(videoUrl);
}
