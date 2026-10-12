import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Building2,
  Vault,
  CreditCard,
  Landmark,
  Plus,
  ArrowRightLeft,
  Copy,
  Check,
  Edit2,
  Trash2,
  TrendingDown,
  TrendingUp,
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
  const { accounts, transactions, deleteAccount, showToast } = useFinance();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    showToast('IBAN panoya kopyalandı', 'info');
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`'${name}' hesabını silmek istediğinize emin misiniz?`)) {
      deleteAccount(id);
      if (selectedAccountId === id) setSelectedAccountId(null);
    }
  };

  // Selected account transactions
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountTransactions = transactions.filter(
    tx => tx.accountId === selectedAccountId || tx.targetAccountId === selectedAccountId
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Banka Hesapları & Kasalar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tüm vadesiz ticari hesaplar, şirket kredi kartları ve nakit kasaların bakiye yönetimi
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

      {/* Accounts Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          const isCreditCard = acc.type === 'Şirket Kredi Kartı';
          const isCash = acc.type === 'Kasa (Nakit)';

          // Credit card limits calculation
          const limit = acc.creditLimit || 50000;
          const usedDebt = Math.abs(Math.min(acc.balance, 0));
          const availableLimit = Math.max(limit - usedDebt, 0);
          const usedPercent = Math.min((usedDebt / limit) * 100, 100);

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(isSelected ? null : acc.id)}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: acc.color || '#10b981' }}
              />

              <div>
                {/* Account Type & Actions */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {acc.type}
                  </span>
                  <div
                    className="flex items-center gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onOpenTransfer(acc.id)}
                      title="Bu hesaptan transfer yap"
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
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    {isCash ? (
                      <Vault className="w-5 h-5" />
                    ) : isCreditCard ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Balance display */}
                <div className="mt-4">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isCreditCard ? 'Güncel Dönem Borcu' : 'Hesap Bakiyesi'}
                  </span>
                  <div
                    className={`text-2xl font-bold font-mono-num mt-0.5 ${
                      isCreditCard
                        ? 'text-rose-600 dark:text-rose-400'
                        : acc.balance < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>

                {/* Credit Card Limit Progress */}
                {isCreditCard && (
                  <div className="mt-3 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Kullanılan: {formatCurrency(usedDebt)}</span>
                      <span>Kalan Limit: {formatCurrency(availableLimit)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Toplam Limit: {formatCurrency(limit)}</span>
                      <span>Kesim Günü: Her ayın {acc.cutOffDay || 15}'i</span>
                    </div>
                  </div>
                )}

                {/* IBAN details for bank accounts */}
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
                      className="p-1 text-slate-400 hover:text-emerald-500 flex items-center gap-1 text-[11px] font-medium"
                    >
                      {copiedIban === acc.iban ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Kopyalandı</span>
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

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {transactions.filter(t => t.accountId === acc.id || t.targetAccountId === acc.id).length} hareket
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isSelected ? 'Seçimi Kapat' : 'Hareketleri İncele →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account Detailed History */}
      {selectedAccount && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAccount.name} Hesap Ekstresi
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedAccount.type}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Bu hesaba ait son finansal giriş ve çıkışlar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Bakiye:</span>
                <div className="text-base font-bold font-mono-num text-slate-900 dark:text-white">
                  {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                </div>
              </div>
              <button
                onClick={() => onOpenTransfer(selectedAccount.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Virman Yap
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {accountTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Bu hesap için henüz işlem kaydı bulunmamaktadır.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Tür</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Cari / Açıklama</th>
                    <th className="py-2.5 px-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {accountTransactions.map(tx => {
                    const isIncomingTransfer =
                      tx.type === 'Transfer' && tx.targetAccountId === selectedAccount.id;
                    const isOutgoing = tx.type === 'Gider' || (tx.type === 'Transfer' && tx.accountId === selectedAccount.id);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-2.5 px-3 text-slate-500">{formatDate(tx.date)}</td>
                        <td className="py-2.5 px-3 font-semibold">
                          <span
                            className={
                              isIncomingTransfer || tx.type === 'Gelir'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {tx.type === 'Transfer'
                              ? isIncomingTransfer
                                ? 'Virman Giriş (+)'
                                : 'Virman Çıkış (-)'
                              : tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{tx.category}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {tx.cariName ? `${tx.cariName} · ` : ''}
                          {tx.desc}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono-num font-bold ${
                            isIncomingTransfer || tx.type === 'Gelir'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncomingTransfer || tx.type === 'Gelir' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
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
