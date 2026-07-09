"use client";

import { useEffect, useMemo, useState } from "react";
import { ChefHat, Flame, Plus } from "lucide-react";
import { MenuLocaleSwitcher } from "@/components/menu/MenuLocaleSwitcher";
import { getBusinessConfig, type BusinessType } from "@/lib/business-config";
import type { MenuCategory, MenuData, MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import type { MenuVisualStyle } from "@/lib/menu-visual";
import { cn } from "@/lib/utils";
import { getLocalizedMenuView } from "@/lib/menu-cart";
import {
  DEFAULT_MENU_LOCALE,
  resolveEnabledLocales,
  type MenuLocaleCode,
} from "@/lib/menu-locales";

interface MenuBodyProps {
  data: MenuData;
  style: MenuVisualStyle;
  locale?: MenuLocaleCode;
  onLocaleChange?: (locale: MenuLocaleCode) => void;
  orderMode?: boolean;
  cartQtyByItem?: Record<string, number>;
  onAddToCart?: (item: { id: string; name: string; price: string }) => void;
}

function AddToCartButton({
  itemId,
  qty,
  onAdd,
  accentColor,
}: {
  itemId: string;
  qty: number;
  onAdd: (itemId: string) => void;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(itemId)}
      className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
      style={{ backgroundColor: accentColor }}
      aria-label="Sepete ekle"
    >
      <Plus className="h-3.5 w-3.5" />
      {qty > 0 ? qty : ""}
    </button>
  );
}

function MenuCover({
  businessType,
  restaurantName,
  description,
  logoUrl,
  style,
}: {
  businessType: BusinessType;
  restaurantName: string;
  description: string;
  logoUrl: string;
  style: MenuVisualStyle;
}) {
  const config = getBusinessConfig(businessType);
  const isDarkHeader = !style.isLight && style.layoutId !== "minimal";

  return (
    <header
      className={cn(
        "relative px-5 pb-6 pt-8 text-center sm:px-8",
        style.layoutId === "minimal" ? "border-b border-[#e8dfd0] bg-[#fffef9]" : ""
      )}
      style={
        style.layoutId === "minimal"
          ? undefined
          : {
              backgroundImage: `linear-gradient(165deg, ${style.headerFrom}, ${style.headerTo})`,
              color: style.headerTextColor,
            }
      }
    >
      {style.layoutId !== "minimal" ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, ${style.headerTextColor} 0, ${style.headerTextColor} 1px, transparent 1px, transparent 8px)`,
            }}
          />
        </>
      ) : null}

      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="relative mx-auto mb-4 h-16 w-16 rounded-full border-2 object-cover shadow-md"
          style={{
            borderColor: style.layoutId === "minimal" ? "#e8dfd0" : style.panelBorder,
          }}
        />
      ) : null}

      <p
        className={cn(
          "relative mb-1 text-[10px] font-semibold uppercase tracking-[0.35em]",
          style.layoutId === "minimal" ? "text-[#a08f7a]" : ""
        )}
        style={isDarkHeader ? { color: style.mutedText } : undefined}
      >
        {config.catalogTitle}
      </p>
      <h1
        className={cn(
          "font-menu-display relative text-3xl font-bold leading-tight sm:text-4xl",
          style.layoutId === "minimal" ? "text-[#2c2419]" : ""
        )}
        style={isDarkHeader ? { color: style.headerTextColor } : undefined}
      >
        {restaurantName || config.businessNameFallback}
      </h1>
      {description ? (
        <p
          className={cn(
            "font-menu-body relative mx-auto mt-2 max-w-sm text-base italic leading-relaxed",
            style.layoutId === "minimal" ? "text-[#6b5d4f]" : ""
          )}
          style={isDarkHeader ? { color: style.mutedText } : undefined}
        >
          {description}
        </p>
      ) : null}
      <div
        className="relative mx-auto mt-4 h-px w-24"
        style={{ backgroundColor: style.accentColor }}
      />
    </header>
  );
}

function CategoryTitle({ name, style }: { name: string; style: MenuVisualStyle }) {
  return (
    <div className="menu-category-rule mb-5" style={{ "--menu-accent": style.accentColor } as React.CSSProperties}>
      <h2
        className="font-menu-display shrink-0 text-lg font-bold uppercase tracking-[0.2em] text-[#3d3428] sm:text-xl"
        style={{ color: style.layoutId === "minimal" ? style.accentColor : "#3d3428" }}
      >
        {name || "Kategori"}
      </h2>
    </div>
  );
}

/** Klasik restoran satırı: isim ········· fiyat */
function MenuItemClassic({
  item,
  style,
  featured,
  featuredBadge,
  orderMode,
  cartQty,
  onAddToCart,
}: {
  item: MenuItem;
  style: MenuVisualStyle;
  featured?: boolean;
  featuredBadge: string;
  orderMode?: boolean;
  cartQty?: number;
  onAddToCart?: (itemId: string) => void;
}) {
  const price = formatPrice(item.price);

  return (
    <article className={cn(featured && "rounded-xl border border-[#e8dfd0] bg-white/60 p-3")}>
      {featured ? (
        <span
          className="mb-2 inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: style.accentColor }}
        >
          <ChefHat className="h-3 w-3" /> {featuredBadge}
        </span>
      ) : null}

      <div className={cn("flex gap-3", item.imageUrl ? "items-start" : "items-end")}>
        <div className="min-w-0 flex-1">
          <div className="menu-price-line">
            <span className="font-menu-body text-[17px] font-semibold leading-snug text-[#2c2419] sm:text-lg">
              {item.name}
            </span>
            {price ? <span className="menu-price-dots" aria-hidden /> : null}
            {price ? (
              <span
                className="font-menu-body shrink-0 text-[17px] font-bold tabular-nums text-[#2c2419] sm:text-lg"
                style={{ color: style.accentColor }}
              >
                {price}
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="font-menu-body mt-1.5 text-sm leading-relaxed text-[#6b5d4f]">{item.description}</p>
          ) : null}
        </div>
        {orderMode && onAddToCart ? (
          <AddToCartButton
            itemId={item.id}
            qty={cartQty ?? 0}
            onAdd={onAddToCart}
            accentColor={style.accentColor}
          />
        ) : null}
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-20 w-20 shrink-0 rounded-lg border border-[#e8dfd0] object-cover shadow-sm sm:h-24 sm:w-24"
          />
        ) : null}
      </div>
    </article>
  );
}

/** Lokanta / kebapçı tarzı: büyük fotoğraflı kart */
function MenuItemPhotoCard({
  item,
  style,
  featured,
  popularBadge,
  orderMode,
  cartQty,
  onAddToCart,
}: {
  item: MenuItem;
  style: MenuVisualStyle;
  featured?: boolean;
  popularBadge: string;
  orderMode?: boolean;
  cartQty?: number;
  onAddToCart?: (itemId: string) => void;
}) {
  const price = formatPrice(item.price);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-[#e8dfd0] bg-white shadow-sm",
        featured && "ring-2 ring-offset-2"
      )}
      style={
        featured
          ? ({ "--tw-ring-color": style.accentColor } as React.CSSProperties)
          : undefined
      }
    >
      {item.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
          {featured ? (
            <span
              className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase text-white shadow"
              style={{ backgroundColor: style.accentColor }}
            >
              <Flame className="h-3 w-3" /> {popularBadge}
            </span>
          ) : null}
        </div>
      ) : (
        <div
          className="flex aspect-[3/2] items-center justify-center text-sm text-[#a08f7a]"
          style={{ backgroundColor: `${style.accentColor}12` }}
        >
          {item.name}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-menu-body text-lg font-semibold text-[#2c2419]">{item.name}</h3>
          <div className="flex shrink-0 items-center gap-2">
            {price ? (
              <span className="font-menu-body text-lg font-bold tabular-nums" style={{ color: style.accentColor }}>
                {price}
              </span>
            ) : null}
            {orderMode && onAddToCart ? (
              <AddToCartButton
                itemId={item.id}
                qty={cartQty ?? 0}
                onAdd={onAddToCart}
                accentColor={style.accentColor}
              />
            ) : null}
          </div>
        </div>
        {item.description ? (
          <p className="font-menu-body mt-1.5 text-sm leading-relaxed text-[#6b5d4f]">{item.description}</p>
        ) : null}
      </div>
    </article>
  );
}

/** Fine dining: ortalanmış, sade */
function MenuItemFine({
  item,
  style,
  orderMode,
  cartQty,
  onAddToCart,
}: {
  item: MenuItem;
  style: MenuVisualStyle;
  orderMode?: boolean;
  cartQty?: number;
  onAddToCart?: (itemId: string) => void;
}) {
  const price = formatPrice(item.price);
  return (
    <article className="text-center">
      <h3 className="font-menu-display text-xl font-semibold text-[#2c2419]">{item.name}</h3>
      {item.description ? (
        <p className="font-menu-body mx-auto mt-2 max-w-xs text-sm italic leading-relaxed text-[#6b5d4f]">
          {item.description}
        </p>
      ) : null}
      {price ? (
        <p className="font-menu-body mt-2 text-base font-semibold tabular-nums" style={{ color: style.accentColor }}>
          {price}
        </p>
      ) : null}
      {orderMode && onAddToCart ? (
        <div className="mt-3 flex justify-center">
          <AddToCartButton
            itemId={item.id}
            qty={cartQty ?? 0}
            onAdd={onAddToCart}
            accentColor={style.accentColor}
          />
        </div>
      ) : null}
      <div className="mx-auto mt-4 h-px w-8 bg-[#e8dfd0]" />
    </article>
  );
}

export function MenuPreviewBody({
  data,
  style,
  locale: localeProp,
  onLocaleChange,
  orderMode = false,
  cartQtyByItem = {},
  onAddToCart,
}: MenuBodyProps) {
  const config = getBusinessConfig(data.businessType);
  const enabledLocales = resolveEnabledLocales(data.enabledLocales);
  const [internalLocale, setInternalLocale] = useState<MenuLocaleCode>(DEFAULT_MENU_LOCALE);
  const locale = localeProp ?? internalLocale;
  const setLocale = onLocaleChange ?? setInternalLocale;

  const localized = useMemo(() => getLocalizedMenuView(data, locale), [data, locale]);
  const categories: MenuCategory[] = useMemo(
    () =>
      localized.categories.map((category) => ({
        id: category.id,
        name: category.name,
        items: category.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
        })),
      })),
    [localized.categories]
  );

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.items.some((item) => item.name.trim())),
    [categories]
  );

  const [activeCategory, setActiveCategory] = useState(visibleCategories[0]?.id ?? "");
  const layout = style.layoutId;

  useEffect(() => {
    if (visibleCategories.length && !visibleCategories.some((c) => c.id === activeCategory)) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCategory]);

  const handleAddToCart = (itemId: string) => {
    if (!onAddToCart) return;
    const item = categories.flatMap((c) => c.items).find((i) => i.id === itemId);
    if (item) onAddToCart({ id: item.id, name: item.name, price: item.price });
  };

  return (
    <div
      className="menu-sheet menu-sheet-frame w-full overflow-hidden rounded-sm"
      style={{ "--menu-accent": style.accentColor } as React.CSSProperties}
    >
      <MenuCover
        businessType={data.businessType}
        restaurantName={localized.restaurantName}
        description={localized.description}
        logoUrl={data.logoUrl}
        style={style}
      />

      <MenuLocaleSwitcher
        locales={enabledLocales}
        active={locale}
        onChange={setLocale}
        accentColor={style.accentColor}
      />

      {visibleCategories.length > 1 ? (
        <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-[#e8dfd0] bg-[#fffef9]/95 px-4 py-2.5 backdrop-blur-sm scrollbar-none">
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                document.getElementById(`menu-cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
                activeCategory === cat.id
                  ? "text-white shadow-sm"
                  : "bg-[#f5efe6] text-[#6b5d4f] hover:bg-[#ebe3d8]"
              )}
              style={activeCategory === cat.id ? { backgroundColor: style.accentColor } : undefined}
            >
              {cat.name || "Kategori"}
            </button>
          ))}
        </nav>
      ) : null}

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {visibleCategories.length === 0 ? (
          <p className="font-menu-body py-12 text-center text-base text-[#a08f7a]">{config.emptyItemsMessage}</p>
        ) : (
          <div className="flex flex-col gap-10 sm:gap-12">
            {visibleCategories.map((category) => {
              const items = category.items.filter((item) => item.name.trim());
              const isPhotoLayout = layout === "gallery" || layout === "bistro";

              return (
                <section key={category.id} id={`menu-cat-${category.id}`} className="scroll-mt-14">
                  <CategoryTitle name={category.name} style={style} />

                  {layout === "minimal" ? (
                    <div className="flex flex-col gap-8">
                      {items.map((item) => (
                        <MenuItemFine
                          key={item.id}
                          item={item}
                          style={style}
                          orderMode={orderMode}
                          cartQty={cartQtyByItem[item.id]}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  ) : isPhotoLayout ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {items.map((item, index) => (
                        <MenuItemPhotoCard
                          key={item.id}
                          item={item}
                          style={style}
                          featured={layout === "bistro" && index === 0}
                          popularBadge={config.popularBadge}
                          orderMode={orderMode}
                          cartQty={cartQtyByItem[item.id]}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 sm:gap-6">
                      {items.map((item, index) => (
                        <MenuItemClassic
                          key={item.id}
                          item={item}
                          style={style}
                          featured={index === 0 && !item.imageUrl}
                          featuredBadge={config.featuredBadge}
                          orderMode={orderMode}
                          cartQty={cartQtyByItem[item.id]}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <footer className="font-menu-body mt-10 border-t border-[#e8dfd0] pt-4 text-center text-xs text-[#a08f7a]">
          {config.footer}
        </footer>
      </div>
    </div>
  );
}
