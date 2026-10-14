export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'personel';
  password?: string;
  avatar?: string;
  phone?: string;
  permissions?: string[];
  createdAt?: string;
}

export type CariType = 'tedarikci' | 'musteri';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  taxNumber?: string;
  taxOffice?: string;
  type: 'tedarikci';
  // Cari Finans Durumu
  currentBalance: number; // Pozitif: Tedarikçiye borcumuz var (Alacaklı), Negatif: Tedarikçiden alacağımız var
  totalPurchased: number; // Toplam mal alımı tutarı (₺)
  totalPaid: number;      // Tedarikçiye yapılan toplam ödeme (₺)
  // Kâr Takip İlişkisi
  associatedProductsCount: number;
  avgProfitMargin?: number;
  category: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  type: 'musteri';
  currentBalance: number; // Pozitif: Müşteriden alacağımız var
  totalSales: number;
  totalCollected: number;
  category: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  subCategory?: string; // Alt Kategori (Detaylı Stok)
  brand?: string;       // Marka (Detaylı Stok)
  supplierId: string;   // Ortak Tedarikçi ID'si
  supplierName: string;
  supplierSku?: string;
  stockQty: number;
  unit: string;
  costPrice: number;    // Ağırlıklı ortalama birim alış maliyeti (₺)
  salePrice: number;    // Tavsiye edilen satış fiyatı (₺)
  minStockAlert: number;
  lastPurchaseDate?: string;
  notes?: string;
}

export interface PurchaseItem {
  productId?: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  supplierId: string; // Ortak Tedarikçi ID'si
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: 'odendi' | 'vadeli' | 'kismi';
  paidAmount: number;
  dueDate?: string;
  notes?: string;
  source: 'manuel' | 'excel';
  createdAt: string;
}

export type PaymentMethod = 'pesin' | 'kredi_karti' | 'senetli';

export interface SaleItem {
  id: string;
  saleId: string;
  date: string;
  customerName: string;
  productName: string;
  matchedSku?: string;
  matchedSupplierId?: string;
  matchedSupplierName?: string;
  category: string;
  quantity: number;
  unitSalePrice: number;
  totalSalePrice: number;
  // Maliyet & Vade Farkı
  unitCost: number;        // Birim temel maliyet
  baseCost: number;        // Toplam temel maliyet (unitCost * quantity)
  interestCost?: number;   // Senetli satış vade farkı maliyeti
  totalCost: number;       // baseCost + (interestCost || 0)
  grossProfit: number;     // totalSalePrice - totalCost
  profitMarginPercent: number;
  // Satış Şekli & Vade Bilgisi
  paymentMethod: PaymentMethod;
  installmentCount?: number;   // Vade / Taksit sayısı (örn: 3, 6, 9, 12, 18 ay)
  monthlyInterestRate?: number; // Uygulanan aylık vade farkı oranı (%)
  salesperson: string;         // Satış Personeli
  status: 'tamamlandi' | 'beklemede' | 'iptal';
}

export interface Expense {
  id: string;
  date: string;
  category: 'Kira' | 'Personel Maaş' | 'Elektrik & Su' | 'Nakliye & Lojistik' | 'Pazarlama & Reklam' | 'Vergi & SGK' | 'Montaj & Bakım' | 'Diğer';
  description: string;
  amount: number;
  accountId: string;
  accountName: string;
  paidTo?: string;
  receiptNumber?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'kasa' | 'banka' | 'pos';
  bankName?: string;
  accountNumber?: string;
  balance: number;
  currency: 'TRY' | 'USD' | 'EUR';
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  type: 'giris' | 'cikis' | 'virman';
  amount: number;
  description: string;
  category: string;
  referenceNo?: string;
  balanceAfter: number;
}

export interface CariMovement {
  id: string;
  cariId: string;
  cariName: string;
  cariType: CariType;
  date: string;
  type: 'mal_alimi' | 'odeme' | 'tahsilat' | 'satis_faturasi' | 'iade' | 'acilis';
  description: string;
  documentNo?: string;
  borc: number;   // Tedarikçiye olan borcumuzun artması veya müşterinin borçlanması
  alacak: number; // Yapılan ödeme ile borcun kapanması veya müşteriden tahsilat
  balanceAfter: number;
  relatedPurchaseId?: string;
}

export interface ProductMatchRule {
  id: string;
  saleProductName: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productSku: string;
  productName: string;
  estimatedCost: number;
}

// Tanımlamalar Sekmesi Tipleri
export interface CategoryDefinition {
  id: string;
  name: string;
  subCategories: string[];
}

export interface SubCategoryDefinition {
  id: string;
  categoryName: string;
  name: string;
  description?: string;
}

export interface BrandDefinition {
  id: string;
  name: string;
  country?: string;
}

export interface MonthlyInterestRate {
  id: string;
  monthCode: string; // '2026-10'
  monthName: string; // 'Ekim 2026'
  rate: number;      // % Aylık Vade Farkı Oranı (örn: 2.8)
  isDefault?: boolean;
}

export interface PriceListItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  category: string;
  subCategory?: string;
  brand?: string;
  monthCode: string; // '2026-10'
  costPrice: number;
  cashSalePrice: number;
  cardSalePrice: number;
  installment12Price: number;
  lastUpdated: string;
}
