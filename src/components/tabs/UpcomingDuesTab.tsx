import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { UpcomingDue } from '../../types/finance';
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
} from '../../utils/formatters';
import {
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Layers,
  MessageCircle,
} from 'lucide-react';

export const UpcomingDuesTab: React.FC = () => {
  const {
    upcomingDues,
    toggleUpcomingDue,
    deleteUpcomingDue,
    deleteInstallmentGroup,
    addUpcomingDue,
    createInstallmentPlan,
    openInstallmentModal,
    openTransactionModal,
    getWhatsAppReminderUrl,
    caris,
  } = useFinance();

  const [filter, setFilter] = useState<'pending' | 'completed' | 'overdue' | 'installments' | 'all'>('pending');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Gelir' | 'Gider'>('Gider');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Mal / Stok Alımı');
  const [cariName, setCariName] = useState('');
  const [recurrence, setRecurrence] = useState<'Tek Seferlik' | 'Aylık' | 'Yıllık'>('Tek Seferlik');

  const [isInstallmentMode, setIsInstallmentMode] = useState(false);
  const [installmentCount, setInstallmentCount] = useState<number>(6);

  const filteredDues = upcomingDues.filter(d => {
    const remaining = getDaysRemaining(d.dueDate);
    if (filter === 'pending') return !d.isCompleted;
    if (filter === 'completed') return d.isCompleted;
    if (filter === 'overdue') return !d.isCompleted && remaining.status === 'overdue';
    if (filter === 'installments') return !!d.installmentGroupId;
    return true;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const pendingCount = upcomingDues.filter(d => !d.isCompleted).length;
  const overdueCount = upcomingDues.filter(d => !d.isCompleted && getDaysRemaining(d.dueDate).status === 'overdue').length;
  const completedCount = upcomingDues.filter(d => d.isCompleted).length;
  const installmentDuesCount = upcomingDues.filter(d => !!d.installmentGroupId).length;

  const pendingIncome = upcomingDues
    .filter(d => !d.isCompleted && d.type === 'Gelir')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingExpense = upcomingDues
    .filter(d => !d.isCompleted && d.type === 'Gider')
    .reduce((sum, d) => sum + d.amount, 0);

  const handleCreateDue = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !dueDate) return;

    if (isInstallmentMode && installmentCount > 1) {
      const matchedCari = caris.find(c => c.name.toLowerCase() === cariName.trim().toLowerCase());
      createInstallmentPlan({
        type,
        totalAmount: numAmount,
        installmentsCount: installmentCount,
        firstDueDate: dueDate,
        title: title.trim() || undefined,
        cariName: cariName.trim() || undefined,
        cariId: matchedCari?.id,
        category: category.trim() || (type === 'Gelir' ? 'Taksitli Satış' : 'Taksitli Mal Alımı'),
      });
    } else {
      if (!title.trim()) return;
      addUpcomingDue({
        title: title.trim(),
        type,
        amount: numAmount,
        dueDate,
        category,
        cariName: cariName.trim() || undefined,
        isCompleted: false,
        recurrence,
      });
    }
    setIsAddModalOpen(false);
    setTitle('');
    setAmount('');
    setDueDate('');
    setCariName('');
    setIsInstallmentMode(false);
    setInstallmentCount(6);
  };

  const handlePayOrCollect = (due: UpcomingDue) => {
    openTransactionModal({
      type: due.type,
      category: due.category,
      desc: due.title,
      amount: due.amount,
      cariName: due.cariName,
      date: new Date().toISOString().split('T')[0],
    });
    toggleUpcomingDue(due.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Vade & Planlı Ödemeler Takvimi
            {overdueCount > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {overdueCount} Gecikmiş Vade
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Yaklaşan çekler, vergi yükleri, taksitli planlar ve vadeli müşteri alacakları
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openInstallmentModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" /> Taksitlendir & Vade Planla
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Vade / Ödeme Ekle
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Beklenen Tahsilatlar
          </span>
          <h3 className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatCurrency(pendingIncome)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Vadesi beklenen toplam nakit girişi
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Yaklaşan Ödemeler
          </span>
          <h3 className="text-2xl font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
            -{formatCurrency(pendingExpense)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Kira, vergi, çek, taksit ve tedarikçi borçları
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Net Planlanan Nakit Değişimi
          </span>
          <h3
            className={`text-2xl font-bold font-mono-num mt-1 ${
              pendingIncome - pendingExpense >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(pendingIncome - pendingExpense)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Gelecek vadelere göre net bakiye etkisi
          </p>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bekleyenler ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              filter === 'overdue'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Gecikenler ({overdueCount})
          </button>
          <button
            onClick={() => setFilter('installments')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition flex items-center gap-1.5 ${
              filter === 'installments'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Taksitli Planlar ({installmentDuesCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tamamlananlar ({completedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tümü ({upcomingDues.length})
          </button>
        </div>
      </div>

      {/* Dues List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredDues.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">Bu filtrede vade kaydı bulunmuyor.</p>
            <p className="text-xs text-slate-400">
              Yeni bir vade kaydı ekleyebilir veya 'Taksitlendir & Vade Planla' ile otomatik plan oluşturabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDues.map(due => {
              const remaining = getDaysRemaining(due.dueDate);
              const isOverdue = remaining.status === 'overdue' && !due.isCompleted;
              const waUrl = getWhatsAppReminderUrl(due.id);

              return (
                <div
                  key={due.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                    due.isCompleted ? 'opacity-60 bg-slate-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleUpcomingDue(due.id)}
                      title={due.isCompleted ? 'Tamamlanmadı yap' : 'Tamamlandı olarak işaretle'}
                      className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                        due.isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold text-sm ${
                            due.isCompleted
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {due.title}
                        </span>
                        {due.installmentIndex && due.totalInstallments && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Taksit {due.installmentIndex}/{due.totalInstallments}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> {remaining.text}
                          </span>
                        )}
                        {!due.isCompleted && !isOverdue && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {remaining.text}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-medium text-slate-600 dark:text-slate-300 font-mono">
                          {formatDate(due.dueDate)}
                        </span>
                        <span>·</span>
                        <span>{due.category}</span>
                        {due.cariName && (
                          <>
                            <span>·</span>
                            <span className="text-slate-500">{due.cariName}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="text-[11px] text-slate-400">
                          {due.installmentGroupId ? "30 Günlük Periyot" : due.recurrence}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                    <div className="text-right">
                      <div
                        className={`text-base font-bold font-mono-num ${
                          due.type === 'Gelir'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {due.type === 'Gelir' ? '+' : '-'}
                        {formatCurrency(due.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {due.type === 'Gelir' ? 'Tahsilat Bekleniyor' : 'Ödeme Yükü'}
                      </span>
                    </div>

                    {!due.isCompleted && (
                      <div className="flex items-center gap-1.5">
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                            title="Müşteriye WhatsApp Vade Hatırlatması Gönder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handlePayOrCollect(due)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition active:scale-95 ${
                            due.type === 'Gelir'
                              ? 'bg-emerald-600 hover:bg-emerald-500'
                              : 'bg-rose-600 hover:bg-rose-500'
                          }`}
                        >
                          {due.type === 'Gelir' ? 'Tahsil Et' : 'Öde'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      {due.installmentGroupId && (
                        <button
                          onClick={() => {
                            if (window.confirm('Bu taksit planına ait TÜM taksitler silinsin mi?')) {
                              deleteInstallmentGroup(due.installmentGroupId!);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition"
                          title="Tüm Taksit Planını Sil"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteUpcomingDue(due.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Bu kaydı sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Due Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Yeni Vade / Ödeme Takvimi Kaydı
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDue} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('Gider')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    type === 'Gider'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Gider (Ödeme)
                </button>
                <button
                  type="button"
                  onClick={() => setType('Gelir')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    type === 'Gelir'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Gelir (Tahsilat)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İlgili Cari / Firma Adı
                </label>
                <input
                  type="text"
                  list="dues-cari-list"
                  value={cariName}
                  onChange={e => setCariName(e.target.value)}
                  placeholder="Müşteri veya Tedarikçi Firma Adı..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <datalist id="dues-cari-list">
                  {caris.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Başlık {isInstallmentMode ? '(Otomatik oluşturulur)' : '*'}
                </label>
                <input
                  type="text"
                  required={!isInstallmentMode}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={
                    isInstallmentMode
                      ? `${cariName.trim() || 'Firma'} - 1/${installmentCount} Taksit`
                      : 'Örn: Fabrika Kira Ödemesi, Atlas Çek Vadesi'
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isInstallmentMode ? 'Toplam Tutar (₺) *' : 'Tutar (₺) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono-num outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isInstallmentMode ? 'İlk Vade Tarihi *' : 'Vade Tarihi *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInstallmentMode}
                      onChange={e => setIsInstallmentMode(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Otomatik Taksitlendir (30'ar Günlük Periyot)
                    </span>
                  </label>
                  {isInstallmentMode && (
                    <span className="text-[11px] font-mono-num font-semibold text-indigo-700 dark:text-indigo-300">
                      {parseFloat(amount) > 0
                        ? `${formatCurrency(parseFloat(amount) / installmentCount)} / Taksit`
                        : ''}
                    </span>
                  )}
                </div>

                {isInstallmentMode && (
                  <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-indigo-900 dark:text-indigo-300 font-medium">
                        Taksit Sayısı:
                      </span>
                      {[2, 3, 4, 6, 9, 12].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setInstallmentCount(cnt)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                            installmentCount === cnt
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Mal Alımı, Fatura..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tekrarlama
                  </label>
                  <select
                    disabled={isInstallmentMode}
                    value={recurrence}
                    onChange={e => setRecurrence(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <option value="Tek Seferlik">Tek Seferlik</option>
                    <option value="Aylık">Her Ay Tekrarla</option>
                    <option value="Yıllık">Her Yıl Tekrarla</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  {isInstallmentMode ? `${installmentCount} Taksitli Planı Kaydet` : 'Takvime Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
