import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, Transaction } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Building2,
  Vault,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Coins,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeft,
  FileText,
  X,
} from 'lucide-react';

interface AccountsTabProps {
  onOpenAddAccount: () => void;
  onEditAccount: (account: Account) => void;
  onOpenTransfer: (sourceAccountId?: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  onOpenAddAccount,
  onEditAccount,
  onOpenTransfer,
}) => {
  const { accounts, transactions, deleteAccount, showToast, isAdmin } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'bank' | 'credit'>('all');

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    showToast('IBAN panoya kopyalandı', 'info');
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) {
      showToast('Hesap silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    if (window.confirm(`'${name}' hesabını silmek istediğinize emin misiniz?`)) {
      deleteAccount(id);
      if (selectedAccountId === id) setSelectedAccountId(null);
    }
  };

  // Group accounts
  const bankAccounts = accounts.filter(a => a.type !== 'Şirket Kredi Kartı');
  const creditCards = accounts.filter(a => a.type === 'Şirket Kredi Kartı');

  // Bank accounts KPIs
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

  // Credit cards KPIs
  const totalCardDebt = creditCards.reduce((sum, a) => sum + Math.abs(Math.min(a.balance, 0)), 0);
  const totalCreditLimit = creditCards.reduce((sum, a) => sum + (a.creditLimit || 50000), 0);
  const totalAvailableLimit = Math.max(totalCreditLimit - totalCardDebt, 0);

  // Selected account transactions & movement reports
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountTransactions = transactions.filter(
    tx => tx.accountId === selectedAccountId || tx.targetAccountId === selectedAccountId
  );

  const [movementPeriod, setMovementPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = String(now.getFullYear());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const filteredAccountTransactions = useMemo(() => {
    return accountTransactions.filter(tx => {
      if (movementPeriod === 'daily') return tx.date === todayStr;
      if (movementPeriod === 'weekly') return tx.date >= sevenDaysAgoStr;
      if (movementPeriod === 'monthly') return tx.date.startsWith(currentMonthKey);
      if (movementPeriod === 'yearly') return tx.date.startsWith(currentYearStr);
      return true;
    });
  }, [accountTransactions, movementPeriod, todayStr, sevenDaysAgoStr, currentMonthKey, currentYearStr]);

  const periodTotalIn = useMemo(() => {
    return filteredAccountTransactions.reduce((sum, tx) => {
      const isIncoming = tx.type === 'Gelir' || (tx.type === 'Transfer' && tx.targetAccountId === selectedAccountId);
      return isIncoming ? sum + tx.amount : sum;
    }, 0);
  }, [filteredAccountTransactions, selectedAccountId]);

  const periodTotalOut = useMemo(() => {
    return filteredAccountTransactions.reduce((sum, tx) => {
      const isOutgoing = tx.type === 'Gider' || tx.type === 'Mal Alımı' || (tx.type === 'Transfer' && tx.accountId === selectedAccountId);
      return isOutgoing ? sum + tx.amount : sum;
    }, 0);
  }, [filteredAccountTransactions, selectedAccountId]);

  const periodNetChange = periodTotalIn - periodTotalOut;

  const handleExportAccountStatementCSV = () => {
    if (!selectedAccount || filteredAccountTransactions.length === 0) {
      showToast('Dışa aktarılacak hareket bulunamadı.', 'info');
      return;
    }
    const headers = ['Tarih', 'İşlem Türü', 'Kategori', 'Açıklama / Cari', 'Giriş Tutarı (TL)', 'Çıkış Tutarı (TL)'];
    const rows = filteredAccountTransactions.map(tx => {
      const isIncoming = tx.type === 'Gelir' || (tx.type === 'Transfer' && tx.targetAccountId === selectedAccount.id);
      return [
        tx.date,
        `"${tx.type}"`,
        `"${tx.category}"`,
        `"${tx.cariName ? `${tx.cariName} - ` : ''}${tx.desc}"`,
        isIncoming ? tx.amount : '',
        !isIncoming ? tx.amount : '',
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedAccount.name.replace(/\s+/g, '_')}_hesap_ekstresi_${movementPeriod}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Banka Hesapları & Kredi Kartları
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vadesiz banka mevduatları, nakit kasalar ve şirket kredi kartlarının bağımsız takibi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTransfer()}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" /> Virman / Transfer Yap
          </button>
          <button
            onClick={onOpenAddAccount}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Hesap Ekle
          </button>
        </div>
      </div>

      {/* Top Filter Buttons */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setViewFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition ${
            viewFilter === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tümü ({accounts.length})
        </button>
        <button
          onClick={() => setViewFilter('bank')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            viewFilter === 'bank'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          Banka Hesapları & Kasalar ({bankAccounts.length})
        </button>
        <button
          onClick={() => setViewFilter('credit')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
            viewFilter === 'credit'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-500" />
          Kredi Kartları ({creditCards.length})
        </button>
      </div>

      {/* GROUP 1: Banka Hesapları ve Kasalar */}
      {(viewFilter === 'all' || viewFilter === 'bank') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Banka Hesapları & Kasalar
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Vadesiz ticari hesaplar, döviz hesapları ve fiziki şirket kasaları
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Toplam Likit Bakiye</span>
              <span className="font-mono-num font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalBankBalance)}
              </span>
            </div>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Kayıtlı banka hesabı veya kasa bulunmuyor. "Yeni Hesap Ekle" ile ekleyebilirsiniz.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bankAccounts.map(acc => {
                const isSelected = selectedAccountId === acc.id;
                const isCash = acc.type === 'Kasa (Nakit)';

                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedAccountId(isSelected ? null : acc.id)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: acc.color || '#2563eb' }}
                    />

                    <div>
                      {/* Top Type & Actions */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                          {acc.type}
                        </span>
                        <div
                          className="flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onOpenTransfer(acc.id)}
                            title="Bu hesaptan virman transfer yap"
                            className="p-1 text-slate-400 hover:text-blue-500 rounded transition"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditAccount(acc)}
                            title="Düzenle"
                            className="p-1 text-slate-400 hover:text-emerald-500 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(acc.id, acc.name)}
                            title="Sil"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Account Name & Bank */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {acc.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {acc.bankName || (isCash ? 'Fiziki Nakit Kasası' : 'Vadesiz Hesap')}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          {isCash ? <Vault className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="mt-4">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Hesap Bakiyesi
                        </span>
                        <div
                          className={`text-2xl font-bold font-mono-num mt-0.5 ${
                            acc.balance < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(acc.balance, acc.currency)}
                        </div>
                      </div>

                      {/* IBAN */}
                      {acc.iban && (
                        <div
                          className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                            {acc.iban}
                          </span>
                          <button
                            onClick={() => handleCopyIban(acc.iban!)}
                            className="p-1 text-slate-400 hover:text-blue-500 flex items-center gap-1 text-[11px] font-medium"
                          >
                            {copiedIban === acc.iban ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-blue-500">Kopyalandı</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Kopyala</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {transactions.filter(t => t.accountId === acc.id || t.targetAccountId === acc.id).length} hareket
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {isSelected ? 'Seçimi Kapat' : 'Ekstreyi İncele →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GROUP 2: Şirket Kredi Kartları */}
      {(viewFilter === 'all' || viewFilter === 'credit') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Şirket Kredi Kartları
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kart limitleri, harcama bakiyeleri ve hesap kesim tarihleri
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Toplam Kart Borcu</span>
              <span className="font-mono-num font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400">
                {formatCurrency(totalCardDebt)}
              </span>
            </div>
          </div>

          {creditCards.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Kayıtlı şirket kredi kartı bulunmuyor. "Yeni Hesap Ekle" üzerinden kredi kartı tanımlayabilirsiniz.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {creditCards.map(card => {
                const isSelected = selectedAccountId === card.id;
                const limit = card.creditLimit || 50000;
                const usedDebt = Math.abs(Math.min(card.balance, 0));
                const availableLimit = Math.max(limit - usedDebt, 0);
                const usedPercent = Math.min((usedDebt / limit) * 100, 100);

                const cutOffText = card.cutOffDate
                  ? formatDate(card.cutOffDate)
                  : card.cutOffDay
                  ? `Her ayın ${card.cutOffDay}. günü`
                  : 'Belirtilmedi';

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedAccountId(isSelected ? null : card.id)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: card.color || '#f59e0b' }}
                    />

                    <div>
                      {/* Top Type & Actions */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Kredi Kartı
                        </span>
                        <div
                          className="flex items-center gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onOpenTransfer(card.id)}
                            title="Kart borcu ödeme / virman"
                            className="p-1 text-slate-400 hover:text-blue-500 rounded transition"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditAccount(card)}
                            title="Düzenle"
                            className="p-1 text-slate-400 hover:text-emerald-500 rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(card.id, card.name)}
                            title="Sil"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Name & Bank */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {card.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {card.bankName || 'Kurumsal Kredi Kartı'}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Debt Display */}
                      <div className="mt-4">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Güncel Kart Borcu
                        </span>
                        <div className="text-2xl font-bold font-mono-num mt-0.5 text-rose-600 dark:text-rose-400">
                          {formatCurrency(usedDebt, card.currency)}
                        </div>
                      </div>

                      {/* Limits & Progress */}
                      <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Limit: {formatCurrency(limit, card.currency)}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Kalan: {formatCurrency(availableLimit, card.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              usedPercent > 80 ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Hesap Kesim Tarihi Badge */}
                      <div className="mt-3 p-2 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>Hesap Kesim Tarihi:</span>
                        </div>
                        <span className="font-bold text-amber-900 dark:text-amber-200 text-[11px]">
                          {cutOffText}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {transactions.filter(t => t.accountId === card.id || t.targetAccountId === card.id).length} harcama
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {isSelected ? 'Seçimi Kapat' : 'Kart Hareketleri →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Account Detailed History & Hareket Raporları */}
      {selectedAccount && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-xl p-5 md:p-6 space-y-5 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedAccount.name} Hareket ve Ekstre Raporu
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedAccount.type}
                </span>
                {selectedAccount.type === 'Şirket Kredi Kartı' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Kesim: {selectedAccount.cutOffDate ? formatDate(selectedAccount.cutOffDate) : (selectedAccount.cutOffDay ? `Her ayın ${selectedAccount.cutOffDay}'i` : '-')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bu kasa veya banka hesabına ait günlük, haftalık, aylık ve yıllık tüm para giriş-çıkış hareketleri
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-right pr-2">
                <span className="text-[11px] text-slate-400 block font-medium">
                  {selectedAccount.type === 'Şirket Kredi Kartı' ? 'Güncel Dönem Borcu:' : 'Mevcut Bakiye:'}
                </span>
                <div className="text-lg font-bold font-mono-num text-slate-900 dark:text-white">
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </div>
              </div>

              <button
                onClick={handleExportAccountStatementCSV}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                title="Ekstre CSV İndir"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => onOpenTransfer(selectedAccount.id)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Virman Yap</span>
              </button>

              <button
                onClick={() => setSelectedAccountId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Detay Ekranını Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Rapor Periyot Seçici: Günlük, Haftalık, Aylık, Yıllık, Tümü */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>Hareket Raporu Periyodu:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setMovementPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  movementPeriod === 'daily'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Günlük (Bugün)
              </button>
              <button
                onClick={() => setMovementPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  movementPeriod === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Haftalık (Son 7 Gün)
              </button>
              <button
                onClick={() => setMovementPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  movementPeriod === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Aylık (Bu Ay)
              </button>
              <button
                onClick={() => setMovementPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  movementPeriod === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Yıllık (Bu Yıl)
              </button>
              <button
                onClick={() => setMovementPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  movementPeriod === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Tüm Geçmiş
              </button>
            </div>
          </div>

          {/* KPI Summary Cards for Selected Period */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Dönem Girişleri (+)</span>
              <div className="text-lg font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatCurrency(periodTotalIn, selectedAccount.currency)}
              </div>
              <span className="text-[10px] text-slate-400">Tahsilat & gelen virman</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Dönem Çıkışları (-)</span>
              <div className="text-lg font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
                -{formatCurrency(periodTotalOut, selectedAccount.currency)}
              </div>
              <span className="text-[10px] text-slate-400">Ödeme, gider & giden virman</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Dönem Net Değişimi</span>
              <div
                className={`text-lg font-bold font-mono-num mt-1 ${
                  periodNetChange >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {periodNetChange > 0 ? '+' : ''}{formatCurrency(periodNetChange, selectedAccount.currency)}
              </div>
              <span className="text-[10px] text-slate-400">Girişler - Çıkışlar farkı</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Dönem İşlem Sayısı</span>
              <div className="text-lg font-bold font-mono-num text-slate-800 dark:text-slate-100 mt-1">
                {filteredAccountTransactions.length} Hareket
              </div>
              <span className="text-[10px] text-slate-400">Seçilen dönem kayıtları</span>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-x-auto">
            {filteredAccountTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Seçilen periyotta ({movementPeriod === 'daily' ? 'Bugün' : movementPeriod === 'weekly' ? 'Bu Hafta' : movementPeriod === 'monthly' ? 'Bu Ay' : movementPeriod === 'yearly' ? 'Bu Yıl' : 'Tümü'}) bu hesaba ait işlem kaydı bulunmamaktadır.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Tür</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Cari / Açıklama</th>
                    <th className="py-2.5 px-3 text-right">Giriş (+)</th>
                    <th className="py-2.5 px-3 text-right">Çıkış (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAccountTransactions.map(tx => {
                    const isIncoming =
                      tx.type === 'Gelir' ||
                      (tx.type === 'Transfer' && tx.targetAccountId === selectedAccount.id);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                          <span
                            className={
                              isIncoming
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : tx.type === 'Mal Alımı'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {tx.type === 'Transfer'
                              ? isIncoming
                                ? 'Virman Giriş (+)'
                                : 'Virman Çıkış (-)'
                              : tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{tx.category}</td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                          {tx.cariName ? <span className="font-semibold text-slate-900 dark:text-white">{tx.cariName} · </span> : ''}
                          <span>{tx.desc}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {isIncoming ? `+${formatCurrency(tx.amount, selectedAccount.currency)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {!isIncoming ? `-${formatCurrency(tx.amount, selectedAccount.currency)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
