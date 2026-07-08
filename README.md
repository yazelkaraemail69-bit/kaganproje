# Dijital Kartvizit & Menü Stüdyosu

İşletmelerin birkaç adımda **dijital kartvizit**, **dijital menü** veya
yapay zekayla **YouTube Shorts senaryosu** oluşturup anında şık bir
önizlemesini görebildiği, dashboard tabanlı bir Next.js uygulaması.

## Özellikler

- **Dashboard/Landing sayfası:** İki ana kart — "Dijital Kartvizit Oluştur"
  ve "Dijital Menü Oluştur"
- **Adım adım (stepped) formlar:** Her iş kolu için ilerleme göstergeli,
  doğrulamalı, çok adımlı veri giriş akışı
  - Kartvizit: Kişisel Bilgiler → İletişim → Sosyal Medya → Tema
  - Menü: Restoran Bilgisi → Ürünler (dinamik kategori/ürün satırı ekleme) → Tema
- **Marka renk temaları:** Hem kartvizit hem menü için 8 hazır renk teması
  (İndigo, Gece Lacivert, Zümrüt, Gün Batımı, Okyanus, Mercan, Siyah & Altın,
  Bulut) arasından seçim yapılabilir; ergonomik, tek dokunuşla seçilen görsel
  bir tema seçici ile sunulur. Menüde ayrıca "Logomdan Otomatik" seçeneğiyle
  restoran logosundan renk çıkarımı da tercih edilebilir
- **Anında önizleme:** Form tamamlandığında girilen veriler profesyonel,
  estetik bir şablona dönüştürülür
  - Kartvizit önizlemesinde **"Rehbere Ekle"** butonu ile `.vcf` (vCard)
    dosyası indirilebilir
  - Menü önizlemesi kategoriye göre gruplanmış, TL formatlı fiyatlarla
    gösterilir
- **Fotoğraf yükleme:** Profil fotoğrafı / restoran logosu / ürün görseli
  tarayıcıda sıkıştırılıp base64'e çevrilir ve anında önizlenir (sunucuya
  yükleme gerekmez)
- **QR kod oluşturma:** Hem kartvizit hem menü önizlemesinde, seçilen temanın
  vurgu rengiyle uyumlu, indirilebilir bir QR kod kartı bulunur
  - Kartvizit QR'ı taratıldığında telefonda doğrudan rehbere ekleme istemi
    açılan bir vCard içerir
  - Menü QR'ı, menünün tüm verisini URL'e kodlayan `/menu/view` bağlantısını
    işaret eder — sunucu/veritabanı gerekmeden paylaşılabilir
- **Menü ürün görselleri:** Her ürüne küçük, kompakt bir görsel eklenebilir;
  önizlemede ürün adının yanında gösterilir
- **Mobile-first responsive tasarım**
- **Lucide-react ikonları** (marka logoları yerine, telif/marka riski
  taşımayan jenerik ikonlar kullanılır — bkz. Notlar)
- **Shorts Senaryosu Oluştur (AI):** Niş konu, hedef kitle, tonlama, süre
  ve dil seçilerek "Master Shorts AI Generator" sistem promptu ile
  OpenRouter üzerinden tam bir YouTube Shorts senaryosu üretilir —
  hook, 3 gövde ipucu ve CTA için ayrı ayrı seslendirme metni, İngilizce
  AI görsel/B-roll promptu (Runway/Pika/Sora'ya hazır) ve kısa metin
  üstü yazılar, ayrıca birleştirilmiş tam seslendirme metni. Tek tık ile
  panoya kopyalama desteklenir. Bu özellik sunucu tarafında çalışır ve
  bir `OPENROUTER_API_KEY` gerektirir (bkz. "Ortam Değişkenleri").
- **Videoya Dönüştür (AI, uçtan uca render):** Üretilen senaryodaki her
  segment (hook + 3 ipucu + CTA) otomatik olarak gerçek bir dikey (9:16)
  video klibine dönüştürülür:
  1. **ElevenLabs** ile doğal seslendirme (`eleven_multilingual_v2`)
  2. **OpenRouter Image API** ile segment başına dikey AI sahne görseli
  3. Görselden video klibi animasyonu — üç sağlayıcıdan biri
     (`lib/video/video-provider.ts` seçer, öncelik sırasıyla):
     - **Wan 2.6 Flash** (Alibaba Cloud/DashScope) — en ucuz Çinli
       alternatif, ~$0.025/sn (720p, sessiz), ama ayrı hesap gerekir
     - **Runway Gen-4 Turbo** — ~$0.05/sn, orijinal entegrasyon
     - **OpenRouter Video API** (Kling v3 Std, Kuaishou/Çin) — ~$0.084/sn,
       ekstra kurulum gerektirmez (zaten var olan `OPENROUTER_API_KEY` ile
       çalışır), üsttekilerden biri yoksa otomatik devreye girer
  4. **ffmpeg** ile klip süresinin seslendirmeyle senkronize edilmesi,
     alt yazı (metin üstü) yakılması ve tüm segmentlerin tek bir mp4'te
     birleştirilmesi

  İşlem birkaç dakika sürebileceğinden arka planda asenkron bir "job"
  olarak çalışır; arayüz adım adım ilerlemeyi gösterir ve tamamlandığında
  videoyu oynatıp indirmenizi sağlar. `ELEVENLABS_API_KEY` ve `OPENROUTER_API_KEY`
  (video sağlayıcısı için varsayılan/yedek) yeterlidir; `DASHSCOPE_API_KEY`
  veya `RUNWAYML_API_SECRET` daha ucuz/farklı sağlayıcılar için opsiyoneldir
  (bkz. "Ortam Değişkenleri").

## Teknoloji Yığını

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS 4** (CSS-first `@theme` yapılandırması)
- **lucide-react** ikon seti
- **qrcode.react** (QR kod üretimi)
- **OpenRouter** (Shorts senaryosu metni + segment görselleri için, `app/api/shorts/route.ts`
  ve `lib/video/images.ts` üzerinden çağrılır)
- **ElevenLabs** (segment seslendirmeleri, `lib/video/elevenlabs.ts`)
- Görselden video klibi üretimi — üç sağlayıcı arasından seçim
  `lib/video/video-provider.ts`'de yapılır: **Wan 2.6 Flash** (Alibaba
  Cloud/DashScope, en ucuz, `lib/video/wan.ts`), **Runway Gen-4 Turbo**
  (`lib/video/runway.ts`), **OpenRouter Video API** (kurulumsuz yedek,
  `lib/video/openrouter-video.ts`)
- **fluent-ffmpeg / ffmpeg-static / ffprobe-static** (klip süresi senkronu,
  alt yazı yakma, birleştirme — `lib/video/ffmpeg.ts`)
- **@vercel/blob** (opsiyonel — üretilen mp4'ün Vercel'de kalıcı depolanması)
- State yönetimi: React `useState` (istemci tarafı, sunucu/veritabanı yok —
  Shorts metin ve video üretimi için sunucu tarafı API route'ları vardır)

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

### Ortam Değişkenleri

Kartvizit ve menü özellikleri tamamen istemci tarafında çalıştığı için
ortam değişkeni gerektirmez. Shorts özellikleri için:

| Değişken | Zorunlu mu? | Ne için kullanılır |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Senaryo metni ve Videoya Dönüştür için | Senaryo metni (`lib/generator.ts`), segment görselleri (`lib/video/images.ts`) ve video klibi yedek sağlayıcısı (`lib/video/openrouter-video.ts`) |
| `ELEVENLABS_API_KEY` | Sadece Videoya Dönüştür için | Segment seslendirmeleri (`lib/video/elevenlabs.ts`) |
| `DASHSCOPE_API_KEY` | Opsiyonel (Videoya Dönüştür için) | Wan 2.6 Flash ile görselden video klibi (`lib/video/wan.ts`) — en ucuz Çinli alternatif, ayrı Alibaba Cloud hesabı gerekir |
| `RUNWAYML_API_SECRET` | Opsiyonel (Videoya Dönüştür için) | Runway Gen-4 Turbo ile görselden video klibi (`lib/video/runway.ts`) |
| `VIDEO_PROVIDER` | Opsiyonel | `wan`, `runway` veya `openrouter` — sağlayıcıyı zorla seçer, yoksa bu sırayla (Wan → Runway → OpenRouter) otomatik seçilir |
| `BLOB_READ_WRITE_TOKEN` | Opsiyonel | Vercel Blob'a kalıcı mp4 depolama (yoksa `public/generated-shorts/`'a yazılır) |

Kurulum adımları:

1. [openrouter.ai/keys](https://openrouter.ai/keys) ve
   [elevenlabs.io](https://elevenlabs.io/app/settings/api-keys) adreslerinden
   anahtarlarınızı alın — bu ikisi "Videoya Dönüştür" için yeterlidir,
   çünkü video klibi üretimi `OPENROUTER_API_KEY` ile OpenRouter'ın video
   API'sine (Kling v3 Std) otomatik düşer, ek kurulum gerekmez.
2. İsteğe bağlı olarak daha ucuz/farklı bir video sağlayıcısı ekleyin:
   - **Wan (en ucuz):** [bailian.console.alibabacloud.com](https://bailian.console.alibabacloud.com)
     üzerinden Alibaba Cloud hesabı açıp Model Studio'yu etkinleştirin, ardından
     [API anahtarı oluşturun](https://www.alibabacloud.com/help/en/model-studio/get-api-key)
     (uluslararası/Singapur bölgesini seçin) ve `DASHSCOPE_API_KEY`'e girin.
   - **Runway:** [dev.runwayml.com](https://dev.runwayml.com) üzerinden anahtar alıp
     `RUNWAYML_API_SECRET`'e girin.
3. Proje kökündeki `.env.local` dosyasını açın (yoksa `.env.example`'ı
   `.env.local` olarak kopyalayın) ve değerleri girin.
4. Geliştirme sunucusunu yeniden başlatın (`npm run dev`).

Sadece senaryo metni üretmek istiyorsanız `OPENROUTER_API_KEY` yeterlidir;
"Videoya Dönüştür" butonu için ayrıca `ELEVENLABS_API_KEY` gerekir (video
klibi sağlayıcısı zaten `OPENROUTER_API_KEY` ile otomatik çalışır).

## Klasör Yapısı

```
app/
  layout.tsx            # Kök layout, fontlar, metadata
  page.tsx              # Dashboard (iki ana kart)
  globals.css           # Tailwind + marka renkleri (@theme)
  kartvizit/page.tsx     # Dijital kartvizit sihirbazı sayfası
  menu/page.tsx          # Dijital menü sihirbazı sayfası
  menu/view/page.tsx     # QR/link ile paylaşılan salt-okunur menü sayfası
  shorts/page.tsx        # Shorts senaryosu sihirbazı sayfası
  api/shorts/route.ts    # Sunucu tarafı: senaryo metni üreten POST endpoint'i
  api/shorts/video/route.ts          # Video render işini başlatan POST endpoint'i (202 + jobId)
  api/shorts/video/[jobId]/route.ts  # İş durumu/ilerleme/sonuç sorgulama (GET)
components/
  ui/                    # Ortak arayüz bileşenleri (Button, Field,
                         # Stepper, PhotoUpload, ItemImageButton, QrCode,
                         # ThemeSwatch, ChipGroup, CopyButton)
  layout/PageHeader.tsx  # Alt sayfalar için geri butonlu üst bar
  dashboard/FeatureCard.tsx
  kartvizit/             # Kartvizit sihirbazı: adımlar + önizleme
    KartvizitWizard.tsx
    StepPersonal.tsx
    StepContact.tsx
    StepSocial.tsx
    StepTheme.tsx        # Kartvizit renk teması seçimi
    CardPreview.tsx      # QR kod (vCard) dahil
  menu/                  # Menü sihirbazı: adımlar + önizleme
    MenuWizard.tsx
    StepRestaurantInfo.tsx
    StepMenuItems.tsx    # Ürün görseli yükleme dahil
    StepTheme.tsx        # Menü renk teması seçimi (+ "Logomdan Otomatik")
    MenuPreview.tsx      # Seçilen/otomatik renk teması + QR kod dahil
    MenuViewClient.tsx   # Paylaşılan linki çözüp salt-okunur önizleme gösterir
  shorts/                # Shorts sihirbazı: ayarlar formu + sonuç önizleme
    ShortsWizard.tsx
    ShortsConfigForm.tsx
    ShortsResult.tsx
    ShortsVideoPanel.tsx  # "Videoya Dönüştür" butonu + ilerleme + video player
lib/
  types.ts               # Paylaşılan TypeScript tipleri ve fabrika
                         # fonksiyonları
  utils.ts               # cn(), formatPrice()
  vcard.ts                # .vcf (vCard) oluşturma/indirme
  image.ts               # Görsel sıkıştırma/ölçeklendirme yardımcıları
  colors.ts               # Görselden baskın renk çıkarma + kontrast hesaplama
  useDominantColors.ts    # colors.ts'i saran React hook'u
  themes.ts               # Hazır marka renk teması setleri (kartvizit + menü)
  share.ts                # Menüyü URL'e kodlama/çözme (QR paylaşım linki)
  shorts-options.ts       # Shorts ayar seçenekleri (ton/süre/dil/öneri listeleri)
  generator.ts            # "Master Shorts AI Generator" sistem promptu +
                          # OpenRouter çağrısı + yanıt doğrulama
  video/
    errors.ts             # VideoGeneratorError (pipeline'daki tüm adımlar için ortak)
    elevenlabs.ts          # Segment seslendirmesi (TTS)
    images.ts              # Segment görseli (OpenRouter Image API)
    wan.ts                 # Görsel -> video klibi (Wan 2.6 Flash / DashScope, async task + polling)
    runway.ts              # Görsel -> video klibi (Runway Gen-4 Turbo, async task + polling)
    openrouter-video.ts    # Görsel -> video klibi (OpenRouter Video API / Kling v3 Std, async job + polling)
    video-provider.ts      # Wan/Runway/OpenRouter arasında seçim yapan sarmalayıcı
    ffmpeg.ts               # Süre senkronu, alt yazı yakma, klipleri birleştirme
    storage.ts              # Final mp4'ü Vercel Blob'a veya public/'e kaydetme
    job-store.ts             # Asenkron render işlerinin bellek içi durumu
    pipeline.ts               # Tüm adımları sırayla/paralel çalıştıran orkestratör
assets/
  fonts/Inter-Variable.ttf  # Alt yazı yakma (drawtext) için gömülü font (SIL OFL)
public/
  generated-shorts/       # Yerel/`next start` fallback'inde üretilen mp4'ler (git'e girmez)
```

## Vercel'e Deploy

1. Bu klasörü ayrı bir GitHub reposuna push edin (veya monorepo ise
   Vercel proje ayarlarında **Root Directory**'yi bu klasöre ayarlayın).
2. Vercel'de "Import Project" ile bağlayın.
3. Proje ayarlarında **Settings → Environment Variables** kısmına ilgili
   anahtarları ekleyin (bkz. "Ortam Değişkenleri" tablosu) — eksik olan
   özellik 500 hatası döner, diğer özellikler etkilenmez.
4. `npm run build` otomatik çalışır; ek yapılandırma gerekmez.
5. **"Videoya Dönüştür" için önemli:** Bu özellik `app/api/shorts/video/route.ts`
   içinde `maxDuration = 800` saniye ile yapılandırılmıştır çünkü seslendirme +
   AI görsel + video klibi üretimi (Wan/Runway) + ffmpeg birleştirme birkaç
   dakika sürebilir. Bu süre yalnızca **Vercel Pro/Enterprise (Fluid Compute)**
   planlarında desteklenir; Hobby planında fonksiyon 10-60 saniyede zaman
   aşımına uğrar. Ayrıca üretilen mp4'ün kalıcı olarak saklanabilmesi için
   `BLOB_READ_WRITE_TOKEN` (Vercel Blob) eklemeniz önerilir — aksi halde
   dosya `public/generated-shorts/`'a yazılmaya çalışılır ki bu, Vercel'in
   salt-okunur/geçici serverless dosya sisteminde kalıcı olmaz. Çok yoğun
   kullanım için render adımının ayrı bir kuyruk/worker'a (örn. Vercel
   Sandbox, Inngest, QStash) taşınması önerilir; mevcut kurulum tek bir
   uzun API route çağrısı içinde arka planda (`after()`) çalışır.

## Notlar

- Kartvizit ve menü özellikleri tamamen istemci tarafında (client-side)
  çalışır; formlar ve önizlemeler `useState` ile yönetilir, sayfa
  yenilendiğinde veriler sıfırlanır. Kalıcı depolama (veritabanı/
  localStorage) şu an kapsam dışıdır. Shorts senaryo metni de kalıcı
  olarak saklanmaz, sayfa yenilendiğinde kaybolur.
- Video render işlerinin durumu (`lib/video/job-store.ts`) bellek içi bir
  `Map` ile tutulur. Bu, yerel geliştirme ve tek örnekli (`next start`)
  bir Node sunucusu için sorunsuz çalışır; ama Vercel'in çok örnekli
  serverless ortamında iş durumu istekler arasında kaybolabilir. Ciddi
  trafik bekleniyorsa bu modülü Vercel KV / Upstash Redis gibi paylaşılan
  bir depoya taşımak gerekir (arayüz aynı kalacak şekilde tasarlandı).
- Alt yazı (metin üstü) yakma işlemi için repoya [Inter](https://github.com/google/fonts/tree/main/ofl/inter)
  fontu (SIL Open Font License) `assets/fonts/Inter-Variable.ttf` olarak
  gömülüdür; böylece ffmpeg render'ı işletim sisteminden bağımsız,
  Windows'ta da Linux'ta (Vercel) da aynı şekilde çalışır.
- Menü paylaşım linki (`/menu/view?d=...`), menü verisinin tamamını
  base64 ile URL'e kodlar; sunucu/veritabanı gerektirmez. QR'ın taranabilir
  kalması için linke ürün görselleri dahil edilmez, sadece küçültülmüş logo
  (renk teması için) ve metin verileri (ürün adı/fiyat/açıklama) kodlanır.
- `lucide-react` 1.0 ile birlikte marka logoları (Instagram, Facebook,
  LinkedIn, X/Twitter vb.) telif/marka riskleri nedeniyle kütüphaneden
  tamamen kaldırıldı. Bu nedenle sosyal medya alanlarında anlamsal olarak
  yakın, jenerik Lucide ikonları kullanılmıştır (ör. Instagram için
  Camera, LinkedIn için Briefcase). Gerçek marka logoları gerekiyorsa
  [`@icons-pack/react-simple-icons`](https://www.npmjs.com/package/@icons-pack/react-simple-icons)
  paketi eklenebilir.
