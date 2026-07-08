import { VideoGeneratorError } from "@/lib/video/errors";
import { clampOpenRouterVideoDuration, generateVideoClip as generateOpenRouterClip } from "@/lib/video/openrouter-video";
import { clampRunwayDuration, generateVideoClip as generateRunwayClip } from "@/lib/video/runway";
import { clampWanDuration, generateVideoClip as generateWanClip } from "@/lib/video/wan";

export type VideoProviderId = "wan" | "runway" | "openrouter";

/**
 * Picks which image-to-video backend renders each segment clip.
 *
 * - "wan": Alibaba Cloud (DashScope) Wan 2.6 Flash direct - cheapest option
 *   (~$0.025/s at 720p) but needs a separate Alibaba Cloud account/API key.
 * - "runway": RunwayML Gen-4 Turbo - the original integration (~$0.05/s).
 * - "openrouter": OpenRouter's video API (Kling v3 Std by default, ~$0.084/s)
 *   - pricier per second than the two above, but reuses the OPENROUTER_API_KEY
 *     the app already requires for script/image generation, so it needs zero
 *     extra signup. Good "just works" fallback.
 *
 * Resolution order: explicit VIDEO_PROVIDER env var wins; otherwise prefer
 * the cheapest configured option first (Wan, then Runway), and fall back to
 * OpenRouter last since it's always technically available but costs more.
 */
export function resolveVideoProvider(): VideoProviderId {
  const explicit = process.env.VIDEO_PROVIDER?.trim().toLowerCase();
  if (explicit === "wan" || explicit === "runway" || explicit === "openrouter") return explicit;

  if (process.env.DASHSCOPE_API_KEY) return "wan";
  if (process.env.RUNWAYML_API_SECRET) return "runway";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";

  throw new VideoGeneratorError(
    "Video üretimi için DASHSCOPE_API_KEY (Wan, ucuz), RUNWAYML_API_SECRET (Runway) ya da OPENROUTER_API_KEY (OpenRouter) tanımlı değil.",
    500
  );
}

/** Human-readable label surfaced in error messages / logs. */
export function videoProviderLabel(provider: VideoProviderId): string {
  if (provider === "wan") return "Wan 2.6 Flash (Alibaba Cloud)";
  if (provider === "runway") return "Runway Gen-4 Turbo";
  return "OpenRouter (Kling v3 Std)";
}

export function clampDurationForProvider(provider: VideoProviderId, seconds: number): number {
  if (provider === "wan") return clampWanDuration(seconds);
  if (provider === "runway") return clampRunwayDuration(seconds);
  return clampOpenRouterVideoDuration(seconds);
}

/**
 * Turns a still image + motion prompt into a short vertical video clip using
 * whichever provider `resolveVideoProvider()` selects.
 */
export async function generateVideoClip(
  promptImageDataUri: string,
  promptText: string,
  targetDurationSeconds: number
): Promise<Buffer> {
  const provider = resolveVideoProvider();
  const duration = clampDurationForProvider(provider, targetDurationSeconds);

  if (provider === "wan") return generateWanClip(promptImageDataUri, promptText, duration);
  if (provider === "runway") return generateRunwayClip(promptImageDataUri, promptText, duration);
  return generateOpenRouterClip(promptImageDataUri, promptText, duration);
}
