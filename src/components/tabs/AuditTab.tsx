import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  User,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AuditTab: React.FC = () => {
  const { deletionRequests, approveDeletionRequest, rejectDeletionRequest, isAdmin } = useFinance();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredRequests = deletionRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>İşlem Denetim & Silme Onay Talepleri</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personeller tarafından silinmek istenen işlemler yöneticinin onayına sunulur
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'pending' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bekleyenler ({deletionRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Onaylananlar
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'rejected' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reddedilenler
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Talep Tarihi</th>
                <th className="py-3 px-3">Modül / Nesne</th>
                <th className="py-3 px-4">Silme Gerekçesi / Açıklama</th>
                <th className="py-3 px-3">Talep Eden</th>
                <th className="py-3 px-3">Durum</th>
                <th className="py-3 px-4 text-center">Yönetici Kararı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    Onay bekleyen silme talebi bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-850/60">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(req.requestedAt)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans font-bold text-slate-200">
                      {(req.targetType || 'İşlem').toUpperCase()}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">
                      {req.reason || req.targetTitle || 'Açıklama belirtilmedi'}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400 whitespace-nowrap">
                      {req.requestedBy || 'Personel'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {req.status === 'pending'
                          ? 'Onay Bekliyor'
                          : req.status === 'approved'
                          ? 'Onaylandı'
                          : 'Reddedildi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {req.status === 'pending' && isAdmin ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => approveDeletionRequest(req.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Silmeyi Onayla</span>
                          </button>
                          <button
                            onClick={() => rejectDeletionRequest(req.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reddet</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-sans">
                          {req.reviewedBy ? `İşleyen: ${req.reviewedBy}` : 'Karar verildi'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
