import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Clock,
  History,
  AlertTriangle,
  User,
  Filter,
  FileText,
  Search,
} from 'lucide-react';

export const AuditTab: React.FC = () => {
  const {
    deletionRequests,
    auditLogs,
    approveDeletionRequest,
    rejectDeletionRequest,
    isAdmin,
    showToast,
  } = useFinance();

  const [activeSection, setActiveSection] = useState<'requests' | 'logs'>('requests');
  const [rejectReasonModalId, setRejectReasonModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');

  const pendingRequests = deletionRequests.filter(r => r.status === 'pending');
  const resolvedRequests = deletionRequests.filter(r => r.status !== 'pending');

  const handleApprove = async (id: string) => {
    if (!isAdmin) {
      showToast('Onaylama yetkisi sadece Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    await approveDeletionRequest(id);
  };

  const handleOpenReject = (id: string) => {
    setRejectReasonModalId(id);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReasonModalId) return;
    await rejectDeletionRequest(rejectReasonModalId, rejectReason.trim() || 'Yönetici tarafından uygun görülmedi.');
    setRejectReasonModalId(null);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (logFilterAction !== 'ALL' && log.action !== logFilterAction) return false;
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchUser = log.performedByName?.toLowerCase().includes(q);
      const matchEntity = log.entityType?.toLowerCase().includes(q);
      if (!matchDesc && !matchUser && !matchEntity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Denetim & Silme Onay Merkezi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standart personelin silme/iptal taleplerini onaylayın veya sistem güvenlik denetim kayıtlarını inceleyin.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSection('requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeSection === 'requests'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Onay Bekleyenler ({pendingRequests.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeSection === 'logs'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-sky-500" />
            <span>Sistem Denetim Günlüğü ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: DELETION REQUESTS */}
      {activeSection === 'requests' && (
        <div className="space-y-6">
          {/* Pending Requests */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Onay Bekleyen Silme & İptal Talepleri ({pendingRequests.length})
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-80" />
                <p className="text-sm font-medium">Şu anda onay bekleyen herhangi bir silme talebi bulunmamaktadır.</p>
                <p className="text-xs text-slate-500 mt-1">Personelin talep ettiği tüm silme işlemleri günceldir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          {req.targetType === 'transaction' ? 'Kasa / Hareket' : 'Cari Hesap'}
                        </span>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                          {req.targetTitle}
                        </h4>
                        {req.amount !== undefined && (
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                            ({formatCurrency(req.amount)})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        <strong>Talep Eden:</strong> {req.requestedByName} ({formatDate(req.requestedAt)})
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 bg-white/70 dark:bg-slate-800/80 p-2 rounded-lg border border-amber-100 dark:border-slate-700">
                        <strong>Silme Gerekçesi:</strong> {req.reason || 'Gerekçe belirtilmemiş'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>Onayla ve Sil</span>
                      </button>
                      <button
                        onClick={() => handleOpenReject(req.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors shadow-xs"
                      >
                        <X className="w-4 h-4" />
                        <span>Reddet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Resolved Requests */}
          {resolvedRequests.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-slate-400" />
                Geçmiş Talepler ({resolvedRequests.length})
              </h3>

              <div className="space-y-2">
                {resolvedRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{req.targetTitle}</span>
                      <span className="text-slate-500 ml-2">Talep: {req.requestedByName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {req.status === 'approved' ? 'Onaylandı (Silindi)' : 'Reddedildi'}
                      </span>
                      <span className="text-slate-400 text-[10px]">{formatDate(req.reviewedAt || req.requestedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: AUDIT LOGS */}
      {activeSection === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          {/* Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İşlem veya personel ara..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={logFilterAction}
                onChange={e => setLogFilterAction(e.target.value)}
                className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="ALL">Tüm İşlem Tipleri</option>
                <option value="Ekleme">Ekleme</option>
                <option value="Güncelleme">Güncelleme</option>
                <option value="Silme Talebi">Silme Talebi</option>
                <option value="Silme Onayı">Silme Onayı</option>
                <option value="Silme Reddi">Silme Reddi</option>
                <option value="Kalıcı Silme">Kalıcı Silme</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Tarih & Saat</th>
                  <th className="py-3 px-4">İşlem Türü</th>
                  <th className="py-3 px-4">Modül / Varlık</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4">İşlemi Yapan</th>
                  <th className="py-3 px-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Kayıtlı denetim hareketi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === 'Ekleme'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.action === 'Güncelleme'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : log.action.includes('Silme')
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.performedByName} ({log.userRole})
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        {log.amount !== undefined ? formatCurrency(log.amount) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-5 shadow-2xl">
            <h4 className="font-bold text-slate-800 dark:text-white text-base mb-2">
              Talebi Reddet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Lütfen personelin talebini reddetme gerekçesini belirtiniz.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Örn: Bu kayıt bu ayın muhasebe kapanışına dahildir, silinemez."
              className="w-full h-24 p-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectReasonModalId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
              >
                Reddetmeyi Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
