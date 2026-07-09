import { NextResponse } from "next/server";
import { getPublishedProfile, incrementProfileViews } from "@/lib/profile-store";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const trackView = new URL(request.url).searchParams.get("track") !== "0";

  const profile = trackView ? await incrementProfileViews(slug) : await getPublishedProfile(slug);

  if (!profile) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(profile);
}
