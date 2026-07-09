/** ISO/IEC 18004 — logo overlay ve baskı için yüksek hata toleransı (%30). */
export const QR_ERROR_CORRECTION_LEVEL = "H" as const;

/** Quiet zone: minimum 4 modül (qrcode.react marginSize). */
export const QR_MARGIN_MODULES = 4;

/** Önerilen canvas boyutu (px). */
export const QR_DEFAULT_SIZE = 200;

/** Level H ile güvenle taranabilir URL üst sınırı (kısa slug URL'ler için bol marj). */
export const QR_SAFE_MAX_LENGTH = 2048;
