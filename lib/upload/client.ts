/** CDN'e yükle; token yoksa veya http URL ise olduğu gibi döndür. */
export async function uploadDataUrlIfPossible(
  dataUrl: string,
  filenamePrefix: string
): Promise<string> {
  if (!dataUrl?.trim()) return "";
  if (!dataUrl.startsWith("data:")) return dataUrl;

  try {
    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataUrl,
        filename: `${filenamePrefix}-${Date.now()}.jpg`,
      }),
    });
    const data = await response.json();
    if (!response.ok) return dataUrl;
    return typeof data.url === "string" ? data.url : dataUrl;
  } catch {
    return dataUrl;
  }
}

export async function uploadCardPhoto(photoUrl: string, slugHint: string): Promise<string> {
  return uploadDataUrlIfPossible(photoUrl, `card-${slugHint}`);
}

export async function uploadCatalogLogo(logoUrl: string, slugHint: string): Promise<string> {
  return uploadDataUrlIfPossible(logoUrl, `catalog-logo-${slugHint}`);
}

export async function uploadCatalogItemImage(imageUrl: string, slugHint: string, index: number): Promise<string> {
  return uploadDataUrlIfPossible(imageUrl, `catalog-item-${slugHint}-${index}`);
}
