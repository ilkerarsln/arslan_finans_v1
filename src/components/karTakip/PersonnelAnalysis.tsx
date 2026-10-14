import React from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import { calculatePersonnelStats } from '../../utils/karTakipCalculations';
import {
  Trophy,
  TrendingUp,
  Percent,
  Package,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface PersonnelAnalysisProps {
  onSelectRep: (repName: string) => void;
}

export const PersonnelAnalysis: React.FC<PersonnelAnalysisProps> = ({ onSelectRep }) => {
  const { enrichedSales, currentUser } = useKarTakip();

  const isAdmin = currentUser?.role === 'ADMIN';
  const allStats = calculatePersonnelStats(enrichedSales);

  const userRepName = currentUser?.salesRepName || currentUser?.name;
  const filteredStats =
    !isAdmin && userRepName
      ? allStats.filter(s => s.salesRep.toLowerCase() === userRepName.toLowerCase())
      : allStats;

  const maxRevenue = Math.max(...allStats.map(s => s.totalRevenue), 1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/70 border border-slate-700/80 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Trophy className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Satış Personeli Performans & Kârlılık Sıralaması
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Personel bazında toplam satış cirosu, net brüt kâr katkısı, ortalama kâr marjı yüzdesi ve toptan maliyeti eksik kalan işlem sayıları.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-700 px-3 py-2 rounded-xl text-center">
              <div className="text-slate-400 text-[10px]">Toplam Personel</div>
              <div className="text-base font-bold text-white">{allStats.length} Temsilci</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStats.map((stat, idx) => {
          const rank = stat.profitRank || idx + 1;
          const isTop1 = rank === 1;
          const isTop2 = rank === 2;
          const isTop3 = rank === 3;

          return (
            <div
              key={stat.salesRep}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-600 flex flex-col justify-between ${
                isTop1
                  ? 'border-amber-400/80 bg-gradient-to-b from-amber-50/50 dark:from-amber-950/10 to-white dark:to-slate-900'
                  : isTop2
                  ? 'border-slate-300 dark:border-slate-400/30'
                  : isTop3
                  ? 'border-amber-600/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                      {stat.salesRep.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{stat.salesRep}</h4>
                      <p className="text-[11px] text-slate-400">
                        {stat.transactionCount} Satış İşlemi
                      </p>
                    </div>
                  </div>

                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      isTop1
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : isTop2
                        ? 'bg-slate-300 text-slate-950'
                        : isTop3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    #{rank}
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Toplam Ciro:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono-num">
                        {formatCurrency(stat.totalRevenue)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${(stat.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Net Brüt Kâr:
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                      {formatCurrency(stat.totalProfit)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-teal-500" />
                      Ort. Kâr Marjı:
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono-num ${
                        stat.profitMargin >= 25
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : stat.profitMargin >= 15
                          ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      %{stat.profitMargin.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-purple-500" />
                      Satılan Hacim:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium font-mono-num">
                      {stat.totalUnitsSold} adet
                    </span>
                  </div>

                  {stat.missingPriceCount > 0 && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{stat.missingPriceCount} üründe toptan maliyet eksik</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => onSelectRep(stat.salesRep)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all group"
                >
                  <span>Satışlarını Listele</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
