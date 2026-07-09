"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image";
import { AiImageButton } from "@/components/ui/AiImageButton";
import type { DesignImageContext, DesignImageType } from "@/lib/design-prompts";

interface PhotoUploadProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  shape?: "circle" | "square";
  aiType?: DesignImageType;
  aiContext?: DesignImageContext;
  aiLabel?: string;
  promptBusinessName?: boolean;
  businessNamePromptTitle?: string;
  businessNamePlaceholder?: string;
  onBusinessNameConfirm?: (name: string) => void;
  /** @deprecated Use promptBusinessName */
  promptRestaurantName?: boolean;
  /** @deprecated Use onBusinessNameConfirm */
  onRestaurantNameConfirm?: (name: string) => void;
}

const MAX_FILE_SIZE_MB = 5;

export function PhotoUpload({
  label,
  hint,
  value,
  onChange,
  shape = "circle",
  aiType,
  aiContext,
  aiLabel,
  promptBusinessName,
  businessNamePromptTitle,
  businessNamePlaceholder,
  onBusinessNameConfirm,
  promptRestaurantName,
  onRestaurantNameConfirm,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seçin.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Görsel ${MAX_FILE_SIZE_MB}MB'dan küçük olmalı.`);
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const dataUrl = await compressImage(file, { maxDimension: 1024, quality: 0.85 });
      onChange(dataUrl);
    } catch {
      setError("Görsel yüklenemedi, tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600",
            shape === "circle" ? "rounded-full" : "rounded-2xl"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              {value ? "Değiştir" : "Fotoğraf Seç"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" /> Kaldır
              </button>
            ) : null}
          </div>
          {aiType && aiContext ? (
            <AiImageButton
              type={aiType}
              context={aiContext}
              onGenerated={onChange}
              label={aiLabel}
              promptBusinessName={promptBusinessName ?? promptRestaurantName}
              businessNamePromptTitle={businessNamePromptTitle}
              businessNamePlaceholder={businessNamePlaceholder}
              onBusinessNameConfirm={onBusinessNameConfirm ?? onRestaurantNameConfirm}
            />
          ) : null}
          {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
          {error ? <span className="text-xs font-medium text-red-500">{error}</span> : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
}
