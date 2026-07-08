import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ShortsScript, ShortsSegment } from "@/lib/types";
import { mapWithConcurrency } from "@/lib/video/concurrency";
import { VideoGeneratorError } from "@/lib/video/errors";
import { synthesizeVoiceover } from "@/lib/video/elevenlabs";
import { concatClips, probeDurationSeconds, renderSegmentClip } from "@/lib/video/ffmpeg";
import { generateSegmentImage } from "@/lib/video/images";
import { setStepStatus, updateVideoJob } from "@/lib/video/job-store";
import { saveFinalVideo } from "@/lib/video/storage";
import { generateVideoClip } from "@/lib/video/video-provider";

const SEGMENT_FILE_NAMES = ["hook", "body-1", "body-2", "body-3", "cta"];
/** Conservative default: ElevenLabs free/starter tiers cap concurrent requests at 2-3. */
const PIPELINE_CONCURRENCY = Number(process.env.VIDEO_PIPELINE_CONCURRENCY) || 2;

function segmentsOf(script: ShortsScript): ShortsSegment[] {
  return [script.hook, ...script.body, script.cta];
}

/**
 * Orchestrates the full "script -> vertical AI video" render:
 * 1. ElevenLabs voiceover per segment
 * 2. OpenRouter vertical still image per segment (from the visual prompt)
 * 3. Image-to-video animation per segment (Wan 2.6 Flash or Runway - see
 *    lib/video/video-provider.ts)
 * 4. ffmpeg: caption burn-in, duration sync to the voiceover, concatenation
 *
 * Meant to run in the background via `after()` from the API route - see
 * app/api/shorts/video/route.ts. Never throws; all failures are recorded on
 * the job via the job store so the client can poll and display them.
 */
export async function runShortsVideoPipeline(jobId: string, script: ShortsScript, language: string): Promise<void> {
  const segments = segmentsOf(script);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `shorts-${jobId}-`));
  let currentStep = 0;

  try {
    updateVideoJob(jobId, { status: "processing" });

    currentStep = 0;
    setStepStatus(jobId, 0, "active");
    const audioPaths = await mapWithConcurrency(segments, PIPELINE_CONCURRENCY, async (segment, index) => {
      const buffer = await synthesizeVoiceover(segment.voiceover, language);
      const audioPath = path.join(workDir, `${SEGMENT_FILE_NAMES[index]}.mp3`);
      await fs.writeFile(audioPath, buffer);
      return audioPath;
    });
    const audioDurations = await Promise.all(audioPaths.map((audioPath) => probeDurationSeconds(audioPath)));
    setStepStatus(jobId, 0, "done");

    currentStep = 1;
    setStepStatus(jobId, 1, "active");
    const images = await mapWithConcurrency(segments, PIPELINE_CONCURRENCY, (segment) =>
      generateSegmentImage(segment.visualPrompt)
    );
    setStepStatus(jobId, 1, "done");

    currentStep = 2;
    setStepStatus(jobId, 2, "active");
    const videoPaths = await mapWithConcurrency(segments, PIPELINE_CONCURRENCY, async (segment, index) => {
      const clipBuffer = await generateVideoClip(images[index], segment.visualPrompt, audioDurations[index] || 4);
      const videoPath = path.join(workDir, `${SEGMENT_FILE_NAMES[index]}.mp4`);
      await fs.writeFile(videoPath, clipBuffer);
      return videoPath;
    });
    setStepStatus(jobId, 2, "done");

    currentStep = 3;
    setStepStatus(jobId, 3, "active");
    const renderedClipPaths = await mapWithConcurrency(segments, PIPELINE_CONCURRENCY, async (segment, index) => {
      const outPath = path.join(workDir, `${SEGMENT_FILE_NAMES[index]}-final.mp4`);
      await renderSegmentClip({
        videoPath: videoPaths[index],
        audioPath: audioPaths[index],
        overlayText: segment.textOverlay,
        outPath,
        targetDurationSeconds: Math.max(2, audioDurations[index] || 4),
      });
      return outPath;
    });

    const finalPath = path.join(workDir, "final.mp4");
    await concatClips(renderedClipPaths, finalPath);
    const finalBuffer = await fs.readFile(finalPath);
    const videoUrl = await saveFinalVideo(finalBuffer, jobId);
    setStepStatus(jobId, 3, "done");

    updateVideoJob(jobId, { status: "done", videoUrl, progress: 100 });
  } catch (error) {
    const message =
      error instanceof VideoGeneratorError ? error.message : "Video oluşturulurken beklenmedik bir hata oluştu.";
    console.error("Shorts video pipeline hatası:", error);
    setStepStatus(jobId, currentStep, "error");
    updateVideoJob(jobId, { status: "error", error: message });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
