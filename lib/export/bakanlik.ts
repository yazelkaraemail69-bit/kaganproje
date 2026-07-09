import type { MenuData } from "@/lib/types";
import { getBusinessConfig } from "@/lib/business-config";
import { parsePriceNumber } from "@/lib/menu-cart";

/** Ticaret Bakanlığı fiyat listesi aktarımı için hazırlık formatı (resmî API yayımlanınca uyarlanır). */
export interface BakanlikPriceExport {
  schemaVersion: "1.0-draft";
  exportDate: string;
  regulation: "Fiyat Etiketi Yönetmeliği — Ekim 2025";
  isletme: {
    unvan: string;
    isletmeTuru: string;
    aciklama?: string;
    iletisimTelefon?: string;
  };
  fiyatListesi: Array<{
    kategori: string;
    urunler: Array<{
      ad: string;
      aciklama?: string;
      fiyatTL: number | null;
      fiyatMetin: string;
      kdvDahil: true;
      paraBirimi: "TRY";
    }>;
  }>;
  toplamUrunSayisi: number;
  not: string;
}

export function buildBakanlikExport(data: MenuData): BakanlikPriceExport {
  const config = getBusinessConfig(data.businessType);
  const fiyatListesi = data.categories
    .map((category) => ({
      kategori: category.name.trim() || "Kategori",
      urunler: category.items
        .filter((item) => item.name.trim())
        .map((item) => ({
          ad: item.name.trim(),
          aciklama: item.description.trim() || undefined,
          fiyatTL: parsePriceNumber(item.price),
          fiyatMetin: item.price.trim(),
          kdvDahil: true as const,
          paraBirimi: "TRY" as const,
        })),
    }))
    .filter((category) => category.urunler.length > 0);

  const toplamUrunSayisi = fiyatListesi.reduce((sum, cat) => sum + cat.urunler.length, 0);

  return {
    schemaVersion: "1.0-draft",
    exportDate: new Date().toISOString(),
    regulation: "Fiyat Etiketi Yönetmeliği — Ekim 2025",
    isletme: {
      unvan: data.restaurantName.trim(),
      isletmeTuru: config.id,
      aciklama: data.description.trim() || undefined,
      iletisimTelefon: data.contactPhone?.trim() || undefined,
    },
    fiyatListesi,
    toplamUrunSayisi,
    not: "Bu dosya Bakanlık elektronik sistemi yayımlanana kadar hazırlık amaçlıdır. Resmî portala aktarmadan önce güncel formatı kontrol edin.",
  };
}

export function buildBakanlikCsv(data: MenuData): string {
  const exportData = buildBakanlikExport(data);
  const header = "kategori,urun_adi,aciklama,fiyat_tl,fiyat_metin,kdv_dahil,para_birimi,isletme_unvan";
  const rows = exportData.fiyatListesi.flatMap((category) =>
    category.urunler.map((item) => {
      const cols = [
        category.kategori,
        item.ad,
        item.aciklama ?? "",
        item.fiyatTL?.toString() ?? "",
        item.fiyatMetin,
        "Evet",
        item.paraBirimi,
        exportData.isletme.unvan,
      ];
      return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
    })
  );
  return [header, ...rows].join("\r\n");
}

export function downloadBakanlikJson(data: MenuData): void {
  const payload = buildBakanlikExport(data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  triggerDownload(blob, `${data.restaurantName || "fiyat-listesi"}-bakanlik.json`);
}

export function downloadBakanlikCsv(data: MenuData): void {
  const csv = buildBakanlikCsv(data);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${data.restaurantName || "fiyat-listesi"}-bakanlik.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Basılı menü talebi için yazdırılabilir HTML (tüketici talebi halinde). */
export function openPrintablePriceList(data: MenuData): void {
  const exportData = buildBakanlikExport(data);
  const config = getBusinessConfig(data.businessType);
  const rows = exportData.fiyatListesi
    .map(
      (cat) => `
      <section>
        <h2>${escapeHtml(cat.kategori)}</h2>
        ${cat.urunler
          .map(
            (item) => `
          <div class="row">
            <span class="name">${escapeHtml(item.ad)}</span>
            <span class="dots"></span>
            <span class="price">${escapeHtml(item.fiyatMetin || (item.fiyatTL != null ? `${item.fiyatTL} ₺` : ""))}</span>
          </div>
          ${item.aciklama ? `<p class="desc">${escapeHtml(item.aciklama)}</p>` : ""}
        `
          )
          .join("")}
      </section>`
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(exportData.isletme.unvan)} — Fiyat Listesi</title>
  <style>
    body{font-family:Georgia,serif;max-width:720px;margin:2rem auto;color:#1a1a1a}
    h1{font-size:1.5rem;margin-bottom:.25rem} .sub{color:#555;font-size:.9rem;margin-bottom:1.5rem}
    h2{font-size:1rem;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:.25rem;margin:1.25rem 0 .75rem}
    .row{display:flex;align-items:baseline;gap:.5rem;margin:.35rem 0}
    .name{font-weight:600}.dots{flex:1;border-bottom:1px dotted #aaa;min-width:1rem}
    .price{font-weight:700;white-space:nowrap}.desc{font-size:.85rem;color:#555;margin:0 0 .5rem}
    footer{margin-top:2rem;font-size:.75rem;color:#777;border-top:1px solid #ddd;padding-top:.75rem}
    @media print{body{margin:1cm}}
  </style></head><body>
    <h1>${escapeHtml(exportData.isletme.unvan)}</h1>
    <p class="sub">${escapeHtml(config.catalogTitle)} — Fiyatlarımıza KDV dahildir</p>
    ${rows}
    <footer>Basılı fiyat listesi — ${new Date().toLocaleDateString("tr-TR")} · Dijital menü ile uyumludur.</footer>
    <script>window.onload=function(){window.print()}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
