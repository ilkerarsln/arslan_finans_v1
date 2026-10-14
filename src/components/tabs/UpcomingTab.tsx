import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { UpcomingDue } from '../../types/finance';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  Layers,
  Trash2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Filter,
  Check
} from 'lucide-react';

export const UpcomingTab: React.FC = () => {
  const {
    upcomingDues,
    toggleUpcomingDue,
    deleteUpcomingDue,
    addUpcomingDue,
    openInstallmentModal,
    caris,
    accounts,
    categories,
    showToast,
  } = useFinance();

  const [filterStatus, setFilterStatus] = useState<'pending' | 'completed' | 'all'>('pending');
  const [filterType, setFilterType] = useState<'all' | 'Gelir' | 'Gider'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Single Due form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'Gelir' | 'Gider'>('Gider');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCariId, setNewCariId] = useState('');
  const [newCategory, setNewCategory] = useState('Diğer');
  const [newAccountId, setNewAccountId] = useState('');

  const filteredDues = useMemo(() => {
    return upcomingDues
      .filter(due => {
        if (filterStatus === 'pending' && due.isCompleted) return false;
        if (filterStatus === 'completed' && !due.isCompleted) return false;
        if (filterType !== 'all' && due.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [upcomingDues, filterStatus, filterType]);

  const totalPendingPayable = useMemo(() => {
    return upcomingDues
      .filter(d => !d.isCompleted && d.type === 'Gider')
      .reduce((sum, d) => sum + d.amount, 0);
  }, [upcomingDues]);

  const totalPendingReceivable = useMemo(() => {
    return upcomingDues
      .filter(d => !d.isCompleted && d.type === 'Gelir')
      .reduce((sum, d) => sum + d.amount, 0);
  }, [upcomingDues]);

  const handleCreateDue = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount.replace(',', '.'));
    if (!newTitle.trim() || isNaN(amountVal) || amountVal <= 0) {
      showToast('Lütfen geçerli bir başlık ve tutar girin.', 'error');
      return;
    }
    const selectedCari = caris.find(c => c.id === newCariId);
    addUpcomingDue({
      title: newTitle.trim(),
      type: newType,
      amount: amountVal,
      dueDate: newDueDate,
      cariId: newCariId || undefined,
      cariName: selectedCari?.name || undefined,
      category: newCategory,
      isCompleted: false,
      recurrence: 'Tek Seferlik',
      accountId: newAccountId || undefined,
    });
    showToast('Yeni vade takvime eklendi.', 'success');
    setShowAddModal(false);
    setNewTitle('');
    setNewAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bekleyen Ödemeler (Giderler)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalPendingPayable)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vadesi yaklaşan mal alışı, çek ve kredi taksitleri
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bekleyen Tahsilatlar (Gelirler)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalPendingReceivable)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vadesi gelen müşteri senetleri, çekler ve alacaklar
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Vade & Taksit İşlemleri
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Toplu taksit planı hazırlayabilir veya tekil vade ekleyebilirsiniz
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => openInstallmentModal()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all"
            >
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Taksit Planı</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Vade Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['pending', 'completed', 'all'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'pending'
                ? 'Sadece Bekleyenler'
                : status === 'completed'
                ? 'Tamamlananlar'
                : 'Tümü'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'Gider', 'Gelir'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === type
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'all' ? 'Tüm Hareketler' : type === 'Gider' ? 'Ödemeler (Gider)' : 'Tahsilatlar (Gelir)'}
            </button>
          ))}
        </div>
      </div>

      {/* Dues List */}
      <div className="space-y-3">
        {filteredDues.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Görüntülenecek vade kaydı bulunmuyor.</p>
            <p className="text-xs text-slate-500 mt-1">Yukarıdaki butonlardan yeni vade veya taksit planı oluşturabilirsiniz.</p>
          </div>
        ) : (
          filteredDues.map(due => {
            const remainingInfo = getDaysRemaining(due.dueDate);
            const isOverdue = remainingInfo.status === 'overdue' && !due.isCompleted;
            const isToday = remainingInfo.status === 'today' && !due.isCompleted;

            return (
              <div
                key={due.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs ${
                  due.isCompleted
                    ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/40'
                    : isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                    : isToday
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => toggleUpcomingDue(due.id)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      due.isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent'
                    }`}
                    title={due.isCompleted ? 'Tekrar Beklemeye Al' : 'Tamamlandı Olarak İşaretle'}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-bold text-sm text-slate-900 dark:text-white ${
                          due.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {due.title}
                      </h4>
                      {due.installmentIndex && due.totalInstallments && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {due.installmentIndex}/{due.totalInstallments} Taksit
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatDate(due.dueDate)}
                      </span>
                      {due.cariName && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {due.cariName}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>{due.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right">
                    <div
                      className={`text-base font-extrabold tabular-nums ${
                        due.type === 'Gelir'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {due.type === 'Gelir' ? '+' : '-'} {formatCurrency(due.amount)}
                    </div>
                    <div className="text-[11px] font-semibold">
                      {due.isCompleted ? (
                        <span className="text-emerald-500">Tamamlandı</span>
                      ) : isOverdue ? (
                        <span className="text-rose-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {remainingInfo.text}
                        </span>
                      ) : isToday ? (
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Bugün vadesi doluyor
                        </span>
                      ) : (
                        <span className="text-slate-400">{remainingInfo.text}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteUpcomingDue(due.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Vade Kaydını Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Single Due Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Yeni Vade / Ödeme Kaydı
            </h3>
            <form onSubmit={handleCreateDue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Vade Başlığı / Açıklama
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kira Ödemesi, Mal Alışı Çeki, vb."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    İşlem Türü
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Gider">Ödeme (Gider)</option>
                    <option value="Gelir">Tahsilat (Gelir)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tutar (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Vade Tarihi
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    İlgili Cari (Opsiyonel)
                  </label>
                  <select
                    value={newCariId}
                    onChange={e => setNewCariId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Seçilmedi</option>
                    {caris.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
