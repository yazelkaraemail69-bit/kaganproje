import { NextResponse } from "next/server";
import { z } from "zod";
import { uploadImageDataUrl } from "@/lib/upload/blob";

const requestSchema = z.object({
  dataUrl: z.string().min(1),
  filename: z.string().min(1).max(120).optional(),
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
    return NextResponse.json({ error: "Geçersiz görsel verisi." }, { status: 400 });
  }

  try {
    const result = await uploadImageDataUrl(
      parsed.data.dataUrl,
      parsed.data.filename ?? `upload-${Date.now()}.jpg`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { url: parsed.data.dataUrl, stored: false, error: "CDN yüklemesi başarısız." },
      { status: 200 }
    );
  }
}
