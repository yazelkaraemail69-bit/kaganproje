import mammoth from "mammoth";
import * as XLSX from "xlsx";
import {
  detectKind,
  extensionOf,
  formatTranscriptReport,
  parseSrt,
  parseTranscriptSegments,
  stripHtml,
  type ExtractedDocument,
  type TableData,
} from "../types/documentConvert";

function decodeBase64(base64: string): Buffer {
  const cleaned = base64.replace(/^data:[^;]+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

function detectCsvDelimiter(text: string): "," | ";" | "\t" {
  const sample = text.split(/\r?\n/).slice(0, 5).join("\n");
  const comma = (sample.match(/,/g) ?? []).length;
  const semi = (sample.match(/;/g) ?? []).length;
  const tab = (sample.match(/\t/g) ?? []).length;
  if (tab > comma && tab > semi) return "\t";
  if (semi > comma) return ";";
  return ",";
}

function csvToTable(text: string, name = "Sheet1"): TableData {
  const fs = detectCsvDelimiter(text);
  const workbook = XLSX.read(text, { type: "string", FS: fs });
  const sheetName = workbook.SheetNames[0] ?? name;
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
  const headers = (rows[0] ?? []).map(String);
  const body = rows.slice(1).map((r) => r.map(String));
  return { name: sheetName, headers, rows: body };
}

function workbookToTables(buffer: Buffer): { tables: TableData[]; text: string } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const tables: TableData[] = [];
  const textParts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
    const headers = (rows[0] ?? []).map(String);
    const body = rows.slice(1).map((r) => r.map(String));
    tables.push({ name: sheetName, headers, rows: body });
    textParts.push(`## ${sheetName}`);
    if (headers.length) textParts.push(headers.join("\t"));
    for (const row of body) textParts.push(row.join("\t"));
    textParts.push("");
  }
  return { tables, text: textParts.join("\n").trim() };
}

export async function extractDocument(input: {
  filename: string;
  mimeType?: string;
  base64: string;
}): Promise<ExtractedDocument> {
  const ext = extensionOf(input.filename);
  const buffer = decodeBase64(input.base64);
  const warnings: string[] = [];

  if (ext === "docx" || input.mimeType?.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    if (result.messages?.length) {
      warnings.push(...result.messages.map((m) => m.message));
    }
    return {
      kind: detectKind(text, "docx"),
      text,
      sourceFormat: "docx",
      title: input.filename,
      warnings: warnings.length ? warnings : undefined,
    };
  }

  if (ext === "xlsx" || ext === "xls" || input.mimeType?.includes("spreadsheet")) {
    const { tables, text } = workbookToTables(buffer);
    return {
      kind: "table",
      text,
      sourceFormat: ext || "xlsx",
      title: input.filename,
      tables,
    };
  }

  const asText = buffer.toString("utf-8");

  if (ext === "csv") {
    const table = csvToTable(asText);
    return {
      kind: "table",
      text: asText,
      sourceFormat: "csv",
      title: input.filename,
      tables: [table],
    };
  }

  if (ext === "html" || ext === "htm") {
    const text = stripHtml(asText);
    return { kind: "plain", text, sourceFormat: "html", title: input.filename };
  }

  if (ext === "srt") {
    const segments = parseSrt(asText);
    const text = formatTranscriptReport(segments, input.filename);
    return { kind: "subtitle", text, sourceFormat: "srt", title: input.filename, segments };
  }

  if (ext === "vtt") {
    const body = asText.replace(/^WEBVTT\s*/i, "");
    const segments = parseSrt(body.replace(/\./g, ","));
    const text = formatTranscriptReport(segments, input.filename);
    return { kind: "subtitle", text, sourceFormat: "vtt", title: input.filename, segments };
  }

  if (ext === "md" || ext === "txt" || ext === "rtf" || ext === "") {
    let text = asText.replace(/^\uFEFF/, "");
    if (ext === "rtf") {
      text = text
        .replace(/\{\\[^}]+\}/g, " ")
        .replace(/\\[a-z]+\d* ?/gi, " ")
        .replace(/[{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      warnings.push("RTF basit metin olarak okundu; bicim kaybolmus olabilir.");
    }
    const kind = detectKind(text, ext || "txt");
    const segments =
      kind === "transcript" || kind === "subtitle" ? parseTranscriptSegments(text) : undefined;
    return {
      kind,
      text: segments?.length ? formatTranscriptReport(segments, input.filename) : text,
      sourceFormat: ext || "txt",
      title: input.filename,
      segments,
      warnings: warnings.length ? warnings : undefined,
    };
  }

  if (ext === "pdf") {
    return {
      kind: "plain",
      text: "",
      sourceFormat: "pdf",
      title: input.filename,
      warnings: [
        "PDF metin cikarma tarayicide yapilir. Bu endpoint PDF binary kabul etmez; istemci pdf.js kullanmalidir.",
      ],
    };
  }

  // Bilinmeyen: utf-8 metin dene
  const kind = detectKind(asText, ext || "unknown");
  return {
    kind,
    text: asText,
    sourceFormat: ext || "unknown",
    title: input.filename,
    warnings: [`Bilinmeyen uzanti (.${ext}); duz metin olarak okundu.`],
  };
}
