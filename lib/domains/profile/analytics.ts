export type ViewDevice = "mobile" | "tablet" | "desktop" | "unknown";

export type ViewSource = "qr" | "direct" | "referral" | "unknown";

export interface ViewEvent {
  at: string;
  device: ViewDevice;
  source: ViewSource;
}

export interface ProfileAnalyticsSummary {
  slug: string;
  displayName: string;
  type: "card" | "catalog";
  viewCount: number;
  publishedAt: string;
  updatedAt: string;
  lastViewedAt: string | null;
  viewsByDay: Array<{ date: string; count: number }>;
  deviceBreakdown: Record<ViewDevice, number>;
  sourceBreakdown: Record<ViewSource, number>;
}

const MAX_STORED_EVENTS = 200;

export function parseViewDevice(userAgent: string | undefined): ViewDevice {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) return "mobile";
  if (/android/.test(ua)) return "tablet";
  return "desktop";
}

export function parseViewSource(referer: string | undefined, origin?: string): ViewSource {
  if (!referer) return "qr";
  if (origin && referer.startsWith(origin)) return "direct";
  return "referral";
}

export function createViewEvent(meta?: { userAgent?: string; referer?: string; origin?: string }): ViewEvent {
  return {
    at: new Date().toISOString(),
    device: parseViewDevice(meta?.userAgent),
    source: parseViewSource(meta?.referer, meta?.origin),
  };
}

export function trimViewEvents(events: ViewEvent[]): ViewEvent[] {
  if (events.length <= MAX_STORED_EVENTS) return events;
  return events.slice(-MAX_STORED_EVENTS);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function buildAnalyticsSummary(profile: {
  slug: string;
  displayName: string;
  type: "card" | "catalog";
  viewCount: number;
  publishedAt: string;
  updatedAt: string;
  viewEvents?: ViewEvent[];
}): ProfileAnalyticsSummary {
  const events = profile.viewEvents ?? [];
  const viewsByDayMap = new Map<string, number>();
  const deviceBreakdown: Record<ViewDevice, number> = {
    mobile: 0,
    tablet: 0,
    desktop: 0,
    unknown: 0,
  };
  const sourceBreakdown: Record<ViewSource, number> = {
    qr: 0,
    direct: 0,
    referral: 0,
    unknown: 0,
  };

  for (const event of events) {
    const date = dayKey(event.at);
    viewsByDayMap.set(date, (viewsByDayMap.get(date) ?? 0) + 1);
    deviceBreakdown[event.device] = (deviceBreakdown[event.device] ?? 0) + 1;
    sourceBreakdown[event.source] = (sourceBreakdown[event.source] ?? 0) + 1;
  }

  const viewsByDay = Array.from(viewsByDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, count }));

  const lastViewedAt = events.length > 0 ? events[events.length - 1].at : null;

  return {
    slug: profile.slug,
    displayName: profile.displayName,
    type: profile.type,
    viewCount: profile.viewCount,
    publishedAt: profile.publishedAt,
    updatedAt: profile.updatedAt,
    lastViewedAt,
    viewsByDay,
    deviceBreakdown,
    sourceBreakdown,
  };
}
