export type KarTakipUserRole = 'ADMIN' | 'SALES_REP';

export interface KarTakipUser {
  id: string;
  name: string;
  email: string;
  role: KarTakipUserRole;
  salesRepName?: string;
  avatarUrl?: string;
}

export interface KarTakipSupplier {
  id: string;
  code: string;
  name: string;
  category?: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  paymentTerms?: string;
  notes?: string;
  activeProductsCount?: number;
}

export interface PurchaseRecord {
  id: string;
  purchaseDate: string; // YYYY-MM-DD
  periodMonth: string; // YYYY-MM
  supplierId: string;
  supplierName: string;
  productCode: string;
  productName: string;
  category: string;
  quantity: number; // Alınan Adet
  unitCost: number; // Alış Birim Maliyeti (₺)
  totalCost: number; // Toplam Fatura Tutarı (₺)
  invoiceNo?: string; // Fatura / İrsaliye No
  notes?: string;
}

export interface WholesalePriceItem {
  id: string;
  productCode: string; // SKU / Barkod
  productName: string;
  category: string;
  wholesalePrice: number; // Toptan alış / liste fiyatı
  periodMonth: string; // YYYY-MM format (e.g. '2024-05')
  supplierId?: string;
  supplier?: string;
  notes?: string;
  updatedAt: string;
}

export interface ProductAliasMapping {
  id: string;
  sourceProductCode: string; // Satış raporundaki kod/SKU
  sourceProductName?: string; // Satış raporundaki ürün adı
  targetProductCode: string; // Toptan katalogdaki eşleşen SKU
  targetProductName: string; // Toptan katalogdaki ürün adı
  targetCategory?: string;
  targetSupplier?: string;
  targetWholesalePrice?: number;
  createdAt: string;
  createdByName?: string;
  notes?: string;
}

export type CostingMethod = 'CATALOG_PRICE' | 'PURCHASE_AVG';

export interface SaleRecord {
  id: string;
  salesRep: string; // Satış Temsilcisi Adı
  date: string; // YYYY-MM-DD
  productCode: string; // SKU
  productName: string;
  category: string;
  quantity: number; // Adet / Miktar
  unitSalePrice: number; // Birim Satış Fiyatı (KDV Dahil/Hariç)
  discountPercent?: number; // İskonto Oranı (%)
  totalSalePrice: number; // Toplam Satış Tutarı
  customerName?: string; // Müşteri / Firma Adı
  invoiceNo?: string;
  
  // Dynamic cost matching:
  matchedWholesalePrice?: number | null; // Bulunan toptan alış maliyeti
  costingMethodUsed?: CostingMethod;
  hasWholesalePrice: boolean; // Maliyeti var mı?
  profit?: number | null; // Net Brüt Kâr
  profitMargin?: number | null; // Kâr Marjı %
  matchedPeriod?: string | null;
  matchedSupplier?: string | null;

  // Product Alias / Matching info:
  matchedViaAlias?: boolean;
  matchedTargetCode?: string;
  matchedTargetName?: string;
}

export interface MonthlyPeriodStatus {
  periodMonth: string; // '2024-05'
  isClosed: boolean; // Kapatıldı / Kilitlendi mi?
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export interface ProductStockInfo {
  productCode: string;
  productName: string;
  category: string;
  totalPurchased: number; // Toplam Alınan Adet
  totalSold: number; // Toplam Satılan Adet
  currentStock: number; // Mevcut Stok
  avgPurchaseCost: number; // Ağırlıklı Ortalama Alış Maliyeti
  latestCatalogPrice: number; // Güncel Toptan Liste Fiyatı
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  primarySupplier?: string;
}

export type AlertType =
  | 'MISSING_WHOLESALE_PRICE'
  | 'NEGATIVE_PROFIT'
  | 'LOW_MARGIN'
  | 'PRICE_INCREASE'
  | 'PRICE_DECREASE'
  | 'OUT_OF_STOCK'
  | 'LOW_STOCK';

export interface PriceAlert {
  id: string;
  type: AlertType;
  productCode: string;
  productName: string;
  salesRep?: string;
  saleRecordId?: string;
  saleDate?: string;
  periodMonth: string;
  currentSalePrice?: number;
  wholesalePrice?: number;
  previousWholesalePrice?: number;
  profit?: number;
  profitMargin?: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  resolved?: boolean;
}

export interface ColumnMapping {
  salesRep: string;
  date: string;
  productCode: string;
  productName: string;
  category: string;
  quantity: string;
  unitSalePrice: string;
  discountPercent?: string;
  totalSalePrice?: string;
  customerName?: string;
  invoiceNo?: string;
}

export interface WholesaleColumnMapping {
  productCode: string;
  productName: string;
  category: string;
  wholesalePrice: string;
  supplier?: string;
  notes?: string;
}

export interface PurchaseColumnMapping {
  purchaseDate: string;
  supplierName: string;
  productCode: string;
  productName: string;
  category: string;
  quantity: string;
  unitCost: string;
  invoiceNo?: string;
  notes?: string;
}

export interface FilterState {
  searchQuery: string;
  selectedSalesRep: string; // 'ALL' or specific name
  selectedCategory: string; // 'ALL' or specific category
  selectedPeriod: string; // 'ALL', '2024-05', etc.
  selectedSupplier: string; // 'ALL' or specific supplier
  statusFilter: 'ALL' | 'PROFITABLE' | 'UNPROFITABLE' | 'MISSING_PRICE';
  costingMethod: CostingMethod; // 'CATALOG_PRICE' vs 'PURCHASE_AVG'
  startDate?: string;
  endDate?: string;
}

export interface KPISummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number; // Brüt Kâr
  averageMargin: number; // Brüt Kâr Marjı %
  totalExpenses: number; // Toplam Masraflar / Giderler
  netProfit: number; // Net Faaliyet Kârı (Brüt Kâr - Masraflar)
  netMargin: number; // Net Kâr Marjı %
  totalUnitsSold: number;
  totalTransactions: number;
  missingPriceCount: number;
  negativeProfitCount: number;
  totalStockUnits: number;
  totalStockValue: number;
}

export type ExpenseType = 'FIXED' | 'VARIABLE';

export interface ExpenseRecord {
  id: string;
  title: string;
  category: string;
  expenseType: ExpenseType;
  amount: number;
  date: string;
  periodMonth: string;
  paymentStatus?: 'PAID' | 'PENDING';
  paymentMethod?: string;
  invoiceNo?: string;
  supplierOrVendor?: string;
  notes?: string;
  createdAt: string;
}

export interface ProductSubCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  targetMarginPercent?: number;
  color?: string;
  subcategories: ProductSubCategory[];
}

export interface SupplierProfitabilityItem {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  unitsSold: number;
  salesCount: number;
  activeProductsCount: number;
  totalPurchasedVolume: number;
  unprofitableSalesCount: number;
  topProducts: {
    productCode: string;
    productName: string;
    revenue: number;
    profit: number;
    quantity: number;
  }[];
}
