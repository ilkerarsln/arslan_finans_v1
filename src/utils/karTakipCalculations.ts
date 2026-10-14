import {
  SaleRecord,
  WholesalePriceItem,
  PurchaseRecord,
  PriceAlert,
  KPISummary,
  CostingMethod,
  ProductStockInfo,
  ProductAliasMapping,
  ExpenseRecord,
  KarTakipSupplier,
  SupplierProfitabilityItem
} from '../types/karTakip';

export function getPeriodFromDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    }
  } else if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}`;
    }
  }
  return dateStr.slice(0, 7);
}

export function calculateInventoryStocks(
  purchases: PurchaseRecord[],
  sales: SaleRecord[],
  wholesalePrices: WholesalePriceItem[]
): ProductStockInfo[] {
  const stockMap = new Map<string, {
    productName: string;
    category: string;
    purchasedQty: number;
    purchasedTotalAmount: number;
    soldQty: number;
    supplier?: string;
  }>();

  purchases.forEach(p => {
    const code = p.productCode.trim().toUpperCase();
    if (!stockMap.has(code)) {
      stockMap.set(code, {
        productName: p.productName,
        category: p.category,
        purchasedQty: 0,
        purchasedTotalAmount: 0,
        soldQty: 0,
        supplier: p.supplierName
      });
    }
    const item = stockMap.get(code)!;
    item.purchasedQty += p.quantity;
    item.purchasedTotalAmount += p.totalCost;
    if (p.supplierName) item.supplier = p.supplierName;
  });

  sales.forEach(s => {
    const code = s.productCode.trim().toUpperCase();
    if (!stockMap.has(code)) {
      stockMap.set(code, {
        productName: s.productName,
        category: s.category,
        purchasedQty: 0,
        purchasedTotalAmount: 0,
        soldQty: 0
      });
    }
    const item = stockMap.get(code)!;
    item.soldQty += s.quantity;
  });

  const result: ProductStockInfo[] = [];

  stockMap.forEach((data, code) => {
    const currentStock = data.purchasedQty - data.soldQty;
    const avgCost = data.purchasedQty > 0 ? data.purchasedTotalAmount / data.purchasedQty : 0;

    const catalogMatch = wholesalePrices
      .filter(w => w.productCode.trim().toUpperCase() === code)
      .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth))[0];

    const stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' =
      currentStock <= 0 ? 'OUT_OF_STOCK' : currentStock <= 3 ? 'LOW_STOCK' : 'IN_STOCK';

    result.push({
      productCode: code,
      productName: data.productName,
      category: data.category,
      totalPurchased: data.purchasedQty,
      totalSold: data.soldQty,
      currentStock,
      avgPurchaseCost: Math.round(avgCost * 100) / 100,
      latestCatalogPrice: catalogMatch ? catalogMatch.wholesalePrice : avgCost,
      stockStatus,
      primarySupplier: data.supplier || catalogMatch?.supplier
    });
  });

  return result.sort((a, b) => a.currentStock - b.currentStock);
}

export function enrichSalesWithWholesalePrices(
  sales: SaleRecord[],
  wholesalePrices: WholesalePriceItem[],
  purchases: PurchaseRecord[] = [],
  costingMethod: CostingMethod = 'CATALOG_PRICE',
  aliasMappings: ProductAliasMapping[] = []
): SaleRecord[] {
  const avgCostMap = new Map<string, { totalQty: number; totalCost: number; supplier: string }>();
  purchases.forEach(p => {
    const code = p.productCode.trim().toUpperCase();
    if (!avgCostMap.has(code)) {
      avgCostMap.set(code, { totalQty: 0, totalCost: 0, supplier: p.supplierName });
    }
    const item = avgCostMap.get(code)!;
    item.totalQty += p.quantity;
    item.totalCost += p.totalCost;
    if (p.supplierName) item.supplier = p.supplierName;
  });

  return sales.map(sale => {
    const salePeriod = getPeriodFromDate(sale.date);
    const rawCode = (sale.productCode || '').trim().toUpperCase();
    const rawName = (sale.productName || '').trim().toLowerCase();

    const alias = aliasMappings.find(a => {
      const matchCode = a.sourceProductCode && a.sourceProductCode.trim().toUpperCase() === rawCode;
      const matchName = a.sourceProductName && a.sourceProductName.trim().toLowerCase() === rawName;
      return matchCode || matchName;
    });

    const effectiveCode = alias ? alias.targetProductCode.trim().toUpperCase() : rawCode;

    let unitCost: number | null = null;
    let matchedPeriod: string | null = null;
    let matchedSupplier: string | null = null;

    if (costingMethod === 'PURCHASE_AVG') {
      const avgData = avgCostMap.get(effectiveCode);
      if (avgData && avgData.totalQty > 0) {
        unitCost = avgData.totalCost / avgData.totalQty;
        matchedPeriod = 'Ortalama Alım';
        matchedSupplier = avgData.supplier;
      }
    }

    if (unitCost === null || unitCost === 0) {
      let match = wholesalePrices.find(
        wp => wp.productCode.trim().toUpperCase() === effectiveCode && wp.periodMonth === salePeriod
      );
      if (!match) {
        const candidates = wholesalePrices
          .filter(wp => wp.productCode.trim().toUpperCase() === effectiveCode)
          .sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
        if (candidates.length > 0) {
          match = candidates[0];
        }
      }
      if (match && match.wholesalePrice > 0) {
        unitCost = match.wholesalePrice;
        matchedPeriod = match.periodMonth;
        matchedSupplier = match.supplier || null;
      }
    }

    if (unitCost && unitCost > 0) {
      const totalCost = unitCost * sale.quantity;
      const profit = sale.totalSalePrice - totalCost;
      const profitMargin = sale.totalSalePrice > 0 ? (profit / sale.totalSalePrice) * 100 : 0;

      return {
        ...sale,
        matchedWholesalePrice: Math.round(unitCost * 100) / 100,
        costingMethodUsed: costingMethod,
        hasWholesalePrice: true,
        profit: Math.round(profit * 100) / 100,
        profitMargin: Math.round(profitMargin * 10) / 10,
        matchedPeriod,
        matchedSupplier,
        matchedViaAlias: Boolean(alias),
        matchedTargetCode: alias ? alias.targetProductCode : undefined,
        matchedTargetName: alias ? alias.targetProductName : undefined
      };
    } else {
      return {
        ...sale,
        matchedWholesalePrice: null,
        costingMethodUsed: costingMethod,
        hasWholesalePrice: false,
        profit: null,
        profitMargin: null,
        matchedPeriod: null,
        matchedSupplier: null,
        matchedViaAlias: false
      };
    }
  });
}

export function generateSystemAlerts(
  enrichedSales: SaleRecord[],
  wholesalePrices: WholesalePriceItem[],
  inventoryStocks: ProductStockInfo[] = []
): PriceAlert[] {
  const alerts: PriceAlert[] = [];
  const reportedMissingCodes = new Set<string>();

  enrichedSales.forEach(sale => {
    if (!sale.hasWholesalePrice) {
      const key = `${sale.productCode}_${sale.salesRep}`;
      if (!reportedMissingCodes.has(key)) {
        reportedMissingCodes.add(key);
        alerts.push({
          id: `alert_missing_${sale.id}`,
          type: 'MISSING_WHOLESALE_PRICE',
          productCode: sale.productCode,
          productName: sale.productName,
          salesRep: sale.salesRep,
          saleRecordId: sale.id,
          saleDate: sale.date,
          periodMonth: getPeriodFromDate(sale.date),
          currentSalePrice: sale.unitSalePrice,
          message: `"${sale.productName}" (${sale.productCode}) için geçerli toptan maliyet veya alım kaydı bulunamadı. Kâr ve marj hesaplanamıyor.`,
          severity: 'critical'
        });
      }
    }
  });

  enrichedSales.forEach(sale => {
    if (sale.hasWholesalePrice && sale.profit !== null && sale.profit !== undefined && sale.profit < 0) {
      alerts.push({
        id: `alert_neg_${sale.id}`,
        type: 'NEGATIVE_PROFIT',
        productCode: sale.productCode,
        productName: sale.productName,
        salesRep: sale.salesRep,
        saleRecordId: sale.id,
        saleDate: sale.date,
        periodMonth: getPeriodFromDate(sale.date),
        currentSalePrice: sale.unitSalePrice,
        wholesalePrice: sale.matchedWholesalePrice || 0,
        profit: sale.profit,
        profitMargin: sale.profitMargin || 0,
        message: `Zararına Satış Uyarısı: ${sale.salesRep} tarafından satılan "${sale.productName}" birim maliyetin (${sale.matchedWholesalePrice?.toLocaleString('tr-TR')} ₺) altında satıldı. Zarar: ${Math.abs(sale.profit).toLocaleString('tr-TR')} ₺`,
        severity: 'critical'
      });
    } else if (
      sale.hasWholesalePrice &&
      sale.profitMargin !== null &&
      sale.profitMargin !== undefined &&
      sale.profitMargin > 0 &&
      sale.profitMargin < 12
    ) {
      alerts.push({
        id: `alert_low_${sale.id}`,
        type: 'LOW_MARGIN',
        productCode: sale.productCode,
        productName: sale.productName,
        salesRep: sale.salesRep,
        saleRecordId: sale.id,
        saleDate: sale.date,
        periodMonth: getPeriodFromDate(sale.date),
        profitMargin: sale.profitMargin,
        message: `Düşük Kâr Marjı Uyarısı: "${sale.productName}" satışı için kâr marjı sadece %${sale.profitMargin.toFixed(1)}.`,
        severity: 'warning'
      });
    }
  });

  inventoryStocks.forEach(stock => {
    if (stock.stockStatus === 'OUT_OF_STOCK') {
      alerts.push({
        id: `alert_stockout_${stock.productCode}`,
        type: 'OUT_OF_STOCK',
        productCode: stock.productCode,
        productName: stock.productName,
        periodMonth: new Date().toISOString().slice(0, 7),
        message: `Kritik Stok Uyarısı: "${stock.productName}" (${stock.productCode}) tükendi veya eksi stokta (${stock.currentStock} adet)! Yeni mal alımı yapılmalıdır.`,
        severity: 'critical'
      });
    } else if (stock.stockStatus === 'LOW_STOCK') {
      alerts.push({
        id: `alert_lowstock_${stock.productCode}`,
        type: 'LOW_STOCK',
        productCode: stock.productCode,
        productName: stock.productName,
        periodMonth: new Date().toISOString().slice(0, 7),
        message: `Düşük Stok Seviyesi: "${stock.productName}" için yalnızca ${stock.currentStock} adet kaldı.`,
        severity: 'warning'
      });
    }
  });

  const wpByCode = new Map<string, WholesalePriceItem[]>();
  wholesalePrices.forEach(wp => {
    const code = wp.productCode.trim().toUpperCase();
    if (!wpByCode.has(code)) wpByCode.set(code, []);
    wpByCode.get(code)!.push(wp);
  });

  wpByCode.forEach((items, code) => {
    const sorted = [...items].sort((a, b) => a.periodMonth.localeCompare(b.periodMonth));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.wholesalePrice !== curr.wholesalePrice) {
        const diff = curr.wholesalePrice - prev.wholesalePrice;
        const pct = ((diff / prev.wholesalePrice) * 100).toFixed(1);
        const isIncrease = diff > 0;
        alerts.push({
          id: `alert_price_change_${curr.id}`,
          type: isIncrease ? 'PRICE_INCREASE' : 'PRICE_DECREASE',
          productCode: code,
          productName: curr.productName,
          periodMonth: curr.periodMonth,
          wholesalePrice: curr.wholesalePrice,
          previousWholesalePrice: prev.wholesalePrice,
          message: `${curr.periodMonth} döneminde "${curr.productName}" toptan alış liste fiyatı ${prev.wholesalePrice.toLocaleString('tr-TR')} ₺'den ${curr.wholesalePrice.toLocaleString('tr-TR')} ₺'ye ${isIncrease ? 'yükseldi' : 'düştü'} (${isIncrease ? '+' : ''}${pct}%).`,
          severity: isIncrease ? 'warning' : 'info'
        });
      }
    }
  });

  return alerts;
}

export function calculateKPISummary(
  sales: SaleRecord[],
  inventoryStocks: ProductStockInfo[] = [],
  expenses: ExpenseRecord[] = []
): KPISummary {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let totalUnitsSold = 0;
  let missingPriceCount = 0;
  let negativeProfitCount = 0;

  sales.forEach(s => {
    totalRevenue += s.totalSalePrice;
    totalUnitsSold += s.quantity;

    if (s.hasWholesalePrice && s.matchedWholesalePrice !== null && s.profit !== null && s.profit !== undefined) {
      const cost = (s.matchedWholesalePrice || 0) * s.quantity;
      totalCost += cost;
      totalProfit += s.profit;
      if (s.profit < 0) {
        negativeProfitCount++;
      }
    } else {
      missingPriceCount++;
    }
  });

  const averageMargin = totalRevenue > 0 && totalCost > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = totalProfit - totalExpenses;
  const netMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  let totalStockUnits = 0;
  let totalStockValue = 0;
  inventoryStocks.forEach(stk => {
    if (stk.currentStock > 0) {
      totalStockUnits += stk.currentStock;
      totalStockValue += stk.currentStock * (stk.avgPurchaseCost || stk.latestCatalogPrice || 0);
    }
  });

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    averageMargin: Math.round(averageMargin * 10) / 10,
    totalExpenses,
    netProfit,
    netMargin: Math.round(netMargin * 10) / 10,
    totalUnitsSold,
    totalTransactions: sales.length,
    missingPriceCount,
    negativeProfitCount,
    totalStockUnits,
    totalStockValue: Math.round(totalStockValue)
  };
}

export interface MonthlyFinancialSummary {
  periodMonth: string;
  revenue: number;
  cost: number;
  profit: number; // Brüt Kâr
  margin: number; // Brüt Kâr Marjı %
  expensesTotalAmount: number;
  netProfit: number;
  netMargin: number;
  unitsSold: number;
  transactionCount: number;
  purchasesTotalAmount: number;
  purchasesQuantity: number;
  isClosed: boolean;
  revenueGrowthMoM?: number;
  profitGrowthMoM?: number;
}

export function calculateMonthlyFinancialSummaries(
  sales: SaleRecord[],
  purchases: PurchaseRecord[],
  closedStatuses: { periodMonth: string; isClosed: boolean }[] = [],
  expenses: ExpenseRecord[] = []
): MonthlyFinancialSummary[] {
  const periodMap = new Map<string, MonthlyFinancialSummary>();

  const ensurePeriod = (p: string) => {
    if (p && !periodMap.has(p)) {
      periodMap.set(p, {
        periodMonth: p,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        expensesTotalAmount: 0,
        netProfit: 0,
        netMargin: 0,
        unitsSold: 0,
        transactionCount: 0,
        purchasesTotalAmount: 0,
        purchasesQuantity: 0,
        isClosed: false
      });
    }
  };

  sales.forEach(s => {
    const p = getPeriodFromDate(s.date);
    if (p) {
      ensurePeriod(p);
      const entry = periodMap.get(p)!;
      entry.revenue += s.totalSalePrice;
      entry.unitsSold += s.quantity;
      entry.transactionCount += 1;
      if (s.hasWholesalePrice && s.matchedWholesalePrice && s.profit !== null && s.profit !== undefined) {
        entry.cost += s.matchedWholesalePrice * s.quantity;
        entry.profit += s.profit;
      }
    }
  });

  purchases.forEach(pur => {
    const p = pur.periodMonth || getPeriodFromDate(pur.purchaseDate);
    if (p) {
      ensurePeriod(p);
      const entry = periodMap.get(p)!;
      entry.purchasesTotalAmount += pur.totalCost;
      entry.purchasesQuantity += pur.quantity;
    }
  });

  expenses.forEach(exp => {
    const p = exp.periodMonth || getPeriodFromDate(exp.date);
    if (p) {
      ensurePeriod(p);
      const entry = periodMap.get(p)!;
      entry.expensesTotalAmount += exp.amount || 0;
    }
  });

  const closedSet = new Set(closedStatuses.filter(c => c.isClosed).map(c => c.periodMonth));
  const list = Array.from(periodMap.values()).map(item => {
    const grossMargin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
    const netProfit = item.profit - item.expensesTotalAmount;
    const netMargin = item.revenue > 0 ? (netProfit / item.revenue) * 100 : 0;
    return {
      ...item,
      netProfit,
      margin: Math.round(grossMargin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
      isClosed: closedSet.has(item.periodMonth)
    };
  });

  list.sort((a, b) => a.periodMonth.localeCompare(b.periodMonth));

  for (let i = 1; i < list.length; i++) {
    const prev = list[i - 1];
    const curr = list[i];
    if (prev.revenue > 0) {
      curr.revenueGrowthMoM = Math.round(((curr.revenue - prev.revenue) / prev.revenue) * 1000) / 10;
    }
    if (prev.profit !== 0) {
      curr.profitGrowthMoM = Math.round(((curr.profit - prev.profit) / Math.abs(prev.profit)) * 1000) / 10;
    }
  }

  return list.sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
}

export function calculateSupplierProfitability(
  sales: SaleRecord[],
  wholesalePrices: WholesalePriceItem[],
  purchases: PurchaseRecord[],
  suppliers: KarTakipSupplier[],
  selectedPeriod: string = 'ALL'
): SupplierProfitabilityItem[] {
  const filteredSales = selectedPeriod === 'ALL'
    ? sales
    : sales.filter(s => getPeriodFromDate(s.date) === selectedPeriod);

  const filteredPurchases = selectedPeriod === 'ALL'
    ? purchases
    : purchases.filter(p => (p.periodMonth || getPeriodFromDate(p.purchaseDate)) === selectedPeriod);

  const productToSupplierName = new Map<string, string>();
  wholesalePrices.forEach(wp => {
    if (wp.supplier && wp.productCode) {
      productToSupplierName.set(wp.productCode.trim().toUpperCase(), wp.supplier.trim());
    }
  });

  purchases.forEach(pur => {
    if (pur.supplierName && pur.productCode) {
      const code = pur.productCode.trim().toUpperCase();
      if (!productToSupplierName.has(code)) {
        productToSupplierName.set(code, pur.supplierName.trim());
      }
    }
  });

  const matchSaleSupplier = (sale: SaleRecord): KarTakipSupplier | undefined => {
    const code = sale.productCode.trim().toUpperCase();
    const mappedSupplierName = sale.matchedSupplier || productToSupplierName.get(code);

    if (mappedSupplierName) {
      const sup = suppliers.find(
        s =>
          s.name.toLowerCase().includes(mappedSupplierName.toLowerCase()) ||
          mappedSupplierName.toLowerCase().includes(s.name.toLowerCase()) ||
          s.code.toLowerCase() === mappedSupplierName.toLowerCase()
      );
      if (sup) return sup;
    }

    const purchaseMatch = purchases.find(p => p.productCode.trim().toUpperCase() === code);
    if (purchaseMatch) {
      const sup = suppliers.find(
        s =>
          s.id === purchaseMatch.supplierId ||
          s.name.toLowerCase().includes(purchaseMatch.supplierName.toLowerCase()) ||
          purchaseMatch.supplierName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (sup) return sup;
    }

    return undefined;
  };

  const supplierStatsMap = new Map<string, {
    supplier: KarTakipSupplier;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    unitsSold: number;
    salesCount: number;
    unprofitableCount: number;
    productMap: Map<string, { code: string; name: string; revenue: number; profit: number; quantity: number }>;
  }>();

  suppliers.forEach(sup => {
    supplierStatsMap.set(sup.id, {
      supplier: sup,
      totalRevenue: 0,
      totalCost: 0,
      grossProfit: 0,
      unitsSold: 0,
      salesCount: 0,
      unprofitableCount: 0,
      productMap: new Map()
    });
  });

  filteredSales.forEach(sale => {
    const supplier = matchSaleSupplier(sale);
    if (!supplier) return;

    if (!supplierStatsMap.has(supplier.id)) {
      supplierStatsMap.set(supplier.id, {
        supplier,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        unitsSold: 0,
        salesCount: 0,
        unprofitableCount: 0,
        productMap: new Map()
      });
    }

    const stat = supplierStatsMap.get(supplier.id)!;
    stat.totalRevenue += sale.totalSalePrice;
    stat.unitsSold += sale.quantity;
    stat.salesCount += 1;

    const code = sale.productCode.trim().toUpperCase();
    let cost = 0;
    let profit = 0;

    if (sale.hasWholesalePrice && sale.matchedWholesalePrice !== null && sale.matchedWholesalePrice !== undefined) {
      cost = sale.matchedWholesalePrice * sale.quantity;
      profit = sale.profit ?? (sale.totalSalePrice - cost);
    }

    stat.totalCost += cost;
    stat.grossProfit += profit;
    if (profit < 0) {
      stat.unprofitableCount += 1;
    }

    if (!stat.productMap.has(code)) {
      stat.productMap.set(code, {
        code,
        name: sale.productName,
        revenue: 0,
        profit: 0,
        quantity: 0
      });
    }
    const prodStat = stat.productMap.get(code)!;
    prodStat.revenue += sale.totalSalePrice;
    prodStat.profit += profit;
    prodStat.quantity += sale.quantity;
  });

  const purchasesBySupplier = new Map<string, number>();
  filteredPurchases.forEach(p => {
    const sup = suppliers.find(
      s => s.id === p.supplierId || s.name.toLowerCase().includes(p.supplierName.toLowerCase())
    );
    const id = sup ? sup.id : p.supplierId;
    purchasesBySupplier.set(id, (purchasesBySupplier.get(id) || 0) + p.totalCost);
  });

  const results: SupplierProfitabilityItem[] = [];

  supplierStatsMap.forEach((stat, supId) => {
    const margin = stat.totalRevenue > 0 ? (stat.grossProfit / stat.totalRevenue) * 100 : 0;
    const topProds = Array.from(stat.productMap.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map(p => ({
        productCode: p.code,
        productName: p.name,
        revenue: p.revenue,
        profit: p.profit,
        quantity: p.quantity
      }));

    results.push({
      supplierId: supId,
      supplierCode: stat.supplier.code,
      supplierName: stat.supplier.name,
      totalRevenue: stat.totalRevenue,
      totalCost: stat.totalCost,
      grossProfit: stat.grossProfit,
      profitMargin: Math.round(margin * 10) / 10,
      unitsSold: stat.unitsSold,
      salesCount: stat.salesCount,
      activeProductsCount: stat.productMap.size,
      totalPurchasedVolume: purchasesBySupplier.get(supId) || 0,
      unprofitableSalesCount: stat.unprofitableCount,
      topProducts: topProds
    });
  });

  return results.sort((a, b) => b.grossProfit - a.grossProfit);
}

export interface PersonnelStat {
  salesRep: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalUnitsSold: number;
  transactionCount: number;
  missingPriceCount: number;
  topCategory: string;
  profitRank?: number;
}

export function calculatePersonnelStats(sales: SaleRecord[]): PersonnelStat[] {
  const map = new Map<string, {
    revenue: number;
    cost: number;
    profit: number;
    units: number;
    txCount: number;
    missingCount: number;
    categories: Record<string, number>;
  }>();

  sales.forEach(s => {
    const rep = s.salesRep || 'Belirtilmemiş';
    if (!map.has(rep)) {
      map.set(rep, {
        revenue: 0,
        cost: 0,
        profit: 0,
        units: 0,
        txCount: 0,
        missingCount: 0,
        categories: {}
      });
    }

    const current = map.get(rep)!;
    current.revenue += s.totalSalePrice;
    current.units += s.quantity;
    current.txCount += 1;

    if (s.category) {
      current.categories[s.category] = (current.categories[s.category] || 0) + s.totalSalePrice;
    }

    if (s.hasWholesalePrice && s.matchedWholesalePrice && s.profit !== null && s.profit !== undefined) {
      current.cost += s.matchedWholesalePrice * s.quantity;
      current.profit += s.profit;
    } else {
      current.missingCount += 1;
    }
  });

  const list: PersonnelStat[] = [];
  map.forEach((data, rep) => {
    let topCat = 'Mobilya';
    let maxCatRev = -1;
    Object.entries(data.categories).forEach(([cat, rev]) => {
      if (rev > maxCatRev) {
        maxCatRev = rev;
        topCat = cat;
      }
    });

    const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
    list.push({
      salesRep: rep,
      totalRevenue: data.revenue,
      totalCost: data.cost,
      totalProfit: data.profit,
      profitMargin: Math.round(margin * 10) / 10,
      totalUnitsSold: data.units,
      transactionCount: data.txCount,
      missingPriceCount: data.missingCount,
      topCategory: topCat
    });
  });

  list.sort((a, b) => b.totalRevenue - a.totalRevenue);
  list.forEach((item, idx) => {
    item.profitRank = idx + 1;
  });

  return list;
}
