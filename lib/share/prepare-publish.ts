import type { ShareableCard, ShareableCatalog } from "@/lib/domains/profile/types";
import type { BusinessCardData, MenuData } from "@/lib/types";
import { toShareableCard } from "@/lib/share/card";
import {
  uploadCardPhoto,
  uploadCatalogItemImage,
  uploadCatalogLogo,
} from "@/lib/upload/client";

export async function prepareCardPayload(data: BusinessCardData, slugHint: string): Promise<ShareableCard> {
  const base = toShareableCard(data);
  if (!data.photoUrl?.startsWith("data:")) {
    return { ...base, photoUrl: data.photoUrl || undefined };
  }
  const photoUrl = await uploadCardPhoto(data.photoUrl, slugHint);
  return { ...base, photoUrl: photoUrl || undefined };
}

export async function prepareCatalogPayload(
  data: MenuData,
  slugHint: string,
  colors?: string[]
): Promise<ShareableCatalog> {
  let logoUrl = data.logoUrl;
  if (logoUrl?.startsWith("data:")) {
    logoUrl = await uploadCatalogLogo(logoUrl, slugHint);
  }

  let itemIndex = 0;
  const categories = await Promise.all(
    data.categories
      .map((category) => ({
        id: category.id,
        name: category.name.trim(),
        items: category.items.filter((item) => item.name.trim()),
      }))
      .filter((category) => category.items.length > 0)
      .map(async (category) => ({
        id: category.id,
        name: category.name,
        items: await Promise.all(
          category.items.map(async (item) => {
            const idx = itemIndex++;
            let imageUrl = item.imageUrl;
            if (imageUrl?.startsWith("data:")) {
              imageUrl = await uploadCatalogItemImage(imageUrl, slugHint, idx);
            }
            return {
              id: item.id,
              name: item.name.trim(),
              price: item.price.trim(),
              description: item.description.trim().slice(0, 100),
              imageUrl: imageUrl || undefined,
            };
          })
        ),
      }))
  );

  return {
    businessType: data.businessType,
    restaurantName: data.restaurantName.trim(),
    description: data.description.trim().slice(0, 160),
    themeId: data.themeId,
    layoutId: data.layoutId,
    colors: colors && colors.length >= 2 ? colors.slice(0, 3) : undefined,
    logoUrl: logoUrl || undefined,
    contactPhone: data.contactPhone?.trim() || undefined,
    enabledLocales: data.enabledLocales?.length ? data.enabledLocales : undefined,
    translations: data.translations,
    categories,
  };
}
