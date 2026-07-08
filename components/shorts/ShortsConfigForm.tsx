"use client";

import { Input } from "@/components/ui/Field";
import { ChipGroup } from "@/components/ui/ChipGroup";
import {
  SHORTS_AUDIENCE_SUGGESTIONS,
  SHORTS_DURATION_OPTIONS,
  SHORTS_LANGUAGE_OPTIONS,
  SHORTS_NICHE_SUGGESTIONS,
  SHORTS_TONE_OPTIONS,
} from "@/lib/shorts-options";
import type { ShortsConfig } from "@/lib/types";

interface ShortsConfigFormProps {
  data: ShortsConfig;
  onChange: (patch: Partial<ShortsConfig>) => void;
}

export function ShortsConfigForm({ data, onChange }: ShortsConfigFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Input
          label="Niş Konu"
          required
          placeholder="Örn. Mantar yetiştiriciliği"
          value={data.niche}
          onChange={(event) => onChange({ niche: event.target.value })}
        />
        <ChipGroup
          className="mt-2.5"
          options={SHORTS_NICHE_SUGGESTIONS}
          value={data.niche}
          onChange={(niche) => onChange({ niche })}
        />
      </div>

      <div>
        <Input
          label="Hedef Kitle"
          required
          placeholder="Örn. Yeni başlayanlar"
          value={data.audience}
          onChange={(event) => onChange({ audience: event.target.value })}
        />
        <ChipGroup
          className="mt-2.5"
          options={SHORTS_AUDIENCE_SUGGESTIONS}
          value={data.audience}
          onChange={(audience) => onChange({ audience })}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tonlama</span>
        <ChipGroup options={SHORTS_TONE_OPTIONS} value={data.tone} onChange={(tone) => onChange({ tone })} />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Video Süresi Hedefi</span>
        <ChipGroup
          options={SHORTS_DURATION_OPTIONS}
          value={data.duration}
          onChange={(duration) => onChange({ duration })}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Dil</span>
        <ChipGroup
          options={SHORTS_LANGUAGE_OPTIONS}
          value={data.language}
          onChange={(language) => onChange({ language })}
        />
      </div>
    </div>
  );
}
