import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDesignImage, DesignImageError } from "@/lib/openrouter/generate-image";

const requestSchema = z.object({
  type: z.enum(["menu-logo", "menu-item", "card-photo", "card-background"]),
  context: z
    .object({
      businessType: z
        .enum(["restaurant", "cafe", "salon", "spa", "shop", "service", "clinic", "other"])
        .optional(),
      restaurantName: z.string().optional(),
      restaurantDescription: z.string().optional(),
      itemName: z.string().optional(),
      itemDescription: z.string().optional(),
      fullName: z.string().optional(),
      title: z.string().optional(),
      company: z.string().optional(),
      themeHint: z.string().optional(),
    })
    .default({}),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await generateDesignImage({
      type: parsed.data.type,
      context: parsed.data.context,
    });
    return NextResponse.json({
      dataUrl: result.dataUrl,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    if (error instanceof DesignImageError) {
      const status = error.message.includes("OPENROUTER_API_KEY") ? 503 : error.status;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Design image error:", error);
    return NextResponse.json({ error: "Görsel oluşturulamadı." }, { status: 500 });
  }
}
