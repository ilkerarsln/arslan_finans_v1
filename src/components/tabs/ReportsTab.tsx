import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileBarChart2,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ShoppingBag,
  Users,
  ChevronRight,
  X,
  CreditCard,
  Building,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const ReportsTab: React.FC = () => {
  const { transactions, sales, purchases, accounts, caris, vadeRates } = useFinance();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMonthModal, setSelectedMonthModal] = useState<string | null>(null);

  // Available years from transactions and sales
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach(t => {
      if (t.date) years.add(new Date(t.date).getFullYear());
    });
    sales.forEach(s => {
      if (s.date) years.add(new Date(s.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, sales]);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Helper to get effective cost with vade for installment sales
  const getSaleProfit = (sale: any) => {
    let effectiveCost = sale.effectiveCost || (sale.costPrice * sale.quantity);
    if (!sale.effectiveCost && sale.saleType === 'Senetli Satış' && sale.installmentsCount && sale.installmentsCount > 0) {
      const saleMonthKey = sale.date?.slice(0, 7);
      const vadeEntry = vadeRates.find(v => v.monthKey === saleMonthKey);
      const monthlyRate = vadeEntry ? vadeEntry.rateMonthly : (sale.vadeRateMonthly || 3.5);
      const vadeDiff = (sale.costPrice * sale.quantity) * (monthlyRate / 100) * (sale.installmentsCount / 12);
      effectiveCost = (sale.costPrice * sale.quantity) + vadeDiff;
    }
    const revenue = sale.totalSaleAmount || (sale.salePrice * sale.quantity);
    const profit = sale.netProfit !== undefined ? sale.netProfit : (revenue - effectiveCost);
    return { revenue, cost: effectiveCost, profit };
  };

  // Monthly aggregated data
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthKey = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
      const name = `${monthNames[i]} ${selectedYear}`;

      // Transactions
      const monthTx = transactions.filter(t => t.date?.startsWith(monthKey));
      const incomeTx = monthTx.filter(t => t.type === 'Gelir').reduce((sum, t) => sum + t.amount, 0);
      const expenseTx = monthTx.filter(t => t.type === 'Gider').reduce((sum, t) => sum + t.amount, 0);
      const purchaseTx = monthTx.filter(t => t.type === 'Mal Alış').reduce((sum, t) => sum + t.amount, 0);

      // Sales
      const monthSales = sales.filter(s => {
        if (!s.date?.startsWith(monthKey)) return false;
        if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
        return true;
      });

      let turnover = 0;
      let totalCost = 0;
      let netProfit = 0;

      monthSales.forEach(s => {
        const { revenue, cost, profit } = getSaleProfit(s);
        turnover += revenue;
        totalCost += cost;
        netProfit += profit;
      });

      const profitMargin = turnover > 0 ? (netProfit / turnover) * 100 : 0;

      return {
        monthKey,
        name,
        monthIndex: i,
        incomeTx,
        expenseTx: expenseTx + purchaseTx,
        turnover,
        totalCost,
        netProfit,
        profitMargin,
        salesCount: monthSales.length,
        sales: monthSales,
        transactions: monthTx,
      };
    });

    return months;
  }, [selectedYear, selectedCategory, transactions, sales, vadeRates]);

  // Year totals
  const yearTotals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => {
        acc.turnover += m.turnover;
        acc.totalCost += m.totalCost;
        acc.netProfit += m.netProfit;
        acc.incomeTx += m.incomeTx;
        acc.expenseTx += m.expenseTx;
        acc.salesCount += m.salesCount;
        return acc;
      },
      { turnover: 0, totalCost: 0, netProfit: 0, incomeTx: 0, expenseTx: 0, salesCount: 0 }
    );
  }, [monthlyData]);

  const yearMargin = yearTotals.turnover > 0 ? (yearTotals.netProfit / yearTotals.turnover) * 100 : 0;

  // Selected Month Details for the Clickable Modal
  const currentModalMonthData = useMemo(() => {
    if (!selectedMonthModal) return null;
    return monthlyData.find(m => m.monthKey === selectedMonthModal) || null;
  }, [selectedMonthModal, monthlyData]);

  // Category breakdown for the year
  const categorySummary = useMemo(() => {
    const cats: Record<string, { turnover: number; profit: number; count: number }> = {};
    sales
      .filter(s => s.date?.startsWith(String(selectedYear)))
      .forEach(s => {
        const cat = s.category || 'Belirtilmemiş';
        if (!cats[cat]) cats[cat] = { turnover: 0, profit: 0, count: 0 };
        const { revenue, profit } = getSaleProfit(s);
        cats[cat].turnover += revenue;
        cats[cat].profit += profit;
        cats[cat].count += s.quantity;
      });

    return Object.entries(cats).sort((a, b) => b[1].turnover - a[1].turnover);
  }, [sales, selectedYear, vadeRates]);

  // Sales Staff Performance
  const staffPerformance = useMemo(() => {
    const staffMap: Record<string, { count: number; turnover: number; profit: number }> = {};
    sales
      .filter(s => s.date?.startsWith(String(selectedYear)))
      .forEach(s => {
        const staff = s.salesPerson || 'Genel Satış';
        if (!staffMap[staff]) staffMap[staff] = { count: 0, turnover: 0, profit: 0 };
        const { revenue, profit } = getSaleProfit(s);
        staffMap[staff].count += 1;
        staffMap[staff].turnover += revenue;
        staffMap[staff].profit += profit;
      });

    return Object.entries(staffMap).sort((a, b) => b[1].profit - a[1].profit);
  }, [sales, selectedYear, vadeRates]);

  // Export full year report to Excel
  const handleExportYearReport = () => {
    const rows = monthlyData.map(m => ({
      'Ay': m.name,
      'Satış Adedi': m.salesCount,
      'Satış Cirosu (₺)': m.turnover,
      'Ürün Maliyeti (₺)': m.totalCost,
      'Net Kâr (₺)': m.netProfit,
      'Kâr Marjı (%)': `%${m.profitMargin.toFixed(1)}`,
      'Kasa Geliri (₺)': m.incomeTx,
      'Kasa Gideri (₺)': m.expenseTx,
    }));

    // Add totals row
    rows.push({
      'Ay': 'YILLIK TOPLAM',
      'Satış Adedi': yearTotals.salesCount,
      'Satış Cirosu (₺)': yearTotals.turnover,
      'Ürün Maliyeti (₺)': yearTotals.totalCost,
      'Net Kâr (₺)': yearTotals.netProfit,
      'Kâr Marjı (%)': `%${yearMargin.toFixed(1)}`,
      'Kasa Geliri (₺)': yearTotals.incomeTx,
      'Kasa Gideri (₺)': yearTotals.expenseTx,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Finansal Rapor ${selectedYear}`);
    XLSX.writeFile(wb, `Arslan_Mobilya_Finansal_Rapor_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Finansal Genel Bakış & Yıllık Raporlar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aylık ciro, maliyet, kârlılık oranları ve tıklanabilir aylık detay analizleri
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr} className="bg-white dark:bg-slate-800">
                  {yr} Yılı
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportYearReport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Raporu İndir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Yıllık Toplam Ciro</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(yearTotals.turnover)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span>Toplam {yearTotals.salesCount} satış işlemi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Ürün Maliyeti</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(yearTotals.totalCost)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Vade farkı dahil maliyet
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Yıllık Net Kâr</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(yearTotals.netProfit)}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Ortalama Kâr Marjı: %{yearMargin.toFixed(1)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kasa & Banka Nakit Akışı</span>
            <Building className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${
            yearTotals.incomeTx - yearTotals.expenseTx >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(yearTotals.incomeTx - yearTotals.expenseTx)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gelir: {formatCurrency(yearTotals.incomeTx)} / Gider: {formatCurrency(yearTotals.expenseTx)}
          </div>
        </div>
      </div>

      {/* Aylık Tablo (Clickable Rows to open detailed reports) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              {selectedYear} Yılı Aylık Finansal Tablo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İlgili ayın detaylı satış ve maliyet dökümünü incelemek için satıra tıklayınız.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Dönem / Ay</th>
                <th className="py-3 px-4 text-center">Satış Adedi</th>
                <th className="py-3 px-4 text-right">Satış Cirosu</th>
                <th className="py-3 px-4 text-right">Ürün Maliyeti</th>
                <th className="py-3 px-4 text-right">Net Kâr</th>
                <th className="py-3 px-4 text-right">Kâr Marjı</th>
                <th className="py-3 px-4 text-right">Kasa Girişi</th>
                <th className="py-3 px-4 text-right">Kasa Çıkışı</th>
                <th className="py-3 px-4 text-center">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {monthlyData.map(m => {
                const isProfitable = m.netProfit >= 0;
                return (
                  <tr
                    key={m.monthKey}
                    onClick={() => setSelectedMonthModal(m.monthKey)}
                    className="hover:bg-sky-50/50 dark:hover:bg-slate-700/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-500 group-hover:scale-125 transition-transform" />
                      {m.name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                      {m.salesCount > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {m.salesCount} adet
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(m.turnover)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrency(m.totalCost)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${
                      m.turnover === 0 ? 'text-slate-400' : isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(m.netProfit)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.turnover > 0 ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          m.profitMargin >= 20
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : m.profitMargin > 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          %{m.profitMargin.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatCurrency(m.incomeTx)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400 font-medium">
                      {formatCurrency(m.expenseTx)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonthModal(m.monthKey);
                        }}
                        className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-100 dark:text-sky-400 dark:hover:bg-slate-700 transition-colors"
                        title="Aylık Detay Raporunu Aç"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-bold border-t border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <tr>
                <td className="py-3.5 px-4">YILLIK TOPLAM</td>
                <td className="py-3.5 px-4 text-center">{yearTotals.salesCount} adet</td>
                <td className="py-3.5 px-4 text-right">{formatCurrency(yearTotals.turnover)}</td>
                <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(yearTotals.totalCost)}</td>
                <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(yearTotals.netProfit)}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    %{yearMargin.toFixed(1)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(yearTotals.incomeTx)}</td>
                <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">{formatCurrency(yearTotals.expenseTx)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Category Performance & Sales Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-amber-500" />
            Kategori Bazında {selectedYear} Yılı Ciro & Kârlılık
          </h3>

          <div className="space-y-3">
            {categorySummary.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Bu yılda henüz kayıtlı satış bulunmamaktadır.</p>
            ) : (
              categorySummary.map(([catName, stats]) => {
                const pct = yearTotals.turnover > 0 ? (stats.turnover / yearTotals.turnover) * 100 : 0;
                const margin = stats.turnover > 0 ? (stats.profit / stats.turnover) * 100 : 0;
                return (
                  <div key={catName} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{catName}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{formatCurrency(stats.turnover)}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden mb-2">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{stats.count} adet ürün</span>
                      <span>Net Kâr: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(stats.profit)}</strong> (%{margin.toFixed(1)})</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sales Staff Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-sky-500" />
            Satış Personeli Performans Tablosu ({selectedYear})
          </h3>

          <div className="space-y-3">
            {staffPerformance.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Bu yılda henüz personel satışı bulunmamaktadır.</p>
            ) : (
              staffPerformance.map(([person, stats]) => {
                const margin = stats.turnover > 0 ? (stats.profit / stats.turnover) * 100 : 0;
                return (
                  <div key={person} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                          {person.slice(0, 2).toUpperCase()}
                        </div>
                        {person}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-9">
                        {stats.count} satış işlemi
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {formatCurrency(stats.turnover)}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Kâr: {formatCurrency(stats.profit)} (%{margin.toFixed(1)})
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY DETAIL MODAL (Tıklanabilir Aylık Detay Raporu) */}
      {selectedMonthModal && currentModalMonthData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-500" />
                  {currentModalMonthData.name} Detaylı Finans & Satış Raporu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bu döneme ait tüm satış işlemleri, maliyetler ve kasa hareketleri
                </p>
              </div>

              <button
                onClick={() => setSelectedMonthModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Satış Cirosu</span>
                <span className="text-base font-bold text-slate-800 dark:text-white">
                  {formatCurrency(currentModalMonthData.turnover)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Ürün Maliyeti</span>
                <span className="text-base font-bold text-slate-800 dark:text-white">
                  {formatCurrency(currentModalMonthData.totalCost)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Net Kâr</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentModalMonthData.netProfit)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Kâr Marjı</span>
                <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                  %{currentModalMonthData.profitMargin.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Modal Body - Sales Items List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-between">
                <span>Dönem Satışları ({currentModalMonthData.sales.length} Kayıt)</span>
              </h4>

              {currentModalMonthData.sales.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Bu ayda kayıtlı satış bulunmamaktadır.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Tarih</th>
                        <th className="py-2.5 px-3">Müşteri</th>
                        <th className="py-2.5 px-3">Ürün</th>
                        <th className="py-2.5 px-3">Satış Şekli</th>
                        <th className="py-2.5 px-3">Personel</th>
                        <th className="py-2.5 px-3 text-right">Satış Tutarı</th>
                        <th className="py-2.5 px-3 text-right">Maliyet</th>
                        <th className="py-2.5 px-3 text-right">Net Kâr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {currentModalMonthData.sales.map(s => {
                        const { revenue, cost, profit } = getSaleProfit(s);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{formatDate(s.date)}</td>
                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-semibold">{s.customerName}</td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              <div>{s.productName}</div>
                              <div className="text-[10px] text-slate-400">{s.category} {s.subCategory ? `• ${s.subCategory}` : ''}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                s.saleType === 'Peşin'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : s.saleType === 'Kredi Kartı'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}>
                                {s.saleType} {s.installmentsCount ? `(${s.installmentsCount} Taksit)` : ''}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{s.salesPerson || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(revenue)}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">{formatCurrency(cost)}</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              {formatCurrency(profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedMonthModal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
