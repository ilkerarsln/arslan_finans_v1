# 3 Seviyeli Kategori Hiyerarşisi ve Tanımlamalar Yönetimi Uygulama Planı

Sistem genelinde eski tek seviyeli kategori yapısını tamamen kaldırarak `Ana Kategori` > `Alt Kategori` > `Ürün Grubu` şeklinde zorunlu, ilişkili 3 seviyeli hiyerarşiyi entegre eden, Tanımlamalar ekranında akordeon ağaç ve filtreli tablo ile tam CRUD (ekle/düzenle/sil) yönetimi sunan mimari plan.

---

## Kullanıcı Tercihleri ve Kritik Kararlar

> [!IMPORTANT]
> **Onaylanan Tercihler:**
> - **Mevcut Stok Dönüşümü:** Depodaki tüm stok ve fiyat listesi kayıtları sıfırlanıp kullanıcının ilettiği 13 maddelik tam 3 seviyeli hiyerarşik ürün listesiyle baştan başlatılacaktır.
> - **Tanımlamalar Ekranı Düzeni:** Tanımlamalar modülünde hiyerarşi, kademeli akordeon ağaç (`Tree View`) ve arama/filtre özellikli liste tablosu (`Data Grid`) ile yönetilecektir.

---

## 1. Genel Bakış ve Kapsam

Kullanıcının belirlediği eksiksiz 13 hiyerarşik grup sisteme işlenecektir:
1. **MOBİLYA -> BAMBİ**: BAMBİ BASLIK, BAMBİ BAZA, BAMBİ BHC MOB, BAMBİ EV TEKS, BAMBİ KOMODIN, BAMBİ OTEL BASLIK, BAMBİ OTEL BAZA, BAMBİ OTEL KOMODIN, BAMBİ OTEL YATAK, BAMBİ TV KLTK, BAMBİ YATAK, BAMBİ YATAK BEBE, BAMBİ YTK AKS
2. **BEYAZ EŞYA -> ALTUS**: ALTUS ANKASTRE DAVLUMBAZLAR, ALTUS ANKASTRE FIRINLAR, ALTUS ANKASTRE OCAKLAR, ALTUS ASPİRATÖR, ALTUS BULAŞIK MAKİNELERİ, ALTUS ÇAMAŞIR MAKİNELERİ, ALTUS ÇEKMECELİ DERİN DONDURUCU, ALTUS ÇİFT KAPILI BUZDOLAPLARI, ALTUS ÇİFT KAPILI NF BUZDOLAPLARI, ALTUS ISI POMPALI KURUTMA MAKİNELERİ, ALTUS KLİMA, ALTUS KOMBİ NF BUZDOLAPLARI, ALTUS NOFROST ÇEKMECELİ DERİN DONDURUCU, ALTUS SOLO SETÜSTÜ OCAKLAR, ALTUS TEK KAPILI BUZDOLAPLARI, ALTUS TV, ALTUS ÜSTTEN KAPAKLI DERİN DONDURUCU, ALTUS YOĞUŞMALI KURUTMA MAKİNELERİ
3. **BEYAZ EŞYA -> KEA**: ALTUS KEA, MUHTELİF KEA, TEFAL KARCHER
4. **BEYAZ EŞYA -> BOSCH**: BOSCH
5. **BEYAZ EŞYA -> HOOVER**: HOOVER BULAŞIK MAKİNELERİ, HOOVER ÇAMAŞIR MAKİNELERİ, HOOVER KURUTMA MAKİNELERİ, HOOVER KURUTMALI ÇAMAŞIR MAKİNESİ
6. **BEYAZ EŞYA -> UGUR**: UGUR ANKASTRE DAVLUMBAZ, UGUR ANKASTRE FIRIN, UGUR ANKASTRE OCAK, UGUR BUZDOLABI, UGUR CEKMECELI DONDURUCU, UGUR ÇAMAŞIR MAKİNESİ, UGUR KURUTMA MAKİNESİ, UGUR NF CEKMECELİ DONDURUCU, UGUR SETUSTU OCAK, UGUR SU ARITMA, UGUR ÜSTTEN KAPAKLI DONDURUCU, UGUR BULASIK MAKİNESİ
7. **MOBİLYA -> MOBİLYA**: AKABE, ANKARA MOBİLYA, AYTASHOME, BENİMODAM, HALİ, İPEK, LADİN, ÖREN MOBİLYA, SERHAT
8. **MOBİLYA -> YATAK**: BEDLIFE CİBO, FİENTO
9. **MOBİLYA -> MASA**: BULUT AKSESUAR, MASA SANDALYE
10. **MOBİLYA -> AKSESUAR**: BÜRO, SEHPA, ÜTÜ MASA KURUTMA, DEKORASYON
11. **MOBİLYA -> MEDİSA**: MEDİSA DELUKS, MEDİSA LUKS, MEDİSA MAKSİ, MEDİSA PREMİUM, MEDİSA TEKİL, MEDİSA YATAK ODASI, MEDİSA YEMEK ODASI
12. **BEYAZ EŞYA -> TV**: SKYTECH

---

## 2. Kullanıcı Deneyimi ve Arayüz Tasarımı

- **Tanımlamalar Ekranı (DefinitionsTab):**
  - Üstte 3 Seviyeli Hiyerarşi Yönetimi ana sekmesi.
  - Sol panelde kademeli akordeon ağaç görünümü: `Ana Kategori` açıldığında bağlı `Alt Kategoriler`, tıklandığında bağlı `Ürün Grupları` ve her seviyede öğe ekleme/silme/düzenleme butonları.
  - Sağ panelde arama kutusu ve filtreli tablo; seçilen satırı yerinde (inline) düzenleme veya tek tıkla silme olanağı.
- **Kademeli Kategori Seçici (CategoryCascader):**
  - Formlarda (`ProductEditModal`, `StockTab`, `DataImporter`, `ProfitTab`) 3 basamaklı dinamik filtre:
    - 1. Adım: Ana Kategori (`MOBİLYA` veya `BEYAZ EŞYA`)
    - 2. Adım: Seçilen ana kategoriye bağlı Alt Kategoriler
    - 3. Adım: Seçilen alt kategoriye bağlı Ürün Grupları
- **Data Importer Entegrasyonu:**
  - 2 sütunlu yalın Excel yüklemesinde (`stokKodu`, `alisAdeti`), eşleşen ürünlerin 3 seviyeli hiyerarşisi otomatik atanır. Eşleşmeyen kalemlerde önizleme tablosunda doğrudan 3 basamaklı kademeli seçiciyle kategori atanabilir.
- **Stok Ekranı (StockTab):**
  - Tabloda `Ana Kategori`, `Alt Kategori`, `Ürün Grubu` ve bağımsız `Marka` ayrı sütunlarda görüntülenir.
  - Üst filtre çubuğunda Ana Kategori ve Alt Kategori bağımlı filtreleri çalışır.

---

## 3. Mimari ve Veri Modeli

### Sistem Mimarisi Şeması

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARSLAN MOBİLYA ERP                             │
├────────────────────────────────────────────────────────────────────────┤
│                          FinanceContext                                │
│   - categoryHierarchy: CategoryHierarchyItem[]                        │
│   - stockItems: StockItem[] (3-level mandatory hierarchy)              │
│   - add/update/deleteCategoryHierarchyItem                             │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│     Tanımlamalar (DefinitionsTab)   │  │   Ürün & Alım Modülleri       │
│  ┌───────────────────────────────┐  │  │  - CategoryCascader           │
│  │ 3-Seviyeli Akordeon Ağaç      │  │  │  - ProductEditModal           │
│  │ [MOBİLYA] > [BAMBİ] > [YATAK] │  │  │  - DataImporter (Mal Alımı)   │
│  └───────────────────────────────┘  │  │  - StockTab (Depo & Filtreler)│
│  ┌───────────────────────────────┐  │  │  - ProfitTab (Kâr & Satışlar) │
│  │ Hiyerarşi Tablosu & CRUD      │  │  └───────────────────────────────┘
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Tip Tanımları (`src/types/finance.ts`)

```typescript
export interface CategoryHierarchyItem {
  id: string;
  anaKategori: 'MOBİLYA' | 'BEYAZ EŞYA' | string;
  altKategori: string;
  urunGrubu: string;
}

export interface StockItem {
  id: string;
  code?: string;
  name: string;
  anaKategori: string; // Zorunlu
  altKategori: string; // Zorunlu
  urunGrubu: string;   // Zorunlu
  brand?: string;      // İsteğe bağlı bağımsız marka
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  unit: string;
  totalValue: number;
  iskontoOrani?: number;
  karMarjiOrani?: number;
  vadeDays?: number;
}
```

---

## 4. Uygulama Adımları

1. **Adım 1:** `src/data/initialCategories.ts` dosyasını kullanıcının verdiği 13 kuraldaki ~75 hiyerarşik kaydın tamamını içerecek şekilde eksiksiz ve hatasız güncellemek.
2. **Adım 2:** `src/data/initialData.ts` dosyasındaki stok ve fiyat listesi verilerini yeni 3 seviyeli kategori hiyerarşisine tam uyumlu hale getirmek.
3. **Adım 3:** `src/context/FinanceContext.tsx` dosyasında kategori hiyerarşisi CRUD metodlarını (ekleme, güncelleme, silme) ve yerel/bulut depolama senkronizasyonunu güçlendirmek.
4. **Adım 4:** `src/components/tabs/DefinitionsTab.tsx` içine 3 seviyeli akordeon ağaç (`Tree View`) ve interaktif CRUD tablosunu entegre etmek.
5. **Adım 5:** `src/components/ui/CategoryCascader.tsx` ve `src/components/modals/ProductEditModal.tsx` bileşenlerini 3 seviyeli zorunlu hiyerarşiye tam uyumlu çalıştırmak.
6. **Adım 6:** `src/components/tabs/StockTab.tsx`, `src/components/importer/DataImporter.tsx` ve `src/components/tabs/ProfitTab.tsx` dosyalarındaki eski tek seviyeli kalıntıları temizleyip derlemeyi doğrulamak.
