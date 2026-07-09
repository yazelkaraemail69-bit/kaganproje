"use client";

import { Phone, Mail, MessageCircle, Wallet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileActionBarProps {
  phone?: string;
  email?: string;
  website?: string;
  whatsappMessage?: string;
  onSaveContact?: () => void;
  accentColor?: string;
  className?: string;
}

function normalizePhoneForTel(phone: string): string {
  return phone.replace(/\s/g, "");
}

function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.startsWith("90")) return digits;
  return digits;
}

export function ProfileActionBar({
  phone,
  email,
  website,
  whatsappMessage,
  onSaveContact,
  accentColor = "#4f46e5",
  className,
}: ProfileActionBarProps) {
  const tel = phone?.trim();
  const mail = email?.trim();
  const site = website?.trim();
  const waDigits = tel ? normalizePhoneForWhatsApp(tel) : "";

  const actions = [
    tel
      ? {
          key: "call",
          href: `tel:${normalizePhoneForTel(tel)}`,
          label: "Ara",
          icon: Phone,
        }
      : null,
    waDigits
      ? {
          key: "whatsapp",
          href: `https://wa.me/${waDigits}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""}`,
          label: "WhatsApp",
          icon: MessageCircle,
          external: true,
        }
      : null,
    mail
      ? {
          key: "email",
          href: `mailto:${mail}`,
          label: "E-posta",
          icon: Mail,
        }
      : null,
    site
      ? {
          key: "website",
          href: site.startsWith("http") ? site : `https://${site}`,
          label: "Web",
          icon: Globe,
          external: true,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    external?: boolean;
  }>;

  if (actions.length === 0 && !onSaveContact) return null;

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {actions.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.key}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition hover:brightness-95 active:scale-[0.98]"
                style={{
                  borderColor: `${accentColor}33`,
                  color: accentColor,
                  backgroundColor: `${accentColor}0a`,
                }}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </a>
            );
          })}
        </div>
      ) : null}

      {onSaveContact ? (
        <button
          type="button"
          onClick={onSaveContact}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 active:scale-[0.98]"
          style={{ backgroundColor: accentColor }}
        >
          <Wallet className="h-4 w-4" /> Rehbere Kaydet
        </button>
      ) : null}
    </div>
  );
}
