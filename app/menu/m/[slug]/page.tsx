import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuSlugViewClient } from "@/components/menu/MenuSlugViewClient";
import { getBusinessConfig } from "@/lib/business-config";
import { buildCatalogPublicUrl } from "@/lib/share/publish";
import { loadPublishedProfile, publishedProfileToMenuData } from "@/lib/profile-loader";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadPublishedProfile(slug, { trackView: false });
  if (!profile || profile.type !== "catalog") {
    return { title: "Dijital Katalog" };
  }

  const payload = profile.payload;
  const businessType =
    payload && "businessType" in payload ? payload.businessType : undefined;
  const config = getBusinessConfig(businessType);
  const description =
    payload && "description" in payload ? payload.description : "";

  return {
    title: `${profile.displayName} | ${config.catalogTitle}`,
    description: description || `${profile.displayName} dijital ${config.catalogTitle.toLowerCase()}`,
    openGraph: {
      title: profile.displayName,
      description: description || config.catalogTitle,
      type: "website",
    },
  };
}

export default async function MenuPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";

  const profile = await loadPublishedProfile(slug, {
    trackView: true,
    userAgent: headerList.get("user-agent") ?? undefined,
    referer: headerList.get("referer") ?? undefined,
    origin,
  });
  const data = profile ? publishedProfileToMenuData(profile) : null;

  if (!profile || !data || profile.type !== "catalog") {
    notFound();
  }

  const config = getBusinessConfig(data.businessType);
  const shareUrl = buildCatalogPublicUrl(slug, origin);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title={`Dijital ${config.catalogTitle}`} />
      <MenuSlugViewClient data={data} shareUrl={shareUrl} />
    </main>
  );
}
