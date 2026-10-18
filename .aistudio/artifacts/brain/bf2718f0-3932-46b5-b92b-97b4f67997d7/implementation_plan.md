# Arslan Mobilya ERP - 3 Seviyeli Kategori Hiyerarşisi Entegrasyon Planı

Kullanıcının belirlediği 3 seviyeli zorunlu hiyerarşik yapı (`Ana Kategori` > `Alt Kategori` > `Ürün Grubu`) ve tam veri listesi; `types`, `initialData`, `FinanceContext`, `DefinitionsTab`, `StockTab`, `ProfitTab` ve `ReportsTab` bileşenlerine eksiksiz entegre edilecektir.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> 1. **3 Seviyeli Zorunlu Hiyerarşi Modeli**:
>    - **Seviye 1 (Ana Kategori)**: `MOBİLYA`, `BEYAZ EŞYA`
>    - **Seviye 2 (Alt Kategori)**: `BAMBİ`, `ALTUS`, `KEA`, `BOSCH`, `HOOVER`, `UGUR`, `MOBİLYA`, `YATAK`, `MASA`, `AKSESUAR`, `MEDİSA`, `TV`
>    - **Seviye 3 (Ürün Grubu)**: Belirtilen 80+ alt ürün grubu (Örn: *BAMBİ BASLIK*, *ALTUS ANKASTRE FIRINLAR*, *MEDİSA DELUKS*, *BEDLIFE CİBO* vb.)
> 2. **Kullanıcı Kararı - Stok & Satış Sıfırlama**: Kullanıcının teyidi doğrultusunda eski tek seviyeli örnek stoklar temizlenecek ve yeni 3 seviyeli hiyerarşiye tam uyumlu örnek stoklarla baştan oluşturulacaktır.
> 3. **Kullanıcı Kararı - Tanımlamalar Yönetimi**: Tanımlamalar ekranında hem kademeli bağlantılı 3 sekme (Ana Kategori, Alt Kategori, Ürün Grubu) hem de tüm hiyerarşiyi tek bakışta gösteren interaktif **Ağaç (Tree) Görünümü** yer alacaktır.

---

### 1. Overview & Core Concept

- **Problem**: Mevcut sistemde kategori ve alt kategoriler gevşek bağlıydı ve 3. seviye (Ürün Grubu) eksikti; mal alım ve stok girişlerinde istenen standart hiyerarşi uygulanamıyordu.
- **Çözüm**: Katı ilişkisel 3 seviyeli hiyerarşik yapı kurularak her ürün grubunun mutlaka bir alt kategoriye, her alt kategorinin de mutlaka bir ana kategoriye bağlı olması sağlanacaktır.
- **Değer**: Mobilya ve beyaz eşya sektörüne özel marka/ürün grubu bazlı stok maliyeti, ciro ve kârlılık kırılımları hatasız çalışacaktır.

---

### 2. User Experience & Visual Design

#### A. Tanımlamalar Ekranı (`DefinitionsTab.tsx`)
- **Bağlantılı 3 Sekme & Ağaç Görünümü**:
  - `Ana Kategoriler (Seviye 1)`: MOBİLYA, BEYAZ EŞYA yönetimi (ekle, düzenle, sil).
  - `Alt Kategoriler (Seviye 2)`: Ana kategoriye bağlı alt kategori listesi; üst ana kategori filtresiyle.
  - `Ürün Grupları (Seviye 3)`: Seçilen Ana Kategori ve Alt Kategoriye bağlı ürün grupları listesi (ekle, düzenle, sil).
  - `Hiyerarşik Ağaç Görünümü (Tree View)`: Tüm yapıyı genişletilebilir/daraltılabilir dal yapısıyla özetleyen interaktif ağaç.
- **Dinamik Kademeli Ekleme Modalı / Formu**:
  - `Ana Kategori Seçin` -> Otomatik olarak o ana kategoriye ait `Alt Kategoriler` listelenir.
  - `Alt Kategori Seçin` -> O alt kategoriye yeni `Ürün Grubu` adı yazılıp eklenir.

#### B. Stok & Mal Alım Ekranı (`StockTab.tsx`)
- **Yeni Ürün & Mal Alımı Formu**:
  - Kademeli 3'lü Select kutuları:
    1. *Ana Kategori* (Örn: BEYAZ EŞYA)
    2. *Alt Kategori* (Örn: ALTUS)
    3. *Ürün Grubu* (Örn: ALTUS ANKASTRE OCAKLAR)
- **Toplu Excel İçe Aktarma (Data Importer)**:
  - Excel şablonu güncellenerek 3 seviye sütunları (`Ana Kategori`, `Alt Kategori`, `Ürün Grubu`) tanınır.

#### C. Kâr Takip & Satış Ekranı (`ProfitTab.tsx`)
- Ürün seçildiğinde veya manuel satış girildiğinde ürünün Ana Kategori, Alt Kategori ve Ürün Grubu bilgisi satış kaydına işlenir.
- Tabloda ve filtrelerde 3 seviyeli filtreleme imkanı sunulur.

---

### 3. Key Product Decisions & Full Hierarchy Data Mapping

Kullanıcının talep ettiği 13 hiyerarşik grup eksiksiz olarak `initialData.ts` içerisine tanımlanacaktır:

1. **MOBİLYA** -> **BAMBİ** -> *BAMBİ BASLIK, BAMBİ BAZA, BAMBİ BHC MOB, BAMBİ EV TEKS, BAMBİ KOMODIN, BAMBİ OTEL BASLIK, BAMBİ OTEL BAZA, BAMBİ OTEL KOMODIN, BAMBİ OTEL YATAK, BAMBİ TV KLTK, BAMBİ YATAK, BAMBİ YATAK BEBE, BAMBİ YTK AKS*
2. **BEYAZ EŞYA** -> **ALTUS** -> *ALTUS ANKASTRE DAVLUMBAZLAR, ALTUS ANKASTRE FIRINLAR, ALTUS ANKASTRE OCAKLAR, ALTUS ASPİRATÖR, ALTUS BULAŞIK MAKİNELERİ, ALTUS ÇAMAŞIR MAKİNELERİ, ALTUS ÇEKMECELİ DERİN DONDURUCU, ALTUS ÇİFT KAPILI BUZDOLAPLARI, ALTUS ÇİFT KAPILI NF BUZDOLAPLARI, ALTUS ISI POMPALI KURUTMA MAKİNELERİ, ALTUS KLİMA, ALTUS KOMBİ NF BUZDOLAPLARI, ALTUS NOFROST ÇEKMECELİ DERİN DONDURUCU, ALTUS SOLO SETÜSTÜ OCAKLAR, ALTUS TEK KAPILI BUZDOLAPLARI, ALTUS TV, ALTUS ÜSTTEN KAPAKLI DERİN DONDURUCU, ALTUS YOĞUŞMALI KURUTMA MAKİNELERİ*
3. **BEYAZ EŞYA** -> **KEA** -> *ALTUS KEA, MUHTELİF KEA, TEFAL KARCHER*
4. **BEYAZ EŞYA** -> **BOSCH** -> *BOSCH*
5. **BEYAZ EŞYA** -> **HOOVER** -> *HOOVER BULAŞIK MAKİNELERİ, HOOVER ÇAMAŞIR MAKİNELERİ, HOOVER KURUTMA MAKİNELERİ, HOOVER KURUTMALI ÇAMAŞIR MAKİNESİ*
6. **BEYAZ EŞYA** -> **UGUR** -> *UGUR ANKASTRE DAVLUMBAZ, UGUR ANKASTRE FIRIN, UGUR ANKASTRE OCAK, UGUR BUZDOLABI, UGUR CEKMECELI DONDURUCU, UGUR ÇAMAŞIR MAKİNESİ, UGUR KURUTMA MAKİNESİ, UGUR NF CEKMECELİ DONDURUCU, UGUR SETUSTU OCAK, UGUR SU ARITMA, UGUR ÜSTTEN KAPAKLI DONDURUCU, UGUR BULASIK MAKİNESİ*
7. **MOBİLYA** -> **MOBİLYA** -> *AKABE, ANKARA MOBİLYA, AYTASHOME, BENİMODAM, HALİ, İPEK, LADİN, ÖREN MOBİLYA, SERHAT*
8. **MOBİLYA** -> **YATAK** -> *BEDLIFE CİBO, FİENTO*
9. **MOBİLYA** -> **MASA** -> *BULUT AKSESUAR, MASA SANDALYE*
10. **MOBİLYA** -> **AKSESUAR** -> *BÜRO, SEHPA, ÜTÜ MASA KURUTMA, DEKORASYON*
11. **MOBİLYA** -> **MEDİSA** -> *MEDİSA DELUKS, MEDİSA LUKS, MEDİSA MAKSİ, MEDİSA PREMİUM, MEDİSA TEKİL, MEDİSA YATAK ODASI, MEDİSA YEMEK ODASI*
12. **BEYAZ EŞYA** -> **TV** -> *SKYTECH*

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      3-Tier Hierarchy                       │
├─────────────────────────────────────────────────────────────┤
│ 1. ProductCategory (Ana Kategori)                           │
│    └── id, name ('MOBİLYA' | 'BEYAZ EŞYA')                  │
│                                                             │
│ 2. ProductSubCategory (Alt Kategori)                        │
│    └── id, mainCategoryId, mainCategoryName, name           │
│        (BAMBİ, ALTUS, KEA, BOSCH, HOOVER, UGUR, vb.)        │
│                                                             │
│ 3. ProductGroup (Ürün Grubu)                                │
│    └── id, mainCategoryId, subCategoryId, name             │
│        (BAMBİ BASLIK, ALTUS ANKASTRE FIRINLAR, vb.)         │
└─────────────────────────────────────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       StockItem (Depo)              SaleRecord (Satış)
    ├── category: MOBİLYA         ├── category: MOBİLYA
    ├── subCategory: BAMBİ        ├── subCategory: BAMBİ
    └── productGroup: BAMBİ BAZA  └── productGroup: BAMBİ BAZA
```

#### Değişiklik Yapılacak Dosyalar:
1. `src/types/finance.ts`:
   - `ProductGroup` tipinin eklenmesi.
   - `StockItem`, `SaleRecord`, `PurchaseItemDetail` tiplerine `productGroup?: string` alanının eklenmesi.
2. `src/data/initialData.ts`:
   - 2 Ana Kategori, 12 Alt Kategori ve 80+ Ürün Grubunun eksiksiz tanımlanması.
   - Yeni hiyerarşiye uyumlu örnek stokların tanımlanması.
3. `src/context/FinanceContext.tsx`:
   - `productGroups` state'i ve CRUD fonksiyonları (`addProductGroup`, `updateProductGroup`, `deleteProductGroup`).
   - LocalStorage ve Firestore senkronizasyonu.
4. `src/components/tabs/DefinitionsTab.tsx`:
   - 3 seviyeli bağlantılı sekme ve ağaç (tree) görünümünün kodlanması.
5. `src/components/tabs/StockTab.tsx`:
   - Kademeli 3'lü kategori seçimi ve Excel içe aktarım uyumu.
6. `src/components/tabs/ProfitTab.tsx`:
   - Satış formunda ve tablosunda 3 seviyeli hiyerarşinin gösterimi.
