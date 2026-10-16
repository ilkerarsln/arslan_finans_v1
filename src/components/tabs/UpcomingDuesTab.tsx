import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Check,
  Building,
  User,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { UpcomingDue } from '../../types/finance';

export const UpcomingDuesTab: React.FC = () => {
  const { upcomingDues, toggleUpcomingDue, caris, accounts } = useFinance();

  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Gider' | 'Gelir'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredDues = useMemo(() => {
    return upcomingDues
      .filter(due => {
        if (statusFilter === 'pending' && due.isCompleted) return false;
        if (statusFilter === 'completed' && !due.isCompleted) return false;
        if (typeFilter !== 'ALL' && due.type !== typeFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const mTitle = due.title.toLowerCase().includes(q);
          const mCari = (due.cariName || '').toLowerCase().includes(q);
          const mCat = (due.category || '').toLowerCase().includes(q);
          const mDesc = (due.description || '').toLowerCase().includes(q);
          if (!mTitle && !mCari && !mCat && !mDesc) return false;
        }
        return true;
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [upcomingDues, statusFilter, typeFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    let pendingPayable = 0; // Bizim ödeyeceğimiz borçlar (Tedarikçi vadesi, çek vb)
    let pendingReceivable = 0; // Bizim tahsil edeceğimiz alacaklar (Müşteri senetleri vb)
    let overdueCount = 0;

    upcomingDues.forEach(d => {
      if (!d.isCompleted) {
        if (d.type === 'Gider') pendingPayable += d.amount;
        if (d.type === 'Gelir') pendingReceivable += d.amount;
        if (d.dueDate < todayStr) overdueCount++;
      }
    });

    return { pendingPayable, pendingReceivable, overdueCount };
  }, [upcomingDues, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Yaklaşan Tedarikçi & Borç Ödemeleri</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-2">
            {formatCurrency(stats.pendingPayable)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Mal alım ve gider vadeleri</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Beklenen Müşteri Tahsilatları</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {formatCurrency(stats.pendingReceivable)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Taksit ve senet vadeleri</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Günü Geçmiş / Kritik Vadeler</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2">
            {stats.overdueCount} Adet
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Acil işlem gerektirenler</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'pending'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bekleyen Vadeler
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ödenen / Tamamlanan
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü
            </button>
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Tüm Hareketler</option>
            <option value="Gider">Borç Ödemesi (Tedarikçi Borcu / Çek)</option>
            <option value="Gelir">Alacak Tahsilatı (Müşteri Senedi / Alacak)</option>
          </select>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Vade ara (başlık, cari)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Dues List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-3">Vade Tarihi</th>
                <th className="py-3 px-3">Tür</th>
                <th className="py-3 px-4">Başlık & Cari</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-4 text-right">Tutar</th>
                <th className="py-3 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    Kriterlere uygun vade kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredDues.map(item => {
                  const isPayable = item.type === 'Gider';
                  const isOverdue = !item.isCompleted && item.dueDate < todayStr;
                  const isToday = !item.isCompleted && item.dueDate === todayStr;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-850/60 transition ${
                        item.isCompleted ? 'opacity-60 bg-slate-950/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUpcomingDue(item.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                            item.isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-700 hover:border-emerald-500 text-transparent'
                          }`}
                          title={item.isCompleted ? 'Ödenmedi Olarak İşaretle' : 'Ödendi / Tamamlandı'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        <span
                          className={
                            isOverdue
                              ? 'text-rose-400 font-bold'
                              : isToday
                              ? 'text-amber-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {formatDate(item.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="block text-[9px] text-rose-400 font-sans font-semibold">
                            Günü Geçti!
                          </span>
                        )}
                        {isToday && (
                          <span className="block text-[9px] text-amber-400 font-sans font-semibold">
                            Bugün Vadesi!
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPayable
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isPayable ? 'Borç Ödemesi' : 'Tahsilat'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-100">{item.title}</div>
                        {item.cariName && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="text-slate-500">Cari:</span>
                            <span className="text-slate-300 font-medium">{item.cariName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {item.category || item.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isPayable ? 'text-rose-400' : 'text-emerald-400'}>
                          {isPayable ? '-' : '+'}
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleUpcomingDue(item.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                            item.isCompleted
                              ? 'bg-slate-800 text-slate-400 hover:text-white'
                              : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          {item.isCompleted ? 'Geri Al' : 'Tamamla'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
