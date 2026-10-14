import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  Calendar,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';

interface MonthlyTrackingViewProps {
  onOpenPeriodUpload: () => void;
}

export const MonthlyTrackingView: React.FC<MonthlyTrackingViewProps> = ({ onOpenPeriodUpload }) => {
  const {
    monthlyFinancials,
    monthlyStatuses,
    togglePeriodLock,
    costingMethod,
    setCostingMethod,
    currentUser,
    setFilters
  } = useKarTakip();

  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    monthlyFinancials[0]?.periodMonth || '2024-05'
  );
  const [closingNotes, setClosingNotes] = useState('');
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const currentSummary =
    monthlyFinancials.find(m => m.periodMonth === selectedPeriod) ||
    monthlyFinancials[0] || {
      periodMonth: selectedPeriod,
      revenue: 0,
      cost: 0,
      profit: 0,
      margin: 0,
      unitsSold: 0,
      transactionCount: 0,
      purchasesTotalAmount: 0,
      purchasesQuantity: 0,
      isClosed: false
    };

  const currentStatus = monthlyStatuses.find(s => s.periodMonth === selectedPeriod);
  const isPeriodClosed = currentStatus ? currentStatus.isClosed : false;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleToggleLock = () => {
    togglePeriodLock(selectedPeriod, closingNotes || undefined);
    setShowLockConfirm(false);
    setClosingNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/80 border border-slate-700/80 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Aylık Takip & Dönemsel Finansal Kapanış
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Tüm satış, toptan maliyet, tedarikçi mal alımları ve kârlılık oranlarını aylık dönemler halinde analiz edin; tamamlanan ayları kilitleyerek arşivleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
            {monthlyFinancials.map(m => {
              const closed = m.isClosed;
              return (
                <button
                  key={m.periodMonth}
                  onClick={() => setSelectedPeriod(m.periodMonth)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedPeriod === m.periodMonth
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {closed ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>{m.periodMonth} Dönemi</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isPeriodClosed
                    ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
                    : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
                }`}
              >
                {isPeriodClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedPeriod} Dönemi Kapanış Durumu
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isPeriodClosed
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                    }`}
                  >
                    {isPeriodClosed ? 'Kilitli & Arşivlenmiş' : 'Açık / İşlem Yapılabilir'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPeriodClosed
                    ? `${currentStatus?.closedAt || 'Geçmiş'} tarihinde ${currentStatus?.closedBy || 'Yönetici'} tarafından kapatıldı.`
                    : 'Bu dönem henüz kapatılmadı. Satış ve maliyet güncellemeleri serbesttir.'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowLockConfirm(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                  isPeriodClosed
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {isPeriodClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isPeriodClosed ? 'Kilidi Aç' : 'Dönemi Kilitle / Kapat'}</span>
              </button>
            )}
          </div>

          {currentStatus?.notes && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-500">Kapanış Notu: </span>
              {currentStatus.notes}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Bu döneme ait {currentSummary.transactionCount} adet satış hareketi mevcut.
            </span>
            <button
              onClick={() => setFilters({ selectedPeriod })}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Satış Listesinde İncele</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Maliyet & Kâr Hesaplama Motoru
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Kârlılığın toptan liste fiyatına mı yoksa tedarikçiden fiilen alınan partilerin ağırlıklı ortalama maliyetine göre mi hesaplanacağını seçin.
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setCostingMethod('CATALOG_PRICE')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  costingMethod === 'CATALOG_PRICE'
                    ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-500/50 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="costingMethod"
                  checked={costingMethod === 'CATALOG_PRICE'}
                  onChange={() => setCostingMethod('CATALOG_PRICE')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold">Aylık Toptan Liste Fiyatı</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    O aya ait toptan katalog fiyatını maliyet kabul eder
                  </div>
                </div>
              </label>

              <label
                onClick={() => setCostingMethod('PURCHASE_AVG')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  costingMethod === 'PURCHASE_AVG'
                    ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-500/50 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="costingMethod"
                  checked={costingMethod === 'PURCHASE_AVG'}
                  onChange={() => setCostingMethod('PURCHASE_AVG')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <div className="text-xs font-bold">Fiili Mal Alım Ortalaması (WAC)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tedarikçiden alınan partilerin birim alış ağırlıklı ortalaması
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Dönem Satış Cirosu</span>
            {currentSummary.revenueGrowthMoM !== undefined && (
              <span
                className={`flex items-center gap-0.5 text-[11px] font-bold ${
                  currentSummary.revenueGrowthMoM >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {currentSummary.revenueGrowthMoM >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {currentSummary.revenueGrowthMoM >= 0 ? '+' : ''}%{currentSummary.revenueGrowthMoM} MoM
              </span>
            )}
          </div>
          <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatCurrency(currentSummary.revenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {currentSummary.unitsSold} adet ürün satıldı
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Satılan Malın Maliyeti (SMM)</span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              {costingMethod === 'CATALOG_PRICE' ? 'Liste Fiyatı' : 'Alım Ortalaması'}
            </span>
          </div>
          <div className="text-xl font-bold font-mono-num text-slate-800 dark:text-slate-200 mt-2">
            {formatCurrency(currentSummary.cost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Eşleşen parti maliyetleri
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Net Brüt Kâr</span>
            {currentSummary.profitGrowthMoM !== undefined && (
              <span
                className={`flex items-center gap-0.5 text-[11px] font-bold ${
                  currentSummary.profitGrowthMoM >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {currentSummary.profitGrowthMoM >= 0 ? '+' : ''}%{currentSummary.profitGrowthMoM} MoM
              </span>
            )}
          </div>
          <div
            className={`text-xl font-bold font-mono-num mt-2 ${
              currentSummary.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(currentSummary.profit)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400/90 mt-1 font-medium">
            Kâr Marjı: %{currentSummary.margin.toFixed(1)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Dönem İçi Mal Alımı</span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Satın Alma</span>
          </div>
          <div className="text-xl font-bold font-mono-num text-purple-600 dark:text-purple-300 mt-2">
            {formatCurrency(currentSummary.purchasesTotalAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tedarikçilerden {currentSummary.purchasesQuantity} adet alım
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Tüm Dönemlerin Finansal Karşılaştırma Matrisi</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aylar arası ciro, kâr, marj ve tedarikçi mal alım hareketleri
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Dönem</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">Satış Cirosu (₺)</th>
                <th className="py-3 px-4 text-right">MoM Ciro</th>
                <th className="py-3 px-4 text-right">Toplam Maliyet (₺)</th>
                <th className="py-3 px-4 text-right">Net Brüt Kâr (₺)</th>
                <th className="py-3 px-4 text-right">Kâr Marjı (%)</th>
                <th className="py-3 px-4 text-right">Mal Alımı (₺)</th>
                <th className="py-3 px-4 text-center">İşlem Adedi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {monthlyFinancials.map(m => {
                const isSelected = m.periodMonth === selectedPeriod;
                return (
                  <tr
                    key={m.periodMonth}
                    onClick={() => setSelectedPeriod(m.periodMonth)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 dark:bg-indigo-950/30 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-mono">{m.periodMonth}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                          <Lock className="w-3 h-3 text-amber-500" /> Kilitli
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                          <Unlock className="w-3 h-3 text-emerald-500" /> Açık
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white font-mono-num">
                      {formatCurrency(m.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold font-mono-num">
                      {m.revenueGrowthMoM !== undefined ? (
                        <span className={m.revenueGrowthMoM >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {m.revenueGrowthMoM >= 0 ? '+' : ''}%{m.revenueGrowthMoM}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 font-mono-num">
                      {formatCurrency(m.cost)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                      {formatCurrency(m.profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-teal-600 dark:text-teal-400 font-mono-num">
                      %{m.margin.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-300 font-medium font-mono-num">
                      {formatCurrency(m.purchasesTotalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {m.transactionCount} Satış ({m.unitsSold} ad.)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showLockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center">
                {isPeriodClosed ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isPeriodClosed ? 'Dönem Kilidini Aç?' : `${selectedPeriod} Dönemini Kilitle?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPeriodClosed
                    ? 'Dönem kilidi açıldığında yeniden satış ekleme ve maliyet düzenlemeleri yapılabilir.'
                    : 'Dönem kilitlendiğinde o aya ait satış ve toptan liste kayıtları kalıcı olarak dondurulur.'}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kapanış / Değişiklik Notu
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={e => setClosingNotes(e.target.value)}
                  placeholder="Örn: Muhasebe mutabakatı tamamlandı, dönem kilitlendi."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLockConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Vazgeç
              </button>
              <button
                onClick={handleToggleLock}
                className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold ${
                  isPeriodClosed ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {isPeriodClosed ? 'Kilidi Kaldır' : 'Onayla & Kilitle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
