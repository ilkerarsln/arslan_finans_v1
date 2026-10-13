import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { UserRole, UserProfile } from '../../types/finance';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const UsersTab: React.FC = () => {
  const {
    user,
    userProfile,
    userRole,
    isAdmin,
    allUsers,
    updateUserRole,
    preAssignUserRole,
    deleteUserInvitation,
    isRoleSimulated,
    toggleRoleSimulation,
    setActiveTab,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Standart'>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(true);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Standart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [allUsers, searchTerm, roleFilter]);

  const adminCount = allUsers.filter(u => u.role === 'Admin').length;
  const standardCount = allUsers.filter(u => u.role === 'Standart').length;

  const handleRoleChange = async (targetUser: UserProfile, targetRole: UserRole) => {
    if (targetUser.email.toLowerCase() === 'ilkerarslan78@gmail.com') {
      return;
    }
    setActionLoadingUid(targetUser.uid);
    try {
      await updateUserRole(targetUser.uid, targetRole);
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleDeleteInvitation = async (targetUser: UserProfile) => {
    if (
      window.confirm(
        `'${targetUser.email}' kullanıcısının yetkilendirme kaydını silmek istediğinize emin misiniz?`
      )
    ) {
      setActionLoadingUid(targetUser.uid);
      try {
        await deleteUserInvitation(targetUser.uid);
      } finally {
        setActionLoadingUid(null);
      }
    }
  };

  const handleCreatePreAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await preAssignUserRole(newEmail.trim(), newRole, newName.trim() || undefined);
      setNewEmail('');
      setNewName('');
      setNewRole('Standart');
      setIsInviteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not admin and not simulating, guard page
  if (!isAdmin && !isRoleSimulated) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/80 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Erişim İzniniz Yetersiz (Kısıtlı Yetki)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Kullanıcı ve Rol Yönetimi paneli yalnızca <strong>Sistem Yöneticileri (Admin)</strong>{' '}
          tarafından görüntülenebilir ve yönetilebilir. Standart kullanıcılar yetki atayamaz.
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
        >
          Özet Panele Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      {isRoleSimulated && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Eye className="w-5 h-5 text-purple-100" />
            </div>
            <div>
              <p className="text-sm font-bold">Simülasyon Aktif: Standart Kullanıcı Görünümü</p>
              <p className="text-xs text-purple-200">
                Şu anda sistemi kısıtlı yetkili normal bir kullanıcı gözüyle test ediyorsunuz. Hesap
                silme, veri sıfırlama gibi kritik işlemler pasif durumdadır.
              </p>
            </div>
          </div>
          <button
            onClick={toggleRoleSimulation}
            className="px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-bold transition shrink-0 shadow-sm"
          >
            Yönetici Görünümüne Geri Dön
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Kullanıcı ve Rol Yönetimi (Yetkilendirme)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Firebase Authentication ile giriş yapan personelin rolleri Firestore'da saklanır ve
                denetlenir.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Toggle */}
          <button
            onClick={toggleRoleSimulation}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              isRoleSimulated
                ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title="Sistemin normal/kısıtlı kullanıcıya nasıl göründüğünü anlık test edin"
          >
            {isRoleSimulated ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isRoleSimulated ? 'Standart Görünümü Kapat' : 'Standart Görünüm Testi'}
          </button>

          {/* New User Pre-Assign Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Yeni Kullanıcı Yetkilendir
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Toplam Kullanıcı
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white">
              {allUsers.length}
            </span>
            <span className="text-[11px] text-slate-400">kayıtlı hesap</span>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Yöneticiler (Admin)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-amber-600 dark:text-amber-400">
              {adminCount}
            </span>
            <span className="text-[11px] text-slate-400">tam yetkili</span>
          </div>
        </div>

        {/* Standard Users */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Standart Kullanıcı
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
              {standardCount}
            </span>
            <span className="text-[11px] text-slate-400">kısıtlı yetkili</span>
          </div>
        </div>

        {/* Current Active Account */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aktif Oturumunuz
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isAdmin
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
              }`}
            >
              {userRole}
            </span>
          </div>
          <div className="mt-2 truncate">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {user?.displayName || user?.email?.split('@')[0]}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Permission Matrix (Yetki Karşılaştırma Matrisi) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <button
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Yetkilendirme ve İzinler Matrisi (Admin vs Normal Kullanıcı)
            </h3>
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">
              Detayları Göster
            </span>
          </div>
          {isMatrixOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isMatrixOpen && (
          <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">İşlem / Yetki Kapsamı</th>
                    <th className="py-2.5 px-3 text-center w-36">
                      <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Yönetici (Admin)
                      </span>
                    </th>
                    <th className="py-2.5 px-3 text-center w-40">
                      <span className="text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Standart Kullanıcı
                      </span>
                    </th>
                    <th className="py-2.5 px-3 text-slate-400">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      Finansal Verileri ve Grafikleri Görüntüleme
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      Tüm personel şirket kasa, banka ve nakit akışını anlık inceleyebilir.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      Gelir, Gider ve Mal Alımı İşlemi Ekleme
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      Günlük fiş/fatura ve tedarikçi mal alımı girişleri serbesttir.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      Cari Kart & Vade Takvimi Yönetimi
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      Müşteri/tedarikçi kartları açılabilir, taksit planları incelenebilir.
                    </td>
                  </tr>
                  <tr className="bg-rose-50/40 dark:bg-rose-950/20">
                    <td className="py-2.5 px-3 font-semibold text-rose-800 dark:text-rose-300">
                      Banka & Kasa Hesaplarını Silme
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <XCircle className="w-4 h-4 mx-auto text-rose-500" />
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 text-[11px]">
                      Kritik hesap silme işlemi yetkisiz kullanıcılara tamamen kapalıdır.
                    </td>
                  </tr>
                  <tr className="bg-rose-50/40 dark:bg-rose-950/20">
                    <td className="py-2.5 px-3 font-semibold text-rose-800 dark:text-rose-300">
                      Geçmiş İşlem ve Fiş Kaydı Silme
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <XCircle className="w-4 h-4 mx-auto text-rose-500" />
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 text-[11px]">
                      Kayıt güvenliği ve denetim izi için yalnızca Admin silebilir.
                    </td>
                  </tr>
                  <tr className="bg-rose-50/40 dark:bg-rose-950/20">
                    <td className="py-2.5 px-3 font-semibold text-rose-800 dark:text-rose-300">
                      Tüm Şirket Verilerini Sıfırlama
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <XCircle className="w-4 h-4 mx-auto text-rose-500" />
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 text-[11px]">
                      Veritabanı temizleme ve sıfırlama yalnızca Admin kontrolündedir.
                    </td>
                  </tr>
                  <tr className="bg-amber-50/40 dark:bg-amber-950/20">
                    <td className="py-2.5 px-3 font-semibold text-amber-800 dark:text-amber-300">
                      Kullanıcı ve Rol Yönetim Paneli
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <XCircle className="w-4 h-4 mx-auto text-rose-500" />
                    </td>
                    <td className="py-2.5 px-3 text-amber-700 dark:text-amber-400 text-[11px]">
                      Standart kullanıcıların bu panele ve yetkilere erişimi engellenir.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Users List & Role Management Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İsim veya e-posta ile kullanıcı ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                roleFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Tümü ({allUsers.length})
            </button>
            <button
              onClick={() => setRoleFilter('Admin')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                roleFilter === 'Admin'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3 text-amber-500" />
              Yöneticiler ({adminCount})
            </button>
            <button
              onClick={() => setRoleFilter('Standart')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                roleFilter === 'Standart'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3 text-emerald-500" />
              Standart ({standardCount})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Kullanıcı Bilgisi</th>
                <th className="py-3 px-4">Mevcut Rolü</th>
                <th className="py-3 px-4">Kayıt / Yetki Tarihi</th>
                <th className="py-3 px-4">Son Giriş</th>
                <th className="py-3 px-4">Yetkilendiren</th>
                <th className="py-3 px-4 text-right">Rol Değiştir & İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Arama kriterine uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrent = user?.uid === u.uid || user?.email === u.email;
                  const isPrimary = u.email.toLowerCase() === 'ilkerarslan78@gmail.com';
                  const isPending = u.isPreAssigned || u.lastLoginAt?.includes('Henüz');

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                              {u.displayName.charAt(0).toUpperCase() || 'K'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {u.displayName}
                              </span>
                              {isCurrent && (
                                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                  Siz
                                </span>
                              )}
                              {isPrimary && (
                                <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                  Ana Yönetici
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate font-mono">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        {u.role === 'Admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Shield className="w-3 h-3 text-amber-500" />
                            Yönetici (Admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <UserCheck className="w-3 h-3 text-blue-500" />
                            Standart Kullanıcı
                          </span>
                        )}
                      </td>

                      {/* Created date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Last login */}
                      <td className="py-3 px-4">
                        {isPending ? (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded font-medium">
                            Davet Bekleniyor
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {formatDate(u.lastLoginAt)}
                          </span>
                        )}
                      </td>

                      {/* Assigned by */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.assignedBy || 'Sistem / Kayıt'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPrimary ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium px-2 py-1">
                            <Lock className="w-3 h-3" /> Değiştirilemez
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            {actionLoadingUid === u.uid ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                            ) : u.role === 'Admin' ? (
                              <button
                                onClick={() => handleRoleChange(u, 'Standart')}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition"
                                title="Kullanıcının yetkisini Standart seviyeye düşür"
                              >
                                Standart Yap
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u, 'Admin')}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold transition shadow-xs"
                                title="Kullanıcıya tam yönetici yetkisi ver"
                              >
                                Admin Yap
                              </button>
                            )}

                            {/* Remove pre-assigned pending entry if applicable */}
                            {u.isPreAssigned && (
                              <button
                                onClick={() => handleDeleteInvitation(u)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Daveti / Yetkilendirmeyi Kaldır"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-assign User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Yeni Kullanıcı Yetkilendir
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kullanıcı ilk kez Google ile giriş yapmadan önce rolünü tanımlayın.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePreAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-posta Adresi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ornek@sirket.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kullanıcının sisteme giriş yapacağı Google e-posta adresi.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personel / Kullanıcı Adı (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz (Ön Muhasebe)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Atanacak Rol & Erişim Seviyesi
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewRole('Standart')}
                    className={`p-3 rounded-xl border text-left transition ${
                      newRole === 'Standart'
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      Standart Kullanıcı
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      İşlem girebilir, cari takip edebilir. Hesap veya veri silemez.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('Admin')}
                    className={`p-3 rounded-xl border text-left transition ${
                      newRole === 'Admin'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-600 dark:text-amber-400">
                      <Shield className="w-3.5 h-3.5" />
                      Yönetici (Admin)
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Tüm şirket verilerine, silme ve kullanıcı yönetimine tam erişim.
                    </p>
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Yetkilendirme Firestore'a kaydedilir. Kullanıcı Google ile bağlandığında bu e-posta
                  adresiyle eşleşerek belirlediğiniz yetki otomatik olarak tanımlanır.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor...
                    </>
                  ) : (
                    'Yetkilendir ve Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
