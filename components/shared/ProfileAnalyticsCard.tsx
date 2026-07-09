"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, Loader2, Monitor, Smartphone, Tablet } from "lucide-react";
import type { ProfileAnalyticsSummary } from "@/lib/domains/profile/analytics";
import { fetchProfileAnalytics } from "@/lib/share/publish";

interface ProfileAnalyticsCardProps {
  slug: string;
  accentColor?: string;
  isUpdate?: boolean;
}

function formatDate(date: string): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(date));
  } catch {
    return date;
  }
}

export function ProfileAnalyticsCard({ slug, accentColor = "#4f46e5", isUpdate }: ProfileAnalyticsCardProps) {
  const [analytics, setAnalytics] = useState<ProfileAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProfileAnalytics(slug)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> İstatistikler yükleniyor...
      </div>
    );
  }

  if (!analytics) return null;

  const maxDayCount = Math.max(1, ...analytics.viewsByDay.map((d) => d.count));
  const totalDevices =
    analytics.deviceBreakdown.mobile +
    analytics.deviceBreakdown.tablet +
    analytics.deviceBreakdown.desktop +
    analytics.deviceBreakdown.unknown;

  return (
    <div className="card-shadow w-full rounded-2xl border border-slate-100 bg-white p-5">
      <div className="pointer-events-none mb-4 h-1 w-full rounded-full" style={{ backgroundColor: accentColor }} />

      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
        >
          <BarChart3 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-slate-800">Performans Özeti</p>
          <p className="text-xs text-slate-400">
            {isUpdate ? "Güncellendi — QR kodunuz aynı, içerik yenilendi" : "Yayınlandı — görüntülenmeler burada görünür"}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Eye className="h-3.5 w-3.5" /> Toplam görüntülenme
          </div>
          <p className="mt-1 text-2xl font-black text-slate-900">{analytics.viewCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Son görüntülenme</p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {analytics.lastViewedAt ? formatDate(analytics.lastViewedAt) : "Henüz yok"}
          </p>
        </div>
      </div>

      {analytics.viewsByDay.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Son günler</p>
          <div className="flex h-20 items-end gap-1.5">
            {analytics.viewsByDay.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(8, (day.count / maxDayCount) * 64)}px`,
                    backgroundColor: accentColor,
                    opacity: 0.85,
                  }}
                  title={`${day.count} görüntülenme`}
                />
                <span className="text-[9px] text-slate-400">{formatDate(day.date)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {totalDevices > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {analytics.deviceBreakdown.mobile > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
              <Smartphone className="h-3 w-3" /> Mobil {analytics.deviceBreakdown.mobile}
            </span>
          ) : null}
          {analytics.deviceBreakdown.tablet > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
              <Tablet className="h-3 w-3" /> Tablet {analytics.deviceBreakdown.tablet}
            </span>
          ) : null}
          {analytics.deviceBreakdown.desktop > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
              <Monitor className="h-3 w-3" /> Masaüstü {analytics.deviceBreakdown.desktop}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          QR kodunuzu paylaştığınızda görüntülenme istatistikleri burada birikecek.
        </p>
      )}
    </div>
  );
}
