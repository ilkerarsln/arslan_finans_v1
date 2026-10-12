import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Trash2,
  Edit2,
  Copy,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export const TransactionsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    deleteTransaction,
    openTransactionModal,
    openInstallmentModal,
    exportDataToExcel,
    showToast,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | TransactionType>('All');
  const [accountFilter, setAccountFilter] = useState<string>('All');
  const [periodFilter, setPeriodFilter] = useState<string>('all'); // 'this-month', 'last-month', 'last-90', 'all'
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(tx => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = tx.desc.toLowerCase().includes(query);
        const matchesCari = tx.cariName?.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesDoc = tx.documentNo?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCari && !matchesCat && !matchesDoc) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'All' && tx.type !== typeFilter) {
        return false;
      }

      // Account filter
      if (accountFilter !== 'All') {
        if (tx.accountId !== accountFilter && tx.targetAccountId !== accountFilter) {
          return false;
        }
      }

      // Period filter
      if (periodFilter !== 'all') {
        const txDate = new Date(tx.date);
        if (periodFilter === 'this-month') {
          if (
            txDate.getFullYear() !== currentYear ||
            txDate.getMonth() !== currentMonth
          ) {
            return false;
          }
        } else if (periodFilter === 'last-month') {
          const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
          if (
            txDate.getFullYear() !== lastMonthDate.getFullYear() ||
            txDate.getMonth() !== lastMonthDate.getMonth()
          ) {
            return false;
          }
        } else if (periodFilter === 'last-90') {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          if (txDate < ninetyDaysAgo) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [transactions, searchTerm, typeFilter, accountFilter, periodFilter, sortBy]);

  // Aggregate stats for filtered result
  const filteredIncome = filteredTransactions
    .filter(t => t.type === 'Gelir')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = filteredTransactions
    .filter(t => t.type === 'Gider')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredNet = filteredIncome - filteredExpense;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('Dışa aktarılacak işlem bulunamadı', 'info');
      return;
    }

    const headers = ['Tarih', 'Tür', 'Kategori', 'Cari/Firma', 'Açıklama', 'Hesap', 'Tutar (TL)', 'Belge No'];
    const rows = filteredTransactions.map(tx => {
      const acc = accounts.find(a => a.id === tx.accountId)?.name || tx.accountId;
      return [
        tx.date,
        tx.type,
        `"${tx.category}"`,
        `"${tx.cariName || '-'}"`,
        `"${tx.desc || '-'}"`,
        `"${acc}"`,
        tx.amount,
        `"${tx.documentNo || '-'}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arslan_finans_islemler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('CSV dosyası başarıyla indirildi', 'success');
  };

  const handleDuplicate = (tx: Transaction) => {
    openTransactionModal({
      ...tx,
      id: undefined,
      date: new Date().toISOString().split('T')[0],
      desc: `${tx.desc} (Kopya)`,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu finansal işlemi silmek istediğinize emin misiniz? Bakiye otomatik güncellenecektir.')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Firma, açıklama, kategori veya belge no ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportDataToExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              title="Tüm verileri Excel olarak indir (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="CSV olarak indir"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => openInstallmentModal()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Layers className="w-3.5 h-3.5" /> Taksitlendir
            </button>
            <button
              onClick={() => openTransactionModal({ type: 'Mal Alımı' })}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              title="Tedarikçiden Vadeli Mal Alımı Ekle"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Mal Alımı Ekle
            </button>
            <button
              onClick={() => openTransactionModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Yeni İşlem Ekle
            </button>
          </div>
        </div>

        {/* Filter Badges & Selects */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Segmented Type Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['All', 'Gelir', 'Gider', 'Mal Alımı', 'Transfer'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  typeFilter === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'All' ? 'Tümü' : tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Account filter */}
            <select
              value={accountFilter}
              onChange={e => setAccountFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
            >
              <option value="All">Tüm Hesaplar</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Period filter */}
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="this-month">Bu Ay (Ekim)</option>
              <option value="last-month">Geçen Ay (Eylül)</option>
              <option value="last-90">Son 90 Gün</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-300"
            >
              <option value="date-desc">En Yeni Tarih</option>
              <option value="date-asc">En Eski Tarih</option>
              <option value="amount-desc">En Yüksek Tutar</option>
              <option value="amount-asc">En Düşük Tutar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Aggregates Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between px-2">
          <span className="text-slate-500 dark:text-slate-400">Seçili Filtre Geliri:</span>
          <span className="font-bold font-mono-num text-emerald-600 dark:text-emerald-400 text-sm">
            +{formatCurrency(filteredIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between px-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-2 sm:pt-0">
          <span className="text-slate-500 dark:text-slate-400">Seçili Filtre Gideri:</span>
          <span className="font-bold font-mono-num text-rose-600 dark:text-rose-400 text-sm">
            -{formatCurrency(filteredExpense)}
          </span>
        </div>
        <div className="flex items-center justify-between px-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-2 sm:pt-0">
          <span className="text-slate-500 dark:text-slate-400">Filtre Net Akışı:</span>
          <span
            className={`font-bold font-mono-num text-sm ${
              filteredNet >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(filteredNet)}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">
            Tüm Gelir ve Gider Hareketleri ({filteredTransactions.length})
          </h3>
          <span className="text-xs text-slate-400">
            Toplam {transactions.length} işlem kaydı
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Arama kriterlerine uygun işlem bulunamadı.
            </p>
            <p className="text-xs text-slate-400">
              Filtreleri sıfırlayabilir veya yeni bir işlem ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Tür</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Cari / Firma</th>
                  <th className="py-3 px-4">Hesap / Kasa</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4 text-right">Tutar</th>
                  <th className="py-3 px-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map(tx => {
                  const sourceAcc = accounts.find(a => a.id === tx.accountId);
                  const targetAcc = tx.targetAccountId
                    ? accounts.find(a => a.id === tx.targetAccountId)
                    : null;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
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
                          {tx.type === 'Gelir' && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {tx.type === 'Gider' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {tx.type === 'Mal Alımı' && <ShoppingBag className="w-3.5 h-3.5" />}
                          {tx.type === 'Transfer' && <ArrowRightLeft className="w-3.5 h-3.5" />}
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                        {tx.cariName || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.type === 'Transfer' ? (
                          <span className="text-[11px]">
                            {sourceAcc?.name} ➔ {targetAcc?.name}
                          </span>
                        ) : tx.type === 'Mal Alımı' ? (
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                            Tedarikçi Borcu
                          </span>
                        ) : (
                          sourceAcc?.name || '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[220px]">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="truncate">{tx.desc || '-'}</span>
                          {tx.dueDate && tx.type === 'Mal Alımı' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                              Vade: {formatDate(tx.dueDate)}
                            </span>
                          )}
                          {tx.installmentIndex && tx.totalInstallments && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                              {tx.installmentIndex}/{tx.totalInstallments} Taksit
                            </span>
                          )}
                          {tx.status === 'Beklemede' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                              Beklemede
                            </span>
                          )}
                        </div>
                        {tx.documentNo && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {tx.documentNo}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-num font-bold whitespace-nowrap ${
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
                        {tx.type === 'Mal Alımı' && (
                          <span className="block text-[10px] font-normal text-amber-500">Borç</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleDuplicate(tx)}
                            title="Kopyala / Çoğalt"
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openTransactionModal(tx)}
                            title="Düzenle"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            title="Sil"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
