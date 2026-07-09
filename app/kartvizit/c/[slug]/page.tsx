import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSlugViewClient } from "@/components/kartvizit/CardSlugViewClient";
import { buildCardPublicUrl } from "@/lib/share/publish";
import { loadPublishedProfile, publishedProfileToCardData } from "@/lib/profile-loader";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadPublishedProfile(slug, { trackView: false });
  if (!profile || profile.type !== "card") {
    return { title: "Dijital Kartvizit" };
  }

  const name = profile.displayName;
  const title = profile.payload && "title" in profile.payload ? profile.payload.title : "";
  const company = profile.payload && "company" in profile.payload ? profile.payload.company : "";

  return {
    title: `${name} | Dijital Kartvizit`,
    description: [title, company].filter(Boolean).join(" · ") || `${name} dijital kartviziti`,
    openGraph: {
      title: name,
      description: title || "Profesyonel dijital kartvizit",
      type: "profile",
    },
  };
}

export default async function CardPublicPage({ params }: PageProps) {
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
  const data = profile ? publishedProfileToCardData(profile) : null;

  if (!profile || !data || profile.type !== "card") {
    notFound();
  }

  const shareUrl = buildCardPublicUrl(slug, origin);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Dijital Kartvizit" />
      <CardSlugViewClient data={data} shareUrl={shareUrl} />
    </main>
  );
}
