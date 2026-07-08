import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A sibling project's lockfile in the parent folder confuses Next's
  // workspace-root auto-detection; pin it explicitly to this project.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // These ship native/prebuilt binaries and must run via Node's `require`
  // at runtime rather than being bundled - used by the Shorts video render
  // pipeline (lib/video/ffmpeg.ts).
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "ffprobe-static"],
};

export default nextConfig;
