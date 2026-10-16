import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { TransactionType } from '../../types/finance';
import { TransferModal } from '../modals/TransferModal';

export const TransactionsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    caris,
    openTransactionModal,
    openInstallmentModal,
    deleteTransaction,
    exportDataToExcel,
    isAdmin,
    requestDeleteTransaction,
  } = useFinance();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) set.add(t.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        (t.desc && t.desc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.cariName && t.cariName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.documentNo && t.documentNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      const matchAccount = accountFilter === 'ALL' || t.accountId === accountFilter || t.targetAccountId === accountFilter;
      const matchMonth = selectedMonth === 'ALL' || (t.date && t.date.startsWith(selectedMonth));

      return matchSearch && matchType && matchAccount && matchMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, typeFilter, accountFilter, selectedMonth]);

  const summary = useMemo(() => {
    let gelir = 0;
    let gider = 0;
    let malAlimi = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'Gelir') gelir += t.amount;
      else if (t.type === 'Gider') gider += t.amount;
      else if (t.type === 'Mal Alımı') malAlimi += t.amount;
    });

    return { gelir, gider, malAlimi, net: gelir - gider - malAlimi };
  }, [filteredTransactions]);

  const handleDelete = (id: string, desc: string, amount: number) => {
    if (isAdmin) {
      if (window.confirm(`"${desc}" tutarındaki işlemi silmek istediğinize emin misiniz?`)) {
        deleteTransaction(id);
      }
    } else {
      const reason = window.prompt(`Silme onayı için gerekçe yazınız:`, 'Hatalı işlem kaydı');
      if (reason) {
        requestDeleteTransaction(id, reason);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-indigo-400" />
            Gelir / Gider & Kasa Hareketleri
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nakit, banka, kredi kartı ve POS işlemlerini filtreleyin, ekleyin ve raporlayın.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openTransactionModal({ type: 'Gelir' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Gelir Ekle
          </button>
          <button
            onClick={() => openTransactionModal({ type: 'Gider' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Gider Ekle
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-900/20 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Virman / Transfer
          </button>
          <button
            onClick={() => openInstallmentModal()}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-900/20 transition-all"
          >
            <Clock className="w-4 h-4" /> Taksitli İşlem
          </button>
          <button
            onClick={exportDataToExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Filtrelenen Gelir</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-2">
            {formatCurrency(summary.gelir)}
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Filtrelenen Gider</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-2">
            {formatCurrency(summary.gider)}
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Mal Alımı Harcamaları</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2">
            {formatCurrency(summary.malAlimi)}
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Kasa Akışı</span>
            <span className={`text-xs font-bold ${summary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.net >= 0 ? 'Pozitif' : 'Açık'}
            </span>
          </div>
          <div className={`text-xl font-bold mt-2 ${summary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(summary.net)}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Açıklama, cari, evrak no..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Türler</option>
          <option value="Gelir">Gelir (+)</option>
          <option value="Gider">Gider (-)</option>
          <option value="Transfer">Transfer / Virman</option>
          <option value="Mal Alımı">Mal Alımı (-)</option>
        </select>

        <select
          value={accountFilter}
          onChange={e => setAccountFilter(e.target.value)}
          className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Hesaplar & Kasalar</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.bankName || acc.type})
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Dönemler</option>
          {availableMonths.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Tarih</th>
                <th className="p-3.5">Tür</th>
                <th className="p-3.5">Açıklama / Evrak</th>
                <th className="p-3.5">İlgili Cari / Müşteri</th>
                <th className="p-3.5">Hesap / Kasa</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5 text-right">Tutar</th>
                <th className="p-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    Kayıtlı işlem bulunamadı veya arama kriterine uymuyor.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const acc = accounts.find(a => a.id === t.accountId);
                  const targetAcc = t.targetAccountId ? accounts.find(a => a.id === t.targetAccountId) : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {formatDate(t.date)}
                        {t.dueDate && (
                          <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Vade: {formatDate(t.dueDate)}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.type === 'Gelir'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                              : t.type === 'Gider'
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                              : t.type === 'Transfer'
                              ? 'bg-sky-950/80 text-sky-400 border border-sky-800/50'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs truncate font-medium text-white">
                        {t.desc || t.description}
                        {t.documentNo && (
                          <span className="ml-2 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {t.documentNo}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-300">
                        {t.cariName || '-'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {acc?.name || '-'}
                        {targetAcc && ` → ${targetAcc.name}`}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {t.category || '-'}
                      </td>
                      <td
                        className={`p-3.5 whitespace-nowrap text-right font-bold text-sm ${
                          t.type === 'Gelir'
                            ? 'text-emerald-400'
                            : t.type === 'Gider' || t.type === 'Mal Alımı'
                            ? 'text-rose-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {t.type === 'Gelir' ? '+' : t.type === 'Transfer' ? '' : '-'}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(t.id, t.desc, t.amount)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
};
