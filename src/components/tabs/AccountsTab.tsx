import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Building2,
  Wallet,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Trash2,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Account, AccountType } from '../../types/finance';
import { AccountModal } from '../modals/AccountModal';
import { TransferModal } from '../modals/TransferModal';

export const AccountsTab: React.FC = () => {
  const {
    accounts,
    deleteAccount,
    isAdmin,
  } = useFinance();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'Kasa (Nakit)':
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      case 'Şirket Kredi Kartı':
        return <CreditCard className="w-5 h-5 text-amber-400" />;
      case 'POS Cihazı / Hesabı':
        return <Coins className="w-5 h-5 text-sky-400" />;
      default:
        return <Building2 className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleOpenNew = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) {
      alert('Hesap silme yetkisi sadece yöneticilere aittir.');
      return;
    }
    if (window.confirm(`"${name}" hesabını silmek istediğinize emin misiniz?`)) {
      deleteAccount(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Bankalar, Kasalar & Finans Hesapları
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nakit kasaları, banka ticari hesapları, şirket kredi kartları ve POS hesaplarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Hesap Ekle
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            <ArrowRightLeft className="w-4 h-4" /> Virman / Para Transferi
          </button>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div
            key={acc.id}
            className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  {getAccountIcon(acc.type)}
                </div>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                  {acc.type}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-bold text-white">{acc.name}</h3>
                {acc.bankName && (
                  <p className="text-xs text-slate-400">{acc.bankName}</p>
                )}
                {acc.iban && (
                  <p className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                    {acc.iban}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Bakiye</span>
                <span
                  className={`text-lg font-bold ${
                    acc.balance >= 0 ? 'text-white' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(acc.balance, acc.currency)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(acc)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(acc.id, acc.name)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </div>
  );
};
