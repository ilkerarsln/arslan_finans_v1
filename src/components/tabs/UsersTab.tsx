import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { StaffAccount, UserRole } from '../../types/finance';
import { formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  KeyRound,
  Lock,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Info,
} from 'lucide-react';

export const UsersTab: React.FC = () => {
  const {
    userProfile,
    isAdmin,
    allUsers,
    staffAccounts,
    createStaffAccount,
    updateStaffAccount,
    removeStaffAccount,
    updateUserRole,
    isRoleSimulated,
    toggleRoleSimulation,
    showToast,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Standart');
  const [showPassword, setShowPassword] = useState(false);

  // Edit State
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim() || !password.trim()) {
      showToast('Lütfen tüm zorunlu alanları doldurunuz.', 'error');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if fixed admin username or already taken
    if (cleanUsername === 'ilkerarslan78@gmail' || cleanUsername === 'admin') {
      showToast('Bu kullanıcı adı sistem varsayılan yöneticisi için ayrılmıştır.', 'error');
      return;
    }

    const exists = staffAccounts.some(s => s.username.toLowerCase() === cleanUsername);
    if (exists) {
      showToast('Bu kullanıcı adı zaten kullanımda.', 'error');
      return;
    }

    await createStaffAccount({
      id: 'staff-' + Date.now(),
      username: cleanUsername,
      displayName: displayName.trim(),
      password: password.trim(),
      role: role,
      createdAt: new Date().toISOString(),
    });

    setIsAddModalOpen(false);
    setDisplayName('');
    setUsername('');
    setPassword('');
    setRole('Standart');
    showToast('Yeni personel başarıyla oluşturuldu.', 'success');
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    await updateStaffAccount(editingStaff);
    setEditingStaff(null);
    showToast('Kullanıcı yetkileri güncellendi.', 'success');
  };

  const handleDeleteStaff = async (staffUsername: string, staffName: string) => {
    if (staffUsername === 'ilkerarslan78@gmail' || staffUsername === 'admin') {
      showToast('Varsayılan yönetici hesabı sistemden silinemez!', 'error');
      return;
    }

    if (window.confirm(`"${staffName}" isimli personelin sistem erişimini silmek istediğinize emin misiniz?`)) {
      await removeStaffAccount(staffUsername);
      showToast('Personel hesabı kaldırıldı.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            Personel & Rol Yetkilendirme Paneli
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem kullanıcılarını yönetin, yeni personel hesapları açın ve yetki tanımlayın.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Personel Ekle</span>
          </button>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Kritik Güvenlik Protokolü & Sabit Yönetici Bilgisi</p>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Sistem ana yöneticisi <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded font-mono font-bold">ilkerarslan78@gmail</code> (Şifre: <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded font-mono font-bold">140514</code>) sabit Süper Admin olarak tanımlıdır ve silinemez. Buradan işletmeniz için ek satış personelleri veya alt yöneticiler oluşturabilirsiniz.
          </p>
        </div>
      </div>

      {/* Main Users List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" />
            Kayıtlı Sistem Kullanıcıları & Personel ({1 + staffAccounts.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Kullanıcı / Personel</th>
                <th className="py-3 px-4">Giriş Kimliği</th>
                <th className="py-3 px-4">Yetki Rolü</th>
                <th className="py-3 px-4">Kayıt Tarihi</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* FIXED ADMIN ROW */}
              <tr className="bg-amber-50/30 dark:bg-amber-950/10">
                <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    İA
                  </div>
                  <div>
                    <div>İlker Arslan (Süper Admin)</div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Sistem Sahibi & Ana Yönetici</div>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                  ilkerarslan78@gmail
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    <Shield className="w-3 h-3" />
                    Süper Admin (Sabit)
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500 text-xs">
                  Sistem Kurulumu
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                    Korumalı Hesap
                  </span>
                </td>
              </tr>

              {/* STAFF ACCOUNTS */}
              {staffAccounts.map(staff => (
                <tr key={staff.id || staff.username} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                      {staff.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div>{staff.displayName}</div>
                      <div className="text-[11px] text-slate-400">Personel Hesabı</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {staff.username}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      staff.role === 'Admin'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {staff.role === 'Admin' ? 'Yönetici (Admin)' : 'Standart Personel'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {formatDate(staff.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingStaff(staff)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Yetki Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff.username, staff.displayName)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Personeli Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-500" />
                Yeni Personel Hesabı Oluştur
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Giriş Kullanıcı Adı / E-posta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ahmetyilmaz veya ahmet@arslan.com"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Giriş Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="En az 4 karakter"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Yetki Rolü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Standart')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      role === 'Standart'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800 dark:text-white">Standart Personel</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Satış ve kayıt girer, silme onaya düşer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      role === 'Admin'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800 dark:text-white">Yönetici (Admin)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Tam yetki, silme onaylar, raporları görür</div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs"
                >
                  Personeli Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                Personel Yetkilerini Düzenle
              </h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.displayName}
                  onChange={e => setEditingStaff({ ...editingStaff, displayName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)
                </label>
                <input
                  type="password"
                  placeholder="Mevcut şifreyi koru..."
                  onChange={e => {
                    if (e.target.value.trim()) {
                      setEditingStaff({ ...editingStaff, password: e.target.value.trim() });
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Yetki Rolü
                </label>
                <select
                  value={editingStaff.role}
                  onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                >
                  <option value="Standart">Standart Personel</option>
                  <option value="Admin">Yönetici (Admin)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
