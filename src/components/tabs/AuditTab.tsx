import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Trash2,
  FileText,
  Search
} from 'lucide-react';

export const AuditTab: React.FC = () => {
  const {
    deletionRequests,
    auditLogs,
    approveDeletionRequest,
    rejectDeletionRequest,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'logs'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReasonModal, setRejectReasonModal] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  const pendingRequests = deletionRequests.filter(r => r.status === 'pending');

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(q) ||
      log.performedByName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q)
    );
  });

  const handleApprove = async (id: string) => {
    try {
      await approveDeletionRequest(id);
      showToast('Silme talebi onaylandı ve kayıt kalıcı olarak kaldırıldı.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Onaylama başarısız oldu.', 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReasonModal) return;
    try {
      await rejectDeletionRequest(rejectReasonModal, rejectReasonText.trim() || undefined);
      showToast('Silme talebi reddedildi.', 'info');
      setRejectReasonModal(null);
      setRejectReasonText('');
    } catch (err: any) {
      showToast(err?.message || 'Reddetme başarısız oldu.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bekleyen Silme Talepleri
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingRequests.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Personelin silme onayı bekleyen işlem kayıtları</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Toplam Denetim Kaydı (Audit)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {auditLogs.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Gerçekleşen ekleme, güncelleme ve onay kayıtları</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Güvenlik ve Onay Mekanizması
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Standart kullanıcılar işlem ve cari kayıtlarını doğrudan silemez; yönetici onayı gerekir.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setActiveSubTab('requests')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'requests'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Onay Talepleri ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Denetim İzi ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content depending on subtab */}
      {activeSubTab === 'requests' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Yönetici Onayı Bekleyen Silme Talepleri
            </h3>
            <p className="text-xs text-slate-500">
              Onaylanan talepler kaydı kalıcı olarak siler, reddedilenler ise durumu geri alır.
            </p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Şu anda bekleyen onay talebi bulunmuyor.
              </p>
              <p className="text-xs text-slate-500 mt-1">Personeller tarafından silme talebi oluşturulduğunda burada listelenir.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50">
                        {req.targetType === 'transaction' ? 'Finansal Hareket' : 'Cari Kart'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {req.targetTitle}
                      </h4>
                      {req.amount !== undefined && (
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                          ({formatCurrency(req.amount)})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Talep Eden: <strong className="text-slate-700 dark:text-slate-300">{req.requestedByName}</strong></span>
                      <span>•</span>
                      <span>Tarih: {formatDate(req.requestedAt)}</span>
                      {req.reason && (
                        <>
                          <span>•</span>
                          <span>Gerekçe: <em>"{req.reason}"</em></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => setRejectReasonModal(req.id)}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reddet</span>
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex items-center gap-1.5 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Onayla ve Sil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Sistem Denetim İzi (Audit Log)
              </h3>
              <p className="text-xs text-slate-500">
                Sistemdeki tüm finansal işlemlerin kim tarafından ne zaman yapıldığı kaydı
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Loglarda ara..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Zaman</th>
                  <th className="py-3 px-4">Kullanıcı</th>
                  <th className="py-3 px-4">İşlem Türü</th>
                  <th className="py-3 px-4">Varlık</th>
                  <th className="py-3 px-4">Açıklama</th>
                  <th className="py-3 px-4 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Henüz denetim kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {log.performedByName} ({log.userRole})
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
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
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Silme Talebini Reddet
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Personele iletilmek üzere bir gerekçe belirtebilirsiniz.
            </p>
            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={e => setRejectReasonText(e.target.value)}
              placeholder="Red gerekçesini yazın..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectReasonModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
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
