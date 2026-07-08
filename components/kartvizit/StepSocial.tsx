"use client";

import { AtSign, Briefcase, Camera, Users, type LucideIcon } from "lucide-react";
import type { BusinessCardData, SocialLinks } from "@/lib/types";

interface StepSocialProps {
  data: BusinessCardData;
  onChange: (patch: Partial<SocialLinks>) => void;
}

const fields: Array<{ key: keyof SocialLinks; label: string; icon: LucideIcon; placeholder: string }> = [
  { key: "instagram", label: "Instagram", icon: Camera, placeholder: "kullaniciadi" },
  { key: "linkedin", label: "LinkedIn", icon: Briefcase, placeholder: "kullaniciadi" },
  { key: "twitter", label: "X (Twitter)", icon: AtSign, placeholder: "kullaniciadi" },
  { key: "facebook", label: "Facebook", icon: Users, placeholder: "sayfaadi" },
];

export function StepSocial({ data, onChange }: StepSocialProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Sosyal medya hesaplarınızı kullanıcı adı olarak girin. Bu alan opsiyoneldir, boş bırakabilirsiniz.
      </p>
      {fields.map(({ key, label, icon: Icon, placeholder }) => (
        <label key={key} className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder={placeholder}
              value={data.social[key] ?? ""}
              onChange={(event) => onChange({ [key]: event.target.value })}
            />
          </div>
        </label>
      ))}
    </div>
  );
}
