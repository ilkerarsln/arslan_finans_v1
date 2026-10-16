import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ShieldCheck, UserCheck, Shield, Users, Mail, Clock } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const UsersTab: React.FC = () => {
  const { allUsers, updateUserRole, isAdmin, userProfile } = useFinance();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Personel & Rol Yönetimi</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Sisteme kayıtlı personellerin yetkilerini (Admin / Normal Kullanıcı) düzenleyin
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Personel Adı</th>
                <th className="py-3 px-3">E-Posta / Kullanıcı Adı</th>
                <th className="py-3 px-3">Yetki Rolü</th>
                <th className="py-3 px-3">Kayıt Tarihi</th>
                <th className="py-3 px-4 text-center">Rol Değiştir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {allUsers.map(u => (
                <tr key={u.uid || u.id || u.email} className="hover:bg-slate-850/60">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                    {u.displayName || u.username || 'İsimsiz Personel'}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {u.role === 'Admin' ? 'Yönetici (Admin)' : 'Personel (Normal)'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {u.createdAt ? formatDate(u.createdAt) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {isAdmin && (
                      <select
                        value={u.role}
                        onChange={e => updateUserRole(u.uid || u.id || '', e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Standart">Standart Personel</option>
                        <option value="Admin">Yönetici (Admin)</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
