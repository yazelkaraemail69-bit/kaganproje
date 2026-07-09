/**
 * Araştırma tabanlı görsel prompt şablonları.
 * Menü: mobil-öncelikli QR menü, iştah açıcı fotoğraf, minimal tipografi.
 * Kartvizit: 2025 minimal-profesyonel, güçlü hiyerarşi, yüksek kontrast.
 */

import { getBusinessConfig, type BusinessType } from "@/lib/business-config";

export type DesignImageType = "menu-logo" | "menu-item" | "card-photo" | "card-background";

export interface DesignImageContext {
  businessType?: BusinessType;
  restaurantName?: string;
  restaurantDescription?: string;
  itemName?: string;
  itemDescription?: string;
  fullName?: string;
  title?: string;
  company?: string;
  themeHint?: string;
}

function buildMenuLogoPrompt(brand: string, ctx: DesignImageContext): string {
  const config = getBusinessConfig(ctx.businessType);
  const theme = ctx.themeHint?.trim();

  return [
    `Professional logo emblem for a Turkish ${config.aiLogoIndustry} business named "${brand}".`,
    `The icon should visually evoke the identity, atmosphere and values of "${brand}" — symbolic only, no letters, no words, no typography.`,
    ctx.restaurantDescription ? `Business concept: ${ctx.restaurantDescription}.` : "",
    theme ? `Color palette mood: ${theme}.` : "Professional, trustworthy brand colors suitable for digital catalog.",
    "Clean vector-style logo mark, centered composition, crisp edges, suitable for catalog header.",
    "No text, no watermark, no mockup frame, square format.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildMenuItemPrompt(brand: string, ctx: DesignImageContext): string {
  const config = getBusinessConfig(ctx.businessType);
  const item = ctx.itemName?.trim() || config.itemLabel;

  const stylePrompts: Record<typeof config.aiItemStyle, string[]> = {
    food: [
      `Professional food photography of "${item}" for a premium QR menu.`,
      ctx.itemDescription ? `Details: ${ctx.itemDescription}.` : "",
      `Business: ${brand}.`,
      "Overhead or 45-degree hero shot, shallow depth of field, natural window light.",
      "Appetizing colors, realistic plating, clean neutral background.",
    ],
    product: [
      `Professional product photography of "${item}" for a retail catalog.`,
      ctx.itemDescription ? `Details: ${ctx.itemDescription}.` : "",
      `Store: ${brand}.`,
      "Clean studio or lifestyle product shot, sharp focus, neutral or soft background.",
      "E-commerce catalog quality, realistic materials and colors.",
    ],
    beauty: [
      `Elegant beauty and salon service visual representing "${item}".`,
      ctx.itemDescription ? `Details: ${ctx.itemDescription}.` : "",
      `Salon: ${brand}.`,
      "Soft professional lighting, refined aesthetic, clean composition.",
      "Suitable for hair salon or beauty studio service catalog, no faces required.",
    ],
    service: [
      `Professional service catalog image representing "${item}".`,
      ctx.itemDescription ? `Details: ${ctx.itemDescription}.` : "",
      `Business: ${brand}.`,
      "Clean, trustworthy visual metaphor for the service, modern professional style.",
      "Neutral background, no text, suitable for price list thumbnail.",
    ],
    generic: [
      `Professional catalog image for "${item}".`,
      ctx.itemDescription ? `Details: ${ctx.itemDescription}.` : "",
      `Business: ${brand}.`,
      "Clean commercial photography, neutral background, sharp focus.",
    ],
  };

  return [
    ...stylePrompts[config.aiItemStyle],
    "No text, no watermark, square format, mobile catalog thumbnail quality.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildDesignImagePrompt(type: DesignImageType, ctx: DesignImageContext): string {
  const brand = ctx.restaurantName?.trim() || ctx.company?.trim() || "brand";
  const theme = ctx.themeHint?.trim();

  switch (type) {
    case "menu-logo":
      return buildMenuLogoPrompt(brand, ctx);

    case "menu-item":
      return buildMenuItemPrompt(brand, ctx);

    case "card-photo": {
      const person = ctx.fullName?.trim() || "professional";
      const role = [ctx.title, ctx.company].filter(Boolean).join(" at ");
      return [
        `Professional corporate headshot portrait of ${person}.`,
        role ? `Role: ${role}.` : "",
        "Neutral studio background, soft key light, business attire, confident friendly expression.",
        "LinkedIn-quality, chest-up framing, natural skin tones, no text, no watermark.",
        "Suitable for modern minimalist business card, square crop.",
      ]
        .filter(Boolean)
        .join(" ");
    }

    case "card-background":
      return [
        `Abstract premium business card background for ${brand || "a professional"}.`,
        theme ? `Palette: ${theme}.` : "Sophisticated navy, charcoal, or soft neutral gradient.",
        "Subtle geometric texture or soft gradient, minimal, elegant, no text, no logo, no watermark.",
        "Corporate 2025 design trend: minimal but memorable, high contrast ready.",
        "Landscape card proportions, smooth color transitions.",
      ]
        .filter(Boolean)
        .join(" ");
  }
}

export function aspectRatioForType(type: DesignImageType): "1:1" | "4:3" | "3:4" | "16:9" {
  if (type === "card-background") return "16:9";
  if (type === "menu-item") return "1:1";
  return "1:1";
}
