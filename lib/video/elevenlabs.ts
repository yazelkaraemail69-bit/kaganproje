import { VideoGeneratorError } from "@/lib/video/errors";

const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
const DEFAULT_MODEL = "eleven_multilingual_v2";
/** Rachel - a stable, clear default voice available on every ElevenLabs account. */
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const LANGUAGE_CODES: Record<string, string> = {
  Türkçe: "tr",
  English: "en",
  Deutsch: "de",
  Español: "es",
};

/**
 * Synthesizes a single voiceover line via ElevenLabs. Returns raw mp3 bytes;
 * duration is measured separately (see lib/video/ffmpeg.ts probeDuration)
 * once the file is written to disk, since ElevenLabs doesn't return duration.
 */
export async function synthesizeVoiceover(text: string, language: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new VideoGeneratorError(
      "ELEVENLABS_API_KEY tanımlı değil. .env.local dosyanıza ekleyin (Vercel'de Environment Variables kısmına).",
      500
    );
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const languageCode = LANGUAGE_CODES[language];

  let response: Response;
  try {
    response = await fetch(`${ELEVENLABS_ENDPOINT}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL || DEFAULT_MODEL,
        language_code: languageCode,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });
  } catch {
    throw new VideoGeneratorError("ElevenLabs'e bağlanılamadı. İnternet bağlantınızı kontrol edin.", 502);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new VideoGeneratorError(
      `ElevenLabs seslendirme isteği başarısız oldu (${response.status}): ${errorBody.slice(0, 300)}`,
      502
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
