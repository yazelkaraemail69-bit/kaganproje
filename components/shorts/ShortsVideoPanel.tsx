"use client";

import { AlertTriangle, Video } from "lucide-react";
import { SHORTS_VIDEO_ENABLED, SHORTS_VIDEO_STATUS_MESSAGE } from "@/lib/billing/plans";
import type { ShortsScript } from "@/lib/types";

interface ShortsVideoPanelProps {
  script: ShortsScript;
  language: string;
}

/**
 * Video üretimi ~3 USD/video — A modelinde kapalı.
 * Senaryo metni ShortsWizard üzerinden açık kalır.
 */
export function ShortsVideoPanel({ script: _script, language: _language }: ShortsVideoPanelProps) {
  if (!SHORTS_VIDEO_ENABLED) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Video className="h-4 w-4 text-amber-700" />
          <h3 className="text-sm font-bold text-amber-900">Videoya Dönüştür</h3>
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
            Geliştirmede
          </span>
        </div>
        <p className="flex items-start gap-2 text-sm leading-6 text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {SHORTS_VIDEO_STATUS_MESSAGE}
        </p>
      </div>
    );
  }

  return null;
}
