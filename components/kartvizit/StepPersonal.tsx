"use client";

import { Input } from "@/components/ui/Field";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import type { BusinessCardData } from "@/lib/types";

interface StepPersonalProps {
  data: BusinessCardData;
  onChange: (patch: Partial<BusinessCardData>) => void;
}

export function StepPersonal({ data, onChange }: StepPersonalProps) {
  return (
    <div className="flex flex-col gap-5">
      <PhotoUpload
        label="Profil Fotoğrafı"
        hint="Kare veya yuvarlak kırpılacak bir fotoğraf önerilir."
        value={data.photoUrl}
        onChange={(photoUrl) => onChange({ photoUrl })}
      />
      <Input
        label="Ad Soyad"
        required
        placeholder="Örn. Ayşe Yılmaz"
        value={data.fullName}
        onChange={(event) => onChange({ fullName: event.target.value })}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Ünvan"
          required
          placeholder="Örn. Kurucu Ortak"
          value={data.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <Input
          label="Şirket"
          placeholder="Örn. Yılmaz Danışmanlık"
          value={data.company}
          onChange={(event) => onChange({ company: event.target.value })}
        />
      </div>
    </div>
  );
}
