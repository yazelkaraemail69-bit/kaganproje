import type { VideoJob, VideoJobStep } from "@/lib/types";

/**
 * In-memory job registry.
 *
 * This works as-is for local development and for a traditional long-running
 * Node.js server (e.g. `next start` on a single instance / VPS). On Vercel's
 * serverless runtime each invocation may land on a different instance, so a
 * production deployment should swap this module's internals for a shared
 * store such as Vercel KV / Upstash Redis - the function signatures below
 * are intentionally small so that swap is a one-file change.
 */
const jobs = new Map<string, VideoJob>();

export const VIDEO_JOB_STEP_LABELS = [
  "Seslendirme üretiliyor (ElevenLabs)",
  "Sahne görselleri üretiliyor (AI)",
  "Video klipleri üretiliyor (Runway)",
  "Klipler birleştiriliyor ve altyazılar ekleniyor",
] as const;

function createSteps(): VideoJobStep[] {
  return VIDEO_JOB_STEP_LABELS.map((label) => ({ label, status: "pending" as const }));
}

export function createVideoJob(): VideoJob {
  const now = Date.now();
  const job: VideoJob = {
    id: crypto.randomUUID(),
    status: "queued",
    progress: 0,
    steps: createSteps(),
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getVideoJob(id: string): VideoJob | undefined {
  return jobs.get(id);
}

export function updateVideoJob(id: string, patch: Partial<VideoJob>): void {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, ...patch, updatedAt: Date.now() });
}

export function setStepStatus(id: string, stepIndex: number, status: VideoJobStep["status"]): void {
  const job = jobs.get(id);
  if (!job) return;
  const steps = job.steps.map((step, index) => (index === stepIndex ? { ...step, status } : step));
  const completedCount = steps.filter((step) => step.status === "done").length;
  const progress = Math.round((completedCount / steps.length) * 100);
  jobs.set(id, { ...job, steps, progress, updatedAt: Date.now() });
}

/** Periodic cleanup so the in-memory map doesn't grow unbounded during long dev sessions. */
export function pruneOldJobs(maxAgeMs = 1000 * 60 * 60) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [id, job] of jobs) {
    if (job.updatedAt < cutoff) jobs.delete(id);
  }
}
