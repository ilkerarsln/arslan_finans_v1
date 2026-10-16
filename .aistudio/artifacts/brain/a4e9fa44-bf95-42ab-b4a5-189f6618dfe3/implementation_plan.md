# Arslan Mobilya ERP: 3 Seviyeli Kategori Hiyerarşisi, Marka & Ürün Düzenleme Planı

## 1. Genel Bakış ve Hedefler
Kullanıcının yüklediği kategori hiyerarşisi tablosuna (Görsel referansı) tam uyumlu olarak:
1. **3 Seviyeli Zorunlu Kategori Hiyerarşisi**:
   - `anaKategori`: MOBİLYA, BEYAZ EŞYA
   - `altKategori`: BAMBİ, ALTUS, KEA, HOOVER, UGUR, BOSCH, YATAK, MASA, MEDİSA, AKSESUAR vb.
   - `urunGrubu`: BAMBİ BASLIK, BAMBİ BAZA, ALTUS ANKASTRE DAVLUMBAZLAR vb.
2. **Kademeli (Cascading) Seçim Deneyimi**:
   - Ana Kategori seçildiğinde bağlı Alt Kategoriler filtrelenir.
   - Alt Kategori seçildiğinde bağlı Ürün Grupları filtrelenir.
   - Resimdeki tüm ~75 hiyerarşik kategori kaydı sisteme hazır veri olarak tanımlanır.
3. **Bağımsız Marka Alanı**:
   - Ürün kartları ve formlarına isteğe bağlı harici `marka` / `brand` alanı entegre edilir.
4. **Sonradan Kolay Düzenleme (Full Product Edit Modal)**:
   - Depodaki ve fiyat listelerindeki ürünlerin 3 seviyeli kategorisi, markası, alış/satış fiyatı, genel iskonto oranı ve vade gün bilgisi tek tıkla açılan modern bir modal üzerinden anında güncellenir ve veritabanına işlenir.
5. **Kod Tabanı Temizliği**:
   - Eski uyumsuz tek seviyeli kategori kalıntıları temizlenir. Data Importer şablonları ve ön izleme tabloları 3'lü yapıya uygun hale getirilir.

---

## 2. Veri Modeli ve Tipler (`src/types/finance.ts`)
* `CategoryHierarchyItem`:
  ```typescript
  export interface CategoryHierarchyItem {
    id: string;
    anaKategori: 'MOBİLYA' | 'BEYAZ EŞYA' | string;
    altKategori: string;
    urunGrubu: string;
  }
  ```
* `StockItem` & `PriceListItem` & `LeanImportPreviewItem`:
  ```typescript
  export interface StockItem {
    id: string;
    code?: string; // stokKodu
    name: string; // urunAdi
    anaKategori: string; // Zorunlu Ana Kategori (MOBİLYA, BEYAZ EŞYA)
    altKategori: string; // Zorunlu Alt Kategori (BAMBİ, ALTUS, vb.)
    urunGrubu: string; // Zorunlu Ürün Grubu (BAMBİ YATAK, ALTUS FIRIN vb.)
    brand?: string; // İsteğe bağlı Marka
    purchasePrice: number; // Alış Fiyatı (Net Maliyet)
    salePrice: number; // Satış Fiyatı (10 TL katına yuvarlanmış)
    iskontoOrani?: number; // Uygulanan İskonto %
    karMarjiOrani?: number; // Kâr Marjı %
    vadeDays?: number; // Ödeme Vadesi (Gün)
    quantity: number;
    // Geriye dönük uyumluluk için alias:
    category?: string;
  }
  ```

---

## 3. Hazır Hiyerarşi Veritabanı (`src/data/initialCategories.ts`)
Kullanıcının yüklediği görseldeki tablonun birebir dijitalleştirilmiş tam listesi:
* **MOBİLYA > BAMBİ**: BAMBİ BASLIK, BAMBİ BAZA, BAMBİ BHC MOB, BAMBİ EV TEKS, BAMBİ KOMODIN, BAMBİ OTEL BASLIK, BAMBİ OTEL BAZA, BAMBİ OTEL KOMODIN, BAMBİ OTEL YATAK, BAMBİ TV KLTK, BAMBİ YATAK, BAMBİ YATAK BEBE, BAMBİ YTK AKS
* **BEYAZ EŞYA > ALTUS**: ALTUS ANKASTRE DAVLUMBAZLAR, ALTUS ANKASTRE FIRINLAR, ALTUS ANKASTRE OCAKLAR, ALTUS ASPİRATÖR, ALTUS BULAŞIK MAKİNELERİ, ALTUS ÇAMAŞIR MAKİNELERİ, ALTUS ÇEKMECELİ DERİN DONDURUCU, ALTUS ÇİFT KAPILI BUZDOLAPLARI, ALTUS ÇİFT KAPILI NF BUZDOLAPLARI, ALTUS ISI POMPALI KURUTMA MAKİNELERİ, ALTUS KEA, ALTUS KLİMA, ALTUS KOMBİ NF BUZDOLAPLARI, ALTUS NOFROST ÇEKMECELİ DERİN DONDURUCU, ALTUS SOLO SETÜSTÜ OCAKLAR, ALTUS TEK KAPILI BUZDOLAPLARI, ALTUS TV, ALTUS ÜSTTEN KAPAKLI DERİN DONDURUCU, ALTUS YOĞUŞMALI KURUTMA MAKİNELERİ
* **BEYAZ EŞYA > BOSCH**: BOSCH
* **BEYAZ EŞYA > HOOVER**: HOOVER BULAŞIK MAKİNESİ, HOOVER ÇAMAŞIR MAKİNESİ, HOOVER KURUTMA MAKİNESİ, HOOVER KURUTMALI ÇAMAŞIR MAKİNESİ
* **BEYAZ EŞYA > UGUR**: UGUR ANKASTRE DAVLUMBAZ, UGUR ANKASTRE FIRIN, UGUR ANKASTRE OCAK, UGUR BUZDOLABI, UGUR CEKMECELI DONDURUCU, UGUR ÇAMAŞIR MAKİNESİ, UGUR KURUTMA MAKİNESİ, UGUR NF CEKMECELİ DONDURUCU, UGUR SETUSTU OCAK, UGUR SU ARITMA, UGUR ÜSTTEN KAPAKLI DONDURUCU, UGUR BULASIK MAKİNESİ
* **MOBİLYA > MOBİLYA**: AKABE, ANKARA MOBİLYA, AYTASHOME, BENİMODAM, HALI, İPEK, LADİN, ÖREN MOBİLYA, SERHAT
* **MOBİLYA > YATAK**: BEDLIFE CIBO, FİENTO
* **MOBİLYA > MASA**: BULUT AKSESUAR, MASA SANDALYE
* **MOBİLYA > AKSESUAR**: BÜRO, SEHPA, ÜTÜ MASA KURUTMA, DEKORASYON
* **MOBİLYA > MEDİSA**: MEDISA DELUKS, MEDISA LUKS, MEDISA MAKSİ, MEDISA PREMIUM, MEDISA TEKİL, MEDISA YATAK ODASI, MEDISA YEMEK ODASI
* **BEYAZ EŞYA > KEA**: ALTUS KEA, MUHTELİF KEA, TEFAL KARCHER
* **BEYAZ EŞYA > TV**: SKYTECH

---

## 4. Kullanıcı Arayüzü & Bileşen Güncellemeleri

### A. Kademeli Kategori Seçici Bileşeni (`CategoryCascader.tsx`)
* Formlarda ve modal'larda tekrar kullanılabilir 3'lü seçim bileşeni:
  1. `Ana Kategori` açılır kutusu (`MOBİLYA`, `BEYAZ EŞYA`)
  2. `Alt Kategori` açılır kutusu (Seçilen ana kategoriye göre filtrelenir)
  3. `Ürün Grubu` açılır kutusu (Seçilen alt kategoriye göre filtrelenir)
  4. Ayrıca "Yeni Kategori/Grup Ekle" serbest giriş desteği.

### B. Kapsamlı Ürün Düzenleme Modalı (`ProductEditModal.tsx`)
Stok tablosundaki veya fiyat listesindeki kalemlerin sağındaki "Düzenle" butonuna tıklandığında açılır:
* **Temel Bilgiler**: Stok Kodu, Ürün Adı, İsteğe bağlı Marka alanı.
* **3 Seviyeli Kategori**: Ana Kategori -> Alt Kategori -> Ürün Grubu kademeli seçicisi.
* **Fiyat & Maliyet**: Alış Fiyatı (TL), Satış Fiyatı (TL), Otomatik 10 TL katına yuvarlama butonu.
* **Koşullar**: İskonto Oranı (%), Kâr Marjı (%), Ödeme Vadesi (Gün / Tarih).
* **Kaydet**: Hem yerel belleği hem Firestore'u günceller, anında ekranda yansıtır.

### C. Data Importer (İçe Aktarma Sihirbazı) Entegrasyonu
* İçe aktarılan Excel/CSV ürünleri fiyat listesiyle eşleştiğinde 3 seviyeli kategori bilgilerini (`anaKategori`, `altKategori`, `urunGrubu`) otomatik taşır.
* Eşleşmeyen veya yeni ürünler için ön izleme tablosunda kademeli kategori ve marka seçimi/girişi yapılabilir.

### D. Stok & Tanımlamalar Ekranları (`StockTab.tsx`, `DefinitionsTab.tsx`)
* Stok filtreleme çubuğuna Ana Kategori ve Alt Kategori filtreleri eklenir.
* Tabloda `Ana Kategori`, `Alt Kategori`, `Ürün Grubu` ve `Marka` sütunları net ve düzenli gösterilir.
* Tanımlamalar tabında 3 seviyeli kategori hiyerarşisi ağaç (tree) ve liste görünümünde yönetilebilir, yeni gruplar eklenebilir.

---

## 5. Uygulama Adımları
1. **Adım 1**: `src/types/finance.ts` içinde 3 seviyeli kategori (`CategoryHierarchyItem`, `anaKategori`, `altKategori`, `urunGrubu`, `brand`, `vadeDays`, `iskontoOrani`) modellerini standardize etmek.
2. **Adım 2**: `src/data/initialCategories.ts` dosyasını oluşturup kullanıcının paylaştığı tablodaki tüm satırları hiyerarşik olarak sisteme entegre etmek.
3. **Adım 3**: Reusable kademeli seçim bileşeni (`src/components/ui/CategoryCascader.tsx`) ve kapsamlı ürün düzenleme modalı (`src/components/modals/ProductEditModal.tsx`) oluşturmak.
4. **Adım 4**: `StockTab.tsx`, `DataImporter.tsx`, `DefinitionsTab.tsx` ve `FinanceContext.tsx` dosyalarını 3 seviyeli kategori hiyerarşisi ve marka alanlarıyla güncellemek.
5. **Adım 5**: `compile_applet` ve `lint_applet` çalıştırarak tam derleme doğrulaması yapmak.
