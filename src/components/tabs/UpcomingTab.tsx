import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Building2,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';

export const UpcomingTab: React.FC = () => {
  const {
    upcomingDues,
    toggleUpcomingDue,
    deleteUpcomingDue,
    accounts,
    caris,
    isAdmin,
  } = useFinance();

  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('PENDING');

  const filteredDues = upcomingDues.filter(d => {
    if (filter === 'PENDING') return !d.isCompleted;
    if (filter === 'PAID') return d.isCompleted;
    return true;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const totalPending = upcomingDues
    .filter(d => !d.isCompleted)
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            Yaklaşan Ödemeler, Senet & Vadeler
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kredi kartı ekstreleri, çek/senet vadeleri ve tedarikçi mal alımı borçlarını takip edin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Bekleyen Toplam: </span>
            <span className="font-bold text-rose-400">{formatCurrency(totalPending)}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'PENDING'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Bekleyenler ({upcomingDues.filter(d => !d.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('PAID')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'PAID'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Tamamlananlar ({upcomingDues.filter(d => d.isCompleted).length})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'ALL'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          Tümü ({upcomingDues.length})
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDues.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 bg-slate-900/20 rounded-2xl border border-slate-800/40">
            Kayıtlı vade/ödeme bulunmamaktadır.
          </div>
        ) : (
          filteredDues.map(due => {
            const dueInfo = getDaysRemaining(due.dueDate);
            const isOverdue = dueInfo.status === 'overdue' && !due.isCompleted;

            return (
              <div
                key={due.id}
                className={`p-4 rounded-2xl border transition-all ${
                  due.isCompleted
                    ? 'bg-slate-900/20 border-slate-800/40 opacity-70'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-900/50'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      {due.type}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{due.title}</h3>
                    {due.cariName && (
                      <p className="text-xs text-indigo-400 mt-0.5">{due.cariName}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-bold text-rose-400 block">
                      {formatCurrency(due.amount)}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Vade: {formatDate(due.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {due.isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Tamamlandı
                      </span>
                    ) : isOverdue ? (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-4 h-4" /> {dueInfo.text}
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-semibold">
                        <Clock className="w-4 h-4" /> {dueInfo.text}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleUpcomingDue(due.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        due.isCompleted
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {due.isCompleted ? 'Ödenmedi Yap' : 'Ödendi Olarak İşle'}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => deleteUpcomingDue(due.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
