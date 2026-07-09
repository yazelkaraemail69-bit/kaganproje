/**
 * Modelin ekledigi aciklama, markdown veya formatlama katmanini temizler.
 * JSON belge ciktilarinda icerik bozulmaz.
 */
export function cleanOcrResponse(raw: string): string {
  let text = raw.trim();

  // Markdown kod blogu varsa icini al (json veya duz).
  const fenced = text.match(/^```(?:json|JSON|text|txt)?\s*\n?([\s\S]*?)\n?```$/);
  if (fenced) {
    text = fenced[1].trim();
  } else {
    text = text
      .replace(/^```(?:json|JSON|text|txt)?\s*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
  }

  // JSON nesnesi ise prefix temizligi uygulama (alan adlarini bozmamak icin).
  if (text.startsWith("{") && text.includes('"lines"')) {
    return text.trim();
  }

  const jsonStart = text.indexOf("{");
  if (jsonStart >= 0) {
    const maybeJson = text.slice(jsonStart);
    if (maybeJson.includes('"lines"')) {
      return maybeJson.trim();
    }
  }

  const prefixPatterns = [
    /^(işte|iste)\s+(transkripsiyon|metin)[:\s]*/i,
    /^(transkripsiyon|transcription|ceviri|translation)[:\s]*/i,
    /^el\s*yazisi\s*(metni|transkripsiyonu)?[:\s]*/i,
    /^(aşağıda|asagida)[:\s]*/i,
  ];

  for (const pattern of prefixPatterns) {
    text = text.replace(pattern, "");
  }

  return text.trim();
}
