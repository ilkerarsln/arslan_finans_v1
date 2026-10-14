import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters';
import { BarChart3, PieChart, TrendingUp, Building2, Layers, Download } from 'lucide-react';

export const RaporlarView: React.FC = () => {
  const { products, suppliers, sales, expenses, purchaseOrders } = useApp();

  const totalStockVal = products.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);
  const totalSalesVal = sales.reduce((sum, s) => sum + s.totalSalePrice, 0);
  const totalCostVal = sales.reduce((sum, s) => sum + s.totalCost, 0);
  const totalProfit = totalSalesVal - totalCostVal;

  // Category Breakdown
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoryStats = categories.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const stockVal = prods.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);
    const catSales = sales.filter((s) => s.category === cat);
    const catRevenue = catSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
    const catProfit = catSales.reduce((sum, s) => sum + s.grossProfit, 0);

    return {
      category: cat,
      productCount: prods.length,
      stockValue: stockVal,
      stockSharePercent: totalStockVal > 0 ? (stockVal / totalStockVal) * 100 : 0,
      revenue: catRevenue,
      profit: catProfit,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Yönetici Karar Destek Raporları</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Raporlar & Analizler</h2>
          <p className="text-xs text-slate-400">
            Kategori bazlı envanter payları, tedarikçi ciro dağılımları ve kâr marjı analizleri.
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Mobilya Kategorilerine Göre Stok & Kâr Dağılımı</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Çeşit</th>
                <th className="py-3 px-4 text-right">Mevcut Stok Değeri</th>
                <th className="py-3 px-4 text-center">Stok Payı (%)</th>
                <th className="py-3 px-4 text-right">Satış Cirosu</th>
                <th className="py-3 px-4 text-right">Elde Edilen Brüt Kâr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {categoryStats.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-white">{item.category}</td>
                  <td className="py-3 px-4 text-center text-slate-300">{item.productCount} Ürün</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-200">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, item.stockSharePercent)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">
                        {formatPercent(item.stockSharePercent)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(item.revenue)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {formatCurrency(item.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Performance Cards */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Ortak Tedarikçi Ciro & Borç Analizi</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{sup.name}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {sup.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{sup.category} | {sup.city}</p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Toplam Alım</span>
                  <span className="font-medium text-slate-200">{formatCurrency(sup.totalPurchased)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Güncel Borç</span>
                  <span className="font-bold text-rose-400">{formatCurrency(sup.currentBalance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
