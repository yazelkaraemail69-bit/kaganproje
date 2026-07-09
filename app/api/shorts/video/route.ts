import { after, NextResponse } from "next/server";
import type { ShortsScript } from "@/lib/types";
import { SHORTS_VIDEO_ENABLED, SHORTS_VIDEO_STATUS_MESSAGE } from "@/lib/billing/plans";
import { isOpenRouterConfigured } from "@/lib/env/openrouter";
import { VideoGeneratorError } from "@/lib/video/errors";
import { createVideoJob } from "@/lib/video/job-store";
import { runShortsVideoPipeline } from "@/lib/video/pipeline";
import { resolveVideoProvider } from "@/lib/video/video-provider";

export const runtime = "nodejs";
// Video rendering (voiceover + AI images + video clips + ffmpeg) can take
// several minutes; this requires a paid Vercel plan with an extended
// function duration (see README "Vercel'e Deploy").
export const maxDuration = 800;

function isPlausibleShortsScript(value: unknown): value is ShortsScript {
  if (!value || typeof value !== "object") return false;
  const script = value as Record<string, unknown>;
  return Boolean(
    script.hook &&
      Array.isArray(script.body) &&
      script.body.length > 0 &&
      script.cta &&
      typeof script.fullVoiceoverScript === "string"
  );
}

export async function POST(request: Request) {
  if (!SHORTS_VIDEO_ENABLED) {
    return NextResponse.json(
      { error: SHORTS_VIDEO_STATUS_MESSAGE, code: "SHORTS_VIDEO_DISABLED" },
      { status: 503 }
    );
  }

  let body: { script?: unknown; language?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  if (!isPlausibleShortsScript(body.script)) {
    return NextResponse.json({ error: "Geçerli bir Shorts senaryosu gönderilmedi." }, { status: 400 });
  }

  const missingEnvVars = [
    !isOpenRouterConfigured() && "OPENROUTER_API_KEY",
    !process.env.ELEVENLABS_API_KEY && "ELEVENLABS_API_KEY",
  ].filter((value): value is string => Boolean(value));

  if (missingEnvVars.length > 0) {
    return NextResponse.json(
      {
        error: `Videoya donusturme icin eksik: ${missingEnvVars.join(", ")}. kaganproje/.env.local dosyasina ekleyin ve sunucuyu yeniden baslatin.`,
      },
      { status: 500 }
    );
  }

  // Confirms at least one image-to-video backend is configured (Wan, Runway,
  // or the OpenRouter fallback) - see video-provider.ts for resolution order.
  try {
    resolveVideoProvider();
  } catch (error) {
    const message = error instanceof VideoGeneratorError ? error.message : "Video sağlayıcısı yapılandırılmadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const language = typeof body.language === "string" && body.language.trim() ? body.language.trim() : "Türkçe";
  const script = body.script as ShortsScript;
  const job = createVideoJob();

  after(() => runShortsVideoPipeline(job.id, script, language));

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
