import * as XLSX from 'xlsx';
import { ComputedMatrixResult } from './ciroCalculations';
import { CIRO_MONTHS } from '../data/initialCiroMatrix';

export function exportCiroMatrixToExcel(data: ComputedMatrixResult): void {
  const workbook = XLSX.utils.book_new();

  const comparisonHeader = data.isFoundationYear
    ? 'Geçmiş Yıl (Kuruluş Yılı)'
    : `${data.comparisonYear} Yılı Toplamı (TL)`;

  // Create Header Row
  const headerRow: string[] = [
    'Grup',
    'Kategori / Marka',
    'Ortalama Kârlılık (%)',
    ...CIRO_MONTHS.map(m => m.name),
    'Genel Toplam (TL)',
    'Aylık Ortalama (TL)',
    comparisonHeader,
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
      data.isFoundationYear ? '-' : Math.round(pastTotal),
      data.isFoundationYear ? '-' : Math.round(growthTl),
      data.isFoundationYear ? 'Kuruluş Yılı' : `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
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

  // 3. GENEL FİRMA TOPLAMI
  rows.push([
    'GENEL',
    'GENEL FİRMA TOPLAMI',
    `${data.grandTotal.weightedMargin.toFixed(1)}%`,
    ...CIRO_MONTHS.map(m => Math.round(data.grandTotal.months[m.no] || 0)),
    Math.round(data.grandTotal.yearTotal),
    Math.round(data.grandTotal.monthlyAverage),
    data.isFoundationYear ? '-' : Math.round(data.grandTotal.pastYearTotal),
    data.isFoundationYear ? '-' : Math.round(data.grandTotal.growthAmount),
    data.isFoundationYear ? 'Kuruluş Yılı (İlk Yıl)' : `${data.grandTotal.growthRate >= 0 ? '+' : ''}${data.grandTotal.growthRate.toFixed(1)}%`,
    Math.round(data.grandTotal.totalEstimatedProfit),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 14 }, // Grup
    { wch: 26 }, // Kategori / Marka
    { wch: 18 }, // Ortalama Kârlılık (%)
    ...CIRO_MONTHS.map(() => ({ wch: 13 })), // 12 Aylar
    { wch: 18 }, // Genel Toplam (TL)
    { wch: 16 }, // Aylık Ortalama (TL)
    { wch: 20 }, // Önceki Yıl Toplamı (TL)
    { wch: 16 }, // Büyüme (TL)
    { wch: 16 }, // Büyüme Oranı (%)
    { wch: 20 }, // Tahmini Brüt Kâr (TL)
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Ciro Matrisi ${data.year}`);
  XLSX.writeFile(workbook, `Arslan_Mobilya_Ciro_Matrisi_${data.year}.xlsx`);
}
