import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { StaffAccount, UserProfile, UserRole } from '../../types/finance';
import {
  ShieldCheck,
  Shield,
  UserCheck,
  Users,
  Plus,
  Trash2,
  Edit,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const UsersTab: React.FC = () => {
  const {
    staffAccounts,
    allUsers,
    userProfile,
    isAdmin,
    userRole,
    isRoleSimulated,
    toggleRoleSimulation,
    createStaffAccount,
    updateStaffAccount,
    removeStaffAccount,
    updateUserRole,
    preAssignUserRole,
    deleteUserInvitation,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'all' | 'permissions'>('staff');

  // Add/Edit Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffUsername, setEditingStaffUsername] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<{
    username: string;
    displayName: string;
    role: UserRole;
    password?: string;
  }>({
    username: '',
    displayName: '',
    role: 'Standart',
    password: '',
  });

  // Pre-assign user by email modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Standart');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenNewStaff = () => {
    setEditingStaffUsername(null);
    setStaffForm({
      username: '',
      displayName: '',
      role: 'Standart',
      password: '',
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffAccount) => {
    setEditingStaffUsername(staff.username);
    setStaffForm({
      username: staff.username,
      displayName: staff.displayName,
      role: staff.role,
      password: staff.password || '',
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.username.trim() || !staffForm.displayName.trim()) {
      showToast('Kullanıcı adı ve personel adı zorunludur.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingStaffUsername) {
        await updateStaffAccount({
          id: editingStaffUsername.toLowerCase(),
          username: editingStaffUsername,
          displayName: staffForm.displayName,
          role: staffForm.role,
          password: staffForm.password,
          createdAt: new Date().toISOString(),
        });
        showToast('Personel hesabı güncellendi.', 'success');
      } else {
        await createStaffAccount({
          id: staffForm.username.toLowerCase(),
          username: staffForm.username,
          displayName: staffForm.displayName,
          role: staffForm.role,
          password: staffForm.password || '123456',
          createdAt: new Date().toISOString(),
        });
        showToast('Yeni personel hesabı oluşturuldu.', 'success');
      }
      setIsStaffModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'İşlem başarısız.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (username: string) => {
    if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'ilkerarslan78') {
      showToast('Ana yönetici hesabı silinemez.', 'error');
      return;
    }
    if (!window.confirm(`"${username}" personel hesabını silmek istediğinize emin misiniz?`)) return;

    try {
      await removeStaffAccount(username);
      showToast(`"${username}" personeli silindi.`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Silme başarısız.', 'error');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast('Geçerli bir e-posta adresi girin.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      await preAssignUserRole(inviteEmail.trim(), inviteRole, inviteName.trim());
      showToast(`"${inviteEmail}" için rol yetkisi tanımlandı.`, 'success');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
    } catch (err: any) {
      showToast(err?.message || 'Yetki atama başarısız.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Personel & Yetki Yönetimi (RBAC)
              </h2>
              <p className="text-xs text-slate-400">
                Personel hesapları açın, yetkileri yapılandırın ve kullanıcı rol simülasyonunu test edin.
              </p>
            </div>
          </div>
        </div>

        {/* Role Simulation Switch */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
              <span>Personel Görünümü Simülasyonu</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-[10px] text-slate-400">
              {isRoleSimulated ? 'Standart Personel Modundasınız' : 'Yönetici (Admin) Modundasınız'}
            </div>
          </div>
          <button
            onClick={toggleRoleSimulation}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              isRoleSimulated ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                isRoleSimulated ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'staff'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Kullanıcı Adı / Şifreli Personeller</span>
            <span className="text-[10px] opacity-80 font-mono">({staffAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'all'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tüm Kullanıcılar & E-posta Davetleri</span>
            <span className="text-[10px] opacity-80 font-mono">({allUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'permissions'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Yetki Matrisi</span>
          </button>
        </div>

        {activeSubTab === 'staff' && (
          <button
            onClick={handleOpenNewStaff}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Personel Tanımla</span>
          </button>
        )}

        {activeSubTab === 'all' && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/15"
          >
            <Mail className="w-4 h-4" />
            <span>E-posta ile Yetki Ata</span>
          </button>
        )}
      </div>

      {/* Sub Tab: Staff Accounts */}
      {activeSubTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffAccounts.map(staff => {
            const isRootAdmin =
              staff.username.toLowerCase() === 'admin' ||
              staff.username.toLowerCase() === 'ilkerarslan78';
            return (
              <div
                key={staff.id || staff.username}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
                        {staff.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm tracking-tight">
                          {staff.displayName}
                        </h4>
                        <div className="text-slate-400 font-mono text-xs">
                          @{staff.username}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                        staff.role === 'Admin'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {staff.role}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Giriş Türü:</span>
                      <span className="text-slate-200 font-medium">Kullanıcı Adı / Şifre</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Şifre:</span>
                      <span className="text-slate-300 font-mono font-medium">
                        {staff.password ? '••••••••' : 'Belirtilmedi'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEditStaff(staff)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
                    title="Düzenle"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </button>

                  {!isRootAdmin && (
                    <button
                      onClick={() => handleRemoveStaff(staff.username)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors text-xs font-semibold flex items-center gap-1.5 border border-rose-500/20"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sil</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub Tab: All Users & Invites */}
      {activeSubTab === 'all' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">Kullanıcı / E-posta</th>
                  <th className="py-3 px-4 font-semibold">Görünen Ad</th>
                  <th className="py-3 px-4 font-semibold">Giriş Şekli</th>
                  <th className="py-3 px-4 font-semibold">Mevcut Rol</th>
                  <th className="py-3 px-4 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Henüz kayıtlı başka bir kullanıcı hesabı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  allUsers.map(u => {
                    const isRoot =
                      u.email.toLowerCase() === 'ilkerarslan78@gmail.com' ||
                      u.username === 'admin';
                    return (
                      <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">
                          <div className="flex items-center gap-2">
                            {u.photoURL ? (
                              <img
                                src={u.photoURL}
                                alt={u.displayName}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400">
                                {u.displayName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-slate-200">
                                {u.email || u.username}
                              </div>
                              {u.isPreAssigned && (
                                <span className="text-[10px] text-amber-400">
                                  (Henüz ilk girişi bekleniyor)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{u.displayName}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.isStaff ? 'Personel Hesabı' : 'Google Hesabı'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.role === 'Admin'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isRoot && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  updateUserRole(
                                    u.uid,
                                    u.role === 'Admin' ? 'Standart' : 'Admin'
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                              >
                                Rolü Değiştir ({u.role === 'Admin' ? 'Standart Yap' : 'Admin Yap'})
                              </button>
                              {u.isPreAssigned && (
                                <button
                                  onClick={() => deleteUserInvitation(u.uid)}
                                  className="p-1 text-rose-400 hover:text-rose-300"
                                  title="Daveti İptal Et"
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
      )}

      {/* Sub Tab: Permissions Matrix */}
      {activeSubTab === 'permissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Rol ve Yetki Seviyeleri Karşılaştırma Matrisi</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">Yetki & İşlem Türü</th>
                  <th className="py-3 px-4 font-semibold text-center w-36">Standart Personel</th>
                  <th className="py-3 px-4 font-semibold text-center w-36 text-amber-400">Yönetici (Admin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3 px-4 text-slate-300">Gelir / Gider ve Satış Ekleme</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Evet</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Evet</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Stok Girişi ve Sayım Güncelleme</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Evet</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Evet</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Kayıt Silme (Doğrudan Silme)</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-semibold">✗ Hayır (Onaya Gider)</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Doğrudan Silebilir</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Silme Taleplerini İnceleme ve Onaylama</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-semibold">✗ Yetkisiz</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Evet (Çift Onay)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Personel Ekleme / Şifre Değiştirme</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-semibold">✗ Yetkisiz</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Tam Yetki</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Kasa / Banka Hesabı Silme</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-semibold">✗ Yetkisiz</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Silebilir</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-300">Denetim Günlüğü (Audit Log) İnceleme</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-semibold">✗ Gizli</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Tüm Hareketler</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Staff Account */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>{editingStaffUsername ? 'Personel Hesabını Düzenle' : 'Yeni Personel Hesabı Oluştur'}</span>
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={staffForm.username}
                  onChange={e => setStaffForm({ ...staffForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  disabled={Boolean(editingStaffUsername)}
                  placeholder="Örn: ahmet, mehmet, arslan1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personel Adı Soyadı
                </label>
                <input
                  type="text"
                  value={staffForm.displayName}
                  onChange={e => setStaffForm({ ...staffForm, displayName: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Giriş Şifresi
                </label>
                <input
                  type="text"
                  value={staffForm.password || ''}
                  onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Personelin giriş şifresi (Örn: 123456)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yetki Seviyesi (Rol)
                </label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Standart">Standart Personel (Kayıt ekler, silme yönetici onayına gider)</option>
                  <option value="Admin">Yönetici / Admin (Tam yetkili, onay verebilir)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite / Pre-assign by Email */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>E-posta ile Rol Ön Atama</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Belirttiğiniz e-posta adresi Google ile giriş yaptığında otomatik olarak bu rol atanır.
            </p>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="kullanici@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ad Soyad (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Örn: Ayşe Demir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yetki Seviyesi
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Standart">Standart Kullanıcı</option>
                  <option value="Admin">Yönetici (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  Yetkiyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
