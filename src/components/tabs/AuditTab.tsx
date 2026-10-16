import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const AuditTab: React.FC = () => {
  const {
    deletionRequests,
    auditLogs,
    approveDeletionRequest,
    rejectDeletionRequest,
    isAdmin,
  } = useFinance();

  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const filteredRequests = deletionRequests.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
          Denetim İzi & Silme Onay Talepleri
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Personel tarafından silinmek istenen işlemler yöneticinin onayına sunulur. Onaylanmadan hiçbir kayıt sistemden kalıcı olarak çıkarılamaz.
        </p>
      </div>

      {/* Pending Deletion Requests */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Bekleyen Silme Talepleri ({deletionRequests.filter(r => r.status === 'pending').length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 bg-slate-800'
              }`}
            >
              Bekleyenler
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 bg-slate-800'
              }`}
            >
              Tüm Talepler
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Bekleyen onay veya silme talebi bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(req => (
              <div
                key={req.id}
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {req.targetType}
                    </span>
                    <span className="text-xs font-bold text-white">{req.targetTitle}</span>
                    {req.amount && (
                      <span className="text-xs font-mono text-rose-400 font-bold">
                        {formatCurrency(req.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-300/80 mt-1">
                    <span className="text-slate-400">Gerekçe: </span>
                    {req.reason}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Talep Eden: {req.requestedByName} • {formatDate(req.requestedAt)}
                  </p>
                </div>

                {req.status === 'pending' && isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveDeletionRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-rose-900/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Silmeyi Onayla
                    </button>
                    <button
                      onClick={() => rejectDeletionRequest(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reddet
                    </button>
                  </div>
                )}
                {req.status !== 'pending' && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      req.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {req.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-3">Sistem Denetim Günlüğü</h3>
        <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              Kayıtlı sistem hareketi bulunmamaktadır.
            </div>
          ) : (
            auditLogs.slice(0, 30).map(log => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-300">{log.action}: </span>
                  <span className="text-slate-400">{log.description}</span>
                  <span className="text-[10px] text-slate-500 ml-2">({log.performedByName})</span>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
