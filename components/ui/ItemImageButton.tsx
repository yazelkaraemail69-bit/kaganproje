"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/image";

interface ItemImageButtonProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
}

export function ItemImageButton({ value, onChange, label = "Ürün görseli ekle" }: ItemImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setIsLoading(true);
    try {
      const dataUrl = await compressImage(file, { maxDimension: 640, quality: 0.8 });
      onChange(dataUrl);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={label}
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-5 w-5" />
        )}
      </button>
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Görseli kaldır"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-500 shadow ring-1 ring-slate-200 transition-colors hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
