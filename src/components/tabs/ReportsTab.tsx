import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  FileBarChart2,
  TrendingUp,
  Boxes,
  PieChart,
  Calendar,
  Download,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import * as XLSX from 'xlsx';

export const ReportsTab: React.FC = () => {
  const { transactions, sales, stockItems, accounts, caris, showToast } = useFinance();

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  // Kategori bazında stok değeri ve adeti
  const categoryStockSummary = useMemo(() => {
    const map = new Map<string, { qty: number; purchaseVal: number; saleVal: number }>();

    stockItems.forEach(s => {
      const cat = s.category || 'Diğer';
      const cur = map.get(cat) || { qty: 0, purchaseVal: 0, saleVal: 0 };
      const pVal = s.quantity * (s.purchasePrice || 0);
      const sVal = s.quantity * (s.salePrice || 0);

      map.set(cat, {
        qty: cur.qty + s.quantity,
        purchaseVal: cur.purchaseVal + pVal,
        saleVal: cur.saleVal + sVal,
      });
    });

    const list: { category: string; qty: number; purchaseVal: number; saleVal: number; potentialProfit: number }[] = [];
    map.forEach((val, cat) => {
      list.push({
        category: cat,
        qty: val.qty,
        purchaseVal: val.purchaseVal,
        saleVal: val.saleVal,
        potentialProfit: val.saleVal - val.purchaseVal,
      });
    });

    return list.sort((a, b) => b.purchaseVal - a.purchaseVal);
  }, [stockItems]);

  // Yıl bazında aylık satış ve kâr özeti
  const monthlyProfitSummary = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const mStr = String(i + 1).padStart(2, '0');
      const key = `${selectedYear}-${mStr}`;
      const monthSales = sales.filter(s => s.date.startsWith(key));

      const totalRevenue = monthSales.reduce((sum, s) => sum + (s.totalSaleAmount || s.totalAmount || 0), 0);
      const totalCost = monthSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
      const totalProfit = monthSales.reduce((sum, s) => sum + (s.netProfit || 0), 0);
      const count = monthSales.length;

      const names = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

      return {
        monthKey: key,
        monthName: names[i],
        totalRevenue,
        totalCost,
        totalProfit,
        count,
        margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      };
    });

    return months;
  }, [sales, selectedYear]);

  const totalYearProfit = monthlyProfitSummary.reduce((sum, m) => sum + m.totalProfit, 0);
  const totalYearRevenue = monthlyProfitSummary.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalInventoryValuation = stockItems.reduce((sum, s) => sum + s.quantity * (s.purchasePrice || 0), 0);
  const totalInventorySaleValuation = stockItems.reduce((sum, s) => sum + s.quantity * (s.salePrice || 0), 0);

  const handleExportAnnualReport = () => {
    try {
      const rows = monthlyProfitSummary.map(m => ({
        Ay: m.monthName,
        'Satış Adedi': m.count,
        'Toplam Ciro (TL)': m.totalRevenue,
        'Maliyet (TL)': m.totalCost,
        'Net Kâr (TL)': m.totalProfit,
        'Kâr Marjı (%)': m.margin.toFixed(1),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Yillik_Rapor_${selectedYear}`);
      XLSX.writeFile(wb, `Arslan_Mobilya_${selectedYear}_Yillik_Mali_Rapor.xlsx`);
      showToast('Yıllık finansal rapor indirildi', 'success');
    } catch {
      showToast('Rapor indirilemedi', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-emerald-400" />
            <span>Mali Raporlar ve Kategori Dağılım Analizi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yıllık satış kârlılıkları, mevcut stok değerlemesi ve kategori payları
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
          >
            <option value="2026">2026 Yılı</option>
            <option value="2025">2025 Yılı</option>
          </select>
          <button
            onClick={handleExportAnnualReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Yıllık Raporu İndir</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">{selectedYear} Yıllık Net Kâr</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalYearProfit)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Satışlardan elde edilen</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">{selectedYear} Toplam Satış Cirosu</span>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1">
            {formatCurrency(totalYearRevenue)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tüm ödeme tipleri dahil</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">Depo Stok Maliyet Değeri</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(totalInventoryValuation)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Alış fiyatları üzerinden</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs text-slate-400 block">Depo Stok Satış Potansiyeli</span>
          <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
            {formatCurrency(totalInventorySaleValuation)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Etiket fiyatları üzerinden</span>
        </div>
      </div>

      {/* Monthly Profit Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          {selectedYear} Aylık Satış, Maliyet ve Kâr Tablosu
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Dönem</th>
                <th className="py-2.5 px-3 text-center">İşlem Adedi</th>
                <th className="py-2.5 px-4 text-right">Toplam Ciro</th>
                <th className="py-2.5 px-4 text-right">Alış Maliyeti</th>
                <th className="py-2.5 px-4 text-right">Net Kâr</th>
                <th className="py-2.5 px-3 text-right">Kâr Marjı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {monthlyProfitSummary.map(m => (
                <tr key={m.monthKey} className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                    {m.monthName}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{m.count}</td>
                  <td className="py-2.5 px-4 text-right text-slate-200">{formatCurrency(m.totalRevenue)}</td>
                  <td className="py-2.5 px-4 text-right text-slate-400">{formatCurrency(m.totalCost)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                    {formatCurrency(m.totalProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    %{m.margin.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          Kategori Bazında Depo Değerlemesi ve Kâr Potansiyeli
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-center">Depodaki Adet</th>
                <th className="py-2.5 px-4 text-right">Toplam Alış Maliyeti</th>
                <th className="py-2.5 px-4 text-right">Toplam Satış Değeri</th>
                <th className="py-2.5 px-4 text-right">Beklenen Brüt Kâr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {categoryStockSummary.map(c => (
                <tr key={c.category} className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                    {c.category}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-300 font-bold">{c.qty}</td>
                  <td className="py-2.5 px-4 text-right text-amber-400">{formatCurrency(c.purchaseVal)}</td>
                  <td className="py-2.5 px-4 text-right text-sky-400">{formatCurrency(c.saleVal)}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                    +{formatCurrency(c.potentialProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
