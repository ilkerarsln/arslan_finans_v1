import React, { useState } from 'react';
import { useKarTakip } from '../../../context/KarTakipContext';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  Check,
  Calendar,
  User,
  Link2
} from 'lucide-react';
import { PriceAlert } from '../../../types/karTakip';

interface AlertsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProductMatch?: (item: {
    sourceProductCode: string;
    sourceProductName?: string;
    currentSalePrice?: number;
    periodMonth?: string;
    salesRep?: string;
  }) => void;
}

export const AlertsCenterModal: React.FC<AlertsCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenProductMatch
}) => {
  const { alerts, updateSingleWholesalePrice, dismissAlert, currentUser } = useKarTakip();
  const [activeTab, setActiveTab] = useState<'all' | 'missing' | 'unprofitable' | 'changes'>('all');
  const [quickPrices, setQuickPrices] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'ADMIN';

  const missingAlerts = alerts.filter(a => a.type === 'MISSING_WHOLESALE_PRICE');
  const unprofitableAlerts = alerts.filter(a => a.type === 'NEGATIVE_PROFIT' || a.type === 'LOW_MARGIN');
  const changeAlerts = alerts.filter(a => a.type === 'PRICE_INCREASE' || a.type === 'PRICE_DECREASE');

  const displayedAlerts =
    activeTab === 'missing'
      ? missingAlerts
      : activeTab === 'unprofitable'
      ? unprofitableAlerts
      : activeTab === 'changes'
      ? changeAlerts
      : alerts;

  const handleQuickSavePrice = (targetAlert: PriceAlert) => {
    const val = parseFloat(quickPrices[targetAlert.id]);
    if (!val || isNaN(val) || val <= 0) {
      setInputError('Lütfen geçerli bir toptan maliyet tutarı girin.');
      return;
    }
    setInputError(null);

    setSavingKey(targetAlert.id);
    updateSingleWholesalePrice(
      targetAlert.productCode,
      targetAlert.periodMonth || new Date().toISOString().slice(0, 7),
      val,
      targetAlert.productName
    );

    setTimeout(() => {
      setSavingKey(null);
      dismissAlert(targetAlert.id);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Akıllı Fiyat & Maliyet Uyarı Merkezi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                  {alerts.length} Uyarı
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Eksik toptan fiyatlar, zararına satışlar ve dönemsel maliyet artış/azalış tespitleri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/90 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tümü ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'missing'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Toptan Fiyatı Eksikler ({missingAlerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('unprofitable')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'unprofitable'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
            <span>Zararına / Düşük Marj ({unprofitableAlerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === 'changes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>Fiyat Değişiklikleri ({changeAlerts.length})</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/40">
          {inputError && (
            <div className="p-3 mb-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{inputError}</span>
              <button onClick={() => setInputError(null)} className="text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {displayedAlerts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">Bu kategoride kritik uyarı bulunmuyor.</p>
              <p className="text-xs text-slate-400 mt-1">
                Tüm ürünlerin toptan maliyetleri eşleştirilmiş veya kârlılık oranları sağlıklı düzeydedir.
              </p>
            </div>
          ) : (
            displayedAlerts.map(alert => {
              const isMissing = alert.type === 'MISSING_WHOLESALE_PRICE';
              const isNegative = alert.type === 'NEGATIVE_PROFIT';
              const isLowMargin = alert.type === 'LOW_MARGIN';

              return (
                <div
                  key={alert.id}
                  className={`pt-3.5 first:pt-0 rounded-2xl p-4 border transition-all ${
                    isMissing
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                      : isNegative
                      ? 'bg-red-50/40 dark:bg-red-950/25 border-red-200 dark:border-red-800/60'
                      : isLowMargin
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                      : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            isMissing
                              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                              : isNegative
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30'
                              : isLowMargin
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                          }`}
                        >
                          {isMissing
                            ? 'Toptan Fiyatı Eksik'
                            : isNegative
                            ? 'Zararına Satış'
                            : isLowMargin
                            ? 'Düşük Kâr Marjı'
                            : alert.type === 'PRICE_INCREASE'
                            ? 'Maliyet Artışı'
                            : 'Maliyet Düşüşü'}
                        </span>

                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          SKU: {alert.productCode}
                        </span>

                        {alert.periodMonth && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {alert.periodMonth} Dönemi
                          </span>
                        )}

                        {alert.salesRep && (
                          <span className="text-[11px] text-cyan-700 dark:text-cyan-300 flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/40">
                            <User className="w-3 h-3 text-cyan-500" />
                            Satıcı: {alert.salesRep}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                        {alert.productName}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alert.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                        {alert.currentSalePrice !== undefined && (
                          <div>
                            Birim Satış: <span className="text-slate-900 dark:text-white font-semibold font-mono-num">{alert.currentSalePrice.toLocaleString('tr-TR')} ₺</span>
                          </div>
                        )}
                        {alert.wholesalePrice !== undefined && (
                          <div>
                            Toptan Maliyet: <span className="text-slate-700 dark:text-slate-200 font-semibold font-mono-num">{alert.wholesalePrice.toLocaleString('tr-TR')} ₺</span>
                          </div>
                        )}
                        {alert.profit !== undefined && (
                          <div>
                            Kâr/Zarar:{' '}
                            <span
                              className={`font-semibold font-mono-num ${
                                alert.profit < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {alert.profit.toLocaleString('tr-TR')} ₺
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                      {isMissing && isAdmin && (
                        <div className="flex flex-wrap items-center gap-2">
                          {onOpenProductMatch && (
                            <button
                              onClick={() => {
                                onOpenProductMatch({
                                  sourceProductCode: alert.productCode,
                                  sourceProductName: alert.productName,
                                  currentSalePrice: alert.currentSalePrice,
                                  periodMonth: alert.periodMonth,
                                  salesRep: alert.salesRep
                                });
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Bu satış ürününü ana toptan katalogdaki doğru ürünle kalıcı eşleştirin"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              <span>Ürün Eşleştir</span>
                            </button>
                          )}

                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₺</span>
                              <input
                                type="number"
                                placeholder="Toptan Maliyet"
                                value={quickPrices[alert.id] || ''}
                                onChange={e =>
                                  setQuickPrices({ ...quickPrices, [alert.id]: e.target.value })
                                }
                                className="w-28 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                            <button
                              onClick={() => handleQuickSavePrice(alert)}
                              disabled={savingKey === alert.id}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors shadow-xs disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{savingKey === alert.id ? '...' : 'Fiyat Gir'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Bu uyarıyı gizle"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Eksik fiyat tanımlandığında geçmiş satışların kâr ve marjları anında otomatik hesaplanır.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
