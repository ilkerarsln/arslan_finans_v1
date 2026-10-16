import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Account, AccountTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  Wallet,
  Landmark,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Calendar,
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface KasaDetayRaporViewProps {
  account: Account;
  onBack: () => void;
}

type PeriodType = 'gunluk' | 'haftalik' | 'aylik' | 'yillik' | 'tumu';

export const KasaDetayRaporView: React.FC<KasaDetayRaporViewProps> = ({ account, onBack }) => {
  const { accountTransactions, addAccountTransaction, updateAccountBalance, showToast } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('aylik');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'tumu' | 'giris' | 'cikis' | 'virman'>('tumu');

  // New Transaction Form Modal
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState<'giris' | 'cikis'>('giris');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDescription, setTxDescription] = useState('');
  const [txCategory, setTxCategory] = useState('Nakit Tahsilat');
  const [txRef, setTxRef] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Account specific transactions
  const thisAccountTxs = accountTransactions.filter((tx) => tx.accountId === account.id);

  // Period Filtering logic
  const now = new Date('2026-10-14'); // System date base
  const nowDateStr = '2026-10-14';

  const periodFilteredTxs = thisAccountTxs.filter((tx) => {
    const txDateObj = new Date(tx.date);

    if (selectedPeriod === 'gunluk') {
      return tx.date === nowDateStr;
    } else if (selectedPeriod === 'haftalik') {
      const diffTime = Math.abs(now.getTime() - txDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && tx.date.startsWith('2026-10');
    } else if (selectedPeriod === 'aylik') {
      return tx.date.startsWith('2026-10');
    } else if (selectedPeriod === 'yillik') {
      return tx.date.startsWith('2026');
    }
    return true; // tumu
  });

  // Filtered by Search & Type
  const displayTxs = periodFilteredTxs.filter((tx) => {
    const matchSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.referenceNo && tx.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = typeFilter === 'tumu' || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  // Financial Period Metrics
  const periodTotalIn = periodFilteredTxs
    .filter((tx) => tx.type === 'giris')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const periodTotalOut = periodFilteredTxs
    .filter((tx) => tx.type === 'cikis')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const periodNetFlow = periodTotalIn - periodTotalOut;

  let Icon = Wallet;
  let label = 'Nakit Kasa';
  let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (account.type === 'banka') {
    Icon = Landmark;
    label = 'Ticari Banka Hesabı';
    badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (account.type === 'pos') {
    Icon = CreditCard;
    label = 'POS Cihazı Hesabı';
    badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  }

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0 || !txDescription.trim()) return;

    const delta = txType === 'giris' ? txAmount : -txAmount;
    const newBal = account.balance + delta;

    addAccountTransaction({
      accountId: account.id,
      accountName: account.name,
      date: txDate,
      type: txType,
      amount: txAmount,
      description: txDescription,
      category: txCategory,
      referenceNo: txRef || undefined,
      balanceAfter: newBal,
    });

    updateAccountBalance(account.id, delta);
    showToast(`İşlem başarıyla kaydedildi: ₺${txAmount.toLocaleString('tr-TR')}`, 'success');

    setIsAddTxOpen(false);
    setTxAmount(0);
    setTxDescription('');
    setTxRef('');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Navigation & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Kasa & Banka Hesaplarına Dön</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddTxOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.3]" />
            <span>Yeni Hareket Ekle</span>
          </button>
        </div>
      </div>

      {/* Account Overview Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
            <Icon className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{account.name}</h2>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}>
                {label}
              </span>
            </div>
            {account.bankName && (
              <p className="text-xs text-slate-400 mt-1">
                {account.bankName} &bull; IBAN/No: <span className="font-mono text-slate-300">{account.accountNumber}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              Güncel Sistem Bakiyesi & Dönemsel Hareket Ekstresi
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col items-end">
          <span className="text-[11px] text-slate-400 font-medium">Mevcut Canlı Bakiye</span>
          <span className="text-2xl font-bold text-emerald-400 mt-0.5 font-mono">
            {formatCurrency(account.balance)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Para Birimi: {account.currency}</span>
        </div>
      </div>

      {/* Period Selection Tabs (Günlük, Haftalık, Aylık, Yıllık, Tümü) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Rapor Periyodu:</span>
            </span>
            <button
              onClick={() => setSelectedPeriod('gunluk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedPeriod === 'gunluk'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Günlük (Bugün)
            </button>
            <button
              onClick={() => setSelectedPeriod('haftalik')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedPeriod === 'haftalik'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Haftalık (Son 7 Gün)
            </button>
            <button
              onClick={() => setSelectedPeriod('aylik')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedPeriod === 'aylik'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Aylık (Ekim 2026)
            </button>
            <button
              onClick={() => setSelectedPeriod('yillik')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedPeriod === 'yillik'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Yıllık (2026 Yılı)
            </button>
            <button
              onClick={() => setSelectedPeriod('tumu')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedPeriod === 'tumu'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
              }`}
            >
              Tüm Kayıtlar
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Seçili Dönemde <strong>{periodFilteredTxs.length} İşlem Hareketi</strong>
          </div>
        </div>

        {/* Period Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Dönem Toplam Giriş</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 font-mono block">
                +{formatCurrency(periodTotalIn)}
              </span>
              <span className="text-[10px] text-slate-500">Tahsilat, Nakit & POS Girişleri</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Dönem Toplam Çıkış</span>
              <span className="text-lg font-bold text-rose-400 mt-1 font-mono block">
                -{formatCurrency(periodTotalOut)}
              </span>
              <span className="text-[10px] text-slate-500">Ödemeler, Masraflar & Virmanlar</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Dönem Net Değişimi</span>
              <span className={`text-lg font-bold mt-1 font-mono block ${periodNetFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {periodNetFlow >= 0 ? `+${formatCurrency(periodNetFlow)}` : formatCurrency(periodNetFlow)}
              </span>
              <span className="text-[10px] text-slate-500">Girişler - Çıkışlar Net Farkı</span>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${periodNetFlow >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {periodNetFlow >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
            >
              <option value="tumu">Tüm İşlem Tipleri</option>
              <option value="giris">Yalnızca Girişler (+)</option>
              <option value="cikis">Yalnızca Çıkışlar (-)</option>
              <option value="virman">Hesap Virmanları</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Açıklama, kategori, fiş no ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Detailed Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Tarih</th>
                <th className="py-3 px-3 text-center">İşlem Türü</th>
                <th className="py-3 px-3">Açıklama</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Belge / Fiş No</th>
                <th className="py-3 px-3 text-right">Tutar</th>
                <th className="py-3 px-3 text-right">İşlem Sonrası Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Bu periyot ve arama kriterlerine uygun hesap hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                displayTxs.map((tx) => {
                  const isGiris = tx.type === 'giris';
                  const isVirman = tx.type === 'virman';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-slate-300 font-mono">{formatDate(tx.date)}</td>
                      <td className="py-3 px-3 text-center">
                        {isGiris ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>GİRİŞ</span>
                          </span>
                        ) : isVirman ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>VİRMAN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>ÇIKIŞ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-white">{tx.description}</td>
                      <td className="py-3 px-3 text-slate-400">{tx.category}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-amber-400/90">
                        {tx.referenceNo || '-'}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold font-mono ${isGiris ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isGiris ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold font-mono text-slate-200">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>{account.name} - Yeni Hareket Ekle</span>
            </h3>

            <form onSubmit={handleAddTransaction} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Hareket Türü *</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="giris">Tahsilat / Giriş (+)</option>
                    <option value="cikis">Ödeme / Çıkış (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">İşlem Tutarı (₺) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={txAmount || ''}
                  onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Açıklama *</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Örn: Müşteri Elden Senet Tahsilatı"
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    placeholder="Örn: Nakit Tahsilat"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Belge / Fiş Ref No</label>
                  <input
                    type="text"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="Örn: MAK-1002"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Hareketi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
