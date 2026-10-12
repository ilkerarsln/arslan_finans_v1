import React from 'react';
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
  AlertCircle,
  Plus,
  TrendingUp,
  CreditCard,
  Users,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export const DashboardTab: React.FC<{
  onOpenTransfer: () => void;
  onOpenAddAccount: () => void;
  onOpenAddCari: () => void;
}> = ({ onOpenTransfer, onOpenAddAccount, onOpenAddCari }) => {
  const {
    transactions,
    accounts,
    caris,
    upcomingDues,
    openTransactionModal,
    openInstallmentModal,
    setActiveTab,
    toggleUpcomingDue,
  } = useFinance();

  // Current month calculation
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthTxs = transactions.filter(
    tx => tx.date.startsWith(currentMonthKey) && tx.status !== 'İptal'
  );

  const totalIncomeThisMonth = currentMonthTxs
    .filter(tx => tx.type === 'Gelir')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenseThisMonth = currentMonthTxs
    .filter(tx => tx.type === 'Gider')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netCashFlowThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;

  // Liquid cash (bank + cash boxes, ignoring credit card debt)
  const totalLiquidAssets = accounts
    .filter(a => a.type !== 'Şirket Kredi Kartı')
    .reduce((sum, a) => sum + a.balance, 0);

  // Total net worth (including credit card debts)
  const totalNetBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Caris total receivables (Alacaklar) & payables (Borçlar)
  const totalReceivables = caris
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPayables = caris
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  // Pending dues (sorted by due date)
  const activeDues = upcomingDues
    .filter(d => !d.isCompleted)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Finansal Durum Raporu · Ekim 2026
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-1">
            Nakit Akışı ve Mali Kontrol Paneli
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Tüm şirket banka hesapları, nakit kasalar, cari borç/alacaklar ve planlanan ödemelerin anlık özeti.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => openTransactionModal({ type: 'Gelir' })}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <ArrowDownRight className="w-3.5 h-3.5" /> Gelir Ekle
          </button>
          <button
            onClick={() => openTransactionModal({ type: 'Gider' })}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Gider Ekle
          </button>
          <button
            onClick={() => openInstallmentModal()}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" /> Taksit Planla
          </button>
          <button
            onClick={onOpenTransfer}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-600 shadow-sm active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" /> Virman Yap
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Likit Varlık / Nakit & Banka */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Toplam Likit Nakit & Banka
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalLiquidAssets)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Net Varlık (Kart borcu dahil):</span>
            <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(totalNetBalance)}
            </span>
          </div>
        </div>

        {/* Card 2: Bu Ayın Toplam Geliri */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Bu Ayın Toplam Geliri
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalIncomeThisMonth)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>İşlem Adedi:</span>
            <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
              {currentMonthTxs.filter(t => t.type === 'Gelir').length} tahsilat
            </span>
          </div>
        </div>

        {/* Card 3: Bu Ayın Toplam Gideri */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Bu Ayın Toplam Gideri
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(totalExpenseThisMonth)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>İşlem Adedi:</span>
            <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
              {currentMonthTxs.filter(t => t.type === 'Gider').length} ödeme
            </span>
          </div>
        </div>

        {/* Card 4: Net Nakit Akışı */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                netCashFlowThisMonth >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              Net Nakit Akışı (Bu Ay)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                netCashFlowThisMonth >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={`text-2xl font-bold font-mono-num mt-2 ${
              netCashFlowThisMonth >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatCurrency(netCashFlowThisMonth)}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Nakit Pozisyonu:</span>
            <span
              className={`font-semibold ${
                netCashFlowThisMonth >= 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {netCashFlowThisMonth >= 0 ? 'Pozitif Artı Bakiye' : 'Negatif Açık'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Overview: Receivables vs Payables */}
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
              <p className="text-lg font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
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
              <p className="text-lg font-bold font-mono-num text-rose-600 dark:text-rose-400">
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
          <MonthlyFlowChart transactions={transactions} />
        </div>
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <CategoryBreakdownChart transactions={currentMonthTxs} type="Gider" />
        </div>
      </div>

      {/* Bottom 2-Column: Recent Transactions & Upcoming Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions List */}
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
              Tümünü Gör ({transactions.length})
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
                  <th className="py-2.5 px-4 font-semibold text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
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
                      className={`py-3 px-4 text-right font-mono-num font-bold ${
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

        {/* Upcoming Dues Widget */}
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
                          {due.installmentIndex && due.totalInstallments && (
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded shrink-0">
                              {due.installmentIndex}/{due.totalInstallments}
                            </span>
                          )}
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
                          className={`text-xs font-mono-num font-bold ${
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

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Vadesi gelen çek ve taksitler</span>
            <button
              onClick={() => setActiveTab('upcoming')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Yeni Vade Ekle +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
