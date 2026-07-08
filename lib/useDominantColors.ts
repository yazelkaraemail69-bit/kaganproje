"use client";

import { useEffect, useState } from "react";
import { extractDominantColors } from "@/lib/colors";

/** Extracts up to `count` dominant colors from an image URL, recomputed whenever it changes. */
export function useDominantColors(imageUrl: string, count = 3): string[] {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const source = imageUrl ? extractDominantColors(imageUrl, count) : Promise.resolve<string[]>([]);

    source.then((result) => {
      if (!cancelled) setColors(result);
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, count]);

  return colors;
}
