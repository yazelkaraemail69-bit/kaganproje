import type { MenuData } from "@/lib/types";
import type { MenuLocaleCode, MenuTranslations } from "@/lib/menu-locales";
import { DEFAULT_MENU_LOCALE } from "@/lib/menu-locales";
import { getBusinessConfig } from "@/lib/business-config";
import { formatPrice } from "@/lib/utils";

export interface LocalizedMenuView {
  restaurantName: string;
  description: string;
  categories: Array<{
    id: string;
    name: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      price: string;
      imageUrl: string;
    }>;
  }>;
}

export function getLocalizedMenuView(data: MenuData, locale: MenuLocaleCode): LocalizedMenuView {
  const translations: MenuTranslations = data.translations ?? {};

  return {
    restaurantName:
      locale === DEFAULT_MENU_LOCALE
        ? data.restaurantName
        : translations.restaurantName?.[locale]?.trim() || data.restaurantName,
    description:
      locale === DEFAULT_MENU_LOCALE
        ? data.description
        : translations.description?.[locale]?.trim() || data.description,
    categories: data.categories.map((category) => ({
      id: category.id,
      name:
        locale === DEFAULT_MENU_LOCALE
          ? category.name
          : translations.categories?.[category.id]?.[locale]?.trim() || category.name,
      items: category.items.map((item) => {
        const itemTr = translations.items?.[item.id]?.[locale];
        return {
          id: item.id,
          name:
            locale === DEFAULT_MENU_LOCALE
              ? item.name
              : itemTr?.name?.trim() || item.name,
          description:
            locale === DEFAULT_MENU_LOCALE
              ? item.description
              : itemTr?.description?.trim() || item.description,
          price: item.price,
          imageUrl: item.imageUrl,
        };
      }),
    })),
  };
}

export interface CartLine {
  itemId: string;
  name: string;
  price: string;
  quantity: number;
}

export function parsePriceNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

export function buildWhatsAppOrderMessage(
  data: MenuData,
  cart: CartLine[],
  locale: MenuLocaleCode = DEFAULT_MENU_LOCALE
): string {
  const view = getLocalizedMenuView(data, locale);
  const config = getBusinessConfig(data.businessType);
  const lines: string[] = [];

  if (locale === "en") {
    lines.push(`Hello, I'd like to order from *${view.restaurantName}*:`);
  } else if (locale === "de") {
    lines.push(`Hallo, ich möchte bei *${view.restaurantName}* bestellen:`);
  } else if (locale === "ar") {
    lines.push(`مرحباً، أود الطلب من *${view.restaurantName}*:`);
  } else if (locale === "ru") {
    lines.push(`Здравствуйте, хочу заказать в *${view.restaurantName}*:`);
  } else {
    lines.push(`Merhaba, *${view.restaurantName}* için sipariş vermek istiyorum:`);
  }

  lines.push("");
  let total = 0;
  let hasNumericTotal = true;

  for (const line of cart) {
    const priceLabel = formatPrice(line.price) || line.price;
    lines.push(`• ${line.quantity}x ${line.name} — ${priceLabel}`);
    const unit = parsePriceNumber(line.price);
    if (unit === null) hasNumericTotal = false;
    else total += unit * line.quantity;
  }

  lines.push("");
  if (hasNumericTotal && total > 0) {
    const totalLabel =
      locale === "en"
        ? "Estimated total"
        : locale === "de"
          ? "Geschätzte Summe"
          : locale === "ar"
            ? "المجموع التقريبي"
            : locale === "ru"
              ? "Примерная сумма"
              : "Tahmini toplam";
    lines.push(`${totalLabel}: ${total.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`);
  }

  lines.push("");
  if (locale === "en") {
    lines.push("(Sent via digital menu)");
  } else if (locale === "de") {
    lines.push("(Über digitales Menü gesendet)");
  } else if (locale === "ar") {
    lines.push("(أُرسل عبر القائمة الرقمية)");
  } else if (locale === "ru") {
    lines.push("(Отправлено через цифровое меню)");
  } else {
    lines.push(`(${config.catalogTitle} üzerinden gönderildi)`);
  }

  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `90${digits.slice(1)}` : digits.startsWith("90") ? digits : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
