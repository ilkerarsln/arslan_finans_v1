import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Wallet, Plus, ArrowRightLeft, Building2, CreditCard, Landmark, CheckCircle } from 'lucide-react';

export const KasaBankaView: React.FC = () => {
  const { accounts, addAccount, updateAccountBalance, showToast } = useApp();

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // New Account
  const [name, setName] = useState('');
  const [type, setType] = useState<'kasa' | 'banka' | 'pos'>('kasa');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [initialBalance, setInitialBalance] = useState(0);

  // Transfer
  const [fromAcc, setFromAcc] = useState(accounts[0]?.id || '');
  const [toAcc, setToAcc] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState(0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addAccount({
      name,
      type,
      bankName: type !== 'kasa' ? bankName : undefined,
      accountNumber: type !== 'kasa' ? accountNumber : undefined,
      balance: initialBalance,
      currency: 'TRY',
    });

    setIsAddAccountOpen(false);
    setName('');
    setBankName('');
    setAccountNumber('');
    setInitialBalance(0);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAcc || !toAcc || fromAcc === toAcc || transferAmount <= 0) {
      alert('Lütfen farklı hesaplar ve geçerli bir tutar seçiniz.');
      return;
    }

    const source = accounts.find((a) => a.id === fromAcc);
    if (source && source.balance < transferAmount) {
      alert('Kaynak hesapta yetersiz bakiye!');
      return;
    }

    updateAccountBalance(fromAcc, -transferAmount);
    updateAccountBalance(toAcc, transferAmount);

    showToast(`₺${transferAmount.toLocaleString('tr-TR')} transfer işlemi gerçekleştirildi.`, 'success');
    setIsTransferOpen(false);
    setTransferAmount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Kasa & Banka Hesapları</h2>
          <p className="text-xs text-slate-400">
            Nakit kasa, ticari banka hesapları ve POS cihazı tahsilat bakiyeleri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <span>Hesaplar Arası Virman</span>
          </button>
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.3]" />
            <span>+ Yeni Hesap Ekle</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Toplam Likit Varlık (Kasa + Banka + POS)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalBalance)}</div>
        </div>
        <div className="text-xs text-slate-400">
          Toplam <strong>{accounts.length} Aktif Hesap</strong>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          let Icon = Wallet;
          let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
          let label = 'Nakit Kasa';

          if (acc.type === 'banka') {
            Icon = Landmark;
            badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            label = 'Banka Hesabı';
          } else if (acc.type === 'pos') {
            Icon = CreditCard;
            badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            label = 'POS Tahsilat';
          }

          return (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{acc.name}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                      {label}
                    </span>
                  </div>
                </div>
              </div>

              {acc.bankName && (
                <div className="text-xs text-slate-400 space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                  <p className="font-medium text-slate-300">{acc.bankName}</p>
                  <p className="font-mono text-[11px] truncate text-slate-500">{acc.accountNumber}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Mevcut Bakiye</span>
                <span className="text-lg font-bold text-emerald-400">{formatCurrency(acc.balance)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white">Yeni Kasa / Banka Hesabı</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Hesap Adı *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Garanti Ticari Şube"
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Hesap Türü</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  <option value="kasa">Fiziki Kasa (Nakit)</option>
                  <option value="banka">Banka Mevduat Hesabı</option>
                  <option value="pos">POS Cihazı Hesabı</option>
                </select>
              </div>

              {type !== 'kasa' && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1">Banka Adı</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Örn: Garanti BBVA"
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">IBAN / Hesap No</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 mb-1">Açılış Bakiyesi (₺)</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Hesabı Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
              <span>Hesaplar Arası Virman / Para Transferi</span>
            </h3>
            <form onSubmit={handleTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Kaynak Hesap (Para Çıkışı) *</label>
                <select
                  value={fromAcc}
                  onChange={(e) => setFromAcc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Hedef Hesap (Para Girişi) *</label>
                <select
                  value={toAcc}
                  onChange={(e) => setToAcc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Transfer Tutarı (₺) *</label>
                <input
                  type="number"
                  min="1"
                  value={transferAmount || ''}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Transferi Tamamla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
