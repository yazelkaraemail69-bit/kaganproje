import { put } from "@vercel/blob";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_UPLOAD_BYTES) return null;
  return { buffer, contentType };
}

export function isBlobUploadEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function uploadImageDataUrl(
  dataUrl: string,
  filename: string
): Promise<{ url: string; stored: boolean }> {
  if (!dataUrl.startsWith("data:")) {
    return { url: dataUrl, stored: false };
  }

  if (!isBlobUploadEnabled()) {
    return { url: dataUrl, stored: false };
  }

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return { url: dataUrl, stored: false };
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await put(`profiles/${safeName}`, parsed.buffer, {
    access: "public",
    contentType: parsed.contentType,
    addRandomSuffix: true,
  });

  return { url: blob.url, stored: true };
}
