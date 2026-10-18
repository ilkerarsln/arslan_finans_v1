import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  calculateInstallmentSchedule,
  formatCurrency,
  formatDate,
} from '../../utils/formatters';
import {
  X,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Building2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export const InstallmentModal: React.FC = () => {
  const {
    isInstallmentModalOpen,
    closeInstallmentModal,
    installmentModalPrefill,
    createInstallmentPlan,
    caris,
    accounts,
    categories,
  } = useFinance();

  const [type, setType] = useState<'Gelir' | 'Gider'>('Gider');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [installmentsCount, setInstallmentsCount] = useState<number>(6);
  const [customInstallments, setCustomInstallments] = useState<string>('');
  const [firstDueDate, setFirstDueDate] = useState<string>('');
  const [cariName, setCariName] = useState<string>('');
  const [cariId, setCariId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [documentNo, setDocumentNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Preset installments
  const PRESET_INSTALLMENTS = [2, 3, 4, 6, 9, 12, 18, 24];

  // Initialize form when opened
  useEffect(() => {
    if (isInstallmentModalOpen) {
      const today = new Date().toISOString().split('T')[0];
      setType(installmentModalPrefill?.type || 'Gider');
      setTotalAmount(
        installmentModalPrefill?.totalAmount
          ? installmentModalPrefill.totalAmount.toString()
          : ''
      );
      const initialCount = installmentModalPrefill?.installmentsCount || 6;
      setInstallmentsCount(initialCount);
      setCustomInstallments('');
      setFirstDueDate(installmentModalPrefill?.firstDueDate || today);
      setCariName(installmentModalPrefill?.cariName || '');
      setCariId(installmentModalPrefill?.cariId || '');
      setCategory(
        installmentModalPrefill?.category ||
          (installmentModalPrefill?.type === 'Gelir' ? 'Taksitli Satış' : 'Taksitli Mal Alımı')
      );
      setAccountId(installmentModalPrefill?.accountId || accounts[0]?.id || '');
      setDocumentNo(installmentModalPrefill?.documentNo || '');
      setNotes(installmentModalPrefill?.notes || '');
    }
  }, [isInstallmentModalOpen, installmentModalPrefill, accounts]);

  // Handle Cari selection from list or typed input
  const handleCariSelect = (name: string) => {
    setCariName(name);
    const matched = caris.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (matched) {
      setCariId(matched.id);
    } else {
      setCariId('');
    }
  };

  // Quick date shortcuts
  const setQuickDate = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setFirstDueDate(`${y}-${m}-${day}`);
  };

  // Quick amount preset
  const setQuickAmount = (val: number) => {
    setTotalAmount(val.toString());
  };

  // Parse numerical amount
  const parsedTotal = parseFloat(totalAmount) || 0;
  const activeCount = customInstallments ? parseInt(customInstallments) || 1 : installmentsCount;

  // Selected Cari object for info display
  const selectedCari = useMemo(() => {
    if (cariId) return caris.find(c => c.id === cariId);
    if (cariName) return caris.find(c => c.name.toLowerCase() === cariName.toLowerCase());
    return null;
  }, [cariId, cariName, caris]);

  // Calculate live installment schedule (strictly +30 days per step)
  const previewSchedule = useMemo(() => {
    if (parsedTotal <= 0 || !firstDueDate || activeCount <= 0) return [];
    return calculateInstallmentSchedule(parsedTotal, activeCount, firstDueDate, cariName);
  }, [parsedTotal, activeCount, firstDueDate, cariName]);

  if (!isInstallmentModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTotal <= 0) return;
    if (!firstDueDate) return;
    if (activeCount <= 0) return;

    createInstallmentPlan({
      type,
      totalAmount: parsedTotal,
      installmentsCount: activeCount,
      firstDueDate,
      cariId: cariId || undefined,
      cariName: cariName.trim() || undefined,
      category: category || (type === 'Gelir' ? 'Taksitli Satış' : 'Taksitli Mal Alımı'),
      accountId: accountId || accounts[0]?.id,
      documentNo: documentNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    closeInstallmentModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Otomatik Taksitlendirme & Esnek Vade Planlama
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  30 Günlük Periyot
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toplam tutarı eşit taksitlere böler, 30'ar günlük vadelerle takvim ve cari hareketlere otomatik işler.
              </p>
            </div>
          </div>
          <button
            onClick={closeInstallmentModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Transaction Type (Gelir / Gider) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              İşlem Türü
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('Gider')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                  type === 'Gider'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Tedarikçi / Gider Ödemesi (Borç)
              </button>
              <button
                type="button"
                onClick={() => setType('Gelir')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                  type === 'Gelir'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Müşteri Tahsilatı (Alacak)
              </button>
            </div>
          </div>

          {/* 2. Cari / Firma Adı */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                İlgili Cari / Firma Adı *
              </label>
              {selectedCari && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedCari.balance > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : selectedCari.balance < 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {selectedCari.type} • Bakiye: {formatCurrency(selectedCari.balance)}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                list="installment-cari-list"
                value={cariName}
                onChange={e => handleCariSelect(e.target.value)}
                placeholder="Örn: Atlas Lojistik A.Ş., Demir Çelik Sanayi..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-slate-900 dark:text-white"
              />
              <datalist id="installment-cari-list">
                {caris.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.type} {c.balance !== 0 ? `(Bakiye: ₺${c.balance})` : ''}
                  </option>
                ))}
              </datalist>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Taksit başlıkları otomatik olarak: <span className="font-semibold text-slate-600 dark:text-slate-300">"{cariName.trim() || 'Firma Adı'} - 1/{activeCount} Taksit"</span> şeklinde adlandırılacaktır.
            </p>
          </div>

          {/* 3. Toplam Tutar & Hızlı Seçim */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Toplam Tutar (₺) *
              </label>
              {parsedTotal > 0 && activeCount > 0 && (
                <span className="text-xs font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                  Taksit Başına: {formatCurrency(parsedTotal / activeCount)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ₺
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold font-mono-num outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            {/* Quick amount chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 mr-1">Hızlı Tutar:</span>
              {[15000, 30000, 60000, 90000, 120000, 240000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmount(val)}
                  className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
                >
                  ₺{val.toLocaleString('tr-TR')}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Taksit Sayısı Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Taksit Sayısı
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {PRESET_INSTALLMENTS.map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setInstallmentsCount(cnt);
                    setCustomInstallments('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    !customInstallments && installmentsCount === cnt
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cnt} Taksit
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={customInstallments}
                  onChange={e => setCustomInstallments(e.target.value)}
                  placeholder="Özel"
                  className="w-16 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono-num outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400">Taksit</span>
              </div>
            </div>
          </div>

          {/* 5. Esnek İlk Vade Tarihi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                İlk Taksit Vade Tarihi (dueDate) *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 underline"
                >
                  Bugün
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setQuickDate(15)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 underline"
                >
                  15 Gün Sonra
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setQuickDate(30)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 underline"
                >
                  +30 Gün
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                required
                value={firstDueDate}
                onChange={e => setFirstDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 30 Günlük Periyot Bilgi Kartı */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                30'ar Günlük Sabit Periyot Prensibi:
              </p>
              <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                İlk taksit seçtiğiniz <strong>{firstDueDate ? formatDate(firstDueDate) : 'tarihte'}</strong> başlar. Sonraki tüm taksitler otomatik olarak tam <strong>+30 gün, +60 gün, +90 gün</strong> eklenerek periyodik olarak planlanır.
              </p>
            </div>
          </div>

          {/* 6. Canlı Taksit Planı Önizleme Tablosu */}
          {previewSchedule.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Hesaplanan Taksit Planı Tablosu ({previewSchedule.length} Taksit)
                </span>
                <span className="text-[11px] text-slate-400">
                  Son Vade: {formatDate(previewSchedule[previewSchedule.length - 1].dueDate)}
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Taksit</th>
                      <th className="py-2 px-3">Otomatik Başlık</th>
                      <th className="py-2 px-3">Vade Tarihi</th>
                      <th className="py-2 px-3">Periyot</th>
                      <th className="py-2 px-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewSchedule.map(item => (
                      <tr
                        key={item.index}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {item.index}/{activeCount}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">
                          {item.title}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-mono">
                          {formatDate(item.dueDate)}
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {item.index === 1 ? 'İlk Vade' : `+${(item.index - 1) * 30} Gün`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. Kategori, Hesap & Belge No */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Örn: Mal Alışı, Satış..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                İlgili Banka / Kasa
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sözleşme / Belge No
              </label>
              <input
                type="text"
                value={documentNo}
                onChange={e => setDocumentNo(e.target.value)}
                placeholder="Örn: TKS-2026-001"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              {parsedTotal > 0 && activeCount > 0 ? (
                <span>
                  Toplam: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(parsedTotal)}</strong> • {activeCount} Taksit x {formatCurrency(parsedTotal / activeCount)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={closeInstallmentModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={parsedTotal <= 0 || !firstDueDate}
                className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 ${
                  type === 'Gelir'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Check className="w-4 h-4" />
                Taksit Planını Onayla ve Kaydet ({activeCount} Taksit)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
