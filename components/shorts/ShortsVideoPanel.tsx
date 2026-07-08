"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Download, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ShortsScript, VideoJob } from "@/lib/types";

interface ShortsVideoPanelProps {
  script: ShortsScript;
  language: string;
}

const POLL_INTERVAL_MS = 3000;

export function ShortsVideoPanel({ script, language }: ShortsVideoPanelProps) {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  function pollJob(jobId: string) {
    pollTimer.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/shorts/video/${jobId}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "İş durumu alınamadı.");
        }
        const nextJob = payload as VideoJob;
        setJob(nextJob);
        if (nextJob.status === "done" || nextJob.status === "error") {
          stopPolling();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "İş durumu alınamadı.");
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleStart() {
    setError("");
    setIsStarting(true);
    try {
      const response = await fetch("/api/shorts/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, language }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Video oluşturma başlatılamadı.");
      }
      setJob({
        id: payload.jobId,
        status: "queued",
        progress: 0,
        steps: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      pollJob(payload.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.");
    } finally {
      setIsStarting(false);
    }
  }

  const isRunning = job?.status === "queued" || job?.status === "processing";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <Video className="h-4 w-4 text-brand-600" /> Videoya Dönüştür (AI)
        </h3>
        {!job || job.status === "error" ? (
          <Button onClick={handleStart} disabled={isStarting}>
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Başlatılıyor...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" /> {job?.status === "error" ? "Tekrar Dene" : "Videoyu Oluştur"}
              </>
            )}
          </Button>
        ) : null}
      </div>

      <p className="mb-3 text-xs leading-5 text-slate-500">
        Her segment için AI seslendirme, dikey görsel ve Runway ile video klibi üretilip alt yazılarla birleştirilir.
        Bu işlem birkaç dakika sürebilir.
      </p>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>
      ) : null}

      {job && job.steps.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-2">
          {job.steps.map((step) => (
            <li key={step.label} className="flex items-center gap-2.5 text-sm">
              {step.status === "done" ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : step.status === "active" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
              ) : step.status === "error" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-200" />
              )}
              <span
                className={cn(
                  "leading-5",
                  step.status === "pending" ? "text-slate-400" : "text-slate-700",
                  step.status === "error" && "text-red-600"
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {isRunning ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${Math.max(6, job?.progress ?? 0)}%` }}
          />
        </div>
      ) : null}

      {job?.status === "error" && job.error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{job.error}</p>
      ) : null}

      {job?.status === "done" && job.videoUrl ? (
        <div className="mt-2 flex flex-col items-center gap-3">
          <video
            src={job.videoUrl}
            controls
            playsInline
            className="aspect-[9/16] w-full max-w-[280px] rounded-2xl bg-black"
          />
          <a
            href={job.videoUrl}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
          >
            <Download className="h-4 w-4" /> Videoyu İndir
          </a>
        </div>
      ) : null}
    </div>
  );
}
