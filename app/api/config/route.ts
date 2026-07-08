import { NextResponse } from "next/server";
import { isOpenRouterConfigured, OPENROUTER_SETUP_HINT } from "@/lib/env/openrouter";

export async function GET() {
  const openRouter = isOpenRouterConfigured();

  return NextResponse.json({
    openRouterConfigured: openRouter,
    setupHint: openRouter ? null : OPENROUTER_SETUP_HINT,
    modules: {
      kartvizit: { ok: true, requiresOpenRouter: false },
      menu: { ok: true, requiresOpenRouter: false },
      shorts: { ok: openRouter, requiresOpenRouter: true },
      elyazisi: { ok: openRouter, requiresOpenRouter: true, backendPort: 4000 },
    },
  });
}
