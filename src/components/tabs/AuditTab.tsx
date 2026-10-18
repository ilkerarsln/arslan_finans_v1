import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Search,
  Download,
  AlertTriangle,
  Trash2,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  X,
  FileSpreadsheet,
  Shield,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AuditLogEntry, DeletionRequest } from '../../types/finance';

export const AuditTab: React.FC = () => {
  const {
    auditLogs,
    deletionRequests,
    approveDeletionRequest,
    rejectDeletionRequest,
    transactions,
    isAdmin,
    userProfile,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'audit'>(
    deletionRequests.filter(r => r.status === 'pending').length > 0 ? 'pending' : 'audit'
  );
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Pending deletion requests
  const pendingRequests = useMemo(() => {
    return deletionRequests.filter(r => r.status === 'pending');
  }, [deletionRequests]);

  // Unique users list for filter dropdown
  const uniqueUsers = useMemo(() => {
    const usersSet = new Set<string>();
    auditLogs.forEach(l => {
      if (l.performedByName) usersSet.add(l.performedByName);
      else if (l.performedBy) usersSet.add(l.performedBy);
    });
    // Also include creators from transactions
    transactions.forEach(t => {
      if (t.createdByName) usersSet.add(t.createdByName);
      else if (t.createdBy) usersSet.add(t.createdBy);
    });
    return Array.from(usersSet);
  }, [auditLogs, transactions]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        searchTerm === '' ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.performedByName && log.performedByName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.entityType && log.entityType.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesUser =
        userFilter === 'ALL' ||
        log.performedByName === userFilter ||
        log.performedBy === userFilter;

      return matchesSearch && matchesAction && matchesUser;
    });
  }, [auditLogs, searchTerm, actionFilter, userFilter]);

  const handleApprove = async (req: DeletionRequest) => {
    if (!window.confirm(`"${req.targetTitle}" işlemini kalıcı olarak silmeyi ve onaylamayı kabul ediyor musunuz? Bakiye otomatik düzeltilecektir.`)) {
      return;
    }
    setIsProcessingId(req.id);
    try {
      await approveDeletionRequest(req.id);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleReject = async (req: DeletionRequest) => {
    const reason = window.prompt(
      `"${req.targetTitle}" silme talebini reddetme gerekçenizi yazın (isteğe bağlı):`,
      'Yönetici tarafından işlem uygun görüldü, silinmedi.'
    );
    if (reason === null) return; // user cancelled prompt

    setIsProcessingId(req.id);
    try {
      await rejectDeletionRequest(req.id, reason.trim() || undefined);
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Dışa aktarılacak denetim kaydı bulunamadı.');
      return;
    }

    const headers = ['Zaman Damgası', 'İşlem Yapan Kullanıcı', 'Yetki Rolü', 'Eylem', 'Varlık Türü', 'Açıklama', 'Tutar'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('tr-TR'),
      `"${log.performedByName || log.performedBy}"`,
      log.userRole,
      log.action,
      log.entityType,
      `"${log.description.replace(/"/g, '""')}"`,
      log.amount ? log.amount : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arslan_finans_denetim_raporu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Onay Bekleyen Talepler */}
        <div
          onClick={() => setActiveSubTab('pending')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            pendingRequests.length > 0
              ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15 ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Onay Bekleyen Silme Talepleri
            </span>
            <div className={`p-2 rounded-xl ${pendingRequests.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono-num ${pendingRequests.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {pendingRequests.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">talep</span>
          </div>
          {pendingRequests.length > 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Yönetici incelemesi ve onayı gerekiyor
            </p>
          )}
        </div>

        {/* Card 2: Toplam Denetim Kaydı */}
        <div
          onClick={() => setActiveSubTab('audit')}
          className="cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Toplam Denetim Kaydı
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white">
              {auditLogs.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">kayıt</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Eklenen, güncellenen ve silinen tüm finansal hareketler
          </p>
        </div>

        {/* Card 3: İşlem Yapan Kullanıcılar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              İşlem Kaydeden Personel
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white">
              {uniqueUsers.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">aktif kullanıcı</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Her işlemin kim tarafından eklendiği takip altındadır
          </p>
        </div>

        {/* Card 4: Silme & Yetki Güvencesi */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Silme & İptal Politikası
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Yalnızca Admin Onaylı
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Personeller doğrudan silemez, Admin onayına sunulur
          </p>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Onay Bekleyen Silme Talepleri</span>
          {pendingRequests.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeSubTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
            }`}>
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>İşlem Denetim Raporu (Audit Trail)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeSubTab === 'audit' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: Onay Bekleyen Silme Talepleri */}
      {activeSubTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Personel Silme & İptal Onay Talepleri ({pendingRequests.length})
              </h3>
              <p className="text-xs text-slate-400">
                Standart kullanıcıların silmek istediği işlemler bu listeye düşer. Yönetici onayı olmadan işlem silinmez.
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
                {pendingRequests.length} talep onay bekliyor
              </span>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Onay bekleyen silme veya iptal talebi bulunmuyor.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Personeller herhangi bir işlemi veya cari kartı silmek istediğinde talep burada görüntülenecektir.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Talep Tarihi</th>
                    <th className="py-3 px-4">Talep Eden Personel</th>
                    <th className="py-3 px-4">Tür & İşlem Başlığı</th>
                    <th className="py-3 px-4 text-right">Tutar</th>
                    <th className="py-3 px-4">Silme Gerekçesi</th>
                    <th className="py-3 px-4 text-center">Yönetici Kararı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingRequests.map(req => {
                    const isProcessing = isProcessingId === req.id;
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(req.requestedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                              {req.requestedByName ? req.requestedByName[0].toUpperCase() : 'P'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                {req.requestedByName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                @{req.requestedBy}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 mr-1">
                            {req.targetType === 'transaction' ? 'Finansal İşlem' : 'Cari Kart'}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                            {req.targetTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {req.targetId}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-num font-bold whitespace-nowrap text-slate-900 dark:text-white">
                          {req.amount !== undefined ? formatCurrency(req.amount) : '-'}
                        </td>
                        <td className="py-3.5 px-4 max-w-[240px]">
                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 italic">
                            &ldquo;{req.reason}&rdquo;
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs active:scale-95 disabled:opacity-50"
                              title="Silme talebini onayla: İşlem kalıcı olarak silinir ve bakiye geri alınır"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Onayla & Sil</span>
                            </button>
                            <button
                              onClick={() => handleReject(req)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold text-xs transition active:scale-95 disabled:opacity-50"
                              title="Silme talebini reddet: İşlem aktif tutulur"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reddet</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Detaylı İşlem Denetim Raporu */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Denetim loglarında ara (personel, işlem, açıklama)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tüm Eylemler</option>
                <option value="Ekleme">Yalnızca Eklemeler</option>
                <option value="Güncelleme">Güncellemeler</option>
                <option value="Silme Talebi">Silme Talepleri</option>
                <option value="Silme Onayı">Silme Onayları</option>
                <option value="Silme Reddi">Silme Redleri</option>
                <option value="Kalıcı Silme">Kalıcı Silmeler</option>
              </select>

              {/* User Filter */}
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Tüm Kullanıcılar</option>
                {uniqueUsers.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-xs shrink-0"
              title="Filtrelenen denetim raporunu CSV olarak indir"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Raporu İndir</span>
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                İşlem Denetim Kayıtları ({filteredLogs.length})
              </h3>
              <span className="text-xs text-slate-400">
                Sistemdeki tüm kayıtların izlenebilirliği
              </span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Filtreye uygun denetim kaydı bulunamadı.
                </p>
                <p className="text-xs text-slate-400">
                  Arama terimini değiştirebilir veya filtreleri sıfırlayabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tarih & Zaman</th>
                      <th className="py-3 px-4">İşlem Yapan Kullanıcı</th>
                      <th className="py-3 px-4">Eylem</th>
                      <th className="py-3 px-4">Varlık</th>
                      <th className="py-3 px-4">Açıklama / İşlem Detayı</th>
                      <th className="py-3 px-4 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLogs.map(log => {
                      const logDate = new Date(log.timestamp);
                      const formattedTime = logDate.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                      const formattedDate = logDate.toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">
                              {formattedDate}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formattedTime}
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                                {log.performedByName ? log.performedByName[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                  {log.performedByName || log.performedBy}
                                </span>
                                <div className="flex items-center gap-1">
                                  {log.userRole === 'Admin' ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                      <Shield className="w-2.5 h-2.5" /> Admin
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                                      <UserCheck className="w-2.5 h-2.5" /> Personel
                                    </span>
                                  )}
                                  {log.performedBy && (
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      (@{log.performedBy})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                log.action === 'Ekleme'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : log.action === 'Güncelleme'
                                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : log.action === 'Silme Talebi'
                                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : log.action === 'Silme Onayı'
                                  ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : log.action === 'Silme Reddi'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {log.entityType}
                            </span>
                          </td>

                          <td className="py-3 px-4 max-w-[340px]">
                            <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                              {log.description}
                            </div>
                            {log.entityId && (
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                Ref ID: {log.entityId}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono-num font-bold whitespace-nowrap text-slate-900 dark:text-white">
                            {log.amount !== undefined && log.amount !== null
                              ? formatCurrency(log.amount)
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
