# Arslan Finans - Tanımlamalar & Veri Aktarım Merkezi Yenileme Planı

Tanımlamalar sayfasının ERP standartlarında yeniden yapılandırılması, Veri Ciro Sihirbazı eklenmesi, Vade Oranları ve Fiyat Listelerinin (Toptan & Perakende) bağımsız bölümlere ayrılması ve tüm veri içe/dışa aktarım operasyonlarının yeni "Veri Aktar" merkezi altında toplanması planıdır.

---

### Kullanıcı Tercihleri & Onaylanan Kararlar

> [!IMPORTANT]
> 1. Aşamada kullanıcı ile teyit edilen kararlar doğrultusunda mimari kurgulanmıştır:

- **Veri Aktar Konumu**: Sol ana menüde (Sidebar) bağımsız **Veri Aktar** (`data-transfer`) sekmesi olarak yer alacaktır.
- **Veri Ciro Sihirbazı**: Tanımlamalar sayfası başlığından ve ilgili bölümden tetiklenen hızlı hedefleme, dağıtım ve ciro hesaplama modali olarak çalışacaktır.
- **Fiyat Listeleri**: "Fiyat Listeleri" ana başlığı altında **Toptan Fiyat Listesi** ve **Perakende Fiyat Listesi** olmak üzere iki bağımsız sekme olarak sunulacaktır.
- **Kategori Hiyerarşisi**: "Kategoriler" başlığı altında kesin sıralama korunacaktır:
  1. Ana Kategoriler
  2. Alt Kategoriler
  3. Ürün Grupları
  4. Markalar
- **Vade Oranları**: Ayrı ve tamamen bağımsız bir bölüm olarak yer alacaktır.

---

## 1. Genel Bakış ve Kapsam

Arslan Finans ERP sisteminde operasyonel verimliliği artırmak ve veri giriş karmaşasını önlemek adına iki temel alan yeniden düzenlenecektir:

1. **Tanımlamalar Sayfası (`DefinitionsTab.tsx`)**:
   - Üst seviye navigasyonda modüler gruplama:
     - **Kategoriler & Ürün Ağacı**: Ağaç Görünümü (Tree View), 1. Seviye (Ana Kategoriler), 2. Seviye (Alt Kategoriler), 3. Seviye (Ürün Grupları) ve 4. Seviye (Markalar).
     - **Vade Oranları**: Dönemsel/aylık vade farkı oranlarının yönetildiği bağımsız bölüm.
     - **Fiyat Listeleri**: Toptan Fiyat Listesi ve Perakende Fiyat Listesi sekmelerine sahip bağımsız bölüm.
     - **Ortak Tedarikçiler**: Tedarikçi cari tanımları.
   - **Veri Ciro Sihirbazı**: Tanımlamalar sayfasına doğrudan eklenen, kategori/marka bazında aylık tahmini veya gerçekleşen ciro dağıtımlarını hesaplayıp matrise ve kâr motoruna aktaran interaktif sihirbaz.

2. **Veri Aktar Merkezi (`DataTransferTab.tsx`)**:
   - Dağınık olan tüm Excel/JSON içe ve dışa aktarma işlemleri tek bir operasyonel merkezde toplanacaktır.
   - 3 temel sekme:
     - **Ciro Aktar**: Ciro matrisi Excel şablonu indirme, Excel/CSV ile yıllık ciro verisi yükleme ve dışa aktarma.
     - **Satış Aktar**: Satış fişleri ve hareketlerini toplu Excel şablonu ile içe aktarma, mevcut satışları Excel/JSON olarak dışa aktarma.
     - **Ödeme Aktar**: Gelir/gider kasa hareketleri, tahsilat ve tediye kayıtlarını Excel/JSON ile içe ve dışa aktarma.

---

## 2. Kullanıcı Deneyimi & Arayüz Tasarımı (UX & UI)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Sol Kenar Menüsü (Sidebar)                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 📊 Ciro & Analiz Matrisi                                              │
│ 📈 Gösterge Paneli                                                    │
│ 🏷️  Satış & Kârlılık Takibi                                           │
│ 📦 Mal Alım & Stok                                                    │
│ ⇄  Gelir / Gider (Kasa)                                              │
│ 🏦 Bankalar & Kasalar                                                  │
│ 👥 Cari Hesaplar                                                       │
│ ⚙️  Tanımlamalar ───► [ Kategoriler | Vade Oranları | Fiyat Listeleri ] │
│ 📅 Vade Takvimi                                                       │
│ 📥 Veri Aktar (YENİ) ──► [ Ciro Aktar | Satış Aktar | Ödeme Aktar ]   │
│ 🛡️  Denetim & Onaylar (Admin)                                         │
│ 👤 Personel & Roller (Admin)                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Tanımlamalar Sayfası Yeni Sekme Düzeni
Tanımlamalar sayfasında üst bar şu yapıyla modernize edilecektir:
- **Kategoriler (Dropdown veya Gruplu Butonlar)**:
  1. `Ana Kategoriler`
  2. `Alt Kategoriler`
  3. `Ürün Grupları`
  4. `Markalar`
  *(İsteğe bağlı hızlı gezinim için Ağaç Görünümü korunaklı kalacaktır)*
- **Vade Oranları**: Bağımsız buton/sekme (aylık vade marjları ve katsayıları).
- **Fiyat Listeleri**:
  - `Toptan Fiyat Listesi` (Tedarikçi/toptan alım-satım liste fiyatları, iskonto oranları).
  - `Perakende Fiyat Listesi` (Müşteri son tüketici fiyatları, KDV ve taksitli satış referansları).
- **Veri Ciro Sihirbazı Butonu**: Başlık sağ üst kısmında dikkat çekici zümrüt/altın degrade aksanlı "Veri Ciro Sihirbazı" butonu. Tıklandığında adım adım yönlendirmeli sihirbaz modalı açılacaktır.

### B. Veri Ciro Sihirbazı (Ciro Dağıtım & Hesaplama Modalı)
Sihirbaz 3 adımdan oluşacaktır:
1. **Hedef & Dönem Belirleme**: Yıl (örn. 2025/2026), grup seçimi (BEYAZ EŞYA / MOBİLYA), hedef yıllık ciro tutarı.
2. **Kategori ve Marka Dağılımı**: Sistemdeki Ana Kategori ve Markalar listelenerek yüzde (%) veya ağırlık katsayısı verilir. Mevsimsellik çarpanı (yaz/kış/çeyiz sezonu) uygulanabilir.
3. **Önizleme & Matrise Yazma**: Aylık simülasyon tablosu oluşturulur ve tek tıkla canlı ciro matrisine işlenir.

### C. Veri Aktar Bölümü (Data Transfer Hub)
- **Tasarım Dili**: SaaS Dashboard ilkelerine uygun, yüksek yoğunluklu veri aktarım kartları, sürükle-bırak Excel/CSV yükleme alanları, şablon indirme aksiyonları ve veri doğrulama logları.
- **Sekme 1 - Ciro Aktar**:
  - Örnek Ciro Excel Şablonu İndir (.xlsx)
  - Yıl Seçimi & Excel Yükle
  - Yüklenecek satırları önizleme ve çakışma kontrolü
  - Mevcut Ciro Matrisini Excel Olarak Dışa Aktar
- **Sekme 2 - Satış Aktar**:
  - Örnek Satış Şablonu İndir (.xlsx)
  - Müşteri, ürün grubu, satış tipi (Senetli/Peşin), ciro ve kâr satırlarını içeren toplu Excel içe aktarma
  - Mevcut Satış Veritabanını Excel veya JSON olarak dışa aktarma
- **Sekme 3 - Ödeme Aktar**:
  - Gelir / Gider ve Kasa Hareketleri şablonu
  - Banka ve Kasa hesap eşleştirmesi ile toplu hareket yükleme
  - Kasa hareketlerini Excel olarak dışa aktarma

---

## 3. Mimari ve Bileşen Yapısı

```
src/
├── types/finance.ts                 # ActiveTab: 'data-transfer' tipi eklenir
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx              # 'data-transfer' (Veri Aktar) menü öğesi eklenir
│   ├── tabs/
│   │   ├── DefinitionsTab.tsx       # Kategoriler, Vade Oranları, Fiyat Listeleri (Toptan/Perakende)
│   │   └── DataTransferTab.tsx      # YENİ: Ciro, Satış, Ödeme içe/dışa aktar merkezi
│   └── modals/
│       └── CiroWizardModal.tsx      # YENİ: Tanımlamalar Veri Ciro Sihirbazı
└── App.tsx                          # 'data-transfer' sekmesini ve yeni modalı render eder
```

---

## 4. Uygulama Adımları

1. **Tip Tanımlamaları (`src/types/finance.ts`)**:
   - `ActiveTab` tipine `'data-transfer'` eklenmesi.
   - Fiyat listesi girdilerine `type?: 'Toptan' | 'Perakende'` desteği eklenmesi.

2. **Veri Ciro Sihirbazı Bileşeni (`src/components/modals/CiroWizardModal.tsx`)**:
   - Kategori ve markalara göre ciro hedefleme, mevsimsel dağıtım katsayısı ve Ciro Matrisine toplu aktarım fonksiyonu.

3. **Tanımlamalar Sayfası Yeniden Yapılandırması (`src/components/tabs/DefinitionsTab.tsx`)**:
   - Alt menünün revize edilmesi:
     - `kategoriler` sekmesi altında (Ana Kategoriler, Alt Kategoriler, Ürün Grupları, Markalar).
     - Bağımsız `vaderates` (Vade Oranları) sekmesi.
     - Bağımsız `pricelists` (Fiyat Listeleri) sekmesi, içerisinde `Toptan` ve `Perakende` alt görünümleri.
   - Header kısmına "Veri Ciro Sihirbazı" butonunun eklenmesi.

4. **Veri Aktar Sekmesi (`src/components/tabs/DataTransferTab.tsx`)**:
   - `Ciro Aktar`, `Satış Aktar`, `Ödeme Aktar` sekmeleriyle tam fonksiyonel import/export motoru.

5. **Navigasyon & App Entegrasyonu (`src/components/layout/Sidebar.tsx` & `src/App.tsx`)**:
   - Sidebar'a `Veri Aktar` bağlantısının eklenmesi (`DownloadCloud` / `ArrowDownUp` ikonu).
   - `App.tsx` içine `DataTransferTab` ve `CiroWizardModal` bileşenlerinin bağlanması.

6. **Doğrulama & Test**:
   - Kod bütünlüğü ve `compile_applet` kontrolü.
   - Hiyerarşi, sihirbaz ve aktarım işlemlerinin fonksiyonel testi.
