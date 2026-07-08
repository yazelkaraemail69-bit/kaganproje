import { NextResponse } from "next/server";
import { generateShortsScript, ShortsGeneratorError } from "@/lib/generator";
import type { ShortsConfig } from "@/lib/types";

export async function POST(request: Request) {
  let body: Partial<Record<keyof ShortsConfig, unknown>>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const config: ShortsConfig = {
    niche: typeof body.niche === "string" ? body.niche.trim() : "",
    audience: typeof body.audience === "string" ? body.audience.trim() : "",
    tone: typeof body.tone === "string" ? body.tone.trim() : "",
    duration: typeof body.duration === "string" ? body.duration.trim() : "",
    language: typeof body.language === "string" ? body.language.trim() : "",
  };

  if (!config.niche || !config.audience || !config.tone || !config.duration || !config.language) {
    return NextResponse.json(
      { error: "Niş, hedef kitle, ton, süre ve dil alanlarının tümü zorunludur." },
      { status: 400 }
    );
  }

  try {
    const script = await generateShortsScript(config);
    return NextResponse.json(script);
  } catch (error) {
    if (error instanceof ShortsGeneratorError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Shorts generator beklenmedik hata:", error);
    return NextResponse.json({ error: "Beklenmedik bir hata oluştu." }, { status: 500 });
  }
}
