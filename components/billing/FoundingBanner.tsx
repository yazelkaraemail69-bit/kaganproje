"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Users } from "lucide-react";

interface FoundingStatus {
  limit: number;
  claimed: number;
  remaining: number;
  open: boolean;
  freeDays: number;
  referralTotalDays: number;
  headline: string;
  subline?: string;
  cta: string;
}

export function FoundingBanner({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/billing/founding")
      .then((r) => r.json())
      .then((data: FoundingStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) return null;

  if (!status.open) {
    return (
      <div
        className={
          compact
            ? "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
            : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        }
      >
        Kurucu üye kontenjanı ({status.limit}) doldu. Ücretli paketlerle devam edebilirsiniz.
      </div>
    );
  }

  const pct = Math.round((status.claimed / status.limit) * 100);

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
          : "rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-5 py-4 shadow-sm"
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Gift className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-emerald-950 sm:text-base">{status.headline}</p>
          {status.subline ? (
            <p className="mt-1 text-xs leading-5 text-emerald-800">{status.subline}</p>
          ) : null}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-emerald-800">
            <Users className="h-3.5 w-3.5" />
            <span>
              {status.claimed}/{status.limit} koltuk doldu ·{" "}
              <strong>{status.remaining} kaldı</strong>
            </span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
            />
          </div>
          {!compact ? (
            <Link
              href="/hesap"
              className="mt-3 inline-flex text-sm font-bold text-emerald-800 underline-offset-2 hover:underline"
            >
              {status.cta} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
