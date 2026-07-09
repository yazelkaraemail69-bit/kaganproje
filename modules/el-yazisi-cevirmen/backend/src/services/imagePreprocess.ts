import sharp from "sharp";

export interface PreprocessOptions {
  /** Varsayılan true — EXIF, resize, grayscale */
  normalize?: boolean;
  /** Kontrast / normalize güçlendir */
  enhanceContrast?: boolean;
  /** Siyah-beyaz eşik (el yazısı için agresif) */
  binarize?: boolean;
  /** Hafif median ile gürültü azaltma */
  denoise?: boolean;
  /** Uzun kenar üst sınırı (px) */
  maxEdge?: number;
}

export interface PreprocessResult {
  base64: string;
  mimeType: string;
  applied: boolean;
  width?: number;
  height?: number;
}

function stripDataUrl(base64: string): { buffer: Buffer; mimeType?: string } {
  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { buffer: Buffer.from(match[2], "base64"), mimeType: match[1] };
  }
  return { buffer: Buffer.from(base64, "base64") };
}

/**
 * El yazısı OCR için görüntü ön işleme:
 * EXIF rotate, max kenar, grayscale, gürültü azaltma, kontrast, opsiyonel binarizasyon.
 */
export async function preprocessHandwritingImage(
  imageBase64: string,
  mimeType: string,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> {
  const {
    normalize = true,
    enhanceContrast = false,
    binarize = false,
    denoise = true,
    maxEdge = 2048,
  } = options;

  if (!normalize && !enhanceContrast && !binarize && !denoise) {
    return { base64: imageBase64, mimeType, applied: false };
  }

  const { buffer } = stripDataUrl(imageBase64);

  let pipeline = sharp(buffer, { failOn: "none" }).rotate();

  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w > 0 && h > 0) {
    const longEdge = Math.max(w, h);
    if (longEdge > maxEdge) {
      pipeline = pipeline.resize({
        width: w >= h ? maxEdge : undefined,
        height: h > w ? maxEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
  }

  pipeline = pipeline.grayscale();

  if (denoise) {
    // 3x3 median: sensör/JPEG gürültüsünü azaltır, mürekkep kenarlarını fazla yumuşatmaz
    pipeline = pipeline.median(3);
  }

  if (enhanceContrast || binarize || normalize) {
    pipeline = pipeline.normalize();
  }

  // Kontrastı biraz daha aç (el yazısı / kağıt ayrımı)
  if (enhanceContrast && !binarize) {
    pipeline = pipeline.linear(1.15, -8);
  }

  if (binarize) {
    pipeline = pipeline.threshold(168);
  }

  const out = await pipeline.png().toBuffer({ resolveWithObject: true });
  const outMeta = out.info;

  return {
    base64: out.data.toString("base64"),
    mimeType: "image/png",
    applied: true,
    width: outMeta.width,
    height: outMeta.height,
  };
}
