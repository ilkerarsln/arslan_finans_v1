import React, { useState } from 'react';
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
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { MonthlyFlowChart } from '../charts/MonthlyFlowChart';
import { CategoryBreakdownChart } from '../charts/CategoryBreakdownChart';
import { CiroMatrixModule } from '../reports/CiroMatrixModule';

export const ReportsTab: React.FC = () => {
  const { transactions, upcomingDues, sales, stockItems, exportDataToExcel } = useFinance();

  const [activeReport, setActiveReport] = useState<'ciroMatrix' | 'flow' | 'category'>('ciroMatrix');

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.totalSaleAmount || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalNetProfit = totalSalesRevenue - totalCost;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-indigo-400" />
            Finansal Raporlar & Analizler
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Excel uyumlu ciro matrisi, nakit akış projeksiyonları ve kategori bazlı finansal analizler.
          </p>
        </div>

        <button
          onClick={exportDataToExcel}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Tüm ERP Verilerini Excel'e Aktar
        </button>
      </div>

      {/* Main Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveReport('ciroMatrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeReport === 'ciroMatrix'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400/30'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Ciro & Finansal Analiz Matrisi (Excel Uyumlu)
        </button>

        <button
          onClick={() => setActiveReport('flow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeReport === 'flow'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-sky-400" />
          Aylık Nakit Akış Trendi
        </button>

        <button
          onClick={() => setActiveReport('category')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeReport === 'category'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4 text-amber-400" />
          Kategori Dağılım Grafiği
        </button>
      </div>

      {/* Active Tab View */}
      {activeReport === 'ciroMatrix' && <CiroMatrixModule />}

      {activeReport === 'flow' && (
        <div className="space-y-6">
          {/* Flow KPIs */}
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

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Aylık Nakit Akış Trendi (Son 6 Ay)</h3>
            <MonthlyFlowChart transactions={transactions} upcomingDues={upcomingDues} />
          </div>
        </div>
      )}

      {activeReport === 'category' && (
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Giderlerin Kategori Dağılımı</h3>
          <CategoryBreakdownChart transactions={transactions} type="Gider" />
        </div>
      )}
    </div>
  );
};
