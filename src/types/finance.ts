export type TransactionType = 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alışı';

export type TransactionStatus = 'Tamamlandı' | 'Beklemede' | 'İptal';

export interface Transaction {
  id: string;
  date: string;
  dueDate?: string; // Mal alışı ödeme / vade tarihi
  type: TransactionType;
  category: string;
  cariId?: string;
  cariName?: string;
  supplierCariId?: string; // POS tahsilatı tedarikçi cari eşleştirmesi (mahsup)
  supplierCariName?: string;
  isPosOffset?: boolean;
  desc: string;
  amount: number;
  accountId: string;
  targetAccountId?: string; // Virman için hedef hesap
  status: TransactionStatus;
  documentNo?: string;
  createdAt: string;
  createdBy?: string; // İşlemi ekleyen kullanıcı (Kullanıcı Adı veya E-posta)
  createdByName?: string; // Ekleyen personelin adı
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

export type AccountType = 'Ticari Hesap' | 'Kasa (Nakit)' | 'Şirket Kredi Kartı' | 'POS Cihazı / Hesabı' | 'Döviz Hesabı';

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
  cutOffDate?: string; // Kredi kartı hesap kesim tarihi
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
  dueDate: string;
  cariId?: string;
  cariName?: string;
  category: string;
  isCompleted: boolean;
  recurrence: 'Tek Seferlik' | 'Aylık' | 'Yıllık';
  accountId?: string;
  installmentIndex?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
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
  id: string; // normalized username
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
  requestedBy: string; // username or email
  requestedByName: string;
  requestedAt: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'Ekleme' | 'Güncelleme' | 'Silme Talebi' | 'Silme Onayı' | 'Silme Reddi' | 'Kalıcı Silme';
  entityType: 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alışı' | 'Cari' | 'Hesap' | 'Personel' | 'Sistem' | 'Satış' | 'Stok';
  entityId: string;
  description: string;
  performedBy: string;
  performedByName: string;
  userRole: UserRole;
  timestamp: string;
  amount?: number;
  details?: Record<string, any>;
}

// ----------------------------------------------------------------------
// Kâr Takip & Satış Türleri
// ----------------------------------------------------------------------
export type SaleType = 'Peşin' | 'Kredi Kartı' | 'Senetli Satış';

export interface SaleRecord {
  id: string;
  date: string; // YYYY-MM-DD
  documentNo?: string;
  customerId?: string;
  customerName: string;
  productId?: string;
  productName: string;
  category: string; // Level 1: Ana Kategori (MOBİLYA | BEYAZ EŞYA)
  subCategory?: string; // Level 2: Alt Kategori (BAMBİ, ALTUS, vb.)
  productGroup?: string; // Level 3: Ürün Grubu (BAMBİ YATAK, ALTUS BUZDOLABI, vb.)
  brand?: string;
  supplierId?: string; // Ortak Tedarikçi Cari ID
  supplierName?: string;
  quantity: number;
  costPrice: number; // Birim alış maliyeti
  totalCost: number; // quantity * costPrice
  saleType: SaleType;
  installmentsCount?: number; // Senetli satış taksit sayısı (örnek: 6, 12, 18, 24)
  vadeRateMonthly?: number; // Tanımlardan alınan aylık vade farkı oranı (% örnek: 3.5)
  vadeFarkiAmount?: number; // Senetli satış için hesaplanan toplam vade farkı maliyeti
  effectiveCost: number; // Ürün Maliyeti + Vade Farkı Maliyeti
  salePrice: number; // Birim satış fiyatı
  totalSaleAmount: number; // Toplam Satış Cirosu
  netProfit: number; // Toplam Ciro - Efektif Maliyet
  profitMargin: number; // Net Kâr / Satış Cirosu (%)
  salesPerson: string; // İşlemi gerçekleştiren Satış Personeli
  accountId?: string; // Peşin/Kredi Kartı tahsilat hesabı
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// ----------------------------------------------------------------------
// Mal Alım & Stok Yönetimi
// ----------------------------------------------------------------------
export interface StockItem {
  id: string;
  code?: string;
  name: string;
  category: string; // Level 1: Ana Kategori (e.g. MOBİLYA, BEYAZ EŞYA)
  subCategory?: string; // Level 2: Alt Kategori (e.g. BAMBİ, ALTUS, vb.)
  productGroup?: string; // Level 3: Ürün Grubu (e.g. BAMBİ YATAK, ALTUS FIRINLAR)
  brand?: string; // Marka
  supplierId?: string; // Ortak Tedarikçi
  supplierName?: string;
  quantity: number;
  unit: string;
  purchasePrice: number; // Son Alış Maliyeti
  totalValue: number; // quantity * purchasePrice
  salePrice: number; // Perakende Satış Fiyatı
  minStockLevel?: number;
  lastPurchaseDate?: string;
  notes?: string;
}

export interface PurchaseItemDetail {
  productId?: string;
  name: string;
  category: string;
  subCategory?: string;
  productGroup?: string;
  brand?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  salePrice?: number;
}

export interface StockPurchaseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  documentNo: string;
  supplierId: string; // Ortak Tedarikçi Cari ID
  supplierName: string;
  items: PurchaseItemDetail[];
  totalAmount: number;
  paymentType: 'Vadeli (Cari Borca Ekle)' | 'Peşin Kasa/Banka';
  dueDate?: string; // Vade tarihi
  accountId?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
}

// ----------------------------------------------------------------------
// 3 Seviyeli Zorunlu Kategori Hiyerarşisi
// 1. Ana Kategori -> 2. Alt Kategori -> 3. Ürün Grubu
// ----------------------------------------------------------------------
export interface CategoryHierarchyItem {
  id: string;
  anaKategori: string;
  altKategori: string;
  urunGrubu: string;
}

export interface ProductCategory {
  id: string;
  name: string; // 'MOBİLYA' | 'BEYAZ EŞYA'
  type?: string;
  color?: string;
}

export interface ProductSubCategory {
  id: string;
  categoryId: string; // Level 1 (Ana Kategori ID)
  categoryName: string; // Level 1 (Ana Kategori Adı: MOBİLYA | BEYAZ EŞYA)
  name: string; // Level 2 (BAMBİ, ALTUS, KEA, BOSCH, vb.)
}

export interface ProductGroup {
  id: string;
  categoryId: string; // Level 1 (Ana Kategori ID)
  categoryName: string; // Level 1 (Ana Kategori Adı)
  subCategoryId: string; // Level 2 (Alt Kategori ID)
  subCategoryName: string; // Level 2 (Alt Kategori Adı)
  name: string; // Level 3 (Ürün Grubu Adı)
  code?: string;
  notes?: string;
}

export interface ProductBrand {
  id: string;
  name: string;
  categoryNames?: string[];
}

export interface VadeRateEntry {
  id: string;
  monthKey: string; // YYYY-MM
  rateMonthly: number; // Aylık Vade Farkı Oranı (%) Örn: 3.5
  notes?: string;
}

export interface PriceListEntry {
  id: string;
  monthKey: string; // YYYY-MM
  title: string;
  categoryName?: string;
  itemsCount: number;
  type?: 'Toptan' | 'Perakende';
  fileUrl?: string;
  notes?: string;
}

export type ActiveTab =
  | 'ciro-matrix'
  | 'dashboard'
  | 'profit'
  | 'stock'
  | 'transactions'
  | 'accounts'
  | 'currents'
  | 'upcoming'
  | 'reports'
  | 'definitions'
  | 'data-transfer'
  | 'audit'
  | 'users';

export interface CiroMatrixRow {
  id: string;
  group: 'BEYAZ EŞYA' | 'MOBİLYA';
  name: string; // Marka / Kategori adı: ALTUS, UĞUR, HOOVER, İKEA, TV, BOSCH, MEDİSA, MOBİLYA, YATAK, BAMBİ vs.
  profitMargin: number; // Ortalama Kârlılık (%)
  months: { [monthIndex: number]: number }; // 0: Ocak, 1: Şubat, ..., 11: Aralık (tutar)
  isLiveSynced?: boolean;
}

export interface CiroMatrixYearData {
  year: number;
  rows: CiroMatrixRow[];
}
