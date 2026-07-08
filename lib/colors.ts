function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Perceived luminance (0-255), used to pick a readable black/white text color. */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function getReadableTextColor(hex: string): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#ffffff";
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return relativeLuminance(r, g, b) > 150 ? "#0f172a" : "#ffffff";
}

/**
 * Extracts up to `count` dominant colors from an image by quantizing pixels
 * into buckets and returning the most frequent ones. Runs entirely on the
 * client via a scratch canvas; skips fully/mostly transparent pixels.
 */
export async function extractDominantColors(imageUrl: string, count = 3): Promise<string[]> {
  if (!imageUrl || typeof window === "undefined") return [];

  let img: HTMLImageElement;
  try {
    img = await loadImageElement(imageUrl);
  } catch {
    return [];
  }

  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, size, size);

  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return [];
  }

  const BUCKET = 32;
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < 200) continue;

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const key = `${Math.round(r / BUCKET)}-${Math.round(g / BUCKET)}-${Math.round(b / BUCKET)}`;

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((bucket) => rgbToHex(Math.round(bucket.r / bucket.count), Math.round(bucket.g / bucket.count), Math.round(bucket.b / bucket.count)));
}
