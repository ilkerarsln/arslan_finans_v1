export type TransactionType = 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alım';
export type TransactionStatus = 'Tamamlandı' | 'Beklemede' | 'İptal';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // Mal alım ödeme / vade tarihi
  type: TransactionType;
  category: string;
  cariId?: string;
  cariName?: string;
  supplierCariId?: string; // POS tahsilatı tedarikçi cari eşleştirmesi (mahsup)
  supplierCariName?: string;
  isPosOffset?: boolean;
  desc: string;
  description?: string;
  amount: number;
  accountId: string;
  targetAccountId?: string; // Virman için hedef hesap
  status: TransactionStatus;
  documentNo?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
  installmentIndex?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  // Silme / İptal onay mekanizması
  pendingDeletion?: boolean;
  deletionRequestedBy?: string;
  deletionRequestedByName?: string;
  deletionRequestedAt?: string;
  deletionReason?: string;
}

export type AccountType =
  | 'Ticari Hesap'
  | 'Kasa (Nakit)'
  | 'Şirket Kredi Kartı'
  | 'POS Cihazı / Hesabı'
  | 'Döviz Hesabı';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  balance: number;
  currency: 'TRY' | 'USD' | 'EUR';
  creditLimit?: number;
  cutOffDay?: number;
  cutOffDate?: string;
  color: string;
  icon: string;
}

export type CariType = 'Müşteri' | 'Tedarikçi' | 'Personel' | 'Diğer';

export interface Cari {
  id: string;
  name: string;
  type: CariType;
  phone?: string;
  email?: string;
  taxNumber?: string;
  taxOffice?: string;
  city?: string;
  balance: number; // pozitif: alacağımız var (Müşteri), negatif: borcumuz var (Tedarikçi)
  notes?: string;
}

export interface UpcomingDue {
  id: string;
  title: string;
  type: 'Gelir' | 'Gider';
  amount: number;
  dueDate: string; // YYYY-MM-DD
  cariId?: string;
  cariName?: string;
  category: string;
  isCompleted: boolean;
  recurrence: 'Tek Seferlik' | 'Aylık' | 'Yıllık';
  accountId?: string;
  installmentIndex?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  description?: string;
}

export interface InstallmentPlanRequest {
  title?: string;
  cariId?: string;
  cariName?: string;
  type: 'Gelir' | 'Gider';
  totalAmount: number;
  installmentsCount: number;
  firstDueDate: string; // YYYY-MM-DD
  category?: string;
  accountId?: string;
  documentNo?: string;
  notes?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'Gelir' | 'Gider';
  color: string;
}

export type UserRole = 'Admin' | 'Standart';

export interface UserPermissions {
  canManageUsers: boolean;
  canDeleteAccounts: boolean;
  canClearDatabase: boolean;
  canExportImport: boolean;
  canDeleteTransactions: boolean;
  canDeleteCaris: boolean;
}

export interface UserProfile {
  uid: string;
  id?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  assignedBy?: string;
  isPreAssigned?: boolean;
  username?: string;
  isStaff?: boolean;
}

export interface StaffAccount {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  password?: string;
  email?: string;
  createdAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

export interface DeletionRequest {
  id: string;
  targetType: 'transaction' | 'cari';
  targetId: string;
  targetTitle: string;
  amount?: number;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'Ekleme' | 'Giriş' | 'Güncelleme' | 'Silme Talebi' | 'Silme Onayı' | 'Silme Reddi' | 'Kalıcı Silme';
  entityType: 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alım' | 'Cari' | 'Hesap' | 'Personel' | 'Sistem' | 'Satış' | 'Stok' | 'Fiyat Listesi';
  entityId: string;
  description: string;
  performedBy: string;
  performedByName: string;
  userRole: UserRole;
  timestamp: string;
  amount?: number;
  details?: Record<string, any>;
}

// Kâr Takip & Satış Türleri
export type SaleType = 'Peşin' | 'Kredi Kartı' | 'Senetli Satış';

export interface SaleRecord {
  id: string;
  date: string; // YYYY-MM-DD
  documentNo?: string;
  customerId?: string;
  customerName: string;
  productId?: string;
  productName: string;
  category: string;
  subCategory?: string;
  brand?: string;
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  costPrice: number; // Birim alış maliyeti
  totalCost: number; // quantity * costPrice
  saleType: SaleType;
  installmentsCount?: number; // Senetli satış taksit sayısı (örn: 6, 12, 18, 24)
  vadeRateMonthly?: number; // Tanımlardan alınan aylık vade farkı oranı (% örn: 3.5)
  vadeFarkiAmount?: number; // Senetli satış için hesaplanan toplam vade farkı maliyeti
  effectiveCost: number; // Ürün Maliyeti + Vade Farkı Maliyeti
  salePrice: number; // Birim satış fiyatı
  totalSaleAmount: number; // Toplam Satış Cirosu
  totalAmount?: number; // Toplam Ciro alias
  netProfit: number; // Toplam Ciro - Efektif Maliyet
  profitMargin: number; // Net Kâr / Satış Cirosu (%)
  salesPerson: string; // İşlemi gerçekleştiren Satış Personeli
  accountId?: string; // Peşin/Kredi Kartı tahsilat hesabı
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// 3 Seviyeli Kategori Hiyerarşisi
export interface CategoryHierarchyItem {
  id: string;
  anaKategori: string; // MOBİLYA, BEYAZ EŞYA
  altKategori: string; // BAMBİ, ALTUS, KEA, UĞUR vb.
  urunGrubu: string;   // BAMBİ BASLIK, ALTUS ANKASTRE DAVLUMBAZLAR vb.
}

// Mal Alım & Stok Yönetimi (Zorunlu 3 Seviye + Bağımsız Marka)
export interface StockItem {
  id: string;
  code?: string; // stokKodu
  name: string; // urunAdi
  anaKategori: string; // Zorunlu Ana Kategori: MOBİLYA, BEYAZ EŞYA
  altKategori: string; // Zorunlu Alt Kategori: BAMBİ, ALTUS, MEDİSA vb.
  urunGrubu: string; // Zorunlu Ürün Grubu: BAMBİ YATAK, ALTUS FIRIN vb.
  brand?: string; // Ürüne bağlı Marka (Bosch, Altus, Bambi vb.)
  category?: string; // alias for anaKategori
  subCategory?: string; // alias for altKategori
  supplierId?: string;
  supplierName?: string;
  quantity: number;
  unit: string;
  purchasePrice: number; // Son Alış Maliyeti (netMaliyet)
  totalValue: number; // quantity * purchasePrice
  salePrice: number; // Perakende Satış Fiyatı (10 TL katına yukarı yuvarlanmış)
  iskontoOrani?: number; // Uygulanan İskonto Oranı (%)
  karMarjiOrani?: number; // Hedef Kâr Marjı (%)
  vadeDays?: number; // Vade Süresi (Gün, örn: 30, 60 gün)
  minStockLevel?: number;
  lastPurchaseDate?: string;
  notes?: string;
  kdvRate?: number;
}

export interface PurchaseItemDetail {
  productId?: string;
  stokKodu?: string;
  name: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  quantity: number;
  unitPrice: number; // Net Alış Maliyeti
  totalPrice: number;
  salePrice?: number; // 10 TL katına yukarı yuvarlanmış satış fiyatı
  bazFiyat?: number;
}

export interface StockPurchaseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  documentNo: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItemDetail[];
  totalAmount: number;
  paymentType: 'Vadeli (Cari Borca Ekle)' | 'Peşin Kasa/Banka';
  vadeTuru?: 'pesin' | '30gun' | '60gun' | 'ozel';
  dueDate?: string; // Vade tarihi
  accountId?: string;
  iskontoOrani?: number;
  karMarjiOrani?: number;
  priceListId?: string;
  priceListTitle?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

// Tanımlamalar
export interface ProductCategory {
  id: string;
  name: string;
  type?: string;
  color?: string;
}

export interface ProductSubCategory {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  categoryNames?: string[];
}

export interface VadeRateEntry {
  id: string;
  monthKey: string; // YYYY-MM
  rateMonthly: number; // Aylık Vade Farkı Oranı (%) örn: 3.5
  notes?: string;
}

// Fiyat Listesi Türleri (Toptan ve Perakende)
export type PriceListType = 'Toptan' | 'Perakende';

export interface PriceListItem {
  id: string;
  stokKodu: string; // stokKodu
  code?: string; // alias
  urunAdi: string; // urunAdi
  name?: string; // alias
  anaKategori?: string;
  altKategori?: string;
  urunGrubu?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  toptanFiyat?: number; // Toptan Fiyat Listesi için
  perakendeFiyat?: number; // Perakende Fiyat Listesi için
  costPrice?: number; // backwards compatibility
  salePrice?: number; // backwards compatibility
  notes?: string;
}

export interface PriceListEntry {
  id: string;
  monthKey: string; // YYYY-MM
  title: string;
  listType: PriceListType; // 'Toptan' veya 'Perakende'
  supplierId?: string;
  supplierName?: string;
  categoryName?: string;
  itemsCount: number;
  items: PriceListItem[];
  fileUrl?: string;
  notes?: string;
  updatedAt?: string;
}

export type MalAlimiVadeSecimi = 'pesin' | '30gun' | '60gun' | 'ozel';
export type ImportVadeOption = MalAlimiVadeSecimi;

export interface LeanMalAlimiConfig {
  priceListId: string;
  supplierId?: string;
  supplierName?: string;
  donemMonthKey: string;
  genelIskontoOrani: number;
  karMarjiOrani: number;
  vadeOption: ImportVadeOption;
  customDueDate?: string;
  accountId?: string;
  documentNo?: string;
  notes?: string;
}

export interface LeanMalAlimiRow {
  stokKodu: string;
  alisAdeti: number;
}

export interface LeanImportPreviewItem {
  id: string;
  stokKodu: string;
  urunAdi: string;
  gelenAdet: number;
  bazFiyat: number; // Seçilen Fiyat Listesinden toptan veya perakende fiyat
  netMaliyet: number; // bazFiyat * (1 - genelIskonto / 100)
  hesaplananSatisFiyati: number; // Math.ceil((netMaliyet * (1 + karMarji / 100)) / 10) * 10
  toplamMaliyet: number; // gelenAdet * netMaliyet
  toplamSatis: number; // gelenAdet * hesaplananSatisFiyati
  isMatched: boolean;
  hasManualPrice?: boolean;
  matchedStockId?: string;
  anaKategori?: string;
  altKategori?: string;
  urunGrubu?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  notes?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'profit'
  | 'stock'
  | 'transactions'
  | 'accounts'
  | 'currents'
  | 'upcoming'
  | 'reports'
  | 'definitions'
  | 'audit'
  | 'users';

// ==========================================
// Ciro & Finansal Analiz Matrisi (Excel Birebir Uyumlu)
// ==========================================
export type CiroMainGroup = 'BEYAZ EŞYA' | 'MOBİLYA';

export interface CiroMatrixRowDef {
  id: string; // e.g. 'ALTUS', 'UGUR', 'HOOVER', 'KEA', 'TV', 'BOSCH', 'MEDISA', 'MOBILYA', 'YATAK', 'BAMBI', 'MASA', 'AKSESUAR'
  displayName: string;
  group: CiroMainGroup;
  defaultProfitMargin: number; // e.g. 22
  aliases: string[];
}

export interface CiroCellEntry {
  manualAmount?: number;
  overrideTotal?: number;
  note?: string;
  updatedAt?: string;
}

export interface CiroYearConfig {
  rowMargins?: Record<string, number>; // rowId -> custom profit margin %
  cells?: Record<string, Record<number, CiroCellEntry>>; // rowId -> month(1..12) -> entry
}

export type CiroMatrixDataStore = Record<string, CiroYearConfig>;
