import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { VideoGeneratorError } from "@/lib/video/errors";

const execFileAsync = promisify(execFile);

const FONT_PATH = path.join(process.cwd(), "assets", "fonts", "Inter-Variable.ttf");
const VIDEO_WIDTH = 720;
const VIDEO_HEIGHT = 1280;
const FPS = 30;
const MAX_BUFFER = 1024 * 1024 * 50;

/**
 * ffmpeg's mini filtergraph language treats `:` as an option separator, so
 * Windows drive-letter paths (`C:\...`) must be escaped inside filter option
 * values (e.g. `fontfile=`, `textfile=`). Escaping works, but this particular
 * static build mis-parses it when an escaped-colon `fontfile` is immediately
 * followed by another option - so instead we sidestep the whole problem by
 * passing a path relative to the ffmpeg process's cwd (`process.cwd()`),
 * which contains no colon at all. Falls back to colon-escaping only if the
 * path can't be made relative (e.g. a different drive on Windows).
 */
function toFilterPath(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  const posixRelative = relative.split(path.sep).join("/");
  if (!posixRelative.includes(":")) return posixRelative;
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:");
}

/** The concat demuxer's list file only needs forward slashes, no colon escaping. */
function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

/**
 * drawtext doesn't auto-wrap, so long overlays would otherwise run off the
 * sides of the 720px-wide frame. Greedy word-wraps into short lines instead;
 * `textfile` renders raw newline bytes as real line breaks.
 */
function wrapOverlayText(text: string, maxCharsPerLine = 20, maxLines = 3): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  return lines.join("\n");
}

async function runFfmpeg(args: string[]): Promise<void> {
  if (!ffmpegPath) {
    throw new VideoGeneratorError("ffmpeg ikili dosyası bulunamadı (ffmpeg-static).", 500);
  }
  try {
    await execFileAsync(ffmpegPath, args, { maxBuffer: MAX_BUFFER });
  } catch (error) {
    const stderr = error && typeof error === "object" && "stderr" in error ? String(error.stderr) : "";
    throw new VideoGeneratorError(`ffmpeg hatası: ${stderr.slice(-800) || (error as Error).message}`, 500);
  }
}

export async function probeDurationSeconds(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(
      ffprobeStatic.path,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath],
      { maxBuffer: MAX_BUFFER }
    );
    const seconds = Number.parseFloat(stdout.trim());
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  } catch {
    return 0;
  }
}

export interface RenderSegmentOptions {
  videoPath: string;
  audioPath: string;
  overlayText: string;
  outPath: string;
  /** Final clip length; the source video is frame-held or trimmed to match. */
  targetDurationSeconds: number;
}

/**
 * Normalizes one Runway clip: scales/crops to 720x1280, holds the last frame
 * (or trims) to exactly match the segment's voiceover length, burns in the
 * short on-screen caption, and replaces the (silent) video audio with the
 * ElevenLabs voiceover track.
 */
export async function renderSegmentClip(options: RenderSegmentOptions): Promise<void> {
  const { videoPath, audioPath, overlayText, outPath, targetDurationSeconds } = options;
  const duration = Math.max(1, targetDurationSeconds);
  const sourceDuration = await probeDurationSeconds(videoPath);
  const padSeconds = Math.max(0, duration - sourceDuration + 0.3);

  const textFilePath = `${outPath}.overlay.txt`;
  await fs.writeFile(textFilePath, wrapOverlayText(overlayText), "utf-8");

  const drawtext = [
    // NOTE: keep `textfile` before `fontfile` - see toFilterPath() comment.
    `drawtext=textfile=${toFilterPath(textFilePath)}`,
    `fontfile=${toFilterPath(FONT_PATH)}`,
    "fontcolor=white",
    "fontsize=52",
    "line_spacing=6",
    "box=1",
    "boxcolor=black@0.55",
    "boxborderw=24",
    "x=(w-text_w)/2",
    "y=h-380",
  ].join(":");

  const videoFilter = [
    `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT}`,
    `tpad=stop_mode=clone:stop_duration=${padSeconds.toFixed(2)}`,
    `fps=${FPS}`,
    drawtext,
  ].join(",");

  const args = [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-filter_complex",
    `[0:v]${videoFilter}[v]`,
    "-map",
    "[v]",
    "-map",
    "1:a:0",
    "-t",
    duration.toFixed(2),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-movflags",
    "+faststart",
    outPath,
  ];

  try {
    await runFfmpeg(args);
  } finally {
    await fs.unlink(textFilePath).catch(() => {});
  }
}

/** Concatenates already-normalized (same codec/res/fps) segment clips into the final vertical mp4. */
export async function concatClips(clipPaths: string[], outPath: string): Promise<void> {
  const listPath = `${outPath}.list.txt`;
  const listContent = clipPaths.map((clipPath) => `file '${toPosixPath(clipPath)}'`).join("\n");
  await fs.writeFile(listPath, listContent, "utf-8");

  try {
    await runFfmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      outPath,
    ]);
  } finally {
    await fs.unlink(listPath).catch(() => {});
  }
}
