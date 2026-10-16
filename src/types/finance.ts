export type TransactionType = 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alımı';

export type TransactionStatus = 'Tamamlandı' | 'Beklemede' | 'İptal';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // Mal alımı ödeme / vade tarihi
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
  createdBy?: string; // İşlemi ekleyen kullanıcı (Kullanıcı adı veya E-posta)
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
  entityType: 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alımı' | 'Cari' | 'Hesap' | 'Personel' | 'Sistem' | 'Satış' | 'Stok';
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
  supplierId?: string; // Ortak Tedarikçi Cari ID
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
  netProfit: number; // Toplam Ciro - Efektif Maliyet
  profitMargin: number; // Net Kâr / Satış Cirosu (%)
  salesPerson: string; // İşlemi gerçekleştiren Satış Personeli
  accountId?: string; // Peşin/Kredi Kartı tahsilat hesabı
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// Mal Alımı & Stok Yönetimi
export interface StockItem {
  id: string;
  code?: string;
  name: string;
  category: string; // e.g. Beyaz Eşya, Mobilya
  subCategory?: string; // e.g. Buzdolabı, Çamaşır Makinesi
  brand?: string; // e.g. Bosch, Altus, Bambi
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

export interface PriceListItem {
  id: string;
  code?: string;
  name: string;
  category: string;
  subCategory?: string;
  brand?: string;
  costPrice: number;
  salePrice: number;
  notes?: string;
}

export interface PriceListEntry {
  id: string;
  monthKey: string; // YYYY-MM
  title: string;
  categoryName?: string;
  itemsCount: number;
  items?: PriceListItem[];
  fileUrl?: string;
  notes?: string;
  updatedAt?: string;
}

export interface UnmatchedProductResolution {
  rawName: string;
  action: 'match' | 'create_new';
  matchedProductId?: string;
  newName?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  costPrice?: number;
  salePrice?: number;
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
