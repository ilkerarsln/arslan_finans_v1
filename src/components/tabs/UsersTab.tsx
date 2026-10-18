import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Shield,
  Plus,
  Trash2,
  Mail,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { StaffAccount, UserRole } from '../../types/finance';
import { formatDate } from '../../utils/formatters';

export const UsersTab: React.FC = () => {
  const {
    allUsers,
    staffAccounts,
    updateUserRole,
    preAssignUserRole,
    deleteUserInvitation,
    createStaffAccount,
    updateStaffAccount,
    removeStaffAccount,
    isAdmin,
    userProfile,
    showToast,
  } = useFinance();

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Standart');
  const [showPassword, setShowPassword] = useState(false);

  // Edit Staff Account State
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Standart');
  const [editPassword, setEditPassword] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  const handleStartEditStaff = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setEditDisplayName(staff.displayName || '');
    setEditRole(staff.role);
    setEditPassword(staff.password || '');
    setEditEmail(staff.email || '');
    setShowEditPassword(false);
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editDisplayName.trim()) {
      showToast('Personel adı soyadı zorunludur.', 'error');
      return;
    }

    try {
      await updateStaffAccount({
        ...editingStaff,
        displayName: editDisplayName.trim(),
        role: editRole,
        password: editPassword.trim() || editingStaff.password,
        email: editEmail.trim() || editingStaff.email,
      });
      setEditingStaff(null);
    } catch {
      showToast('Personel güncellenirken bir hata oluştu.', 'error');
    }
  };

  // Invite Google User
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Standart');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newDisplayName.trim() || !newPassword.trim()) {
      showToast('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }

    try {
      await createStaffAccount({
        id: newUsername.trim().toLowerCase(),
        username: newUsername.trim().toLowerCase(),
        displayName: newDisplayName.trim(),
        role: newRole,
        password: newPassword,
        createdAt: new Date().toISOString(),
      });
      showToast(`${newDisplayName} personeli başarıyla oluşturuldu.`, 'success');
      setIsAddStaffOpen(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
    } catch {
      showToast('Personel oluşturulurken bir hata meydana geldi.', 'error');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('E-posta adresi zorunludur.', 'error');
      return;
    }
    try {
      await preAssignUserRole(inviteEmail.trim(), inviteRole, inviteName.trim());
      showToast(`${inviteEmail} adresi için rol tanımlandı.`, 'success');
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
    } catch {
      showToast('Kullanıcı davet edilirken hata oluştu.', 'error');
    }
  };

  const handleRoleChange = async (targetUid: string, role: UserRole) => {
    if (!isAdmin) {
      showToast('Yalnızca yönetici rol değiştirebilir.', 'error');
      return;
    }
    try {
      await updateUserRole(targetUid, role);
      showToast('Kullanıcı yetkisi güncellendi.', 'success');
    } catch {
      showToast('Yetki güncellenemedi.', 'error');
    }
  };

  const handleDeleteStaff = async (username: string) => {
    if (window.confirm(`'${username}' personel hesabını silmek istediğinize emin misiniz?`)) {
      try {
        await removeStaffAccount(username);
        showToast('Personel hesabı silindi.', 'info');
      } catch {
        showToast('Personel silinirken hata oluştu.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Personel & Erişim Rolleri Yönetimi</h2>
            <p className="text-xs text-slate-400">Kullanıcı yetkilendirme (Admin / Standart) ve personel giriş hesapları</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Personel Tanımla</span>
            </button>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Google E-posta Yetkilendir</span>
            </button>
          </div>
        )}
      </div>

      {/* Staff Accounts Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Sistem Personel Hesapları ({staffAccounts.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffAccounts.map((staff, idx) => (
            <div
              key={`staff-${staff.username || staff.id || 'acc'}-${idx}`}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      staff.role === 'Admin'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {staff.role}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditStaff(staff)}
                        className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Personeli Düzenle (Ad Soyad, Yetki, Şifre)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {staff.username !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(staff.username)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Personeli Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-white">{staff.displayName}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">@{staff.username}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Eklenme: {formatDate(staff.createdAt)}</span>
                {staff.lastLoginAt && <span>Son Giriş: {formatDate(staff.lastLoginAt)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registered Google Users & Role Matrix */}
      {allUsers.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Kayıtlı Google Hesapları & Yetkiler ({allUsers.length})</span>
          </h3>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Kullanıcı</th>
                    <th className="py-3 px-4">E-posta</th>
                    <th className="py-3 px-4">Kayıt Tarihi</th>
                    <th className="py-3 px-4">Son Oturum</th>
                    <th className="py-3 px-4">Rol</th>
                    {isAdmin && <th className="py-3 px-4 text-right">İşlem</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {allUsers.map((u, idx) => (
                    <tr key={`user-${u.uid || u.email || 'usr'}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium flex items-center gap-2">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                            {u.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span>{u.displayName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(u.lastLoginAt)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            u.role === 'Admin'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.uid, e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-700 text-white text-[11px] rounded-lg px-2 py-1"
                          >
                            <option value="Standart">Standart</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Account */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Yeni Personel Tanımla</h3>
            <p className="text-xs text-slate-400">
              Personel kullanıcı adı ve şifresi ile sisteme giriş yapabilir.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personel Adı Soyadı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: ahmetyilmaz"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Giriş şifresi..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Yetki Rolü</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Standart">Standart (Veri girişi yapar, silme onaya tabidir)</option>
                  <option value="Admin">Admin (Tam yetkili, onay verme ve silme hakkı)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Personeli Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Google User */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Google E-posta ile Yetkilendir</h3>
            <p className="text-xs text-slate-400">
              Bu e-posta adresi ile Google üzerinden giriş yapıldığında atanmış rol uygulanacaktır.
            </p>

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  placeholder="ornek@arslanfinans.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Soyad (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Yetki Rolü</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Standart">Standart</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm"
                >
                  Yetkilendirmeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Account */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Personel Bilgilerini Düzenle</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  @{editingStaff.username} sistem hesabının yetki ve bilgilerini güncelleyin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kullanıcı Adı (Sistem Kimliği)
                </label>
                <input
                  type="text"
                  disabled
                  value={`@${editingStaff.username}`}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personel Adı Soyadı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: İlker Arslan"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Giriş Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    placeholder="Şifreyi girin..."
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yetki Rolü
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Admin">Admin (Tam yetkili: Onay verme, silme, kullanıcı yönetimi)</option>
                  <option value="Standart">Standart (Veri girişi yapar, silme işlemleri onaya tabidir)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  İletişim / E-posta (Opsiyonel)
                </label>
                <input
                  type="email"
                  placeholder="ornek@arslanfinans.com"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
