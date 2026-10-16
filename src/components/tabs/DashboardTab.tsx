import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
} from '../../utils/formatters';
import { MonthlyFlowChart } from '../charts/MonthlyFlowChart';
import { CategoryBreakdownChart } from '../charts/CategoryBreakdownChart';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
} from 'lucide-react';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const DashboardTab: React.FC = () => {
  const {
    transactions,
    accounts,
    caris,
    upcomingDues,
    setActiveTab,
    toggleUpcomingDue,
  } = useFinance();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthKey);
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) set.add(t.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [transactions, currentMonthKey]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);

  const selectedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonthKey.split('-');
    const mIdx = parseInt(m, 10) - 1;
    return `${MONTH_NAMES_TR[mIdx] || m} ${y}`;
  }, [selectedMonthKey]);

  const currentMonthTxs = useMemo(() => {
    return transactions.filter(
      tx => tx.date.startsWith(selectedMonthKey) && tx.status !== 'İptal'
    );
  }, [transactions, selectedMonthKey]);

  const totalIncomeThisMonth = useMemo(() => {
    return currentMonthTxs
      .filter(tx => tx.type === 'Gelir')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [currentMonthTxs]);

  const totalExpenseThisMonth = useMemo(() => {
    return currentMonthTxs
      .filter(tx => tx.type === 'Gider' || tx.type === 'Mal Alımı')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [currentMonthTxs]);

  const netCashFlowThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;

  const totalLiquidAssets = accounts
    .filter(a => a.type !== 'Şirket Kredi Kartı')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalReceivables = caris
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPayables = caris
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const todayIncome = transactions
    .filter(t => t.date === todayStr && t.type === 'Gelir' && t.status !== 'İptal')
    .reduce((s, t) => s + t.amount, 0);

  const todayExpense = transactions
    .filter(t => t.date === todayStr && (t.type === 'Gider' || t.type === 'Mal Alımı') && t.status !== 'İptal')
    .reduce((s, t) => s + t.amount, 0);

  const recentTransactions = transactions.slice(0, 6);
  const activeDues = upcomingDues
    .filter(d => !d.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400">
            <span>Finansal Durum Raporu · {selectedMonthLabel}</span>
            {availableMonths.length > 1 && (
              <div className="flex items-center gap-1.5 ml-1 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2 py-0.5">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <select
                  value={selectedMonthKey}
                  onChange={e => setSelectedMonthKey(e.target.value)}
                  className="bg-transparent text-emerald-300 text-[11px] font-semibold outline-none cursor-pointer"
                >
                  {availableMonths.map(ym => {
                    const [y, m] = ym.split('-');
                    const mIdx = parseInt(m, 10) - 1;
                    return (
                      <option key={ym} value={ym} className="bg-slate-900 text-white">
                        {MONTH_NAMES_TR[mIdx] || m} {y} {ym === currentMonthKey ? '(Güncel Ay)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1.5">
            Nakit Akışı ve Mali Kontrol Paneli
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Tüm şirket banka hesapları, nakit kasalar, cari borç/alacaklar ve planlanan ödemelerin anlık özeti.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Toplam Likit Nakit & Banka
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalLiquidAssets)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Bugün Net Giriş:</span>
            <span
              className={`font-mono font-semibold ${
                todayIncome - todayExpense >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {todayIncome - todayExpense > 0 ? '+' : ''}{formatCurrency(todayIncome - todayExpense)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {selectedMonthLabel} Toplam Gelir
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatCurrency(totalIncomeThisMonth)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>İşlem Adedi:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {currentMonthTxs.filter(t => t.type === 'Gelir').length} tahsilat
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {selectedMonthLabel} Toplam Gider
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            -{formatCurrency(totalExpenseThisMonth)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>İşlem Adedi:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {currentMonthTxs.filter(t => t.type === 'Gider' || t.type === 'Mal Alımı').length} ödeme
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                netCashFlowThisMonth >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Net Nakit Akışı ({selectedMonthLabel})
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                netCashFlowThisMonth >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              {netCashFlowThisMonth >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <h3
            className={`text-2xl font-bold font-mono mt-2 ${
              netCashFlowThisMonth >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netCashFlowThisMonth > 0 ? '+' : ''}{formatCurrency(netCashFlowThisMonth)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Aylık Net Durum:</span>
            <span
              className={`font-semibold ${
                netCashFlowThisMonth >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netCashFlowThisMonth >= 0 ? '+ Pozitif Durum (Artı)' : '- Negatif Durum (Açık)'}
            </span>
          </div>
        </div>
      </div>

      {/* Receivables vs Payables overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Müşterilerden Toplam Alacak
              </p>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalReceivables)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('currents')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline"
          >
            Carileri İncele
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tedarikçilere Toplam Borç
              </p>
              <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(totalPayables)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('currents')}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline"
          >
            Borçları İncele
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <MonthlyFlowChart transactions={transactions} upcomingDues={upcomingDues} />
        </div>
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <CategoryBreakdownChart transactions={currentMonthTxs} type="Gider" />
        </div>
      </div>

      {/* Bottom 2-Column: Recent Transactions & Upcoming Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Son Finansal Hareketler
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                En son eklenen nakit, banka ve virman kayıtları
              </p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Tümü ({transactions.length})
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Tarih</th>
                  <th className="py-2.5 px-4 font-semibold">Tür</th>
                  <th className="py-2.5 px-4 font-semibold">Firma / Cari</th>
                  <th className="py-2.5 px-4 font-semibold">Kategori</th>
                  <th className="py-2.5 px-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          tx.type === 'Gelir'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'Gider'
                            ? 'text-rose-600 dark:text-rose-400'
                            : tx.type === 'Mal Alımı'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {tx.type === 'Gelir' && <ArrowDownRight className="w-3 h-3" />}
                        {tx.type === 'Gider' && <ArrowUpRight className="w-3 h-3" />}
                        {tx.type === 'Mal Alımı' && <ShoppingBag className="w-3 h-3" />}
                        {tx.type === 'Transfer' && <ArrowRightLeft className="w-3 h-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                      {tx.cariName || tx.desc || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {tx.category}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        tx.type === 'Gelir'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : tx.type === 'Mal Alımı'
                          ? 'text-amber-600 dark:text-amber-400'
                          : tx.type === 'Gider'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {tx.type === 'Gelir' ? '+' : tx.type === 'Gider' ? '-' : tx.type === 'Mal Alımı' ? '-' : ''}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Yaklaşan Vade & Ödeme Takvimi
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Takvim ({upcomingDues.length})
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              {activeDues.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Bekleyen planlı ödeme veya tahsilat bulunmuyor.
                </div>
              ) : (
                activeDues.map(due => {
                  const remaining = getDaysRemaining(due.dueDate);
                  return (
                    <div
                      key={due.id}
                      className="py-3 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg px-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              due.type === 'Gelir' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {due.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 ml-4">
                          <span>{formatDate(due.dueDate)}</span>
                          <span>·</span>
                          <span
                            className={`font-medium ${
                              remaining.status === 'overdue'
                                ? 'text-rose-500 font-bold'
                                : remaining.status === 'today'
                                ? 'text-amber-500 font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            {remaining.text}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-mono font-bold ${
                            due.type === 'Gelir'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {due.type === 'Gelir' ? '+' : '-'}
                          {formatCurrency(due.amount)}
                        </span>
                        <button
                          onClick={() => toggleUpcomingDue(due.id)}
                          title="Ödendi / Alındı olarak işaretle"
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
