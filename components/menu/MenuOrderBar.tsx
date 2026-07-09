"use client";

import { MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import type { MenuData } from "@/lib/types";
import type { CartLine } from "@/lib/menu-cart";
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from "@/lib/menu-cart";
import type { MenuLocaleCode } from "@/lib/menu-locales";
import { formatPrice } from "@/lib/utils";

interface MenuOrderBarProps {
  data: MenuData;
  cart: CartLine[];
  locale: MenuLocaleCode;
  onUpdateQty: (itemId: string, delta: number) => void;
}

export function MenuOrderBar({ data, cart, locale, onUpdateQty }: MenuOrderBarProps) {
  const phone = data.contactPhone?.trim();
  if (!phone || cart.length === 0) return null;

  const totalItems = cart.reduce((sum, line) => sum + line.quantity, 0);
  const message = buildWhatsAppOrderMessage(data, cart, locale);
  const whatsappUrl = buildWhatsAppOrderUrl(phone, message);

  const labels =
    locale === "en"
      ? { order: "Order via WhatsApp", items: "items" }
      : locale === "de"
        ? { order: "Über WhatsApp bestellen", items: "Artikel" }
        : locale === "ar"
          ? { order: "اطلب عبر واتساب", items: "عناصر" }
          : locale === "ru"
            ? { order: "Заказать в WhatsApp", items: "поз." }
            : { order: "WhatsApp ile Sipariş Ver", items: "ürün" };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8dfd0] bg-[#fffef9]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(44,36,25,0.08)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2">
        <div className="flex max-h-28 flex-col gap-1 overflow-y-auto text-xs text-[#6b5d4f]">
          {cart.map((line) => (
            <div key={line.itemId} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                {line.quantity}x {line.name}
                {line.price ? ` — ${formatPrice(line.price) || line.price}` : ""}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateQty(line.itemId, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5efe6] text-[#6b5d4f] hover:bg-[#ebe3d8]"
                  aria-label="Azalt"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-5 text-center font-semibold tabular-nums">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(line.itemId, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f5efe6] text-[#6b5d4f] hover:bg-[#ebe3d8]"
                  aria-label="Artır"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95"
        >
          <MessageCircle className="h-5 w-5" />
          <ShoppingBag className="h-4 w-4" />
          {labels.order} ({totalItems} {labels.items})
        </a>
      </div>
    </div>
  );
}
