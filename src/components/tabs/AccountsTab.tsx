import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Building2,
  Wallet,
  CreditCard,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Account } from '../../types/finance';
import { AccountModal } from '../modals/AccountModal';
import { TransferModal } from '../modals/TransferModal';

export const AccountsTab: React.FC = () => {
  const { accounts, transactions, deleteAccount, isAdmin } = useFinance();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Selected account transactions
  const accountTransactions = transactions
    .filter(t => t.accountId === selectedAccountId && t.status !== 'İptal')
    .slice(0, 25);

  const handleOpenNewAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Toplam Likit Kasa & Banka Varlığı
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalBalance)}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {accounts.length} aktif hesap ve kasa tanımlı
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span>Hesaplar Arası Virman / Transfer</span>
          </button>
          <button
            onClick={handleOpenNewAccount}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Hesap / Kasa Ekle</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => {
          const isSelected = acc.id === selectedAccountId;
          const isBank = acc.type === 'Ticari Hesap' || acc.type === 'Döviz Hesabı';
          const isPos = acc.type === 'POS Cihazı / Hesabı' || acc.type === 'Şirket Kredi Kartı';

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer relative group ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isBank
                        ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                        : isPos
                        ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {isBank ? (
                      <Building2 className="w-5 h-5" />
                    ) : isPos ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {acc.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {acc.type} {acc.bankName ? `• ${acc.bankName}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleOpenEditAccount(acc);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-100 rounded"
                    title="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm(`${acc.name} hesabını silmek istediğinize emin misiniz?`)) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                    Bakiye
                  </span>
                  <div
                    className={`text-lg font-bold font-mono-num ${
                      acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>

                {acc.iban && (
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                    {acc.iban}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Account Mini Statement */}
      {selectedAccount && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                {selectedAccount.name} Son Kasa/Banka Hareketleri
              </h3>
              <span className="text-xs text-slate-400">
                Bu hesaba ait son 25 işlem dökümü
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              Güncel Bakiye: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Tarih</th>
                  <th className="py-2.5 px-3">Tür</th>
                  <th className="py-2.5 px-4">Açıklama & Cari</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {accountTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                      Bu hesaba ait henüz bir işlem bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  accountTransactions.map(t => {
                    const isIncome = t.type === 'Gelir';
                    return (
                      <tr key={t.id} className="hover:bg-slate-850/50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                          {formatDate(t.date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isIncome
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-200">
                          {t.desc || t.description || ''}
                          {t.cariName && (
                            <span className="block text-[10px] text-slate-400">
                              Cari: {t.cariName}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-sans">
                          {t.category || '-'}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultSourceAccountId={selectedAccountId}
      />
    </div>
  );
};
