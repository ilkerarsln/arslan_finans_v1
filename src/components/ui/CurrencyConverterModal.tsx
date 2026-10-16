import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLiveCurrency } from '../../services/currencyService';
import { X, RefreshCw, Calculator, DollarSign, ArrowRightLeft, Check, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const CurrencyConverterModal: React.FC = () => {
  const { isCurrencyConverterOpen, closeCurrencyConverter } = useFinance();
  const { usd, eur, lastUpdated, isLive, isLoading, refreshRates } = useLiveCurrency();

  const [inputCurrency, setInputCurrency] = useState<'USD' | 'EUR' | 'TRY'>('USD');
  const [amount, setAmount] = useState<string>('1000');
  const [markupPercent, setMarkupPercent] = useState<number>(0); // e.g. %20 KDV veya kâr marjı

  if (!isCurrencyConverterOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const markedUpAmount = numAmount * (1 + markupPercent / 100);

  // Conversion calculations
  let valInTRY = 0;
  let valInUSD = 0;
  let valInEUR = 0;

  if (inputCurrency === 'USD') {
    valInUSD = markedUpAmount;
    valInTRY = markedUpAmount * usd;
    valInEUR = eur > 0 ? valInTRY / eur : 0;
  } else if (inputCurrency === 'EUR') {
    valInEUR = markedUpAmount;
    valInTRY = markedUpAmount * eur;
    valInUSD = usd > 0 ? valInTRY / usd : 0;
  } else {
    // TRY
    valInTRY = markedUpAmount;
    valInUSD = usd > 0 ? markedUpAmount / usd : 0;
    valInEUR = eur > 0 ? markedUpAmount / eur : 0;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeCurrencyConverter}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Canlı Döviz & Maliyet Hesaplayıcı
              </h3>
              <p className="text-[11px] text-slate-400">
                Piyasa kurları ile anlık TL / USD / EUR çevrimi
              </p>
            </div>
          </div>
          <button
            onClick={closeCurrencyConverter}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Rates Badge */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-3 font-mono font-medium">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-bold">1 USD =</span>
              <span className="font-bold text-slate-900 dark:text-white">₺{usd.toFixed(2)}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-bold">1 EUR =</span>
              <span className="font-bold text-slate-900 dark:text-white">₺{eur.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => refreshRates(true)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            title="Kurları yenile"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{lastUpdated || 'Anlık'}</span>
          </button>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Çevrilecek Para Birimi & Tutar
            </label>
            <div className="flex items-center gap-2">
              <select
                value={inputCurrency}
                onChange={e => setInputCurrency(e.target.value as any)}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Tutar girin..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono-num font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Markups / VAT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ek Maliyet / Kâr / KDV Oranı:
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                %{markupPercent}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[0, 10, 18, 20, 25, 30, 35].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMarkupPercent(pct)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition ${
                    markupPercent === pct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  %{pct}
                </button>
              ))}
            </div>
          </div>

          {/* Results Display */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Hesaplanan Karşılıklar
            </span>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Türk Lirası (₺):</span>
              <span className="text-lg font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                ₺{valInTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Amerikan Doları ($):</span>
              <span className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                ${valInUSD.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Euro (€):</span>
              <span className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                €{valInEUR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={closeCurrencyConverter}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
