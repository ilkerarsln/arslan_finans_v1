# Ciro ve Finansal Analiz Matrisi Geliştirme ve Optimizasyon Planı

Bu plan, **Arslan Mobilya ERP** sistemindeki **Raporlar** sekmesinde yer alan **Ciro ve Finansal Analiz modülünü** kullanıcının belirlediği tam sütun seti, dinamik formül motoru, alt toplam payları, Excel gibi doğrudan hücre düzenleme ve sayfa akışına uyumlu ferah tablo tasarımıyla tamamen güncellemek üzere hazırlanmıştır.

---

## Kullanıcı Tercihleri ve Kararlar (Faz 1 Özeti)

> [!IMPORTANT]
> **Doğrulanan Kullanıcı Tercihleri:**
> 1. **Aylık Ortalama Hesaplama Kuralı:** Genel toplam, sabit 12 aya değil; **yalnızca cirosu girilen aktif ay sayısına** bölünerek hesaplanacaktır.
> 2. **Hücre Düzenleme Deneyimi:** Excel spreadsheet mantığında olduğu gibi, matris üzerindeki herhangi bir ay hücresine veya kârlılık oranına **tıklanıp anında inline olarak yazılacak**, değer girildiği anda tüm alt toplamlar, büyüme ve brüt kârlar anında güncellenecektir.
> 3. **Kaydırma Çubuğu ve Yükseklik:** Tablo içerisindeki dar dikey scrollbar (`max-h-[680px]` vb.) tamamen kaldırılacak, tablo `auto-height` ile sayfa genel akışına bırakılacak; satır ve sütun boşlukları görsel ferahlık için optimize edilecektir.

---

## 1. Genel Bakış ve Kapsam

- **Hedef Ekran:** `Raporlar & Analiz` -> `Ciro & Finansal Analiz Matrisi (Excel Uyumlu)` (`src/components/reports/CiroMatrixModule.tsx`).
- **Amaç:** 
  - Beyaz Eşya ve Mobilya ana grupları altındaki 12 ana kategori/markanın Ocak–Aralık 12 aylık cirolarını, kârlılık oranlarını, genel toplamlarını, aktif aylık ortalamalarını, 2025 baz yılı kıyasını (Büyüme TL ve Büyüme %), tahmini brüt kâr tutarlarını tek bir entegre matriste birleştirmek.
  - "BEYAZ EŞYA ALT TOPLAM" ve "MOBİLYA ALT TOPLAM" satırlarında dinamik ciro, kâr ve **Genel Toplam içindeki Pay Yüzdesi (`Payı: %...`)** özetini sunmak.
  - Tablonun en altında **GENEL FİRMA TOPLAMI** satırı ile tüm şirketin aylık ve yıllık ciro/kâr/büyüme performansını raporlamak.
  - Excel içe aktarım sihirbazı (`Data Importer` / `CiroDataImporter`) ile tam entegrasyon sağlamak.

---

## 2. Kullanıcı Deneyimi ve Arayüz Tasarımı (UI/UX)

### A. Matris Sütun Mimarisi
Tablo soldan sağa şu tam sütun setine sahip olacaktır:
1. **Grup** (`BEYAZ EŞYA` / `MOBİLYA`)
2. **Kategori / Marka** (`ALTUS`, `UĞUR`, `HOOVER`, `KEA`, `TV`, `BOSCH`, `MEDİSA`, `MOBİLYA`, `YATAK`, `BAMBİ`, `MASA`, `AKSESUAR`)
3. **Ortalama Kârlılık (%)** (Tıklanıp doğrudan düzenlenebilen dinamik oran, örn: `%22`, `%32`)
4. **Aylık Ciro Sütunları (12 Ay):** `Ocak`, `Şubat`, `Mart`, `Nisan`, `Mayıs`, `Haziran`, `Temmuz`, `Ağustos`, `Eylül`, `Ekim`, `Kasım`, `Aralık`
5. **Genel Toplam (TL):** Ocak–Aralık satır toplamı
6. **Aylık Ortalama (TL):** Genel Toplam / Aktif girilen ay sayısı
7. **2025 Yılı Toplamı (TL):** 2025 baz yılı toplam cirosu
8. **Büyüme (TL):** Genel Toplam - 2025 Toplamı (Pozitif ise yeşil `+`, negatif ise kırmızı `-`)
9. **Büyüme Oranı (%):** (Büyüme TL / 2025 Toplamı) * 100
10. **Tahmini Brüt Kâr (TL):** Genel Toplam * (Ortalama Kârlılık % / 100)

### B. Kaydırma Çubuğu (Scrollbar) ve Boşluk Optimizasyonu
- **Dar Dikey Scrollbar İptali:** Tablonun etrafındaki `max-h-[680px]` ve `overflow-y-auto` sınırlandırmaları kaldırılacak. Tablo dikeyde kesintisiz, akışkan (`h-auto`) olarak sayfa gövdesiyle birlikte uzayacak.
- **Yatay Akış:** 22 sütunluk geniş finansal tablonun yatayda taşmaması için yalnızca dış kapsayıcıda akıcı yatay kaydırma (`overflow-x-auto`) bulunacak; sol sütunlar (`Grup`, `Kategori/Marka`, `Kârlılık %`) `sticky` ile sabit tutularak okunabilirlik korunacak.
- **Görsel Ferahlık:** Hücre içi dolgular `py-3.5 px-3.5` seviyesine çıkartılacak, yazı tipleri netleştirilecek, sayılar `font-mono tabular-nums` ile dikey hizada parlayacak.

### C. Excel Tarzı Doğrudan Hücre Düzenleme (Inline Editing)
- Kullanıcı herhangi bir ay hücresine tıkladığında hücre anında bir `input` kutucuğuna dönüşür.
- Değer yazılıp Enter tuşuna basıldığında veya dışarı tıklandığında (blur) değer anında kaydedilir ve Firestore / Context verisine işlenir.
- Otomatik ERP satışlarından gelen cirolar (`liveSalesAmount`) ile manuel girişler şeffaf biçimde birleştirilir.

---

## 3. Otomatik Hesaplama Motoru (Formüller)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                OTOMATİK HESAPLAMA MOTORU                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Satır Genel Toplamı (TL)  = ∑(Ocak .. Aralık Girilen Aylık Cirolar)                 │
│ 2. Aktif Ay Sayısı           = Cirosu > 0 olan ay adedi (0 ise en az 1)                │
│ 3. Aylık Ortalama (TL)       = Genel Toplam / Aktif Ay Sayısı                          │
│ 4. Büyüme (TL)               = Genel Toplam - 2025 Yılı Toplamı                        │
│ 5. Büyüme Oranı (%)          = (Büyüme TL / 2025 Yılı Toplamı) * 100                   │
│ 6. Tahmini Brüt Kâr (TL)     = Genel Toplam * (Ortalama Kârlılık Oranı % / 100)        │
│ 7. Grup Payı (%)             = (Grup Genel Toplamı / GENEL FİRMA TOPLAMI) * 100        │
│ 8. Grup Ağırlıklı Kâr (%)    = (Grup Toplam Brüt Kârı / Grup Genel Toplamı) * 100      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Tetikleyiciler:** Kullanıcı herhangi bir ay cirosunu veya satır kârlılık yüzdesini değiştirdiği anda tüm satırlar, alt toplamlar ve genel firma toplamı sıfır gecikmeyle (anlık) yeniden hesaplanır.

---

## 4. Teknik Mimari ve Değişiklik Yapılacak Bileşenler

```
src/
├── types/finance.ts            --> Ciro matrisi tipleri (Aktif ay sayısı, 2025 baz yılı, büyüme)
├── utils/ciroCalculations.ts   --> Aktif ay ortalaması, 2025 kıyas formülleri, dinamik grup payları
├── utils/ciroExcelExport.ts    --> 2025 kıyas sütunları ve grup paylarıyla tam uyumlu Excel ihracı
├── components/reports/
│   └── CiroMatrixModule.tsx    --> Dikey scrollbar'sız, ferah, inline-editable ana matris arayüzü
├── components/importer/
│   └── CiroDataImporter.tsx    --> Excel ciro şablonu yükleme ve anlık matrise aktarma entegrasyonu
└── context/FinanceContext.tsx  --> Inline düzenlemelerin anlık context ve localStorage'a yazılması
```

---

## 5. Doğrulama ve Test Adımları

1. **Hesaplama Doğrulaması:** 
   - 3 ayı dolu bir satır için (örn: 300K, 300K, 300K = 900K) aylık ortalamanın 900K / 3 = 300K çıktığı doğrulanacak.
   - 2025 toplamı ile farkın Büyüme TL ve Büyüme % sütunlarına tam yansıdığı kontrol edilecek.
   - Brüt kâr tutarının `Genel Toplam x Kârlılık %` formülüyle hatasız çarptığı test edilecek.
2. **Alt Toplam ve Pay Doğrulaması:**
   - Beyaz Eşya ve Mobilya alt toplamlarının toplamları ve `Payı: %...` değerlerinin toplamının %100 verdiği doğrulanacak.
   - GENEL FİRMA TOPLAMI satırının tüm şirketi eksiksiz özetlediği test edilecek.
3. **UI ve Scrollbar Doğrulaması:**
   - İç dikey kaydırma çubuğunun kaldırıldığı, sayfanın akıcı ve ferah şekilde dikeyde aktığı doğrulanacak.
   - Hücrelere doğrudan tıklanarak inline düzenleme yapılabildiği doğrulanacak.
4. **Kod Derleme Testi:**
   - `compile_applet` ile TypeScript ve Vite üretim derlemesinin sıfır hatayla geçtiği teyit edilecek.
