# El Yazisi Cevirmen

Cok formatli el yazisi OCR + belge ceviri / donusum (Ana Yasa).

## Akislar
1. **El yazisi** — fotograf → metin → ceviri → dosya
2. **Belge cevir & donustur** — PDF, DOCX, XLSX, CSV, TXT, MD, HTML, SRT, VTT, RTF
3. **Transkript / Google Kayit** — zaman damgali metin → rapor / SRT / VTT

## Cikis formatlari
TXT, MD, DOCX, PDF, XLSX, CSV, HTML, SRT, VTT

## API
- `POST /api/ocr` — el yazisi
- `POST /api/translate` — ceviri
- `POST /api/convert/extract` — belge okuma
- `POST /api/convert/export` — format donusumu
- `POST /api/export/docx` — klasik DOCX

## Vercel
Repo: https://github.com/yazelkaraemail69-bit/el-yaz-s-okuyucu-ve-evirici  
Canli: https://el-yaz-s-okuyucu-ve-evirici.vercel.app

Env: `OPENROUTER_API_KEY`, `APP_SHARED_SECRET`, `CORS_ORIGINS=*`
