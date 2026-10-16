import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  FileBarChart2,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { MonthlyFlowChart } from '../charts/MonthlyFlowChart';
import { CategoryBreakdownChart } from '../charts/CategoryBreakdownChart';

export const ReportsTab: React.FC = () => {
  const { transactions, upcomingDues, sales, stockItems, exportDataToExcel } = useFinance();

  const [activeReport, setActiveReport] = useState<'flow' | 'category' | 'sales'>('flow');

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.totalSaleAmount || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalNetProfit = totalSalesRevenue - totalCost;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-indigo-400" />
            Finansal Raporlar & Grafikli Analizler
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gelir/gider akışı, kategori bazlı harcama dağılımları ve kâr marjı analizleri.
          </p>
        </div>

        <button
          onClick={exportDataToExcel}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 transition-all"
        >
          <Download className="w-4 h-4" /> Tüm Verileri Excel'e Aktar
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400">Toplam Satış Cirosu</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalSalesRevenue)}
          </div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400">Satılan Malların Maliyeti</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalCost)}
          </div>
        </div>
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400">Net Satış Kârı</span>
          <div className="text-xl font-bold text-sky-400 mt-1">
            {formatCurrency(totalNetProfit)}
          </div>
        </div>
      </div>

      {/* Chart Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveReport('flow')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeReport === 'flow'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Aylık Gelir / Gider Akışı
        </button>
        <button
          onClick={() => setActiveReport('category')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeReport === 'category'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Kategori Dağılım Grafiği
        </button>
      </div>

      {/* Charts Display */}
      {activeReport === 'flow' ? (
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Aylık Nakit Akış Trendi (Son 6 Ay)</h3>
          <MonthlyFlowChart transactions={transactions} upcomingDues={upcomingDues} />
        </div>
      ) : (
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Giderlerin Kategori Dağılımı</h3>
          <CategoryBreakdownChart transactions={transactions} type="Gider" />
        </div>
      )}
    </div>
  );
};
