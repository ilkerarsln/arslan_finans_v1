import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { UserRole, UserProfile, StaffAccount } from '../../types/finance';
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
  KeyRound,
  User,
  Copy,
  Check,
  Building,
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
    staffAccounts,
    createStaffAccount,
    removeStaffAccount,
  } = useFinance();

  // Management section selector: 'staff' (Kullanıcı Adı & Şifre) or 'google' (Google OAuth)
  const [activeSection, setActiveSection] = useState<'staff' | 'google'>('staff');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Standart'>('all');
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isGoogleInviteModalOpen, setIsGoogleInviteModalOpen] = useState(false);

  // New Staff Account form state
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffDisplayName, setNewStaffDisplayName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('Standart');
  const [showStaffPasswordInput, setShowStaffPasswordInput] = useState(false);

  // New Google Email form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Standart');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffAccounts.filter(s => {
      const matchSearch =
        s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || s.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staffAccounts, searchTerm, roleFilter]);

  // Filtered Google users list
  const filteredGoogleUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchSearch =
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [allUsers, searchTerm, roleFilter]);

  const totalPersonnelCount = staffAccounts.length + allUsers.length;
  const adminPersonnelCount =
    staffAccounts.filter(s => s.role === 'Admin').length +
    allUsers.filter(u => u.role === 'Admin').length;

  const handleCopyCredentials = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newStaffUsername.trim().toLowerCase();
    if (!cleanUser) {
      alert('Lütfen bir kullanıcı adı girin.');
      return;
    }
    if (!newStaffPassword.trim()) {
      alert('Lütfen şifre belirleyin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newStaff: StaffAccount = {
        id: cleanUser,
        username: cleanUser,
        displayName: newStaffDisplayName.trim() || cleanUser,
        password: newStaffPassword.trim(),
        role: newStaffRole,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'Admin',
      };
      await createStaffAccount(newStaff);
      setNewStaffUsername('');
      setNewStaffPassword('');
      setNewStaffDisplayName('');
      setNewStaffRole('Standart');
      setIsStaffModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffUsername: string) => {
    if (staffUsername === 'admin') {
      alert('Varsayılan "admin" hesabı sistem güvenliği için silinemez.');
      return;
    }
    if (confirm(`"${staffUsername}" personel hesabını silmek istediğinize emin misiniz?`)) {
      setActionLoadingUid(staffUsername);
      try {
        await removeStaffAccount(staffUsername);
      } finally {
        setActionLoadingUid(null);
      }
    }
  };

  const handleStaffRoleChange = async (staff: StaffAccount, newRole: UserRole) => {
    setActionLoadingUid(staff.username);
    try {
      await createStaffAccount({ ...staff, role: newRole });
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleGoogleRoleChange = async (targetUser: UserProfile, targetRole: UserRole) => {
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
      confirm(
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
      setIsGoogleInviteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard page for non-admin unless simulating
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
                Personel hesaplarını (Kullanıcı Adı & Şifre) veya Google ile giriş yapan kullanıcıları yönetin.
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

          {/* New Staff Account Button */}
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <KeyRound className="w-4 h-4" />
            Yeni Personel Ekle (Şifreli)
          </button>

          {/* New Google Pre-Assign Button */}
          <button
            onClick={() => setIsGoogleInviteModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Mail className="w-4 h-4" />
            Google E-posta Yetkilendir
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Personel Hesapları
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {staffAccounts.length}
            </span>
            <span className="text-[11px] text-slate-400">şifreli personel</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Google Hesapları
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {allUsers.length}
            </span>
            <span className="text-[11px] text-slate-400">e-posta ile bağlı</span>
          </div>
        </div>

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
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {adminPersonnelCount}
            </span>
            <span className="text-[11px] text-slate-400">tam yetkili</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Mevcut Rolünüz
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                isAdmin
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                  : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
              }`}
            >
              {userRole}
            </span>
            {isRoleSimulated && (
              <span className="text-[10px] text-purple-500 font-semibold">(Simüle)</span>
            )}
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'staff'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Personel Girişi Hesapları ({staffAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('google')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'google'
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Google & E-posta Girişleri ({allUsers.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsMatrixOpen(!isMatrixOpen)}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
        >
          <span>Yetki Matrisi</span>
          {isMatrixOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Permissions Matrix */}
      {isMatrixOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Rol İzinleri ve Güvenlik Seviyeleri (RBAC Matrisi)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 mb-2">
                <Shield className="w-4 h-4" />
                <span>Yönetici (Admin) Yetkileri</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Tüm şirket gelir, gider, kasa ve banka hesaplarını görüntüleme ve düzenleme</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Kullanıcı ve personel hesaplarını ekleme, rol atama ve şifre yönetimi</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Kasa/Banka hesaplarını ve hatalı finansal işlemleri silme</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Tüm şirket veritabanını sıfırlama veya tam Excel/JSON yedeği alma</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/50">
              <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-2">
                <UserCheck className="w-4 h-4" />
                <span>Standart Kullanıcı (Personel / Kasa) Yetkileri</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Yeni gelir, gider, mal alımı ve virman işlemleri ekleme</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Müşteri / Tedarikçi cari kartlarını görüntüleme ve bakiye takip etme</span>
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-rose-700 dark:text-rose-400">
                    Banka/Kasa hesaplarını ve geçmiş işlemleri silemez (Engellendi)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-rose-700 dark:text-rose-400">
                    Kullanıcı ve Rol Yönetimi paneline erişemez (Yetkisiz)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              activeSection === 'staff'
                ? 'Kullanıcı adı veya personele göre ara...'
                : 'E-posta veya ada göre ara...'
            }
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">Tüm Roller</option>
            <option value="Admin">Yöneticiler (Admin)</option>
            <option value="Standart">Standart Kullanıcılar</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: STAFF (USERNAME & PASSWORD) ACCOUNTS */}
      {activeSection === 'staff' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Personel Girişi Hesap Listesi (Firestore Doğrulamalı)
              </h3>
            </div>
            <span className="text-xs text-slate-500">{filteredStaff.length} personel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kullanıcı Adı</th>
                  <th className="py-3 px-4">Personel / Ünvan</th>
                  <th className="py-3 px-4">Şifre Bilgisi</th>
                  <th className="py-3 px-4">Yetki Seviyesi (Rol)</th>
                  <th className="py-3 px-4">Oluşturan</th>
                  <th className="py-3 px-4 text-right">Rol & İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Arama kriterlerine uygun personel bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(staff => {
                    const isStaffAdmin = staff.role === 'Admin';
                    const isSystemAdmin = staff.username === 'admin';
                    const isLoading = actionLoadingUid === staff.username;

                    return (
                      <tr
                        key={staff.username}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Username */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
                              {staff.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span>{staff.username}</span>
                          </div>
                        </td>

                        {/* Display Name */}
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {staff.displayName}
                        </td>

                        {/* Password */}
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <span>{staff.password || '••••••'}</span>
                            {staff.password && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyCredentials(
                                    `Kullanıcı Adı: ${staff.username}\nŞifre: ${staff.password}`,
                                    staff.username
                                  )
                                }
                                title="Giriş bilgilerini kopyala"
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              >
                                {copiedKey === staff.username ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              isStaffAdmin
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                            }`}
                          >
                            {isStaffAdmin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {staff.role}
                          </span>
                        </td>

                        {/* Created By */}
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {staff.createdBy || 'Sistem'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                            ) : (
                              <>
                                {!isStaffAdmin ? (
                                  <button
                                    onClick={() => handleStaffRoleChange(staff, 'Admin')}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-semibold transition"
                                  >
                                    Yönetici Yap
                                  </button>
                                ) : (
                                  !isSystemAdmin && (
                                    <button
                                      onClick={() => handleStaffRoleChange(staff, 'Standart')}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-semibold transition"
                                    >
                                      Standart Yap
                                    </button>
                                  )
                                )}

                                {!isSystemAdmin && (
                                  <button
                                    onClick={() => handleDeleteStaff(staff.username)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    title="Personel hesabını sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: GOOGLE OAUTH USERS */}
      {activeSection === 'google' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Google ile Kayıtlı veya Yetkilendirilmiş Kullanıcılar
              </h3>
            </div>
            <span className="text-xs text-slate-500">{filteredGoogleUsers.length} kullanıcı</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kullanıcı</th>
                  <th className="py-3 px-4">E-posta Adresi</th>
                  <th className="py-3 px-4">Rol & Yetki</th>
                  <th className="py-3 px-4">Son Giriş / Durum</th>
                  <th className="py-3 px-4 text-right">Rol Değiştir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
                {filteredGoogleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      Kayıtlı Google kullanıcısı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredGoogleUsers.map(usr => {
                    const isCurrentUser = user?.uid === usr.uid;
                    const isMasterAdmin = usr.email.toLowerCase() === 'ilkerarslan78@gmail.com';
                    const isUserAdmin = usr.role === 'Admin';
                    const isLoading = actionLoadingUid === usr.uid;

                    return (
                      <tr
                        key={usr.uid}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                              {usr.displayName.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{usr.displayName}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-medium">
                                    Siz
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {usr.email}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              isUserAdmin
                                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                            }`}
                          >
                            {isUserAdmin ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {usr.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {usr.isPreAssigned
                            ? 'Beklemede (İlk girişte aktifleşecek)'
                            : usr.lastLoginAt
                            ? formatDate(usr.lastLoginAt)
                            : '-'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                            ) : isMasterAdmin ? (
                              <span className="text-[11px] text-amber-600 font-semibold">Ana Yönetici</span>
                            ) : (
                              <>
                                {!isUserAdmin ? (
                                  <button
                                    onClick={() => handleGoogleRoleChange(usr, 'Admin')}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-semibold"
                                  >
                                    Yönetici Yap
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleGoogleRoleChange(usr, 'Standart')}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold"
                                  >
                                    Standart Yap
                                  </button>
                                )}

                                {usr.isPreAssigned && (
                                  <button
                                    onClick={() => handleDeleteInvitation(usr)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Daveti kaldır"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW STAFF ACCOUNT (USERNAME & PASSWORD) */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Yeni Personel Hesabı Oluştur
                </h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaffAccount} className="space-y-4 text-xs">
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Personel, belirlenen kullanıcı adı ve şifre ile sisteme doğrudan giriş yapabilir.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kullanıcı Adı (Benzersiz) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newStaffUsername}
                    onChange={e => setNewStaffUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="Örn: kasa1, ahmet, mehmet"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Giriş Şifresi *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showStaffPasswordInput ? 'text' : 'password'}
                    required
                    value={newStaffPassword}
                    onChange={e => setNewStaffPassword(e.target.value)}
                    placeholder="En az 6 karakterli şifre"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPasswordInput(!showStaffPasswordInput)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showStaffPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ad Soyad / Personel Görevi
                </label>
                <input
                  type="text"
                  value={newStaffDisplayName}
                  onChange={e => setNewStaffDisplayName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz (Kasa Görevlisi)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yetki Seviyesi (Rol)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffRole('Standart')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newStaffRole === 'Standart'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5 flex items-center gap-1 text-blue-600">
                      <UserCheck className="w-3.5 h-3.5" />
                      Standart Personel
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">İşlem girebilir, hesap silemez.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStaffRole('Admin')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newStaffRole === 'Admin'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5 flex items-center gap-1 text-amber-600">
                      <Shield className="w-3.5 h-3.5" />
                      Yönetici (Admin)
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Tam yetki ve yönetim panelleri.</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Personeli Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GOOGLE PRE-ASSIGNMENT MODAL */}
      {isGoogleInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-600">
                <Mail className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Google E-posta ile Yetkilendir
                </h3>
              </div>
              <button
                onClick={() => setIsGoogleInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePreAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google E-posta Adresi *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ornek@sirket.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ad Soyad (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Kullanıcı Adı"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Atanacak Rol
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('Standart')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newRole === 'Standart'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5 text-blue-600">Standart</div>
                    <p className="text-[10px] text-slate-400">Normal kullanıcı yetkisi.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('Admin')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      newRole === 'Admin'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs mb-0.5 text-amber-600">Yönetici (Admin)</div>
                    <p className="text-[10px] text-slate-400">Tam yönetici yetkisi.</p>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGoogleInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Yetkilendir ve Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
