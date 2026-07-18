export type DocumentKind =
  | "plain"
  | "table"
  | "transcript"
  | "subtitle"
  | "mixed"
  | "unknown";

export interface TableData {
  name: string;
  headers: string[];
  rows: string[][];
}

export interface TranscriptSegment {
  start?: string;
  end?: string;
  speaker?: string;
  text: string;
}

export interface ExtractedDocument {
  kind: DocumentKind;
  text: string;
  sourceFormat: string;
  title?: string;
  tables?: TableData[];
  segments?: TranscriptSegment[];
  warnings?: string[];
}

const TIMESTAMP_LINE =
  /^(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)\s*(?:-->|-|–|—)\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)(?:\])?\s*(.*)$/;

const SPEAKER_LINE = /^(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*)?([A-Za-zÇĞİÖŞÜçğıöşü0-9 ._-]{1,40}):\s+(.+)$/;

export function detectKind(text: string, sourceFormat: string): DocumentKind {
  const fmt = sourceFormat.toLowerCase();
  if (fmt === "srt" || fmt === "vtt") return "subtitle";
  if (fmt === "xlsx" || fmt === "xls" || fmt === "csv") return "table";

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return "unknown";

  let tsHits = 0;
  let speakerHits = 0;
  for (const line of lines.slice(0, 80)) {
    if (TIMESTAMP_LINE.test(line.trim()) || /^\d{1,2}:\d{2}/.test(line.trim())) tsHits += 1;
    if (SPEAKER_LINE.test(line.trim())) speakerHits += 1;
  }
  if (tsHits >= 3 || (tsHits >= 1 && speakerHits >= 2)) return "transcript";
  if (fmt === "docx" || fmt === "pdf" || fmt === "txt" || fmt === "md" || fmt === "html") return "plain";
  return "plain";
}

export function parseTranscriptSegments(text: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const ts = line.match(TIMESTAMP_LINE);
    if (ts) {
      segments.push({ start: ts[1], end: ts[2], text: ts[3]?.trim() || "" });
      continue;
    }
    const sp = line.match(SPEAKER_LINE);
    if (sp) {
      segments.push({ speaker: sp[1].trim(), text: sp[2].trim() });
      continue;
    }
    if (segments.length > 0 && !segments[segments.length - 1].text) {
      segments[segments.length - 1].text = line;
    } else {
      segments.push({ text: line });
    }
  }
  return segments;
}

export function parseSrt(text: string): TranscriptSegment[] {
  const blocks = text.replace(/^\uFEFF/, "").split(/\r?\n\r?\n+/);
  const segments: TranscriptSegment[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) continue;
    const timeLine = lines.find((l) => l.includes("-->")) ?? lines[1];
    const m = timeLine.match(
      /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
    );
    const textLines = lines.filter((l) => !/^\d+$/.test(l.trim()) && !l.includes("-->"));
    segments.push({
      start: m?.[1]?.replace(",", "."),
      end: m?.[2]?.replace(",", "."),
      text: textLines.join(" "),
    });
  }
  return segments;
}

export function formatTranscriptReport(segments: TranscriptSegment[], title = "Transkript"): string {
  const lines = [`# ${title}`, ""];
  for (const seg of segments) {
    const time =
      seg.start && seg.end ? `[${seg.start} – ${seg.end}] ` : seg.start ? `[${seg.start}] ` : "";
    const speaker = seg.speaker ? `${seg.speaker}: ` : "";
    lines.push(`${time}${speaker}${seg.text}`.trim());
  }
  return lines.join("\n");
}

export function extensionOf(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
