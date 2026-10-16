import * as XLSX from 'xlsx';
import { ComputedMatrixResult } from './ciroCalculations';
import { CIRO_MONTHS } from '../data/initialCiroMatrix';

export function exportCiroMatrixToExcel(data: ComputedMatrixResult): void {
  const workbook = XLSX.utils.book_new();

  // Create Header Row
  const headerRow: string[] = [
    'Grup',
    'Kategori / Marka',
    'Ortalama Kârlılık (%)',
    ...CIRO_MONTHS.map(m => m.name),
    'Genel Toplam (TL)',
    'Aylık Ortalama (TL)',
    `${data.comparisonYear} Yılı Toplamı (TL)`,
    'Büyüme (TL)',
    'Büyüme Oranı (%)',
    'Tahmini Brüt Kâr (TL)',
  ];

  const rows: any[][] = [headerRow];

  // Helper to push row
  const addDataRow = (
    group: string,
    name: string,
    margin: number,
    months: Record<number, number>,
    total: number,
    avg: number,
    pastTotal: number,
    growthTl: number,
    growthRate: number,
    profit: number
  ) => {
    rows.push([
      group,
      name,
      `${margin.toFixed(1)}%`,
      ...CIRO_MONTHS.map(m => Math.round(months[m.no] || 0)),
      Math.round(total),
      Math.round(avg),
      Math.round(pastTotal),
      Math.round(growthTl),
      `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
      Math.round(profit),
    ]);
  };

  // 1. Beyaz Eşya Rows
  data.beyazEsyaRows.forEach(r => {
    const monthsObj: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      monthsObj[m] = r.months[m].totalAmount;
    }
    addDataRow(
      'BEYAZ EŞYA',
      r.displayName,
      r.profitMargin,
      monthsObj,
      r.yearTotal,
      r.monthlyAverage,
      r.pastYearTotal,
      r.growthAmount,
      r.growthRate,
      r.estimatedProfit
    );
  });

  // Beyaz Eşya Subtotal
  addDataRow(
    'BEYAZ EŞYA',
    `BEYAZ EŞYA ALT TOPLAM (Payı: %${data.beyazEsyaSubtotal.sharePercent.toFixed(1)})`,
    data.beyazEsyaSubtotal.weightedMargin,
    data.beyazEsyaSubtotal.months,
    data.beyazEsyaSubtotal.yearTotal,
    data.beyazEsyaSubtotal.monthlyAverage,
    data.beyazEsyaSubtotal.pastYearTotal,
    data.beyazEsyaSubtotal.growthAmount,
    data.beyazEsyaSubtotal.growthRate,
    data.beyazEsyaSubtotal.estimatedProfit
  );

  // Blank line
  rows.push([]);

  // 2. Mobilya Rows
  data.mobilyaRows.forEach(r => {
    const monthsObj: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      monthsObj[m] = r.months[m].totalAmount;
    }
    addDataRow(
      'MOBİLYA',
      r.displayName,
      r.profitMargin,
      monthsObj,
      r.yearTotal,
      r.monthlyAverage,
      r.pastYearTotal,
      r.growthAmount,
      r.growthRate,
      r.estimatedProfit
    );
  });

  // Mobilya Subtotal
  addDataRow(
    'MOBİLYA',
    `MOBİLYA ALT TOPLAM (Payı: %${data.mobilyaSubtotal.sharePercent.toFixed(1)})`,
    data.mobilyaSubtotal.weightedMargin,
    data.mobilyaSubtotal.months,
    data.mobilyaSubtotal.yearTotal,
    data.mobilyaSubtotal.monthlyAverage,
    data.mobilyaSubtotal.pastYearTotal,
    data.mobilyaSubtotal.growthAmount,
    data.mobilyaSubtotal.growthRate,
    data.mobilyaSubtotal.estimatedProfit
  );

  // Blank line
  rows.push([]);

  // 3. Genel Firma Toplamı
  addDataRow(
    'GENEL',
    'GENEL FİRMA TOPLAMI',
    data.grandTotal.weightedMargin,
    data.grandTotal.months,
    data.grandTotal.yearTotal,
    data.grandTotal.monthlyAverage,
    data.grandTotal.pastYearTotal,
    data.grandTotal.growthAmount,
    data.grandTotal.growthRate,
    data.grandTotal.totalEstimatedProfit
  );

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    ...CIRO_MONTHS.map(() => ({ wch: 13 })),
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Ciro Matrisi ${data.year}`);
  XLSX.writeFile(workbook, `Arslan_Mobilya_Ciro_Analiz_${data.year}.xlsx`);
}
