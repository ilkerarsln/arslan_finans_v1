import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/finance';
import { X, Building2, Check } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
}) => {
  const { addAccount, updateAccount } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Ticari Hesap');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [cutOffDate, setCutOffDate] = useState('');
  const [cutOffDay, setCutOffDay] = useState('');
  const [color, setColor] = useState('#2563eb');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setBankName(editingAccount.bankName || '');
      setIban(editingAccount.iban || '');
      setBalance(editingAccount.balance.toString());
      setCreditLimit(editingAccount.creditLimit ? editingAccount.creditLimit.toString() : '');
      setCutOffDate(editingAccount.cutOffDate || '');
      setCutOffDay(editingAccount.cutOffDay ? editingAccount.cutOffDay.toString() : '');
      setCurrency(editingAccount.currency);
      setColor(editingAccount.color);
    } else {
      setName('');
      setType('Ticari Hesap');
      setBankName('');
      setIban('');
      setBalance('0');
      setCreditLimit('50000');
      const today = new Date();
      const defaultCutoff = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-15`;
      setCutOffDate(defaultCutoff);
      setCutOffDay('15');
      setCurrency('TRY');
      setColor('#059669');
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance) || 0;
    const numLimit = creditLimit ? parseFloat(creditLimit) : undefined;
    const icon =
      type === 'Kasa (Nakit)'
        ? 'Vault'
        : type === 'Şirket Kredi Kartı'
        ? 'CreditCard'
        : 'Building2';

    const derivedDay = cutOffDay
      ? parseInt(cutOffDay, 10)
      : cutOffDate
      ? parseInt(cutOffDate.split('-')[2], 10)
      : undefined;

    if (editingAccount) {
      updateAccount({
        ...editingAccount,
        name: name.trim(),
        type,
        bankName: bankName.trim() || undefined,
        iban: iban.trim() || undefined,
        balance: numBalance,
        creditLimit: numLimit,
        cutOffDate: type === 'Şirket Kredi Kartı' ? cutOffDate || undefined : undefined,
        cutOffDay: type === 'Şirket Kredi Kartı' ? derivedDay : undefined,
        currency,
        color,
        icon,
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        bankName: bankName.trim() || undefined,
        iban: iban.trim() || undefined,
        balance: numBalance,
        creditLimit: numLimit,
        cutOffDate: type === 'Şirket Kredi Kartı' ? cutOffDate || undefined : undefined,
        cutOffDay: type === 'Şirket Kredi Kartı' ? derivedDay : undefined,
        currency,
        color,
        icon,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingAccount ? 'Hesabı Güncelle' : 'Yeni Banka & Kasa / Kart Ekle'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hesap Türü
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as AccountType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Ticari Hesap">Ticari Banka Hesabı</option>
              <option value="Kasa (Nakit)">Fiziki Kasa (Nakit)</option>
              <option value="Şirket Kredi Kartı">Şirket Kredi Kartı</option>
              <option value="POS Cihazı / Hesabı">POS Cihazı / Hesabı</option>
              <option value="Döviz Hesabı">Döviz Hesabı (USD/EUR)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hesap Adı
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ör: Garanti Ticari Hesap, Merkez Kasa"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {type !== 'Kasa (Nakit)' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Banka Adı
              </label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="Ör: Garanti BBVA, Yapı Kredi"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {type === 'Ticari Hesap' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                IBAN Numarası
              </label>
              <input
                type="text"
                value={iban}
                onChange={e => setIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {type === 'Şirket Kredi Kartı' ? 'Güncel Borç (₺)' : 'Açılış Bakiyesi (₺) *'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {type === 'Şirket Kredi Kartı' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kart Limiti (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Para Birimi
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as 'TRY' | 'USD' | 'EUR')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TRY">Türk Lirası (₺)</option>
                  <option value="USD">Amerikan Doları ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {editingAccount ? 'Kaydet' : 'Hesabı Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
