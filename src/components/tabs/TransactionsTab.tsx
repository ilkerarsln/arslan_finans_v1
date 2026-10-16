import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction, TransactionType } from '../../types/finance';
import * as XLSX from 'xlsx';

export const TransactionsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    caris,
    categories,
    deleteTransaction,
    openTransactionModal,
    isAdmin,
    showToast,
  } = useFinance();

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedYear !== 'ALL') {
        const itemYear = t.date.split('-')[0];
        if (itemYear !== selectedYear) return false;
      }
      if (selectedMonth !== 'ALL') {
        const itemMonth = t.date.split('-')[1];
        if (itemMonth !== selectedMonth) return false;
      }
      if (selectedType !== 'ALL' && t.type !== selectedType) return false;
      if (selectedAccountId !== 'ALL' && t.accountId !== selectedAccountId) return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mDesc = (t.desc || t.description || '').toLowerCase().includes(q);
        const mCat = (t.category || '').toLowerCase().includes(q);
        const mDoc = (t.documentNo || '').toLowerCase().includes(q);
        const mCari = (t.cariName || '').toLowerCase().includes(q);
        if (!mDesc && !mCat && !mDoc && !mCari) return false;
      }
      return true;
    });
  }, [transactions, selectedYear, selectedMonth, selectedType, selectedAccountId, selectedCategory, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let purchaseCost = 0;

    filteredTransactions.forEach(t => {
      if (t.status === 'İptal') return;
      if (t.type === 'Gelir') income += t.amount;
      else if (t.type === 'Gider') expense += t.amount;
      else if (t.type === 'Mal Alımı') purchaseCost += t.amount;
    });

    const net = income - (expense + purchaseCost);
    return { income, expense, purchaseCost, net, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleExportExcel = () => {
    try {
      const rows = filteredTransactions.map(t => {
        const acc = accounts.find(a => a.id === t.accountId);
        return {
          Tarih: t.date,
          Tür: t.type,
          Kategori: t.category,
          Açıklama: t.desc || t.description || '',
          Tutar: t.amount,
          Hesap: acc ? acc.name : t.accountId,
          Cari: t.cariName || '-',
          EvrakNo: t.documentNo || '-',
          Durum: t.status,
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KasaHareketleri');
      XLSX.writeFile(wb, `Arslan_Mobilya_Kasa_Hareketleri_${selectedYear}_${selectedMonth}.xlsx`);
      showToast('Kasa hareketleri Excel dosyası olarak indirildi', 'success');
    } catch (err) {
      showToast('Dışa aktarma başarısız', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Toplam Gelir</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {formatCurrency(stats.income)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Satış ve diğer tahsilatlar</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Operasyonel Gider</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-2">
            {formatCurrency(stats.expense)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Kira, elektrik, personel vb.</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mal Alım Ödemeleri</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-sky-400 mt-2">
            {formatCurrency(stats.purchaseCost)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tedarikçi peşin alımları</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Nakit Akışı</span>
            <span className="text-[11px] font-mono text-slate-400">{stats.count} İşlem</span>
          </div>
          <div
            className={`text-xl font-bold font-mono mt-2 ${
              stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.net >= 0 ? '+' : ''}
            {formatCurrency(stats.net)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Gelir - Gider dengesi</span>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => openTransactionModal({ type: 'Gelir' })}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gelir Ekle</span>
            </button>
            <button
              onClick={() => openTransactionModal({ type: 'Gider' })}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gider Ekle</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel'e Aktar</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Yıl
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tüm Yıllar</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Ay
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tüm Aylar</option>
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                const names = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                return (
                  <option key={m} value={m}>
                    {m} - {names[i]}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              İşlem Türü
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tümü</option>
              <option value="Gelir">Gelir (+)</option>
              <option value="Gider">Gider (-)</option>
              <option value="Mal Alımı">Mal Alımı (-)</option>
              <option value="Transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Hesap / Kasa
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tüm Hesaplar</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Arama
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Açıklama, evrak no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-3">Tür</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-4">Açıklama & Cari</th>
                <th className="py-3 px-3">Hesap / Kasa</th>
                <th className="py-3 px-4 text-right">Tutar</th>
                <th className="py-3 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    Filtre kriterlerine uygun kasa veya banka hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(item => {
                  const acc = accounts.find(a => a.id === item.accountId);
                  const isIncome = item.type === 'Gelir';
                  const isExpense = item.type === 'Gider' || item.type === 'Mal Alımı';

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/60 transition group">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(item.date)}
                        {item.documentNo && (
                          <span className="block text-[10px] text-slate-500">
                            {item.documentNo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.type === 'Mal Alımı'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-sans whitespace-nowrap">
                        {item.category || '-'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-medium text-slate-200 line-clamp-1">
                          {item.desc || item.description || ''}
                        </div>
                        {item.cariName && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-500">Cari:</span>
                            <span className="text-slate-300">{item.cariName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans whitespace-nowrap">
                        {acc ? acc.name : item.accountId}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold font-mono">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm('Bu hareketi silmek istediğinize emin misiniz?')) {
                              deleteTransaction(item.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition rounded hover:bg-slate-800"
                          title="Hareketi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
