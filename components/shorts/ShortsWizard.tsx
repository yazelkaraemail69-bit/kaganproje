"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShortsConfigForm } from "@/components/shorts/ShortsConfigForm";
import { ShortsResult } from "@/components/shorts/ShortsResult";
import { createEmptyShortsConfig, type ShortsConfig, type ShortsScript } from "@/lib/types";

export function ShortsWizard() {
  const [view, setView] = useState<"form" | "result">("form");
  const [data, setData] = useState<ShortsConfig>(createEmptyShortsConfig);
  const [script, setScript] = useState<ShortsScript | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateData(patch: Partial<ShortsConfig>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  async function handleGenerate() {
    if (!data.niche.trim() || !data.audience.trim()) {
      setError("Lütfen niş konu ve hedef kitle alanlarını doldurun.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Senaryo oluşturulamadı.");
      }
      setScript(payload as ShortsScript);
      setView("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmedik bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setData(createEmptyShortsConfig());
    setScript(null);
    setError("");
    setView("form");
  }

  if (view === "result" && script) {
    return (
      <div className="container-app py-10 sm:py-14">
        <ShortsResult script={script} language={data.language} onEdit={() => setView("form")} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="container-app max-w-2xl py-10 sm:py-14">
      <div className="card-shadow rounded-3xl border border-slate-100 bg-white p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Shorts Ayarları</h2>
        <p className="mb-6 text-sm text-slate-500">
          Niş, kitle, ton, süre ve dili seçin; yapay zeka sizin için tam bir Shorts senaryosu üretsin.
        </p>

        <ShortsConfigForm data={data} onChange={updateData} />

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>
        ) : null}

        <div className="mt-8 flex justify-end">
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Senaryo Oluştur
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
