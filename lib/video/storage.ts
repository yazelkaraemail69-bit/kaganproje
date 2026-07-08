import { promises as fs } from "node:fs";
import path from "node:path";

const LOCAL_OUTPUT_DIR = path.join(process.cwd(), "public", "generated-shorts");

/**
 * Persists the final rendered mp4 and returns a publicly reachable URL.
 *
 * - If `BLOB_READ_WRITE_TOKEN` is configured (Vercel Blob), the file is
 *   uploaded there - the right choice for a real Vercel deployment, since
 *   serverless functions don't share a persistent/writable filesystem.
 * - Otherwise it's written under `public/generated-shorts/`, which works
 *   for local development and traditional long-running Node servers.
 */
export async function saveFinalVideo(buffer: Buffer, jobId: string): Promise<string> {
  const fileName = `${jobId}.mp4`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`generated-shorts/${fileName}`, buffer, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  await fs.mkdir(LOCAL_OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_OUTPUT_DIR, fileName), buffer);
  return `/generated-shorts/${fileName}`;
}
