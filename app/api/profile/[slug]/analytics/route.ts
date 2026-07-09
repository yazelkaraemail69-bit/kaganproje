import { NextResponse } from "next/server";
import { getProfileAnalytics } from "@/lib/profile-store";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const analytics = await getProfileAnalytics(slug);

  if (!analytics) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(analytics);
}
