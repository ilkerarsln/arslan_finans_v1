# Ciro ve Finansal Analiz Modülü: Çoklu Yıl İlişkileri, Kuruluş Yılı (2024) Mantığı ve Toplam Doğrulama Planı

Bu plan; **Arslan Mobilya ERP** sistemindeki **Ciro ve Finansal Analiz** modülünde, şirketin kuruluş yılı olan **2024** yılına ait büyüme oranlarının sıfırlanmasını/hatasız gösterilmesini, 2025 ve sonraki yıllarda bir önceki yılın gerçek verileriyle dinamik eşleştirilmesini ve alt/genel toplamların matematiksel tutarlılığını sağlamayı hedefler.

---

## Kullanıcı Tercihleri ve Kritik Kararlar

> [!IMPORTANT]
> Kullanıcı "TOPLAMLAR DOĞRU HESAPLANSIN" talimatını vermiştir. Yapılan tüm matematiksel hesaplamalar ve çoklu yıl eşleştirmeleri şu kurallara bağlanmıştır:

1. **Kuruluş Yılı (2024) Büyüme Sıfırlama Kuralı:**
   - Arslan Mobilya 2024 yılında kurulduğundan 2023 verisi bulunmamaktadır.
   - 2024 yılı seçildiğinde karşılaştırma sütunları ve büyüme metrikleri hatalı eksi değerler üretmeyecek; `Kuruluş Yılı (İlk Yıl)` olarak etiketlenip büyüme tutar ve oranları sıfırlanacaktır.
2. **2025 ve Sonrası Dinamik Kıyaslama:**
   - 2025 yılı incelenirken karşılaştırma sütunu dinamik olarak **2024 Yılı Toplamı (TL)** başlığını alacak ve 2024'ün gerçek ciro verilerini çekecektir.
   - 2026 yılı incelenirken dinamik olarak **2025 Yılı Toplamı (TL)** verileriyle eşleşecektir (`Yıl - 1` dinamik kuralı).
3. **Kusursuz Toplam Motoru ("TOPLAMLAR DOĞRU HESAPLANSIN"):**
   - **Genel Toplam (TL):** Satırdaki 12 ayın toplamı (`Ocak + ... + Aralık`).
   - **Aylık Ortalama (TL):** Cirosu girilen aktif ay sayısına göre (`Genel Toplam / Aktif Ay Sayısı`).
   - **Büyüme (TL):** `Cari Yıl Genel Toplamı - Geçmiş Yıl Toplamı` (2024 için N/A).
   - **Büyüme Oranı (%):** `(Büyüme / Geçmiş Yıl Toplamı) × 100` (Geçmiş yıl yoksa 0 / N/A).
   - **Tahmini Brüt Kâr (TL):** `Genel Toplam × (Kârlılık Oranı / 100)`.
   - **BEYAZ EŞYA ALT TOPLAM & MOBİLYA ALT TOPLAM:**
     - 12 ayın her birinin grup toplamı.
     - Grubun genel toplamı, aktif ay ortalaması, geçmiş yıl toplamı, büyüme TL ve %, tahmini brüt kârı ve **Genel Firma Cirosu İçindeki Payı (`Payı: %...`)**.
   - **GENEL FİRMA TOPLAMI:**
     - Tüm grupların ve markaların toplamı, ağırlıklı kârlılık ortalaması ve firma geneli büyüme metriği.

---

## 1. Mimari ve Veri Akış Şeması

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Ciro & Finansal Analiz Modülü                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                 Yıl Seçimi: [ 2024 | 2025 | 2026 | ... ]
                                     │
           ┌─────────────────────────┴────────────────────────┐
           ▼                                                  ▼
   [ 2024 Seçildiğinde ]                             [ 2025+ Seçildiğinde ]
   Kuruluş Yılı Mantığı                             Dinamik Önceki Yıl Eşleştirme
   • comparisonYear = 'Kuruluş Yılı'                • comparisonYear = (Yıl - 1)
   • pastYearTotal = '-'                            • pastYearTotal = 2024 Gerçek Ciroları
   • growthAmount = '-' / 0                         • growthAmount = Cari - Önceki Yıl
   • growthRate = '-' / 0                           • growthRate = (Fark / Önceki) × 100
   • KPI: "Kuruluş Yılı (İlk Dönem)"                 • KPI: "2024 Yılına Göre Büyüme"
           │                                                  │
           └─────────────────────────┬────────────────────────┘
                                     ▼
                ┌───────────────────────────────────────────┐
                │   Hesaplama Motoru (ciroCalculations.ts)  │
                │   • Satır Bazlı 12 Ay Toplamı             │
                │   • Aktif Ay Sayısına Göre Ortalama       │
                │   • Brüt Kâr = Ciro × Kâr Marjı           │
                │   • Grup Alt Toplamları + Pay Yüzdesi %   │
                │   • GENEL FİRMA TOPLAMI (Matris Özeti)    │
                └─────────────────────┬─────────────────────┘
                                      ▼
                ┌───────────────────────────────────────────┐
                │   Kullanıcı Arayüzü (CiroMatrixModule)    │
                │   • 22 Sütunlu Geniş Matris Tablosu       │
                │   • Dinamik Sütun Başlığı ("2024 Toplam") │
                │   • Tıklanabilir Excel Tipi Inline Edit   │
                │   • Auto-height (İç Dikey Scrollbar Yok)  │
                └───────────────────────────────────────────┘
```

---

## 2. Yapılacak Değişiklikler ve Dosya Eşleştirmesi

### 1. `src/utils/ciroCalculations.ts`
* `calculateCiroMatrix` fonksiyonuna **Kuruluş Yılı Kontrolü** (`isFoundationYear = currentYearNum <= 2024`):
  * `comparisonYear` belirlenmesi: `currentYearNum <= 2024` ise `null` veya `''`; aksi takdirde `String(currentYearNum - 1)`.
  * 2024 seçildiğinde:
    * `isFoundationYear = true`
    * `pastYearTotal = 0`
    * `growthAmount = 0`
    * `growthRate = 0`
  * 2025 seçildiğinde:
    * `comparisonYear = '2024'`
    * 2024 yılındaki gerçek hücre ve manuel kayıtlar toplanarak her markanın `pastYearTotal` değerine yazılacak.
    * Büyüme TL ve Büyüme % formülleri kusursuz hesaplanacak.
  * Grup Alt Toplamları (`BEYAZ EŞYA ALT TOPLAM`, `MOBİLYA ALT TOPLAM`) ve `GENEL FİRMA TOPLAMI`:
    * Her grup için 12 ayın toplamı, Genel Toplam, aktif ay ortalaması ve brüt kârlar tek tek toplanarak doğrulanacak.
    * Matristeki hiçbir satırda NaN veya tanımsız değer oluşmayacak.

### 2. `src/components/reports/CiroMatrixModule.tsx`
* Sütun Başlığı:
  * `{matrixResult.isFoundationYear ? 'Geçmiş Yıl' : `${matrixResult.comparisonYear} Yılı Toplamı (TL)`}`
* Tablo Satırları (Markalar, Alt Toplamlar ve Genel Firma Toplamı):
  * Eğer `matrixResult.isFoundationYear` ise:
    * Kıyaslama sütununda `"-"` gösterilecek.
    * Büyüme (TL) ve Büyüme Oranı (%) alanlarında `"Kuruluş Yılı"` veya `"-"` rozeti gösterilecek.
  * 2025 ve sonrasında:
    * Gerçek 2024 toplamı, büyüme TL ve yeşil/kırmızı büyüme oranı gösterilecek.
* Üst KPI Kartları:
  * 2024'te büyüme kartında "Kuruluş Yılı / İlk Dönem" bilgisi sunulacak, hatalı negatif büyüme kartı gösterilmeyecek.

### 3. `src/utils/ciroExcelExport.ts`
* Excel dışa aktarımında da 2024 için büyüme alanlarına `"Kuruluş Yılı"` yazılarak ve 2025 için 2024 kıyaslama verileri eklenerek rapor bütünlüğü sağlanacak.

---

## 3. Doğrulama ve Test Adımları
1. **2024 Yılı Testi:**
   - Yıl seçiciden 2024 seçilecek.
   - Büyüme sütunlarında negatif sayı olmamalı, "Kuruluş Yılı" veya "-" çıkmalı.
   - 12 ay toplamları ve alt toplamlar kontrol edilecek.
2. **2025 Yılı Testi:**
   - Yıl seçiciden 2025 seçilecek.
   - Sütun başlığının "2024 Yılı Toplamı (TL)" olduğu ve 2024'ün gerçek cirolarıyla eşleştiği doğrulanacak.
   - Büyüme TL ve Büyüme % hesapları test edilecek.
3. **Toplamların Doğruluğu:**
   - Alt toplamların (Beyaz Eşya + Mobilya) Genel Firma Toplamı ile kuruşu kuruşuna eşit olduğu doğrulanacak.
   - `compile_applet` ve `lint_applet` ile sıfır hata onayı alınacak.
