import React from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertOctagon,
  Percent,
  ReceiptText
} from 'lucide-react';

interface KPICardsProps {
  onOpenAlerts: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ onOpenAlerts }) => {
  const { kpis, filteredSales, currentUser, filters } = useKarTakip();

  const isRep = currentUser?.role === 'SALES_REP';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
      {/* 1. Toplam Ciro */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {isRep ? 'Kişisel Ciro' : 'Toplam Satış Cirosu'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(kpis.totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ReceiptText className="w-3 h-3 text-slate-400 inline" />
            <span>{filteredSales.length} adet işlem</span>
          </div>
        </div>
      </div>

      {/* 2. Toplam Maliyet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Toplam Maliyet (SMM)
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono-num text-slate-800 dark:text-slate-200 tracking-tight">
            {formatCurrency(kpis.totalCost)}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
            {filters.costingMethod === 'PURCHASE_AVG' ? 'Fiili Alım (WAC)' : 'Aylık Toptan Liste'}
          </div>
        </div>
      </div>

      {/* 3. Net Brüt Kâr */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Net Brüt Kâr
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className={`text-xl font-bold font-mono-num tracking-tight ${
            kpis.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(kpis.totalProfit)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400/90 mt-1 font-medium">
            {kpis.totalProfit >= 0 ? 'Pozitif Bilanço' : 'Zarar Riski'}
          </div>
        </div>
      </div>

      {/* 4. Ortalama Kâr Marjı */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ortalama Kâr Marjı
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono-num text-teal-600 dark:text-teal-400 tracking-tight">
            %{kpis.averageMargin.toFixed(1)}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(kpis.averageMargin, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Kritik Uyarılar */}
      <div
        onClick={onOpenAlerts}
        className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-all relative overflow-hidden group ${
          kpis.missingPriceCount > 0 || kpis.negativeProfitCount > 0
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 hover:bg-rose-100/60'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
            Kritik Fiyat Uyarıları
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
            kpis.missingPriceCount > 0 ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono-num text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-1.5">
            <span>{kpis.missingPriceCount + kpis.negativeProfitCount}</span>
            <span className="text-xs font-normal text-rose-500 dark:text-rose-300/80">Kayıt</span>
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 flex items-center gap-1 underline underline-offset-2">
            {kpis.missingPriceCount > 0 ? `${kpis.missingPriceCount} üründe toptan fiyat eksik` : 'Tüm fiyatlar tanımlı'}
          </div>
        </div>
      </div>

      {/* 6. Satılan Toplam Adet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Toplam Satılan Adet
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-white tracking-tight">
            {kpis.totalUnitsSold.toLocaleString('tr-TR')} <span className="text-xs font-normal text-slate-400">parça</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Ürün hacim performansı
          </div>
        </div>
      </div>
    </div>
  );
};
