interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

function drawToDataUrl(img: HTMLImageElement, maxDimension: number, quality: number): string {
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Reads a File, downscales it, and re-encodes it as a compact JPEG data URL. */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<string> {
  const { maxDimension = 1024, quality = 0.85 } = options;
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await loadImageFromSrc(rawDataUrl);
  return drawToDataUrl(img, maxDimension, quality);
}

/** Further downscales an existing data URL, e.g. before embedding it in a shareable QR link. */
export async function downscaleDataUrl(dataUrl: string, maxDimension: number, quality: number): Promise<string> {
  const img = await loadImageFromSrc(dataUrl);
  return drawToDataUrl(img, maxDimension, quality);
}
