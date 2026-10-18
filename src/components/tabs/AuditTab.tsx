import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Search,
  Filter,
  User,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AuditTab: React.FC = () => {
  const {
    deletionRequests,
    auditLogs,
    approveDeletionRequest,
    rejectDeletionRequest,
    isAdmin,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'logs'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pendingRequestsCount = deletionRequests.filter(r => r.status === 'pending').length;

  const filteredRequests = deletionRequests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = r.targetTitle.toLowerCase().includes(q);
      const matchBy = r.requestedByName?.toLowerCase().includes(q) || r.requestedBy?.toLowerCase().includes(q);
      const matchReason = r.reason?.toLowerCase().includes(q);
      return matchTitle || matchBy || matchReason;
    }
    return true;
  });

  const filteredLogs = auditLogs.filter(log => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.performedByName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApprove = async (id: string) => {
    if (!isAdmin) {
      showToast('Yalnızca yönetici bu işlemi onaylayabilir.', 'error');
      return;
    }
    try {
      await approveDeletionRequest(id);
      showToast('Silme talebi onaylandı ve işlem silindi.', 'success');
    } catch {
      showToast('Silme işlemi onaylanırken bir hata oluştu.', 'error');
    }
  };

  const handleReject = async (id: string) => {
    if (!isAdmin) {
      showToast('Yalnızca yönetici bu işlemi reddedebilir.', 'error');
      return;
    }
    try {
      await rejectDeletionRequest(id, rejectReason[id] || 'Yönetici tarafından reddedildi');
      setRejectingId(null);
      showToast('Silme talebi reddedildi.', 'info');
    } catch {
      showToast('Talep reddedilirken bir hata oluştu.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">İşlem Denetimi & Onay Merkezi</h2>
            <p className="text-xs text-slate-400">Silme onay talepleri, personel işlem günlükleri ve denetim izi</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'requests'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Silme Talepleri</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-slate-950 font-bold rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Denetim Günlüğü ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeSubTab === 'requests' ? 'Kayıt başlığı, personel veya açıklama ara...' : 'Denetim günlüğünde ara...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {activeSubTab === 'requests' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede ({pendingRequestsCount})</option>
              <option value="approved">Onaylananlar</option>
              <option value="rejected">Reddedilenler</option>
            </select>
          </div>
        )}
      </div>

      {/* Subtab 1: Deletion Requests */}
      {activeSubTab === 'requests' && (
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Bekleyen Onay Talebi Bulunmuyor</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Personellerin sildiği işlemler için onay mekanizması aktiftir. Onay bekleyen talep olduğunda burada listelenir.
              </p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';

              return (
                <div
                  key={req.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-300 font-medium">
                        {req.targetType === 'transaction' ? 'Finansal Hareket' : 'Cari Hesap'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded font-semibold ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPending ? 'Onay Bekliyor' : isApproved ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                      {req.amount !== undefined && (
                        <span className="text-xs font-mono font-bold text-white">
                          {formatCurrency(req.amount)}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white">{req.targetTitle}</h4>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Talebi Açan: <strong className="text-slate-300">{req.requestedByName || req.requestedBy}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatDate(req.requestedAt)}
                      </span>
                    </div>

                    {req.reason && (
                      <p className="text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 mt-1">
                        Gerekçe: {req.reason}
                      </p>
                    )}
                  </div>

                  {/* Actions for Admin */}
                  {isPending && isAdmin && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      {rejectingId === req.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ret gerekçesi..."
                            value={rejectReason[req.id] || ''}
                            onChange={e =>
                              setRejectReason({ ...rejectReason, [req.id]: e.target.value })
                            }
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <button
                            onClick={() => handleReject(req.id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                          >
                            Reddet
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Silmeyi Onayla</span>
                          </button>
                          <button
                            onClick={() => setRejectingId(req.id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-lg text-xs font-semibold transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reddet</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Subtab 2: Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tarih / Saat</th>
                  <th className="py-3 px-4">İşlem Türü</th>
                  <th className="py-3 px-4">Varlık</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4">Tutar</th>
                  <th className="py-3 px-4">Personel</th>
                  <th className="py-3 px-4">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      Kayıtlı denetim günlüğü bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            log.action === 'Ekleme'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : log.action === 'Güncelleme'
                              ? 'bg-sky-500/10 text-sky-400'
                              : log.action.includes('Silme')
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-medium">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-slate-200 min-w-[200px]">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                        {log.amount !== undefined ? formatCurrency(log.amount) : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {log.performedByName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.userRole === 'Admin'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {log.userRole}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
