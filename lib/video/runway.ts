import { VideoGeneratorError } from "@/lib/video/errors";

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";
const DEFAULT_MODEL = "gen4_turbo";
/** Vertical Shorts/Reels ratio. Override via RUNWAY_RATIO if your account's allowed list differs. */
const DEFAULT_RATIO = "720:1280";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function runwayHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

/** Runway's turbo model accepts whole-second durations between 2 and 10. */
export function clampRunwayDuration(seconds: number): number {
  return Math.min(10, Math.max(3, Math.round(seconds)));
}

async function submitImageToVideoTask(
  apiKey: string,
  promptImage: string,
  promptText: string,
  durationSeconds: number
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${RUNWAY_BASE}/image_to_video`, {
      method: "POST",
      headers: runwayHeaders(apiKey),
      body: JSON.stringify({
        model: process.env.RUNWAY_MODEL || DEFAULT_MODEL,
        promptImage,
        promptText: promptText.slice(0, 900),
        ratio: process.env.RUNWAY_RATIO || DEFAULT_RATIO,
        duration: clampRunwayDuration(durationSeconds),
      }),
    });
  } catch {
    throw new VideoGeneratorError("Runway'e bağlanılamadı. İnternet bağlantınızı kontrol edin.", 502);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new VideoGeneratorError(
      `Runway görevi başlatılamadı (${response.status}): ${errorBody.slice(0, 300)}`,
      502
    );
  }

  const payload = await response.json();
  const taskId: string | undefined = payload?.id;
  if (!taskId) {
    throw new VideoGeneratorError("Runway bir görev kimliği döndürmedi.", 502);
  }
  return taskId;
}

async function pollTaskUntilDone(apiKey: string, taskId: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    let response: Response;
    try {
      response = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
        headers: runwayHeaders(apiKey),
      });
    } catch {
      continue; // transient network hiccup, keep polling until deadline
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new VideoGeneratorError(
        `Runway görev durumu sorgulanamadı (${response.status}): ${errorBody.slice(0, 300)}`,
        502
      );
    }

    const task = await response.json();

    if (task.status === "SUCCEEDED") {
      const videoUrl: string | undefined = task.output?.[0];
      if (!videoUrl) {
        throw new VideoGeneratorError("Runway görevi tamamlandı ama video adresi bulunamadı.", 502);
      }
      return videoUrl;
    }

    if (task.status === "FAILED") {
      throw new VideoGeneratorError(`Runway video üretimi başarısız oldu: ${task.failure ?? "bilinmeyen hata"}`, 502);
    }
    // "PENDING" / "RUNNING" / "THROTTLED" -> keep polling
  }

  throw new VideoGeneratorError("Runway video üretimi zaman aşımına uğradı.", 504);
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
 * Runway's Gen-4 Turbo image-to-video model. Submits the async task, polls
 * until it succeeds, and returns the downloaded mp4 bytes.
 */
export async function generateVideoClip(
  promptImageDataUri: string,
  promptText: string,
  targetDurationSeconds: number
): Promise<Buffer> {
  const apiKey = process.env.RUNWAYML_API_SECRET;
  if (!apiKey) {
    throw new VideoGeneratorError(
      "RUNWAYML_API_SECRET tanımlı değil. .env.local dosyanıza ekleyin (Vercel'de Environment Variables kısmına).",
      500
    );
  }

  const taskId = await submitImageToVideoTask(apiKey, promptImageDataUri, promptText, targetDurationSeconds);
  const videoUrl = await pollTaskUntilDone(apiKey, taskId);
  return downloadVideo(videoUrl);
}
