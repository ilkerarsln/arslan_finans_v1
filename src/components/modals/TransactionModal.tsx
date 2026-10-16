import React, { useEffect, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType } from '../../types/finance';
import {
  X,
  ArrowRightLeft,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Plus,
  Layers,
  Calendar,
  Sparkles,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  calculateInstallmentDate,
} from '../../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    prefillTransaction,
    addTransaction,
    updateTransaction,
    createInstallmentPlan,
    accounts,
    caris,
    addCari,
    categories,
    addCategory,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('Gelir');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [cariName, setCariName] = useState<string>('');
  const [cariId, setCariId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [documentNo, setDocumentNo] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(6);
  const [firstDueDate, setFirstDueDate] = useState<string>('');
  const [isPosOffset, setIsPosOffset] = useState<boolean>(false);
  const [supplierCariId, setSupplierCariId] = useState<string>('');

  useEffect(() => {
    if (isTransactionModalOpen) {
      const today = new Date().toISOString().split('T')[0];
      const defaultMaturity = new Date();
      defaultMaturity.setDate(defaultMaturity.getDate() + 30);
      const defaultMaturityStr = defaultMaturity.toISOString().split('T')[0];

      if (prefillTransaction && prefillTransaction.id) {
        setEditingId(prefillTransaction.id);
        setType(prefillTransaction.type || 'Gelir');
        setAmount(prefillTransaction.amount?.toString() || '');
        setDate(prefillTransaction.date || today);
        setDueDate(prefillTransaction.dueDate || defaultMaturityStr);
        setFirstDueDate(prefillTransaction.date || today);
        setCategory(prefillTransaction.category || '');
        setCariName(prefillTransaction.cariName || '');
        setCariId(prefillTransaction.cariId || '');
        setAccountId(prefillTransaction.accountId || (accounts[0]?.id || ''));
        setTargetAccountId(prefillTransaction.targetAccountId || '');
        setDesc(prefillTransaction.desc || '');
        setDocumentNo(prefillTransaction.documentNo || '');
        setIsInstallment(false);
        setIsPosOffset(Boolean(prefillTransaction.isPosOffset));
        setSupplierCariId(prefillTransaction.supplierCariId || '');
      } else {
        setEditingId(null);
        setType(prefillTransaction?.type || 'Gelir');
        setAmount(prefillTransaction?.amount ? prefillTransaction.amount.toString() : '');
        const targetDate = prefillTransaction?.date || today;
        setDate(targetDate);
        setDueDate(prefillTransaction?.dueDate || defaultMaturityStr);
        setFirstDueDate(targetDate);
        setCategory(
          prefillTransaction?.category ||
            (prefillTransaction?.type === 'Mal Alımı' ? 'Mal / Stok Alımı' : '')
        );
        setCariName(prefillTransaction?.cariName || '');
        setCariId(prefillTransaction?.cariId || '');
        const defaultAcc = prefillTransaction?.accountId || accounts[0]?.id || '';
        setAccountId(defaultAcc);
        setTargetAccountId(prefillTransaction?.targetAccountId || accounts[1]?.id || '');
        setDesc(prefillTransaction?.desc || '');
        setDocumentNo(prefillTransaction?.documentNo || '');
        setIsInstallment(false);
        setInstallmentsCount(6);
        const isPos = Boolean(
          prefillTransaction?.isPosOffset ||
            accounts.find(a => a.id === defaultAcc)?.type === 'POS Cihazı / Hesabı'
        );
        setIsPosOffset(isPos);
        setSupplierCariId(prefillTransaction?.supplierCariId || '');
      }
      setIsAddingNewCategory(false);
      setNewCategoryName('');
    }
  }, [isTransactionModalOpen, prefillTransaction, accounts]);

  if (!isTransactionModalOpen) return null;

  const filteredCategories = categories.filter(c => {
    if (type === 'Transfer') return c.type === 'Gider';
    if (type === 'Mal Alımı') return c.type === 'Gider';
    return c.type === type;
  });

  const handleCariSelect = (name: string) => {
    setCariName(name);
    const matched = caris.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (matched) {
      setCariId(matched.id);
    } else {
      setCariId('');
    }
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim(), type === 'Gelir' ? 'Gelir' : 'Gider');
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (type === 'Transfer') {
      if (!accountId || !targetAccountId || accountId === targetAccountId) {
        alert('Lütfen farklı kaynak ve hedef hesaplar seçin.');
        return;
      }
    }

    let finalCariId = cariId;
    if (type === 'Mal Alımı' && cariName.trim() && !finalCariId) {
      const existing = caris.find(c => c.name.toLowerCase() === cariName.trim().toLowerCase());
      if (existing) {
        finalCariId = existing.id;
      } else {
        const created = addCari({
          name: cariName.trim(),
          type: 'Tedarikçi',
          balance: 0,
        });
        finalCariId = created.id;
      }
    }

    const isEffectivePosOffset =
      type === 'Gelir' &&
      (isPosOffset || Boolean(accounts.find(a => a.id === accountId && (a.type === 'POS Cihazı / Hesabı' || a.name.toLowerCase().includes('pos'))))) &&
      Boolean(supplierCariId);

    const matchedSupplier = isEffectivePosOffset ? caris.find(c => c.id === supplierCariId) : null;

    const payload = {
      date: date || new Date().toISOString().split('T')[0],
      dueDate: type === 'Mal Alımı' ? (dueDate || new Date().toISOString().split('T')[0]) : undefined,
      type,
      category:
        type === 'Transfer'
          ? 'Virman'
          : type === 'Mal Alımı'
          ? category || 'Mal / Stok Alımı'
          : category || 'Genel',
      cariId: finalCariId || undefined,
      cariName: cariName.trim() || undefined,
      supplierCariId: isEffectivePosOffset ? supplierCariId : undefined,
      supplierCariName: matchedSupplier ? matchedSupplier.name : undefined,
      isPosOffset: isEffectivePosOffset,
      desc:
        desc.trim() ||
        (type === 'Mal Alımı'
          ? 'Mal Alımı / Tedarikçi Borçlandırması'
          : isEffectivePosOffset && matchedSupplier
          ? `POS Tahsilatı (Mahsup: ${matchedSupplier.name})`
          : ''),
      amount: numAmount,
      accountId: accountId || accounts[0]?.id || 'acc-kasa',
      targetAccountId: type === 'Transfer' ? targetAccountId : undefined,
      status: 'Tamamlandı' as const,
      documentNo: documentNo.trim() || undefined,
    };

    if (!editingId && isInstallment && type !== 'Transfer' && type !== 'Mal Alımı') {
      const count = Math.max(1, Math.floor(installmentsCount || 1));
      const targetFirstDueDate = firstDueDate || date || new Date().toISOString().split('T')[0];
      createInstallmentPlan({
        type: type === 'Gelir' ? 'Gelir' : 'Gider',
        totalAmount: numAmount,
        installmentsCount: count,
        firstDueDate: targetFirstDueDate,
        cariId: finalCariId || undefined,
        cariName: cariName.trim() || undefined,
        category: category || (type === 'Gelir' ? 'Taksitli Satış' : 'Taksitli Mal Alımı'),
        accountId,
        documentNo: documentNo.trim() || undefined,
        notes: desc.trim() || undefined,
      });
      closeTransactionModal();
      return;
    }

    if (editingId) {
      updateTransaction({
        ...payload,
        id: editingId,
        createdAt: prefillTransaction?.createdAt || new Date().toISOString(),
      });
    } else {
      addTransaction(payload);
    }
    closeTransactionModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                type === 'Gelir'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : type === 'Gider'
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : type === 'Mal Alımı'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
              }`}
            >
              {type === 'Gelir' && <ArrowDownRight className="w-5 h-5" />}
              {type === 'Gider' && <ArrowUpRight className="w-5 h-5" />}
              {type === 'Mal Alımı' && <ShoppingBag className="w-5 h-5" />}
              {type === 'Transfer' && <ArrowRightLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId
                  ? 'İşlemi Düzenle'
                  : type === 'Mal Alımı'
                  ? 'Yeni Mal Alımı (Tedarikçi Borcu)'
                  : 'Yeni Finansal İşlem'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {type === 'Mal Alımı'
                  ? 'Kasadan nakit düşmeden vadeli tedarikçi borçlandırması'
                  : 'Kasa, banka ve cari hesap hareket kaydı'}
              </p>
            </div>
          </div>
          <button
            onClick={closeTransactionModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            İşlem Türü
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setType('Gelir')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'Gelir'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Gelir (Tahsilat)
            </button>
            <button
              type="button"
              onClick={() => setType('Gider')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'Gider'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Gider (Ödeme)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('Mal Alımı');
                if (!category) setCategory('Mal / Stok Alımı');
              }}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'Mal Alımı'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Mal Alımı (Borç)
            </button>
            <button
              type="button"
              onClick={() => setType('Transfer')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === 'Transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Virman
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'Mal Alımı' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tutar (₺) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₺
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold font-mono-num outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alış Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Vade Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tutar (₺) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₺
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold font-mono-num outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İşlem Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {type !== 'Transfer' ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Yeni Kategori Ekle
                  </button>
                </div>
                {isAddingNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Yeni kategori adı..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
                    >
                      Ekle
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Kategori Seçin...</option>
                    {type === 'Mal Alımı' && <option value="Mal / Stok Alımı">Mal / Stok Alımı</option>}
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="Diğer">Diğer</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {type === 'Mal Alımı' ? 'Tedarikçi Firma / Satıcı *' : 'Cari / Firma Adı'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required={type === 'Mal Alımı'}
                    list="cari-datalist"
                    value={cariName}
                    onChange={e => handleCariSelect(e.target.value)}
                    placeholder={
                      type === 'Mal Alımı'
                        ? 'Mal aldığınız tedarikçi firma adını yazın veya seçin...'
                        : 'Müşteri, Tedarikçi veya Firma adı...'
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                  <datalist id="cari-datalist">
                    {caris.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.type} {c.balance !== 0 ? `(Bakiye: ₺${c.balance})` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {type === 'Mal Alımı' ? (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Kasadan Nakit Düşmez (Doğrudan Tedarikçi Borcu)</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Bu işlem kasadan nakit düşmeden doğrudan <strong>{cariName || 'ilgili tedarikçiye'}</strong> borç olarak kaydedilir. Seçilen <strong>{dueDate ? formatDate(dueDate) : 'vade'}</strong> ödeme tarihi ise otomatik olarak Vade Takvimi'ne eklenir.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {type === 'Gelir' ? 'Tahsilat Hesabı / Kasa / POS' : 'Ödeme Hesabı / Kasa / Kart'} *
                    </label>
                    <select
                      value={accountId}
                      onChange={e => {
                        const newAccId = e.target.value;
                        setAccountId(newAccId);
                        const sel = accounts.find(a => a.id === newAccId);
                        if (type === 'Gelir' && sel && (sel.type === 'POS Cihazı / Hesabı' || sel.name.toLowerCase().includes('pos'))) {
                          setIsPosOffset(true);
                        }
                      }}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type}) — Mevcut: ₺{acc.balance.toLocaleString('tr-TR')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {type === 'Gelir' && (
                    <div className="p-3 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          <input
                            type="checkbox"
                            checked={isPosOffset}
                            onChange={e => setIsPosOffset(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>POS Tahsilatını Tedarikçi Cari Borcundan Düş (Mahsup Et)</span>
                        </label>
                      </div>

                      {isPosOffset && (
                        <div className="space-y-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Mahsup Edilecek Tedarikçi Cari Hesabı
                          </label>
                          <select
                            value={supplierCariId}
                            onChange={e => setSupplierCariId(e.target.value)}
                            required={isPosOffset}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 font-medium"
                          >
                            <option value="">Tedarikçi Firma Seçin...</option>
                            {caris
                              .filter(c => c.type === 'Tedarikçi')
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} {c.balance !== 0 ? `(Borcumuz: ₺${Math.abs(c.balance).toLocaleString('tr-TR')})` : '(Bakiye: ₺0)'}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  Kaynak Hesap (Para Çıkacak)
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === targetAccountId}>
                      {acc.name} (₺{acc.balance.toLocaleString('tr-TR')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                  Hedef Hesap (Para Girecek)
                </label>
                <select
                  value={targetAccountId}
                  onChange={e => setTargetAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === accountId}>
                      {acc.name} (₺{acc.balance.toLocaleString('tr-TR')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Taksitlendirme */}
          {!editingId && type !== 'Transfer' && type !== 'Mal Alımı' && (
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl space-y-2">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => {
                      const checked = e.target.checked;
                      setIsInstallment(checked);
                      if (checked && !firstDueDate) {
                        setFirstDueDate(date || new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Otomatik Taksitlendir (30'ar Günlük Periyot)
                  </span>
                </div>
                {isInstallment && parseFloat(amount) > 0 && installmentsCount > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(parseFloat(amount) / installmentsCount)} / Ay
                  </span>
                )}
              </label>

              {isInstallment && (
                <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Taksit Sayısı
                      </label>
                      <div className="flex items-center gap-1">
                        {[2, 3, 6, 9, 12].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setInstallmentsCount(cnt)}
                            className={`px-2 py-1 rounded text-xs font-semibold transition ${
                              installmentsCount === cnt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        İlk Vade Tarihi
                      </label>
                      <input
                        type="date"
                        value={firstDueDate || date || new Date().toISOString().split('T')[0]}
                        onChange={e => setFirstDueDate(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description & Document No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Açıklama
              </label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Örn: Ekim ayı kira bedeli, Fatura ödemesi..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Belge / Fatura No (Opsiyonel)
              </label>
              <input
                type="text"
                value={documentNo}
                onChange={e => setDocumentNo(e.target.value)}
                placeholder="FTR-2026-001"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
                type === 'Gelir'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'Gider'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : type === 'Mal Alımı'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Güncelle' : type === 'Mal Alımı' ? 'Mal Alımı & Borcu Kaydet' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
