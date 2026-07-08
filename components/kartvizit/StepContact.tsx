"use client";

import { Input } from "@/components/ui/Field";
import type { BusinessCardData } from "@/lib/types";

interface StepContactProps {
  data: BusinessCardData;
  onChange: (patch: Partial<BusinessCardData>) => void;
}

export function StepContact({ data, onChange }: StepContactProps) {
  return (
    <div className="flex flex-col gap-5">
      <Input
        label="Telefon"
        required
        type="tel"
        placeholder="Örn. +90 555 123 45 67"
        value={data.phone}
        onChange={(event) => onChange({ phone: event.target.value })}
      />
      <Input
        label="E-posta"
        required
        type="email"
        placeholder="Örn. ayse@sirket.com"
        value={data.email}
        onChange={(event) => onChange({ email: event.target.value })}
      />
      <Input
        label="Web Sitesi"
        type="url"
        placeholder="Örn. www.sirket.com"
        value={data.website}
        onChange={(event) => onChange({ website: event.target.value })}
      />
    </div>
  );
}
