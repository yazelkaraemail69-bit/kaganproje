# RESEARCH_SUMMARY — Dijital Kartvizit & QR Katalog Pazar Araştırması

> **Tarih:** 9 Temmuz 2026  
> **Amaç:** Kaganproje (QR Kartvizit + İşletme Kataloğu) sistemini profesyonel, ölçeklenebilir ve dönüşüm odaklı seviyeye taşımak için rekabet analizi ve teknik yol haritası.  
> **Kaynaklar:** Linktree, Canva, Restaumatic, Restomenum, Mobilo, Taplink, Beacons, sektör raporları, QR standartları (ISO/IEC 18004), Türkiye Fiyat Etiketi Yönetmeliği (Ekim 2025).

---

## 1. Executive Summary

Dünyada iki ana ürün ailesi öne çıkıyor:

| Aile | Örnekler | Ana değer | Dönüşüm modeli |
|------|----------|-----------|----------------|
| **Link-in-bio / dijital vitrin** | Linktree, Beacons, Taplink, Koji | Tek linkte tüm kanallar | Trafik yönlendirme, dijital ürün satışı |
| **Profesyonel dijital kartvizit** | Mobilo, Popl, HiHello, V1CE, Beaconstac/Uniqode | Networking + lead capture | CRM senkronu, NFC, analitik |
| **QR menü / restoran OS** | Restaumatic, Restomenum, RestoPOS, MenuTiger | Sipariş + POS + operasyon | Sipariş hacmi, masa başı ödeme, stok optimizasyonu |

**Kaganproje'nin konumu:** Şu an güçlü bir **builder + önizleme + AI görsel** MVP'si; ancak profesyonel ürünlerin ayırt edici katmanı olan **kalıcı profil, kısa URL, dinamik QR, analitik, SEO ve CRM** henüz yok.

**Türkiye fırsatı:** Ekim 2025 Fiyat Etiketi Yönetmeliği ile restoran/kafe/pastanelerde QR fiyat listesi zorunluluğu → yerel talep patlaması. Bakanlık sistemine veri aktarımı ve kapı girişi fiyat görünürlüğü de bekleniyor.

---

## 2. Rekabet Analizi — UI/UX ve Özellik Matrisi

### 2.1 Linktree (Link-in-bio lideri)

**Güçlü yanlar**
- 3 dakikada kurulum; sıfır teknik bilgi
- Sınırsız link (free tier)
- Otomatik QR kod + indirme
- Commerce Links: Stripe, Apple Pay, Google Pay, dijital dosya teslimi
- Medya embed (YouTube, Spotify)
- Temel tıklama analitiği (ücretli planlarda derinleşir)

**Zayıf yanlar**
- Dönüşüm motoru değil, trafik yönlendirücü (~%1.5 conversion benchmark)
- Lead capture formları ve CRM zayıf
- Marka kontrolü ücretli katmanlarda
- Fiyat artışı (Pro ~$15/ay, 2025)

**UI pattern'leri**
- Tek sütun, büyük CTA butonları
- Profil fotoğrafı + kısa bio üstte
- Her link = kart butonu (thumbnail + başlık)
- Mobil-first; desktop'ta dar kolon

**Kaganproje için öğrenim:** Basit onboarding + görsel hiyerarşi. Commerce/lead capture ikinci faz.

---

### 2.2 Beacons / Koji (Commerce-first link-in-bio)

**Beacons farkı**
- Storefront odaklı; conversion rate benchmark'ta Linktree'den ~%45 daha yüksek (2.17% vs 1.49%)
- Email capture, ürün karşılaştırma, storefront layout
- Creator ekonomisi için optimize

**Koji farkı**
- Kampanya/engagement odaklı mini-app'ler
- Etkileşimli widget'lar

**Kaganproje için öğrenim:** Katalog sayfasında "öne çıkan ürün/hizmet" + net CTA (WhatsApp sipariş, randevu) conversion'ı artırır.

---

### 2.3 Canva (Tasarım + QR altyapısı)

**Güçlü yanlar**
- Sınırsız statik QR (free); **dinamik QR** (URL güncellenebilir, yeniden baskı yok)
- Marka renkleri, pattern, logo overlay (Pro+)
- QR Insights: scan sayısı, unique scan, lokasyon, cihaz tipi (Pro+)
- Contact QR app: vCard QR
- Typecard entegrasyonu (Şubat 2025): Apple Wallet / Google Wallet export

**Zayıf yanlar**
- Tasarım aracı; CRM/lead yönetimi yok
- Dinamik QR + analitik ücretli
- Hosted contact page değil, tasarım çıktısı odaklı

**Kaganproje için öğrenim:** Dinamik QR + markalı QR görünümü + wallet export profesyonel algıyı yükseltir.

---

### 2.4 Mobilo / Popl / HiHello (Profesyonel dijital kartvizit)

**Ortak profesyonel özellikler**
- NFC + QR + link — uygulama gerektirmeden paylaşım
- Hosted landing page (mobil optimize)
- vCard / "Add to Contacts" tek tık
- **CRM entegrasyonu:** Salesforce, HubSpot, Microsoft Dynamics
- Lead capture formları, otomatik follow-up
- Takım yönetimi: merkezi kart güncelleme, marka kilidi
- Scan analytics dashboard
- Apple Wallet / Google Wallet pass
- Email imzası embed

**UI pattern'leri**
- Hero: fotoğraf + isim + unvan + şirket
- Büyük aksiyon butonları: Kaydet, Ara, E-posta, WhatsApp
- Sosyal ikon şeridi
- Kurumsal tema: logo, renk, font kilidi

**Kaganproje için öğrenim:** Kartvizit QR'ı ham vCard yerine **hosted `/c/:slug` sayfası** olmalı; vCard indirme sayfa içi CTA olmalı.

---

### 2.5 Restaumatic (Avrupa — restoran OS)

**Güçlü yanlar**
- QR Waiter: masadan sipariş + ödeme
- POS (RePOS) entegrasyonu: tek panelden tüm kanallar
- Gerçek zamanlı menü senkronu (fiyat/stok)
- Mutfak ekranı / KDS
- Çoklu dil
- Delivery platform entegrasyonları (UberEats, Wolt vb.)
- Satış analitiği: popüler ürün, kanal bazlı rapor

**UI pattern'leri**
- Kategori sekmeleri (sticky nav)
- Ürün kartı: fotoğraf + fiyat + açıklama
- Sepet + ödeme akışı
- Garson/masa numarası bağlamı

**Kaganproje için öğrenim:** Saf katalog MVP yeterli başlangıç; sipariş/POS ileri faz. **Anlık fiyat güncelleme + Bakanlık uyumu** Türkiye'de satış argümanı.

---

### 2.6 Restomenum / RestoPOS (Türkiye — QR menü)

**Yerel güçlü yanlar**
- Masa bazlı QR (hangi masadan sipariş geldiği)
- Garson onayı veya direkt mutfak
- Yemeksepeti, Getir, Trendyol Yemek entegrasyonu
- WhatsApp sipariş kanalı
- Çoklu dil (TR + 7 dil)
- Ticaret Bakanlığı fiyat şeffaflığı uyumu pazarlaması
- Komisyonsuz online mağaza

**Türkiye regülasyonu (Ekim 2025 — Fiyat Etiketi Yönetmeliği)**
- Restoran, kafe, pastane, lokanta: **QR ile fiyat listesi zorunlu**
- Kapı girişinde görünür fiyat/QR
- Masalarda erişilebilir QR
- Fiyatların Bakanlık sistemine aktarımı (kriterlere tabi işletmeler)
- Talep halinde basılı menü sunma yükümlülüğü devam
- Uyumsuzluk: idari para cezası riski

**Kaganproje için öğrenim:** "Yasal uyum + 2 dakikada dijital menü" mesajı güçlü GTM. Bakanlık API entegrasyonu roadmap'e alınmalı.

---

## 3. Sürdürülebilir Başarı Özellikleri (Öncelik Sırasıyla)

### Tier 1 — Olmazsa olmaz (MVP+)

| Özellik | Neden kritik | Satış/marka etkisi |
|---------|--------------|-------------------|
| **Mobil-first, <2s LCP** | QR taramanın %70+ mobil | Tarama anında bounce azalır |
| **Hosted paylaşım sayfası** | vCard/JSON URL yerine `/m/:id`, `/c/:id` | Profesyonel algı, SEO, paylaşılabilirlik |
| **Kısa URL + dinamik QR** | Baskı malzemesi değişmeden içerik güncelleme | Tek seferlik QR baskısı = düşük churn |
| **ECC Level H QR** | Logo overlay, baskı hasarı toleransı | Restoran/kartvizit baskısında tarama başarısı |
| **Markalı QR görünümü** | Logo merkez, marka rengi, quiet zone | Kurumsal güven |
| **OG/Twitter meta + JSON-LD** | WhatsApp/LinkedIn önizleme | Organik paylaşım ve marka görünürlüğü |
| **WhatsApp / Ara / Kaydet CTA** | Türkiye'de birincil iletişim kanalı | Doğrudan lead ve sipariş |

### Tier 2 — Büyüme ve retention

| Özellik | Neden kritik | Satış/marka etkisi |
|---------|--------------|-------------------|
| **Scan analytics** | İşletme sahibi ROI görür | Ücretli plan gerekçesi |
| **localStorage + hesap** | Veri kaybı = churn | Güven ve tekrar kullanım |
| **Çoklu dil menü** | Turizm + regülasyon | Daha geniş müşteri kitlesi |
| **Apple/Google Wallet** | Kartvizit sürtünmesiz paylaşım | Premium algı |
| **Tema/marka kilidi** | Ajans ve zincir markalar | B2B satış |

### Tier 3 — Platform / moat

| Özellik | Neden kritik | Satış/marka etkisi |
|---------|--------------|-------------------|
| **CRM webhook (HubSpot, Pipedrive)** | Lead otomasyonu | Kurumsal satış |
| **Bakanlık fiyat bildirim API** | TR restoran compliance | Zorunlu talep → paid conversion |
| **Sipariş/sepet (lite)** | Restomenum parity başlangıcı | ARPU artışı |
| **Takım/çok şube** | Zincir restoran | Enterprise tier |
| **Custom domain** | `menu.lezzetduragi.com` | Marka değeri |

---

## 4. QR Kod Teknik Standartları (Profesyonel Uygulama)

### 4.1 Error Correction Level

| Level | Kurtarma | Kullanım |
|-------|----------|----------|
| L | %7 | Sadece ekran |
| M | %15 | Temiz iç baskı, logosuz |
| Q | %25 | Genel baskı (önerilen default) |
| **H** | **%30** | **Logo overlay, kartvizit, masa tent, outdoor** |

**Kaganproje mevcut durum:** `QrCode.tsx` → `level="L"` (en düşük). `share.ts` yorumu Level M diyor — **tutarsızlık**.

**Hedef:** Tüm kullanıcıya dönük QR üretiminde **Level H**; logo overlay planlanıyorsa zorunlu.

### 4.2 Diğer kurallar

- **Quiet zone:** Minimum 4 modül beyaz kenarlık (tüm kenarlar)
- **Minimum boyut:** 2×2 cm (yakın mesafe), kartvizitte ~1 inç
- **Kontrast:** Koyu modül / açık zemin, min 3:1 (hedef 4:1+)
- **Format:** SVG (ölçeklenebilir baskı) veya PNG 300+ DPI; JPEG kullanma
- **Logo overlay:** Alanın max %25-30'u; köşe finder pattern'lere dokunma
- **Dinamik QR:** Kısa redirect URL → uzun payload QR'dan kaçınır
- **Test:** En az 3 farklı telefon + gerçek baskı proof

### 4.3 Kütüphane

**Mevcut:** `qrcode.react` ^4.2.0 — yeterli; `level="H"`, `marginSize` ≥ 4, opsiyonel `imageSettings` ile logo.

**İleri faz:** `qr-code-styling` — yuvarlatılmış modül, gradient, gelişmiş markalama.

---

## 5. Kaganproje — Mevcut Durum Değerlendirmesi

### 5.1 Güçlü yanlar (korunmalı)

- 4 adımlı sihirbaz UX (işletme türü → bilgi → ürünler → tema)
- 8 işletme türü (`business-config.ts`) — restoran dışı katalog
- Profesyonel menü görünümü (kâğıt doku, kategori kuralları, dot leaders)
- 4 menü + 4 kartvizit layout
- 16 tema + logo'dan otomatik renk
- OpenRouter AI: logo, ürün, portre görselleri
- Menü paylaşım: `/menu/view?d=` (stateless encode)
- QR güvenlik: `QR_SAFE_MAX_LENGTH = 1500` + copy fallback

### 5.2 Kritik boşluklar

| Alan | Durum | Risk |
|------|-------|------|
| Kalıcılık | Sadece `useState` | Sayfa yenileme = veri kaybı |
| Kartvizit paylaşım | Ham vCard QR, hosted page yok | Amatör algı, SEO yok |
| QR ECC | Level L | Baskıda tarama hatası |
| Analitik | Yok | ROI gösterilemez, upsell yok |
| SEO | Global metadata only | Paylaşım önizlemesi zayıf |
| CRM | Yok | B2B satış zor |
| Görseller | Base64 in-memory | URL şişmesi, QR limiti |
| Sosyal linkler | vCard'a dahil değil | Toplanan veri boşa |
| Bakanlık uyumu | Yok | TR restoran GTM fırsatı kaçırılır |

---

## 6. Önerilen Mimari — Clean Code & Modülerlik

### 6.1 Domain-driven modül yapısı

```
lib/
  domains/
    profile/          # Ortak: slug, owner, createdAt, analytics
      types.ts
      schema.ts
    card/             # Kartvizit domain
      types.ts        # BusinessCardData (extends Profile)
      defaults.ts
    catalog/          # Menü/katalog domain
      types.ts        # MenuData (extends Profile)
      business-config.ts
    share/
      encode.ts       # URL-safe payload
      decode.ts
      short-url.ts    # /api/r/[id] redirect
    qr/
      generate.ts     # ECC H, margin, logo overlay
      constants.ts
  design/             # AI prompts, themes, layouts (mevcut)
  integrations/       # CRM, Bakanlık (ileri faz)
```

### 6.2 Ortak `Profile` tabanı (kartvizit ↔ katalog geçişi)

```typescript
interface BaseProfile {
  id: string;              // UUID veya nanoid
  slug: string;            // kisa-url: "lezzet-duragi"
  type: "card" | "catalog";
  businessType?: BusinessType;  // catalog only
  displayName: string;
  tagline?: string;
  logoUrl?: string;        // CDN URL (base64 değil)
  themeId: string;
  layoutId: string;
  customThemeColors?: string[];
  publishedAt?: string;
  updatedAt: string;
}
```

**BusinessCardProfile** extends BaseProfile + contact, social, photo.  
**CatalogProfile** extends BaseProfile + categories, items.

### 6.3 Paylaşım stratejisi evrimi

| Faz | URL formatı | QR payload |
|-----|-------------|------------|
| **Şimdi (MVP)** | `/menu/view?d=base64` | Uzun URL, 1500 char limit |
| **Faz 1** | `/m/:slug` | Kısa HTTPS URL, her zaman QR-safe |
| **Faz 2** | Dinamik redirect `/r/:id` → güncel slug | Baskı değişmez |

### 6.4 Component mimarisi

```
components/
  shared/           # Field, Button, Stepper, QrCode, ThemeSwatch
  wizard/           # Generic WizardShell, StepNavigation
  card/             # Kartvizit-specific steps + preview
  catalog/          # Menü-specific (mevcut menu/ rename)
  view/             # Read-only public pages (SEO metadata)
```

**Prensip:** `shared` → domain-agnostic. `card` ve `catalog` sadece kendi step/preview'larını bilir. `ProfileHeader`, `ProfileFooter`, `ActionBar` (WhatsApp, Ara, Kaydet) paylaşılır.

---

## 7. Dönüşüm Odaklı Özellik Önerileri

Her özellik için: *"İşletme sahibinin satışlarını veya marka değerini nasıl artırır?"*

| Özellik | İş etkisi |
|---------|-----------|
| WhatsApp sipariş butonu (katalog) | Tarama → doğrudan sipariş mesajı; telefon aramasından daha yüksek conversion |
| "Kaydet" (vCard + rehber) | Kartvizit taraması → kalıcı kontakt; tekrar satış fırsatı |
| Öne çıkan ürün rozeti | Sepet/psikolojik anchor; ortalama sepet değeri artışı |
| Kapı girişi QR + fiyat özeti modu | TR regülasyon uyumu; güven algısı → müşteri girişi |
| Scan sayacı dashboard | "Bu ay 340 kişi menünüzü gördü" → yenileme motivasyonu |
| Dinamik QR | Kampanya/fiyat değişikliği anında; baskı maliyeti sıfır |
| Çoklu dil | Turist müşteri → daha yüksek harcama |
| AI profesyonel fotoğraf | Düşük kaliteli telefon fotoğrafı yerine → sipariş artışı (yemek fotoğrafı +%30 sipariş literatürü) |

---

## 8. Uygulama Yol Haritası (Öncelikli)

### Sprint 0 — Hemen (kod kalitesi + güven)
- [ ] QR `level="H"`, `marginSize={4}`
- [ ] `zod` dependency ekle (API route kullanıyor)
- [ ] vCard'a sosyal linkleri ekle
- [ ] `RESEARCH_SUMMARY.md` ✓

### Sprint 1 — Profesyonel temel
- [ ] Ortak `Profile` schema + refactor `types.ts`
- [ ] `/kartvizit/view/[slug]` hosted kart sayfası
- [ ] Menü: slug tabanlı `/m/[slug]` (localStorage persistence ile başla)
- [ ] Paylaşım sayfalarında `generateMetadata` (OG image, title, description)
- [ ] `ActionBar`: WhatsApp, Tel, Kaydet, Paylaş

### Sprint 2 — Büyüme
- [x] Scan event logging (view route + device/source)
- [x] Basit analytics panel (ProfileAnalyticsCard)
- [x] Görsel CDN upload (Vercel Blob + fallback)
- [x] vCard iyileştirme (N/FN, PHOTO URI, UTF-8 BOM, sosyal)
- [x] Dinamik QR güncelleme (existingSlug + localStorage)

### Sprint 3 — Türkiye moat
- [x] Bakanlık fiyat formatı export
- [x] Çoklu dil menü
- [x] Lite sipariş (WhatsApp sepet metni)

### Sprint 4 — Platform
- [x] Auth + hesap
- [x] CRM webhook
- [x] Takım / çok şube
- [x] Stripe freemium

---

## 9. Benchmark Metrikleri (Takip Edilecek)

| Metrik | Hedef (6 ay) |
|--------|--------------|
| Paylaşım sayfası LCP | < 2.5s |
| QR scan success rate | > 98% (Level H, 3 cihaz test) |
| Wizard tamamlama | > 60% |
| QR indirme oranı | > 40% (preview'dan) |
| Mobil traffic payı | > 75% |
| Paylaşım URL uzunluğu | < 80 karakter (slug modunda) |

---

## 10. Kaynaklar

- [Linktree](https://linktr.ee) — link-in-bio, commerce, QR
- [Canva QR Generator](https://www.canva.com/qr-code-generator/) — dinamik QR, analytics
- [Restaumatic QR Waiter](https://www.restaumatic.com/en/qr-waiter/) — sipariş + POS
- [Restomenum](https://restomenum.com/qr-menu) — TR QR menü, entegrasyonlar
- [Mobilo Digital Cards 2026](https://www.mobilocard.com/post/top-digital-business-cards-of-2025) — CRM, NFC, analytics
- [QR Best Practices — EZQR](https://ez-qr.com/guides/qr-code-best-practices) — ECC seviyeleri
- [QR Design 2026 — QR Insights](https://www.qr-insights.com/blog/2026-03-03-qr-code-design-best-practices) — logo overlay kuralları
- [Fiyat Etiketi Yönetmeliği TR](https://www.bee-law.com/fiyat-etiketi-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-resmi-gazetede-yayimlandi/) — QR zorunluluğu
- [Digital Business Card Market — Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/digital-business-card-market) — pazar büyümesi, wallet entegrasyonu

---

## 11. Sonraki Adım (Kullanıcı Talimatı)

Araştırma tamamlandı. Kodlamaya geçerken önerilen sıra:

1. **Ortak veri şeması (`Profile` base)** — kartvizit ve katalog tek mimaride
2. **QR ECC Level H upgrade** — hızlı kazanım
3. **Hosted kartvizit view** — en büyük profesyonellik sıçraması
4. **Slug tabanlı kısa URL** — QR limiti ve analitik temeli

*Bu dosya proje hafızasıdır; her sprint öncesi güncellenmelidir.*
