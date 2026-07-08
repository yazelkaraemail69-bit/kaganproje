"use client";

import {
  AtSign,
  Briefcase,
  Camera,
  Globe,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QrCodeCard } from "@/components/ui/QrCode";
import { getThemePreset, DEFAULT_CARD_THEME_ID } from "@/lib/themes";
import type { BusinessCardData } from "@/lib/types";
import { buildVCard, downloadVCard } from "@/lib/vcard";

interface CardPreviewProps {
  data: BusinessCardData;
  onEdit: () => void;
  onReset: () => void;
}

const socialIcons = {
  instagram: Camera,
  linkedin: Briefcase,
  twitter: AtSign,
  facebook: Users,
} as const;

export function CardPreview({ data, onEdit, onReset }: CardPreviewProps) {
  const theme = getThemePreset(data.themeId, DEFAULT_CARD_THEME_ID);
  const socialEntries = (Object.keys(socialIcons) as Array<keyof typeof socialIcons>).filter(
    (key) => data.social[key]
  );

  const overlay = theme.isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.12)";
  const panelBg = theme.isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.12)";
  const ringColor = theme.isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.3)";
  const mutedText = theme.isLight ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.8)";
  const subtleText = theme.isLight ? "rgba(15,23,42,0.45)" : "rgba(255,255,255,0.7)";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      <div
        className="relative w-full overflow-hidden rounded-3xl p-8 card-shadow"
        style={{
          backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
          color: theme.text,
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ backgroundColor: overlay }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full"
          style={{ backgroundColor: overlay }}
        />

        <div className="relative flex flex-col items-center text-center">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4"
            style={{ borderColor: ringColor, backgroundColor: panelBg }}
          >
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoUrl} alt={data.fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10" style={{ color: subtleText }} />
            )}
          </div>
          <h2 className="mt-4 text-2xl font-black" style={{ color: theme.text }}>
            {data.fullName || "Ad Soyad"}
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: mutedText }}>
            {data.title || "Ünvan"}
            {data.company ? ` · ${data.company}` : ""}
          </p>

          {socialEntries.length > 0 ? (
            <div className="mt-5 flex gap-3">
              {socialEntries.map((key) => {
                const Icon = socialIcons[key];
                return (
                  <span
                    key={key}
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: panelBg }}
                    title={data.social[key]}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <div
          className="relative mt-7 flex flex-col gap-3 rounded-2xl p-4 text-sm backdrop-blur"
          style={{ backgroundColor: panelBg }}
        >
          {data.phone ? (
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0" style={{ color: subtleText }} />
              <span>{data.phone}</span>
            </div>
          ) : null}
          {data.email ? (
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0" style={{ color: subtleText }} />
              <span className="break-all">{data.email}</span>
            </div>
          ) : null}
          {data.website ? (
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 shrink-0" style={{ color: subtleText }} />
              <span className="break-all">{data.website}</span>
            </div>
          ) : null}
          {!data.phone && !data.email && !data.website ? (
            <p className="text-center" style={{ color: subtleText }}>
              İletişim bilgisi eklenmedi.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 sm:flex-row">
        <Button className="flex-1" onClick={() => downloadVCard(data)}>
          <Wallet className="h-4 w-4" /> Rehbere Ekle (.vcf)
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Düzenle
        </Button>
        <Button variant="ghost" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Yeni Oluştur
        </Button>
      </div>

      <QrCodeCard
        value={buildVCard(data)}
        title="QR ile Paylaş"
        description="Taratıldığında telefonda rehbere ekleme istemi açılır."
        fileName={`${data.fullName || "kartvizit"}-qr`}
        accentColor={theme.accent}
      />
    </div>
  );
}
