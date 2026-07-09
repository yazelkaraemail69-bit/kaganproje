"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QrCodeCard } from "@/components/ui/QrCode";
import { ProfileActionBar } from "@/components/shared/ProfileActionBar";
import { ProfileAnalyticsCard } from "@/components/shared/ProfileAnalyticsCard";
import { ContactSaveHint } from "@/components/shared/ContactSaveHint";
import { getThemePreset, DEFAULT_CARD_THEME_ID } from "@/lib/themes";
import type { BusinessCardData } from "@/lib/types";
import { downloadVCard } from "@/lib/vcard";
import { publishProfile } from "@/lib/share/publish";
import { prepareCardPayload } from "@/lib/share/prepare-publish";
import { getStoredProfileSlug, setStoredProfileSlug } from "@/lib/profile-slug-storage";
import type { CardLayoutId } from "@/lib/layouts";

interface CardPreviewProps {
  data: BusinessCardData;
  onEdit?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
  shareUrl?: string;
}

const socialIcons = {
  instagram: Camera,
  linkedin: Briefcase,
  twitter: AtSign,
  facebook: Users,
} as const;

function ContactRows({
  data,
  subtleText,
}: {
  data: BusinessCardData;
  subtleText: string;
}) {
  return (
    <>
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
    </>
  );
}

function SocialPills({ data, panelBg }: { data: BusinessCardData; panelBg: string }) {
  const socialEntries = (Object.keys(socialIcons) as Array<keyof typeof socialIcons>).filter(
    (key) => data.social[key]
  );
  if (socialEntries.length === 0) return null;
  return (
    <div className="flex gap-3">
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
  );
}

function PhotoCircle({
  data,
  ringColor,
  panelBg,
  subtleText,
  size = "lg",
}: {
  data: BusinessCardData;
  ringColor: string;
  panelBg: string;
  subtleText: string;
  size?: "lg" | "md";
}) {
  const dim = size === "lg" ? "h-24 w-24" : "h-20 w-20";
  const icon = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div
      className={`flex ${dim} items-center justify-center overflow-hidden rounded-full border-4`}
      style={{ borderColor: ringColor, backgroundColor: panelBg }}
    >
      {data.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.photoUrl} alt={data.fullName} className="h-full w-full object-cover" />
      ) : (
        <User className={icon} style={{ color: subtleText }} />
      )}
    </div>
  );
}

export function CardPreview({ data, onEdit, onReset, readOnly = false, shareUrl: shareUrlProp }: CardPreviewProps) {
  const theme = getThemePreset(data.themeId, DEFAULT_CARD_THEME_ID);
  const layout = (data.layoutId as CardLayoutId) || "classic";
  const [shareUrl, setShareUrl] = useState(shareUrlProp ?? "");
  const [publishedSlug, setPublishedSlug] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [publishing, setPublishing] = useState(!readOnly && !shareUrlProp);

  const overlay = theme.isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.12)";
  const panelBg = theme.isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.12)";
  const ringColor = theme.isLight ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.3)";
  const mutedText = theme.isLight ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.8)";
  const subtleText = theme.isLight ? "rgba(15,23,42,0.45)" : "rgba(255,255,255,0.7)";

  useEffect(() => {
    if (readOnly || shareUrlProp) return;
    let cancelled = false;
    setPublishing(true);

    const slugHint = (getStoredProfileSlug("card") ?? data.fullName.trim().toLowerCase()) || "kartvizit";
    const existingSlug = getStoredProfileSlug("card");

    prepareCardPayload(data, slugHint)
      .then((payload) =>
        publishProfile({
          type: "card",
          displayName: data.fullName.trim() || "Kartvizit",
          payload,
          existingSlug,
        })
      )
      .then((result) => {
        if (!cancelled) {
          setShareUrl(result.url);
          setPublishedSlug(result.slug);
          setIsUpdate(result.isUpdate);
          setStoredProfileSlug("card", result.slug);
        }
      })
      .catch(() => {
        if (!cancelled) setShareUrl("");
      })
      .finally(() => {
        if (!cancelled) setPublishing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [data, readOnly, shareUrlProp]);

  function renderCard() {
    if (layout === "minimal") {
      return (
        <div className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 card-shadow">
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: theme.accent }} />
          <div className="flex flex-col items-center text-center">
            <PhotoCircle data={data} ringColor="#e2e8f0" panelBg="#f8fafc" subtleText="#94a3b8" size="md" />
            <h2 className="mt-4 text-xl font-black text-slate-900">{data.fullName || "Ad Soyad"}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {data.title || "Ünvan"}
              {data.company ? ` · ${data.company}` : ""}
            </p>
            <div className="mt-6 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm text-slate-700">
              <ContactRows data={data} subtleText="#94a3b8" />
            </div>
          </div>
        </div>
      );
    }

    if (layout === "executive") {
      return (
        <div
          className="relative w-full overflow-hidden rounded-3xl p-6 card-shadow sm:p-8"
          style={{ backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: theme.text }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:text-left">
            <PhotoCircle data={data} ringColor={ringColor} panelBg={panelBg} subtleText={subtleText} size="md" />
            <div className="flex flex-1 flex-col items-center sm:items-start">
              <h2 className="text-2xl font-black" style={{ color: theme.text }}>
                {data.fullName || "Ad Soyad"}
              </h2>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide" style={{ color: mutedText }}>
                {data.title || "Ünvan"}
              </p>
              {data.company ? (
                <p className="mt-0.5 text-sm" style={{ color: subtleText }}>
                  {data.company}
                </p>
              ) : null}
              <div className="mt-4">
                <SocialPills data={data} panelBg={panelBg} />
              </div>
              <div
                className="mt-5 flex w-full flex-col gap-2.5 rounded-2xl p-4 text-sm backdrop-blur"
                style={{ backgroundColor: panelBg }}
              >
                <ContactRows data={data} subtleText={subtleText} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (layout === "bold") {
      return (
        <div
          className="relative w-full overflow-hidden rounded-3xl p-8 card-shadow"
          style={{ backgroundImage: `linear-gradient(160deg, ${theme.from}, ${theme.to})`, color: theme.text }}
        >
          <h2 className="text-4xl font-black leading-none tracking-tight" style={{ color: theme.text }}>
            {data.fullName || "Ad Soyad"}
          </h2>
          <p className="mt-3 text-base font-semibold" style={{ color: mutedText }}>
            {data.title || "Ünvan"}
          </p>
          {data.company ? (
            <p className="text-sm" style={{ color: subtleText }}>
              {data.company}
            </p>
          ) : null}
          <div className="mt-6 flex justify-center sm:justify-start">
            <PhotoCircle data={data} ringColor={ringColor} panelBg={panelBg} subtleText={subtleText} size="md" />
          </div>
          <div className="mt-6 flex flex-col gap-2 text-sm" style={{ color: theme.text }}>
            <ContactRows data={data} subtleText={subtleText} />
          </div>
        </div>
      );
    }

    return (
      <div
        className="relative w-full overflow-hidden rounded-3xl p-8 card-shadow"
        style={{ backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, color: theme.text }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ backgroundColor: overlay }} />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full" style={{ backgroundColor: overlay }} />
        <div className="relative flex flex-col items-center text-center">
          <PhotoCircle data={data} ringColor={ringColor} panelBg={panelBg} subtleText={subtleText} />
          <h2 className="mt-4 text-2xl font-black" style={{ color: theme.text }}>
            {data.fullName || "Ad Soyad"}
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: mutedText }}>
            {data.title || "Ünvan"}
            {data.company ? ` · ${data.company}` : ""}
          </p>
          <div className="mt-5 flex justify-center">
            <SocialPills data={data} panelBg={panelBg} />
          </div>
        </div>
        <div
          className="relative mt-7 flex flex-col gap-3 rounded-2xl p-4 text-sm backdrop-blur"
          style={{ backgroundColor: panelBg }}
        >
          <ContactRows data={data} subtleText={subtleText} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      {renderCard()}

      {readOnly ? (
        <>
          <ProfileActionBar
            phone={data.phone}
            email={data.email}
            website={data.website}
            whatsappMessage={`Merhaba ${data.fullName}, kartvizitinizden ulaşıyorum.`}
            onSaveContact={() => downloadVCard(data)}
            accentColor={theme.accent}
          />
          <ContactSaveHint />
        </>
      ) : (
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
      )}

      {readOnly ? (
        <Link
          href="/kartvizit"
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          Kendi dijital kartvizitinizi oluşturun <ArrowRight className="h-4 w-4" />
        </Link>
      ) : publishing ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Paylaşım linki hazırlanıyor...
        </div>
      ) : shareUrl ? (
        <>
          {publishedSlug ? (
            <ProfileAnalyticsCard slug={publishedSlug} accentColor={theme.accent} isUpdate={isUpdate} />
          ) : null}
          <QrCodeCard
            value={shareUrl}
            title="QR ile Paylaş"
            description="Taratıldığında profesyonel kartvizit sayfanız açılır. Düzenleyip tekrar yayınlarsanız QR aynı kalır."
            fileName={`${data.fullName || "kartvizit"}-qr`}
            accentColor={theme.accent}
          />
          <ContactSaveHint />
        </>
      ) : null}
    </div>
  );
}
