"use client";

import { ArrowLeft, Clapperboard, Mic, MessageCircle, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { ShortsVideoPanel } from "@/components/shorts/ShortsVideoPanel";
import type { ShortsScript, ShortsSegment } from "@/lib/types";

interface ShortsResultProps {
  script: ShortsScript;
  language: string;
  onEdit: () => void;
  onReset: () => void;
}

const SEGMENT_LABELS = ["Kanca (Hook)", "İpucu 1", "İpucu 2", "İpucu 3", "Kapanış (CTA)"];

function SegmentCard({ label, segment }: { label: string; segment: ShortsSegment }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-brand-700">{label}</h3>

      <div className="flex flex-col gap-3 text-sm">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <Mic className="h-3.5 w-3.5" /> Seslendirme
            </span>
            <CopyButton text={segment.voiceover} />
          </div>
          <p className="rounded-xl bg-slate-50 px-3 py-2 leading-6 text-slate-700">{segment.voiceover}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <Type className="h-3.5 w-3.5" /> Metin Üstü
            </span>
            <CopyButton text={segment.textOverlay} />
          </div>
          <p className="rounded-xl bg-slate-50 px-3 py-2 font-bold uppercase tracking-wide text-slate-700">
            {segment.textOverlay}
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
              <Clapperboard className="h-3.5 w-3.5" /> Görsel Prompt (EN)
            </span>
            <CopyButton text={segment.visualPrompt} />
          </div>
          <p className="rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-500">
            {segment.visualPrompt}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ShortsResult({ script, language, onEdit, onReset }: ShortsResultProps) {
  const segments = [script.hook, ...script.body, script.cta];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ShortsVideoPanel script={script} language={language} />

      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <MessageCircle className="h-4 w-4 text-brand-600" /> Tam Seslendirme Metni
          </h3>
          <CopyButton text={script.fullVoiceoverScript} label="Tümünü Kopyala" />
        </div>
        <p className="whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
          {script.fullVoiceoverScript}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {segments.map((segment, index) => (
          <SegmentCard key={index} label={SEGMENT_LABELS[index] ?? `Segment ${index + 1}`} segment={segment} />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={onEdit}>
          <ArrowLeft className="h-4 w-4" /> Ayarları Düzenle
        </Button>
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Yeni Senaryo
        </Button>
      </div>
    </div>
  );
}
