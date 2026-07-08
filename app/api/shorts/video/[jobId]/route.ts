import { NextResponse } from "next/server";
import { getVideoJob } from "@/lib/video/job-store";

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = getVideoJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "İş bulunamadı ya da süresi doldu." }, { status: 404 });
  }

  return NextResponse.json(job);
}
