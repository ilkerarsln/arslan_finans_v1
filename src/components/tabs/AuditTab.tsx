import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DeletionRequest, AuditLogEntry } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  User,
  Calendar,
  FileSpreadsheet,
  Trash2,
  History,
  Activity,
  ArrowUpDown,
  Check,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AuditTab: React.FC = () => {
  const {
    deletionRequests,
    auditLogs,
    approveDeletionRequest,
    rejectDeletionRequest,
    isAdmin,
    userProfile,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'logs'>('requests');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [logSearch, setLogSearch] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [rejectModalItem, setRejectModalItem] = useState<DeletionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered Deletion Requests
  const filteredRequests = useMemo(() => {
    return deletionRequests.filter(req => {
      if (requestFilter === 'all') return true;
      return req.status === requestFilter;
    });
  }, [deletionRequests, requestFilter]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.performedByName.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.entityId.toLowerCase().includes(logSearch.toLowerCase());
      const matchesEntity =
        selectedEntityType === 'all' || log.entityType === selectedEntityType;
      return matchesSearch && matchesEntity;
    });
  }, [auditLogs, logSearch, selectedEntityType]);

  const handleApprove = async (req: DeletionRequest) => {
    if (!isAdmin) {
      showToast('Sadece yöneticiler onay verebilir.', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      await approveDeletionRequest(req.id);
      showToast(`Silme talebi onaylandı ve kayıt kalıcı olarak kaldırıldı.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Onaylama başarısız oldu.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    try {
      setIsProcessing(true);
      await rejectDeletionRequest(rejectModalItem.id, rejectReason || 'Yönetici tarafından reddedildi');
      showToast(`Silme talebi reddedildi.`, 'info');
      setRejectModalItem(null);
      setRejectReason('');
    } catch (err: any) {
      showToast(err?.message || 'Red işlemi başarısız.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAuditLogsToExcel = () => {
    if (auditLogs.length === 0) {
      showToast('Dışa aktarılacak denetim kaydı bulunamadı.', 'info');
      return;
    }
    const data = auditLogs.map(log => ({
      'Tarih / Zaman': log.timestamp,
      'İşlem': log.action,
      'Modül / Tür': log.entityType,
      'Kayıt ID': log.entityId,
      'Açıklama': log.description,
      'Tutar (₺)': log.amount || '',
      'Gerçekleştiren': log.performedByName,
      'Kullanıcı Rolü': log.userRole,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Denetim Günlüğü');
    XLSX.writeFile(workbook, `ArslanFinans_Denetim_Kayitlari_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Denetim günlüğü Excel dosyası olarak indirildi.', 'success');
  };

  const pendingCount = deletionRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Denetim, Onaylar ve Güvenlik
              </h2>
              <p className="text-xs text-slate-400">
                Personel silme taleplerini onaylayın, sistem hareketlerini denetleyin ve çift onay mekanizmasını yönetin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditLogsToExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'requests'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Silme Talepleri ve Onaylar</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'logs'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Sistem Denetim Günlüğü (Audit Log)</span>
          <span className="text-[10px] text-slate-400">({auditLogs.length})</span>
        </button>
      </div>

      {/* Sub Tab: Deletion Requests */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-2">Durum Filtresi:</span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(statusKey => {
                const labels: Record<typeof statusKey, string> = {
                  all: 'Tümü',
                  pending: 'Bekleyenler',
                  approved: 'Onaylananlar',
                  rejected: 'Reddedilenler',
                };
                return (
                  <button
                    key={statusKey}
                    onClick={() => setRequestFilter(statusKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      requestFilter === statusKey
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {labels[statusKey]}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Toplam {filteredRequests.length} kayıt
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium text-sm">
                {requestFilter === 'pending'
                  ? 'Bekleyen silme veya iptal onayı bulunmuyor.'
                  : 'Filtreye uygun talep bulunamadı.'}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Standart personeller bir kaydı silmek istediğinde yönetici onayına düşer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50 shadow-sm'
                        : req.status === 'approved'
                        ? 'bg-slate-900/50 border-slate-800 opacity-80'
                        : 'bg-slate-900/50 border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            req.targetType === 'transaction'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {req.targetType === 'transaction' ? 'Gelir/Gider İşlemi' : 'Cari Kartı'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isPending
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : req.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPending ? 'Beklemede' : req.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDate(req.requestedAt)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-white font-bold text-sm tracking-tight mb-1">
                        {req.targetTitle}
                      </h4>
                      {req.amount !== undefined && (
                        <div className="text-base font-extrabold font-mono text-emerald-400">
                          {formatCurrency(req.amount)}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Talep Eden Personel:</span>
                        <span className="text-slate-200 font-semibold">{req.requestedByName}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-slate-400">
                        <span>Gerekçe:</span>
                        <span className="text-amber-300/90 italic text-right">{req.reason || 'Belirtilmedi'}</span>
                      </div>
                      {req.reviewedBy && (
                        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                          <span>İnceleyen:</span>
                          <span className="text-slate-300 font-mono text-[11px]">{req.reviewedBy}</span>
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/15 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Onayla ve Sil</span>
                        </button>
                        <button
                          onClick={() => setRejectModalItem(req)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold border border-slate-700 hover:border-rose-500/30 transition-all disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reddet</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub Tab: Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Açıklama, personel adı veya ID ile ara..."
                value={logSearch}
                onChange={e => setLogSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <select
                value={selectedEntityType}
                onChange={e => setSelectedEntityType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tüm Modüller</option>
                <option value="Gelir">Gelir İşlemleri</option>
                <option value="Gider">Gider İşlemleri</option>
                <option value="Transfer">Virman / Transfer</option>
                <option value="Mal Alımı">Mal Alımı & Tedarik</option>
                <option value="Satış">Satış & Kâr Takip</option>
                <option value="Stok">Stok Kartları</option>
                <option value="Cari">Cari Kartlar</option>
                <option value="Hesap">Kasa & Bankalar</option>
                <option value="Personel">Personel & Roller</option>
                <option value="Sistem">Sistem Hareketleri</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4 font-semibold">Tarih / Zaman</th>
                    <th className="py-3 px-4 font-semibold">İşlem Türü</th>
                    <th className="py-3 px-4 font-semibold">Modül</th>
                    <th className="py-3 px-4 font-semibold">Açıklama</th>
                    <th className="py-3 px-4 font-semibold text-right">Tutar</th>
                    <th className="py-3 px-4 font-semibold">Personel</th>
                    <th className="py-3 px-4 font-semibold">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Kayıtlı denetim hareketi bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isDanger = log.action.includes('Silme') || log.action.includes('İptal');
                      const isSuccess = log.action.includes('Ekleme') || log.action.includes('Onay');
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isDanger
                                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  : isSuccess
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-300">
                            {log.entityType}
                          </td>
                          <td className="py-3 px-4 text-slate-200 max-w-xs truncate" title={log.description}>
                            {log.description}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                            {log.amount ? formatCurrency(log.amount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                            {log.performedByName}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                log.userRole === 'Admin'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {log.userRole}
                            </span>
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
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Silme Talebini Reddet</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              "{rejectModalItem.targetTitle}" başlıklı kaydın silme talebi reddedilecek ve işlem aktif kalacaktır.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Red Gerekçesi (Opsiyonel)
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Personel bilgilendirmesi için red sebebi giriniz..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                Talebi Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
