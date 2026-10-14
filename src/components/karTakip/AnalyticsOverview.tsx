import React from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  PieChart,
  BarChart3,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

interface AnalyticsOverviewProps {
  onOpenAlerts: () => void;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ onOpenAlerts }) => {
  const { filteredSales, alerts } = useKarTakip();

  const missingAlerts = alerts.filter(a => a.type === 'MISSING_WHOLESALE_PRICE');
  const negativeAlerts = alerts.filter(a => a.type === 'NEGATIVE_PROFIT');

  const categoryMap: Record<string, { revenue: number; profit: number; count: number }> = {};
  filteredSales.forEach(s => {
    const cat = s.category || 'Diğer';
    if (!categoryMap[cat]) categoryMap[cat] = { revenue: 0, profit: 0, count: 0 };
    categoryMap[cat].revenue += s.totalSalePrice;
    categoryMap[cat].count += s.quantity;
    if (s.profit !== null && s.profit !== undefined) {
      categoryMap[cat].profit += s.profit;
    }
  });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1].revenue - a[1].revenue);
  const totalCategoryRev = categories.reduce((sum, item) => sum + item[1].revenue, 0) || 1;

  const monthlyMap: Record<string, { revenue: number; cost: number; profit: number }> = {};
  filteredSales.forEach(s => {
    const period = s.date ? s.date.slice(0, 7) : 'Dönemsiz';
    if (!monthlyMap[period]) monthlyMap[period] = { revenue: 0, cost: 0, profit: 0 };
    monthlyMap[period].revenue += s.totalSalePrice;
    if (s.matchedWholesalePrice && s.profit !== null && s.profit !== undefined) {
      monthlyMap[period].cost += s.matchedWholesalePrice * s.quantity;
      monthlyMap[period].profit += s.profit;
    }
  });

  const months = Object.entries(monthlyMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthRev = Math.max(...months.map(m => m[1].revenue), 1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-4 mb-6">
      {(missingAlerts.length > 0 || negativeAlerts.length > 0) && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/40 border border-rose-300 dark:border-rose-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Dikkat: Çözülmemiş Maliyet & Fiyat Uyarısı
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  {missingAlerts.length + negativeAlerts.length} Adet
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-200/90 mt-0.5 leading-relaxed">
                {missingAlerts.length > 0 && `${missingAlerts.length} üründe geçerli ay toptan maliyet listesi eklenmemiştir. `}
                {negativeAlerts.length > 0 && `${negativeAlerts.length} satış zararına (maliyetin altında) yapılmıştır!`}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAlerts}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>Hemen İncele & Fiyat Gir</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Dönemsel Satış ve Net Kâr Karşılaştırması
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" /> Ciro
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Net Kâr
              </span>
            </div>
          </div>

          {months.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Görüntülenecek dönemsel veri bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {months.map(([period, data]) => {
                const revPct = (data.revenue / maxMonthRev) * 100;
                const profitPct = data.revenue > 0 ? (data.profit / maxMonthRev) * 100 : 0;
                const margin = data.revenue > 0 ? ((data.profit / data.revenue) * 100).toFixed(1) : '0';

                return (
                  <div key={period} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{period} Dönemi</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-slate-500">
                          Ciro: <strong className="text-slate-900 dark:text-white font-mono-num">{formatCurrency(data.revenue)}</strong>
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono-num">
                          Kâr: {formatCurrency(data.profit)} (%{margin})
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-md h-3 flex overflow-hidden gap-1 p-0.5">
                      <div
                        className="bg-blue-500 h-full rounded-xs transition-all duration-500"
                        style={{ width: `${Math.max(revPct - profitPct, 2)}%` }}
                        title={`Maliyet: ${formatCurrency(data.cost)}`}
                      />
                      <div
                        className="bg-emerald-500 h-full rounded-xs transition-all duration-500"
                        style={{ width: `${Math.max(profitPct, 2)}%` }}
                        title={`Net Kâr: ${formatCurrency(data.profit)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-teal-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Kategori Kârlılık Dağılımı
              </h3>
            </div>

            <div className="space-y-3">
              {categories.slice(0, 5).map(([cat, info]) => {
                const share = ((info.revenue / totalCategoryRev) * 100).toFixed(0);
                const margin = info.revenue > 0 ? ((info.profit / info.revenue) * 100).toFixed(1) : '0';

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">{cat}</span>
                      <div className="text-right">
                        <span className="text-slate-900 dark:text-white font-bold font-mono-num">{formatCurrency(info.revenue)}</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 ml-1.5 font-semibold font-mono-num">%{margin} Kâr</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-teal-500 h-1.5 rounded-full"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Toplam {categories.length} Kategori</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Reaktif Otomatik Analiz</span>
          </div>
        </div>
      </div>
    </div>
  );
};
