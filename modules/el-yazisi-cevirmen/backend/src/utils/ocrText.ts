/**
 * Modelin ekledigi aciklama, markdown veya formatlama katmanini temizler.
 */
export function cleanOcrResponse(raw: string): string {
  let text = raw.trim();

  // Markdown kod blogu varsa icini al.
  const fenced = text.match(/^```(?:\w+)?\s*\n([\s\S]*?)\n```$/);
  if (fenced) {
    text = fenced[1].trim();
  }

  text = text
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  const prefixPatterns = [
    /^(işte|iste)\s+(transkripsiyon|metin)[:\s]*/i,
    /^(transkripsiyon|transcription|ceviri|translation)[:\s]*/i,
    /^el\s*yazisi\s*(metni|transkripsiyonu)?[:\s]*/i,
    /^aşağıda|asagida[:\s]*/i,
  ];

  for (const pattern of prefixPatterns) {
    text = text.replace(pattern, "");
  }

  return text.trim();
}
