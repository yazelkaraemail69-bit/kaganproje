"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { DesignImageContext, DesignImageType } from "@/lib/design-prompts";

interface AiImageButtonProps {
  type: DesignImageType;
  context: DesignImageContext;
  onGenerated: (dataUrl: string) => void;
  label?: string;
  disabled?: boolean;
  /** menu-logo: işletme adı sor */
  promptBusinessName?: boolean;
  businessNamePromptTitle?: string;
  businessNamePlaceholder?: string;
  onBusinessNameConfirm?: (name: string) => void;
  /** @deprecated Use promptBusinessName */
  promptRestaurantName?: boolean;
  /** @deprecated Use onBusinessNameConfirm */
  onRestaurantNameConfirm?: (name: string) => void;
}

export function AiImageButton({
  type,
  context,
  onGenerated,
  label = "AI ile Oluştur",
  disabled = false,
  promptBusinessName = false,
  businessNamePromptTitle = "Logo hangi işletme için?",
  businessNamePlaceholder = "Örn. İşletme Adı",
  onBusinessNameConfirm,
  promptRestaurantName = false,
  onRestaurantNameConfirm,
}: AiImageButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNameForm, setShowNameForm] = useState(false);
  const [nameInput, setNameInput] = useState(context.restaurantName?.trim() ?? "");

  const shouldPromptName = type === "menu-logo" && (promptBusinessName || promptRestaurantName);
  const confirmName = onBusinessNameConfirm ?? onRestaurantNameConfirm;

  async function runGenerate(contextOverride: DesignImageContext) {
    const name = contextOverride.restaurantName?.trim();
    if (type === "menu-logo" && !name) {
      setError("Lütfen işletme adını girin.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/design/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context: contextOverride }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Görsel oluşturulamadı.");
      }
      if (!data.dataUrl?.startsWith("data:")) {
        throw new Error("Geçersiz görsel yanıtı.");
      }
      onGenerated(data.dataUrl);
      setShowNameForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Görsel oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  }

  function handleMainClick() {
    if (shouldPromptName) {
      setNameInput(context.restaurantName?.trim() ?? "");
      setError("");
      setShowNameForm(true);
      return;
    }
    void runGenerate(context);
  }

  function handleLogoSubmit() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("İşletme adı zorunludur.");
      return;
    }
    confirmName?.(trimmed);
    void runGenerate({ ...context, restaurantName: trimmed });
  }

  if (showNameForm && shouldPromptName) {
    return (
      <div className="flex w-full max-w-xs flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3">
        <p className="text-xs font-semibold text-violet-900">{businessNamePromptTitle}</p>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => {
            setNameInput(e.target.value);
            setError("");
          }}
          placeholder={businessNamePlaceholder}
          className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogoSubmit();
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLogoSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Oluşturuluyor..." : "Logoyu Oluştur"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNameForm(false);
              setError("");
            }}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white"
          >
            İptal
          </button>
        </div>
        {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleMainClick}
        disabled={disabled || loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? "Oluşturuluyor..." : label}
      </button>
      {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
    </div>
  );
}
