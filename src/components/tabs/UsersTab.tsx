import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { UserRole, StaffAccount } from '../../types/finance';
import { formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  Shield,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  Check,
  UserCheck,
  Mail,
  User,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export const UsersTab: React.FC = () => {
  const {
    allUsers,
    updateUserRole,
    preAssignUserRole,
    deleteUserInvitation,
    staffAccounts,
    createStaffAccount,
    removeStaffAccount,
    isRoleSimulated,
    toggleRoleSimulation,
    userProfile,
    showToast,
  } = useFinance();

  // Invite Google User modal/form state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Standart');
  const [inviteDisplayName, setInviteDisplayName] = useState('');

  // Add Staff Account modal/form state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffUsername, setStaffUsername] = useState('');
  const [staffDisplayName, setStaffDisplayName] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Standart');

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('Lütfen geçerli bir e-posta adresi girin.', 'error');
      return;
    }
    try {
      await preAssignUserRole(inviteEmail.trim().toLowerCase(), inviteRole, inviteDisplayName.trim() || undefined);
      showToast(`${inviteEmail} kullanıcısına ${inviteRole} rolü başarıyla tanımlandı.`, 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteDisplayName('');
    } catch (err: any) {
      showToast(err?.message || 'Rol tanımlama başarısız oldu.', 'error');
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername.trim() || !staffPassword.trim() || !staffDisplayName.trim()) {
      showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }
    try {
      await createStaffAccount({
        id: staffUsername.trim().toLowerCase(),
        username: staffUsername.trim().toLowerCase(),
        displayName: staffDisplayName.trim(),
        role: staffRole,
        password: staffPassword.trim(),
        createdAt: new Date().toISOString(),
      });
      showToast(`${staffUsername} personel hesabı oluşturuldu.`, 'success');
      setShowStaffModal(false);
      setStaffUsername('');
      setStaffDisplayName('');
      setStaffPassword('');
    } catch (err: any) {
      showToast(err?.message || 'Personel hesabı oluşturulamadı.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kayıtlı Google Kullanıcıları
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {allUsers.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Google Workspace veya Gmail ile oturum açan personeller
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Personel & Kasa Hesapları
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {staffAccounts.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kullanıcı adı ve şifreyle doğrudan giriş yapan personeller
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rol Simülasyonu (Test)
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isRoleSimulated
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
              }`}
            >
              {isRoleSimulated ? 'Standart Mod Aktif' : 'Gerçek Yönetici (Admin)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Normal personelin sistemi nasıl gördüğünü test etmek için rolünüzü geçici olarak Standart Kullanıcı yapabilirsiniz.
          </p>
          <div className="mt-4">
            <button
              onClick={toggleRoleSimulation}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                isRoleSimulated
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isRoleSimulated ? 'Yönetici Moduna Geri Dön' : 'Standart Kullanıcı Olarak Simüle Et'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Staff Accounts Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-500" />
              <span>Kullanıcı Adı ile Giriş Yapan Personel Hesapları</span>
            </h3>
            <p className="text-xs text-slate-500">
              Kasa görevlisi, muhasebe veya depo personeli için bağımsız giriş hesapları
            </p>
          </div>
          <button
            onClick={() => setShowStaffModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Personel Hesabı Ekle</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Kullanıcı Adı</th>
                <th className="py-3 px-4">Görünen İsim</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Oluşturulma</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {staffAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Henüz oluşturulmuş personel hesabı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                staffAccounts.map(staff => (
                  <tr key={staff.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {staff.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {staff.displayName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          staff.role === 'Admin'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {staff.createdAt ? formatDate(staff.createdAt) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => removeStaffAccount(staff.username)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Personel Hesabını Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Auth Users Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span>Google Hesabı ile Bağlanan Kullanıcılar & İzinler</span>
            </h3>
            <p className="text-xs text-slate-500">
              E-posta ile önceden rol tanımlayabilir veya mevcut kullanıcıların yetkisini değiştirebilirsiniz
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>E-posta ile Rol Tanımla</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Kullanıcı / E-posta</th>
                <th className="py-3 px-4">İsim</th>
                <th className="py-3 px-4">Yetki Rolü</th>
                <th className="py-3 px-4">Kayıt / Son Giriş</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Henüz kayıtlı Google kullanıcısı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                allUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {u.displayName || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={e => updateUserRole(u.uid, e.target.value as UserRole)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Admin">Admin (Tam Yetkili)</option>
                        <option value="Standart">Standart (Kısıtlı)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : u.createdAt ? formatDate(u.createdAt) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.isPreAssigned && (
                        <button
                          onClick={() => deleteUserInvitation(u.uid)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Daveti Kaldır"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Google E-posta ile Rol Tanımla
            </h3>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  required
                  placeholder="ornek@sirket.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Personel Adı (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={inviteDisplayName}
                  onChange={e => setInviteDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Yetki Rolü
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Standart">Standart Kullanıcı</option>
                  <option value="Admin">Yönetici (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs"
                >
                  Kaydet & Yetkilendir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Account Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Yeni Personel Hesabı Oluştur
            </h3>
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Kullanıcı Adı (Girişte kullanılacak)
                </label>
                <input
                  type="text"
                  required
                  placeholder="kasa, muhasebe1, ahmet, vb."
                  value={staffUsername}
                  onChange={e => setStaffUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Personel Adı Soyadı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ahmet Yılmaz"
                  value={staffDisplayName}
                  onChange={e => setStaffDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  placeholder="Şifre belirleyin"
                  value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Yetki Rolü
                </label>
                <select
                  value={staffRole}
                  onChange={e => setStaffRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Standart">Standart Personel (Kayıt ekler, silme onaya düşer)</option>
                  <option value="Admin">Yönetici / Admin (Tam yetkili)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
                >
                  Hesabı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
