import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  UserCog,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Lock,
  User as UserIcon,
  CheckCircle2,
  KeyRound,
  X,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react';

export const KullanicilarView: React.FC = () => {
  const { currentUser, users, addUser, updateUser, deleteUser, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'personel'>('personel');
  const [permissions, setPermissions] = useState<string[]>([
    'Satış & Kâr Takip Girişi',
    'Stok Listesi Görüntüleme',
  ]);

  const allAvailablePermissions = [
    'Tüm Finansal Yetkiler',
    'Mal Alım & Stok Yönetimi',
    'Cari Hesaplar & Borç/Alacak',
    'Kâr Takip & Vade Farkı Analizi',
    'Kasa & Banka Virman',
    'Gider & Masraf Girişi',
    'Tanımlamalar Yönetimi',
    'Kullanıcı & Yetki Yönetimi',
    'Satış & Kâr Takip Girişi',
    'Stok Listesi Görüntüleme',
  ];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('140514');
    setPhone('');
    setRole('personel');
    setPermissions(['Satış & Kâr Takip Girişi', 'Stok Listesi Görüntüleme']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(u.password || '140514');
    setPhone(u.phone || '');
    setRole(u.role);
    setPermissions(u.permissions || ['Satış & Kâr Takip Girişi']);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name,
        email,
        password,
        phone,
        role,
        permissions,
      });
    } else {
      addUser({
        name,
        email,
        password,
        phone,
        role,
        permissions,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (id: string, email: string) => {
    if (email === 'ilkerarslan78@gmail.com' || email === 'arslanmobilya78@gmail.com') {
      showToast('Ana yönetici hesabı sistemden silinemez!', 'error');
      return;
    }
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Yönetici Yetkilendirme & Erişim Merkezi</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Kullanıcılar & Yetki Yönetimi</h2>
          <p className="text-xs text-slate-400">
            Yönetici paneli üzerinden yeni personel ve yönetici kullanıcılar tanımlayabilir, yetkilerini düzenleyebilirsiniz.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.3]" />
          <span>+ Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      {/* Active User Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{currentUser?.name}</h3>
            <p className="text-xs text-amber-400 font-mono mt-0.5">{currentUser?.email}</p>
            <span className="inline-block mt-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Şu Anda Açık Olan Oturum ({currentUser?.role === 'admin' ? 'Tam Yönetici Yetkisi' : 'Personel'})
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          Rol: <strong className="text-white uppercase">{currentUser?.role}</strong> | Sabit Admin Şifresi: <strong className="font-mono text-amber-400">140514</strong>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Sistemde Kayıtlı Kullanıcılar ({users.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kullanıcı Adı</th>
                <th className="py-3 px-4">E-Posta Adresi</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4">Rol / Yetki</th>
                <th className="py-3 px-4">Giriş Şifresi</th>
                <th className="py-3 px-4">Tanımlı Yetkiler</th>
                <th className="py-3 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isFixedAdmin =
                  u.email === 'ilkerarslan78@gmail.com' || u.email === 'arslanmobilya78@gmail.com';

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {u.role === 'admin' ? 'Yönetici (Admin)' : 'Personel'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {u.password || '140514'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs text-[11px]">
                      {u.permissions?.join(', ') || 'Standart Erişim'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                          title="Yetkileri Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isFixedAdmin && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCog className="w-5 h-5 text-amber-400" />
                <span>{editingUser ? 'Kullanıcı & Yetki Düzenle' : 'Yeni Kullanıcı Tanımla'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Mehmet Demir"
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">E-Posta Adresi (Giriş İçin) *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mehmet@arslanmobilya.com"
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Giriş Şifresi *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="140514"
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Telefon Numarası</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0 (542) 000 00 00"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Kullanıcı Rolü</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="personel">Personel (Satış & Mağaza Yetkisi)</option>
                  <option value="admin">Yönetici (Tam Yetkili Admin)</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-slate-300 font-bold mb-2">Erişim İzinleri & Yetki Matrisi</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allAvailablePermissions.map((perm, idx) => {
                    const isChecked = permissions.includes(perm) || role === 'admin';

                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] transition cursor-pointer ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={role === 'admin'}
                          onChange={() => handleTogglePermission(perm)}
                          className="accent-amber-500 rounded"
                        />
                        <span>{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {editingUser ? 'Değişiklikleri Kaydet' : 'Kullanıcıyı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
