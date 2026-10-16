import { SaleRecord, CiroMatrixDataStore } from '../types/finance';
import { CIRO_ROW_DEFINITIONS, mapSaleToCiroRow } from '../data/initialCiroMatrix';

export interface ComputedCellData {
  manualAmount: number;
  liveSalesAmount: number;
  totalAmount: number;
  salesCount: number;
  contributingSales: SaleRecord[];
  isOverridden: boolean;
  note?: string;
}

export interface ComputedRowData {
  id: string;
  displayName: string;
  group: 'BEYAZ EŞYA' | 'MOBİLYA';
  profitMargin: number; // % e.g. 22
  months: Record<number, ComputedCellData>; // 1..12
  yearTotal: number;
  activeMonthsCount: number; // Cirosu girilen aktif ay sayısı
  monthlyAverage: number; // Genel Toplam / Aktif Ay Sayısı
  pastYearTotal: number; // 2025 Yılı Toplamı (TL)
  growthAmount: number; // yearTotal - pastYearTotal
  growthRate: number; // % growth
  estimatedProfit: number; // yearTotal * (profitMargin / 100)
}

export interface ComputedGroupSubtotal {
  group: 'BEYAZ EŞYA' | 'MOBİLYA';
  months: Record<number, number>; // 1..12 totals
  yearTotal: number;
  activeMonthsCount: number;
  monthlyAverage: number;
  pastYearTotal: number;
  growthAmount: number;
  growthRate: number;
  sharePercent: number; // % of Grand Total
  estimatedProfit: number;
  weightedMargin: number; // %
}

export interface ComputedMatrixResult {
  year: string;
  comparisonYear: string; // Defaults to '2025'
  availableYears: string[];
  rows: ComputedRowData[];
  beyazEsyaRows: ComputedRowData[];
  mobilyaRows: ComputedRowData[];
  beyazEsyaSubtotal: ComputedGroupSubtotal;
  mobilyaSubtotal: ComputedGroupSubtotal;
  grandTotal: {
    months: Record<number, number>;
    yearTotal: number;
    activeMonthsCount: number;
    monthlyAverage: number;
    pastYearTotal: number;
    growthAmount: number;
    growthRate: number;
    totalEstimatedProfit: number;
    weightedMargin: number;
  };
}

/**
 * Calculates complete multi-year Ciro Matrix with live sales integration,
 * manual adjustments, subtotals, margins, and comparative growth metrics.
 */
export function calculateCiroMatrix(
  selectedYear: string,
  matrixStore: CiroMatrixDataStore,
  sales: SaleRecord[]
): ComputedMatrixResult {
  // Determine available years
  const storeYears = Object.keys(matrixStore);
  const salesYears = sales.map(s => s.date.substring(0, 4)).filter(Boolean);
  const allYearsSet = new Set<string>(['2024', '2025', '2026', ...storeYears, ...salesYears]);
  const availableYears = Array.from(allYearsSet).sort();

  const currentYearNum = parseInt(selectedYear, 10) || 2026;
  // If viewing 2026 or later, compare against 2025 (as requested). If viewing 2025, compare against 2024.
  const comparisonYear = currentYearNum === 2025 ? '2024' : '2025';

  // Group sales by year, mapped row ID, and month (1..12)
  const salesMap: Record<string, Record<string, Record<number, SaleRecord[]>>> = {};
  sales.forEach(s => {
    if (!s.date) return;
    const y = s.date.substring(0, 4);
    const m = parseInt(s.date.substring(5, 7), 10);
    if (!m || m < 1 || m > 12) return;

    const rowId = mapSaleToCiroRow(s);
    if (!salesMap[y]) salesMap[y] = {};
    if (!salesMap[y][rowId]) salesMap[y][rowId] = {};
    if (!salesMap[y][rowId][m]) salesMap[y][rowId][m] = [];
    salesMap[y][rowId][m].push(s);
  });

  // Helper to compute a single row for any year
  const computeSingleRow = (rowDef: (typeof CIRO_ROW_DEFINITIONS)[0], yearStr: string): {
    months: Record<number, ComputedCellData>;
    yearTotal: number;
    activeMonthsCount: number;
    profitMargin: number;
  } => {
    const yearConfig = matrixStore[yearStr];
    const customMargin = yearConfig?.rowMargins?.[rowDef.id];
    const profitMargin = typeof customMargin === 'number' ? customMargin : rowDef.defaultProfitMargin;

    const months: Record<number, ComputedCellData> = {};
    let yearTotal = 0;
    let activeMonthsCount = 0;

    for (let m = 1; m <= 12; m++) {
      const cellEntry = yearConfig?.cells?.[rowDef.id]?.[m];
      const contributingSales = salesMap[yearStr]?.[rowDef.id]?.[m] || [];
      const liveSalesAmount = contributingSales.reduce((sum, s) => sum + (s.totalSaleAmount || s.totalAmount || 0), 0);
      const manualAmount = typeof cellEntry?.manualAmount === 'number' ? cellEntry.manualAmount : 0;

      let totalAmount: number;
      let isOverridden = false;

      if (typeof cellEntry?.overrideTotal === 'number') {
        totalAmount = cellEntry.overrideTotal;
        isOverridden = true;
      } else {
        totalAmount = manualAmount + liveSalesAmount;
      }

      months[m] = {
        manualAmount,
        liveSalesAmount,
        totalAmount,
        salesCount: contributingSales.length,
        contributingSales,
        isOverridden,
        note: cellEntry?.note,
      };

      yearTotal += totalAmount;
      if (totalAmount > 0) {
        activeMonthsCount++;
      }
    }

    return { months, yearTotal, activeMonthsCount, profitMargin };
  };

  // Compute baseline year (2025) totals for growth comparison
  const comparisonYearRowTotals: Record<string, number> = {};
  CIRO_ROW_DEFINITIONS.forEach(def => {
    const { yearTotal } = computeSingleRow(def, comparisonYear);
    comparisonYearRowTotals[def.id] = yearTotal;
  });

  // Compute selected year rows
  const computedRows: ComputedRowData[] = CIRO_ROW_DEFINITIONS.map(def => {
    const { months, yearTotal, activeMonthsCount, profitMargin } = computeSingleRow(def, selectedYear);
    const pastYearTotal = comparisonYearRowTotals[def.id] || 0;
    const growthAmount = yearTotal - pastYearTotal;
    const growthRate = pastYearTotal > 0 ? (growthAmount / pastYearTotal) * 100 : 0;
    // Formula rule: Aylık Ortalama = Genel Toplam / Aktif Ay Sayısı
    const divisor = activeMonthsCount > 0 ? activeMonthsCount : 1;
    const monthlyAverage = yearTotal > 0 ? +(yearTotal / divisor).toFixed(2) : 0;
    // Formula rule: Tahmini Brüt Kâr = Genel Toplam x Kârlılık Oranı
    const estimatedProfit = +(yearTotal * (profitMargin / 100)).toFixed(2);

    return {
      id: def.id,
      displayName: def.displayName,
      group: def.group,
      profitMargin,
      months,
      yearTotal,
      activeMonthsCount,
      monthlyAverage,
      pastYearTotal,
      growthAmount,
      growthRate,
      estimatedProfit,
    };
  });

  const beyazEsyaRows = computedRows.filter(r => r.group === 'BEYAZ EŞYA');
  const mobilyaRows = computedRows.filter(r => r.group === 'MOBİLYA');

  // Compute Group Subtotals
  const computeGroup = (groupRows: ComputedRowData[], groupName: 'BEYAZ EŞYA' | 'MOBİLYA'): ComputedGroupSubtotal => {
    const months: Record<number, number> = {};
    let activeMonthsCount = 0;

    for (let m = 1; m <= 12; m++) {
      const monthSum = groupRows.reduce((sum, r) => sum + r.months[m].totalAmount, 0);
      months[m] = monthSum;
      if (monthSum > 0) {
        activeMonthsCount++;
      }
    }

    const yearTotal = groupRows.reduce((sum, r) => sum + r.yearTotal, 0);
    const pastYearTotal = groupRows.reduce((sum, r) => sum + r.pastYearTotal, 0);
    const growthAmount = yearTotal - pastYearTotal;
    const growthRate = pastYearTotal > 0 ? (growthAmount / pastYearTotal) * 100 : 0;
    const divisor = activeMonthsCount > 0 ? activeMonthsCount : 1;
    const monthlyAverage = yearTotal > 0 ? +(yearTotal / divisor).toFixed(2) : 0;
    const estimatedProfit = groupRows.reduce((sum, r) => sum + r.estimatedProfit, 0);
    const weightedMargin = yearTotal > 0 ? (estimatedProfit / yearTotal) * 100 : 0;

    return {
      group: groupName,
      months,
      yearTotal,
      activeMonthsCount,
      monthlyAverage,
      pastYearTotal,
      growthAmount,
      growthRate,
      sharePercent: 0, // Will be set after grand total is calculated
      estimatedProfit,
      weightedMargin,
    };
  };

  const beyazEsyaSubtotal = computeGroup(beyazEsyaRows, 'BEYAZ EŞYA');
  const mobilyaSubtotal = computeGroup(mobilyaRows, 'MOBİLYA');

  // Grand Total
  const grandMonths: Record<number, number> = {};
  let grandActiveMonthsCount = 0;
  for (let m = 1; m <= 12; m++) {
    const mTotal = beyazEsyaSubtotal.months[m] + mobilyaSubtotal.months[m];
    grandMonths[m] = mTotal;
    if (mTotal > 0) {
      grandActiveMonthsCount++;
    }
  }

  const grandYearTotal = beyazEsyaSubtotal.yearTotal + mobilyaSubtotal.yearTotal;
  const grandPastYearTotal = beyazEsyaSubtotal.pastYearTotal + mobilyaSubtotal.pastYearTotal;
  const grandGrowthAmount = grandYearTotal - grandPastYearTotal;
  const grandGrowthRate = grandPastYearTotal > 0 ? (grandGrowthAmount / grandPastYearTotal) * 100 : 0;
  const grandDivisor = grandActiveMonthsCount > 0 ? grandActiveMonthsCount : 1;
  const grandMonthlyAverage = grandYearTotal > 0 ? +(grandYearTotal / grandDivisor).toFixed(2) : 0;
  const totalEstimatedProfit = beyazEsyaSubtotal.estimatedProfit + mobilyaSubtotal.estimatedProfit;
  const grandWeightedMargin = grandYearTotal > 0 ? (totalEstimatedProfit / grandYearTotal) * 100 : 0;

  // Set share percentages
  beyazEsyaSubtotal.sharePercent = grandYearTotal > 0 ? (beyazEsyaSubtotal.yearTotal / grandYearTotal) * 100 : 0;
  mobilyaSubtotal.sharePercent = grandYearTotal > 0 ? (mobilyaSubtotal.yearTotal / grandYearTotal) * 100 : 0;

  return {
    year: selectedYear,
    comparisonYear,
    availableYears,
    rows: computedRows,
    beyazEsyaRows,
    mobilyaRows,
    beyazEsyaSubtotal,
    mobilyaSubtotal,
    grandTotal: {
      months: grandMonths,
      yearTotal: grandYearTotal,
      activeMonthsCount: grandActiveMonthsCount,
      monthlyAverage: grandMonthlyAverage,
      pastYearTotal: grandPastYearTotal,
      growthAmount: grandGrowthAmount,
      growthRate: grandGrowthRate,
      totalEstimatedProfit,
      weightedMargin: grandWeightedMargin,
    },
  };
}
