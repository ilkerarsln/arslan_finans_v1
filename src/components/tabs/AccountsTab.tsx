import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  Building2,
  Wallet,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface AccountsTabProps {
  onOpenAddAccount: () => void;
  onOpenTransfer: () => void;
  onEditAccount: (account: Account) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  onOpenAddAccount,
  onOpenTransfer,
  onEditAccount,
}) => {
  const { accounts, deleteAccount, transactions, permissions, isAdmin, showToast } = useFinance();
  const [selectedType, setSelectedType] = useState<string>('All');
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  const accountTypes: { label: string; value: string }[] = [
    { label: 'Tüm Hesaplar', value: 'All' },
    { label: 'Ticari Hesap', value: 'Ticari Hesap' },
    { label: 'Kasa (Nakit)', value: 'Kasa (Nakit)' },
    { label: 'Kredi Kartı', value: 'Şirket Kredi Kartı' },
    { label: 'POS Cihazı', value: 'POS Cihazı / Hesabı' },
    { label: 'Döviz', value: 'Döviz Hesabı' },
  ];

  const filteredAccounts = accounts.filter(acc => {
    if (selectedType === 'All') return true;
    return acc.type === selectedType;
  });

  const totalAssets = accounts
    .filter(a => a.type !== 'Şirket Kredi Kartı')
    .reduce((sum, a) => sum + (a.currency === 'TRY' ? a.balance : 0), 0);

  const totalCreditCardDebt = accounts
    .filter(a => a.type === 'Şirket Kredi Kartı')
    .reduce((sum, a) => sum + Math.abs(Math.min(0, a.balance)), 0);

  const totalCreditLimit = accounts
    .filter(a => a.type === 'Şirket Kredi Kartı')
    .reduce((sum, a) => sum + (a.creditLimit || 0), 0);

  const handleDelete = (account: Account) => {
    if (!isAdmin && !permissions.canDeleteAccounts) {
      showToast('Hesap silme yetkiniz bulunmamaktadır.', 'error');
      return;
    }
    const hasTransactions = transactions.some(
      t => t.accountId === account.id || t.targetAccountId === account.id
    );
    if (hasTransactions) {
      showToast('Bu hesaba bağlı finansal hareketler var! Önce ilgili hareketleri silin veya başka hesaba taşıyın.', 'error');
      return;
    }
    deleteAccount(account.id);
    showToast(`${account.name} hesabı başarıyla silindi.`, 'success');
    setAccountToDelete(null);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Ticari Hesap':
        return <Building2 className="w-5 h-5" />;
      case 'Kasa (Nakit)':
        return <Wallet className="w-5 h-5" />;
      case 'Şirket Kredi Kartı':
        return <CreditCard className="w-5 h-5" />;
      case 'POS Cihazı / Hesabı':
        return <Layers className="w-5 h-5" />;
      default:
        return <Building2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Toplam Nakit & Mevduat
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalAssets)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vadesiz banka hesapları, nakit kasalar ve döviz varlıkları
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Şirket Kredi Kartı Borçları
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalCreditCardDebt)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Toplam limit: {formatCurrency(totalCreditLimit)} • Kullanılabilir: {formatCurrency(Math.max(0, totalCreditLimit - totalCreditCardDebt))}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hızlı Hesap İşlemleri
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Hesaplar arası anlık virman ve yeni banka/kasa ekleme
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onOpenTransfer}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
              <span>Virman Transfer</span>
            </button>
            <button
              onClick={onOpenAddAccount}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Hesap Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {accountTypes.map(t => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedType === t.value
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAccounts.map(account => {
          const isCard = account.type === 'Şirket Kredi Kartı';
          const isNegative = account.balance < 0;
          const accountTxCount = transactions.filter(
            t => t.accountId === account.id || t.targetAccountId === account.id
          ).length;

          return (
            <div
              key={account.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-xs"
                      style={{ backgroundColor: account.color || '#10B981' }}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {account.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {account.bankName || account.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {account.currency}
                  </span>
                </div>

                {account.iban && (
                  <div className="mt-3.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 select-all">
                    {account.iban}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-xs text-slate-500 mb-1">
                    {isCard ? 'Güncel Borç Durumu' : 'Mevcut Bakiye'}
                  </div>
                  <div
                    className={`text-2xl font-extrabold tabular-nums ${
                      isNegative
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatCurrency(account.balance, account.currency)}
                  </div>
                </div>

                {isCard && account.creditLimit && (
                  <div className="mt-2.5 text-xs text-slate-500 flex items-center justify-between">
                    <span>Limit: {formatCurrency(account.creditLimit)}</span>
                    <span>
                      Kalan: {formatCurrency(Math.max(0, account.creditLimit - Math.abs(account.balance)))}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {accountTxCount} işlem kaydı
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditAccount(account)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAccountToDelete(account)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Hesabı Silmek İstediğinize Emin Misiniz?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              <strong className="text-slate-700 dark:text-slate-300">{accountToDelete.name}</strong> hesabı silinecektir. Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleDelete(accountToDelete)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
