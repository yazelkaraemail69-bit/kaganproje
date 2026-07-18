import { Document, HeadingLevel, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType } from "docx";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { TableData, TranscriptSegment } from "../types/documentConvert";

function textToParagraphs(text: string): Paragraph[] {
  const lines = text.length > 0 ? text.split(/\r?\n/) : [""];
  return lines.map((line) =>
    line.length === 0
      ? new Paragraph({ children: [] })
      : new Paragraph({ children: [new TextRun(line)] })
  );
}

export function buildPdfBase64(input: {
  title: string;
  originalText?: string;
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
}): { filename: string; mimeType: string; base64: string } {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addWrapped = (content: string, fontSize: number, fontStyle: "normal" | "bold" | "italic") => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(content || " ", maxWidth) as string[];
    const lineHeight = fontSize * 1.35;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
  };

  addWrapped(input.title || "Ceviri", 18, "bold");
  y += 10;

  if (input.originalText?.trim()) {
    const label = `Orijinal${input.sourceLang ? ` (${input.sourceLang})` : ""}`;
    addWrapped(label, 13, "bold");
    y += 8;
    addWrapped(input.originalText, 11, "normal");
    y += 14;
  }

  if (input.translatedText?.trim()) {
    const label = `Ceviri${input.targetLang ? ` (${input.targetLang})` : ""}`;
    addWrapped(label, 13, "bold");
    y += 8;
    addWrapped(input.translatedText, 11, "normal");
  }

  const safeName = (input.title || "ceviri").replace(/[^\w.\-]+/g, "_");
  const buffer = doc.output("arraybuffer");
  return {
    filename: `${safeName}.pdf`,
    mimeType: "application/pdf",
    base64: Buffer.from(buffer).toString("base64"),
  };
}

export async function buildDocxBase64(input: {
  title: string;
  originalText?: string;
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
  tables?: TableData[];
}): Promise<{ filename: string; mimeType: string; base64: string }> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: input.title, heading: HeadingLevel.TITLE }),
  ];

  if (input.originalText?.trim()) {
    children.push(
      new Paragraph({
        text: `Orijinal${input.sourceLang ? ` (${input.sourceLang})` : ""}`,
        heading: HeadingLevel.HEADING_1,
      }),
      ...textToParagraphs(input.originalText)
    );
  }

  if (input.translatedText?.trim()) {
    children.push(
      new Paragraph({
        text: `Ceviri${input.targetLang ? ` (${input.targetLang})` : ""}`,
        heading: HeadingLevel.HEADING_1,
      }),
      ...textToParagraphs(input.translatedText)
    );
  }

  if (input.tables?.length) {
    for (const table of input.tables) {
      children.push(new Paragraph({ text: table.name, heading: HeadingLevel.HEADING_2 }));
      const headerRow = new TableRow({
        children: table.headers.map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              width: { size: 2000, type: WidthType.DXA },
            })
        ),
      });
      const bodyRows = table.rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph(String(cell ?? ""))],
                  width: { size: 2000, type: WidthType.DXA },
                })
            ),
          })
      );
      children.push(new Table({ rows: [headerRow, ...bodyRows], width: { size: 9000, type: WidthType.DXA } }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return {
    filename: "ceviri.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    base64: buffer.toString("base64"),
  };
}

export function buildXlsxBase64(input: {
  title: string;
  originalText?: string;
  text?: string;
  translatedText?: string;
  tables?: TableData[];
}): { filename: string; mimeType: string; base64: string } {
  const workbook = XLSX.utils.book_new();
  const original = (input.originalText ?? input.text ?? "").trim();

  if (input.tables?.length) {
    for (const table of input.tables) {
      const aoa = [table.headers, ...table.rows];
      const sheet = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(workbook, sheet, table.name.slice(0, 31) || "Sheet");
    }
  } else {
    const rows: string[][] = [["Bolum", "Icerik"]];
    if (original) rows.push(["Orijinal", original]);
    if (input.translatedText?.trim()) rows.push(["Ceviri", input.translatedText]);
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Ceviri");
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return {
    filename: `${input.title || "ceviri"}.xlsx`.replace(/[^\w.\-]+/g, "_"),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: Buffer.from(buffer).toString("base64"),
  };
}

export function buildCsvBase64(input: {
  originalText?: string;
  text?: string;
  translatedText?: string;
  tables?: TableData[];
}): { filename: string; mimeType: string; base64: string } {
  const original = (input.originalText ?? input.text ?? "").trim();
  let csv = "";
  if (input.tables?.[0]) {
    const t = input.tables[0];
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    csv = [t.headers.map(esc).join(","), ...t.rows.map((r) => r.map(esc).join(","))].join("\n");
  } else {
    csv = [
      "Bolum,Icerik",
      `Orijinal,"${original.replace(/"/g, '""')}"`,
      `Ceviri,"${(input.translatedText ?? "").replace(/"/g, '""')}"`,
    ].join("\n");
  }
  return {
    filename: "ceviri.csv",
    mimeType: "text/csv;charset=utf-8",
    base64: Buffer.from(csv, "utf-8").toString("base64"),
  };
}

export function buildMarkdownBase64(input: {
  title: string;
  originalText?: string;
  translatedText?: string;
}): { filename: string; mimeType: string; base64: string } {
  const parts = [`# ${input.title}`, ""];
  if (input.originalText?.trim()) parts.push("## Orijinal", "", input.originalText, "");
  if (input.translatedText?.trim()) parts.push("## Ceviri", "", input.translatedText, "");
  const body = parts.join("\n");
  return {
    filename: "ceviri.md",
    mimeType: "text/markdown;charset=utf-8",
    base64: Buffer.from(body, "utf-8").toString("base64"),
  };
}

export function buildHtmlBase64(input: {
  title: string;
  originalText?: string;
  translatedText?: string;
}): { filename: string; mimeType: string; base64: string } {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/><title>${esc(input.title)}</title></head><body>
<h1>${esc(input.title)}</h1>
${input.originalText?.trim() ? `<h2>Orijinal</h2><p>${esc(input.originalText)}</p>` : ""}
${input.translatedText?.trim() ? `<h2>Ceviri</h2><p>${esc(input.translatedText)}</p>` : ""}
</body></html>`;
  return {
    filename: "ceviri.html",
    mimeType: "text/html;charset=utf-8",
    base64: Buffer.from(html, "utf-8").toString("base64"),
  };
}

function toSrtTime(value?: string, fallbackIndex = 0): string {
  if (value) {
    const v = value.replace(".", ",");
    if (/^\d{2}:\d{2}:\d{2},\d{3}$/.test(v)) return v;
    if (/^\d{1,2}:\d{2}$/.test(v)) return `00:${v.padStart(5, "0")},000`;
  }
  const sec = fallbackIndex * 3;
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s},000`;
}

export function buildSrtBase64(input: {
  text?: string;
  translatedText?: string;
  segments?: TranscriptSegment[];
}): { filename: string; mimeType: string; base64: string } {
  const content = (input.translatedText || input.text || "").trim();
  let blocks: string[] = [];

  if (input.segments?.length) {
    blocks = input.segments.map((seg, i) => {
      const start = toSrtTime(seg.start, i);
      const end = toSrtTime(seg.end, i + 1);
      const line = seg.text || content.split(/\r?\n/)[i] || "";
      return `${i + 1}\n${start} --> ${end}\n${line}\n`;
    });
  } else {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    blocks = lines.map((line, i) => {
      const start = toSrtTime(undefined, i);
      const end = toSrtTime(undefined, i + 1);
      return `${i + 1}\n${start} --> ${end}\n${line}\n`;
    });
  }

  return {
    filename: "ceviri.srt",
    mimeType: "application/x-subrip;charset=utf-8",
    base64: Buffer.from(blocks.join("\n"), "utf-8").toString("base64"),
  };
}

export function buildVttBase64(input: {
  text?: string;
  translatedText?: string;
  segments?: TranscriptSegment[];
}): { filename: string; mimeType: string; base64: string } {
  const srt = buildSrtBase64(input);
  const srtText = Buffer.from(srt.base64, "base64").toString("utf-8");
  const blocks = srtText
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split(/\r?\n/).filter(Boolean);
      const timeLine = lines.find((l) => l.includes("-->"));
      const textLines = lines.filter((l) => !/^\d+$/.test(l) && !l.includes("-->"));
      if (!timeLine) return "";
      const vttTime = timeLine.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
      return `${vttTime}\n${textLines.join("\n")}`;
    })
    .filter(Boolean);
  const vtt = `WEBVTT\n\n${blocks.join("\n\n")}\n`;
  return {
    filename: "ceviri.vtt",
    mimeType: "text/vtt;charset=utf-8",
    base64: Buffer.from(vtt, "utf-8").toString("base64"),
  };
}
