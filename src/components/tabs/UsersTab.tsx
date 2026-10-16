import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Trash2,
  Lock,
  User,
  KeyRound,
  Shield,
} from 'lucide-react';
import { StaffAccount, UserRole } from '../../types/finance';

export const UsersTab: React.FC = () => {
  const {
    staffAccounts,
    createStaffAccount,
    removeStaffAccount,
    isAdmin,
    userProfile,
  } = useFinance();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Standart');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) return;

    setIsSubmitting(true);
    try {
      const newStaff: StaffAccount = {
        id: `staff-${Date.now()}`,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        role,
        password: password.trim() || '123456',
        createdAt: new Date().toISOString(),
      };
      await createStaffAccount(newStaff);
      setUsername('');
      setDisplayName('');
      setPassword('');
      alert('Personel hesabı başarıyla oluşturuldu.');
    } catch (err: any) {
      alert('Hata: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (uname: string) => {
    if (window.confirm(`"${uname}" kullanıcısını silmek istediğinize emin misiniz?`)) {
      await removeStaffAccount(uname);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          Kullanıcı & Personel Yetki Yönetimi
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Personel hesapları açarak kasa, satış ve stok girişlerine izin verin; silme işlemlerini yönetici onayına bağlayın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Staff Form */}
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-indigo-400" /> Yeni Personel / Kullanıcı Ekle
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Kullanıcı Adı (Giriş için)</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ornek: ahmet, mehmet"
                className="w-full bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Ad Soyad / Ünvan</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ahmet Yılmaz (Satış Temsilcisi)"
                className="w-full bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Şifre (Varsayılan: 123456)</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Yetki / Rol</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Standart">Standart Personel (Silme talebe tabidir)</option>
                <option value="Admin">Admin / Yönetici (Tam yetkili)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Personel Oluştur'}
            </button>
          </form>
        </div>

        {/* Existing Staff List */}
        <div className="lg:col-span-2 bg-slate-900/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Mevcut Personel ve Hesaplar</h3>

          <div className="space-y-3">
            {staffAccounts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Kayıtlı ek personel bulunmuyor.
              </div>
            ) : (
              staffAccounts.map(s => (
                <div
                  key={s.id}
                  className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-xl text-indigo-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{s.displayName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">@{s.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.role === 'Admin'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-indigo-950/80 text-indigo-400 border border-indigo-800'
                      }`}
                    >
                      {s.role}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleRemove(s.username)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
