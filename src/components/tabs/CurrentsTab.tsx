import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Cari, CariType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Edit2,
  Trash2,
  AlertCircle,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

interface CurrentsTabProps {
  onOpenAddCari: () => void;
  onSelectCari: (cari: Cari) => void;
  onEditCari: (cari: Cari) => void;
}

export const CurrentsTab: React.FC<CurrentsTabProps> = ({
  onOpenAddCari,
  onSelectCari,
  onEditCari,
}) => {
  const { caris, deleteCari, requestDeleteCari, isAdmin, permissions, showToast } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | CariType>('All');
  const [balanceFilter, setBalanceFilter] = useState<'All' | 'Receivable' | 'Payable' | 'Zero'>('All');
  const [cariToDelete, setCariToDelete] = useState<Cari | null>(null);

  const filteredCaris = useMemo(() => {
    return caris.filter(cari => {
      if (typeFilter !== 'All' && cari.type !== typeFilter) {
        return false;
      }
      if (balanceFilter === 'Receivable' && cari.balance <= 0) return false;
      if (balanceFilter === 'Payable' && cari.balance >= 0) return false;
      if (balanceFilter === 'Zero' && cari.balance !== 0) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = cari.name.toLowerCase().includes(query);
        const matchesTax = cari.taxNumber?.toLowerCase().includes(query);
        const matchesCity = cari.city?.toLowerCase().includes(query);
        const matchesPhone = cari.phone?.toLowerCase().includes(query);
        if (!matchesName && !matchesTax && !matchesCity && !matchesPhone) return false;
      }
      return true;
    });
  }, [caris, typeFilter, balanceFilter, searchTerm]);

  const totalReceivables = useMemo(() => {
    return caris.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0);
  }, [caris]);

  const totalPayables = useMemo(() => {
    return caris.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0);
  }, [caris]);

  const handleDelete = (cari: Cari) => {
    if (isAdmin || permissions.canDeleteCaris) {
      deleteCari(cari.id);
      showToast(`${cari.name} cari kartı silindi.`, 'success');
    } else {
      requestDeleteCari(cari.id, 'Kullanıcı silme talebi iletti.');
      showToast('Cari silme talebi yönetici onayına iletildi.', 'info');
    }
    setCariToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Toplam Alacaklarımız (Müşteriler)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalReceivables)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Müşterilerden tahsil edilecek pozitif bakiye toplamı
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Toplam Borçlarımız (Tedarikçiler)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalPayables)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Toptancılara ve tedarikçilere ödenecek borçlar
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cari Kart İşlemleri
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {caris.length} kayıtlı cari hesap mevcuttur
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={onOpenAddCari}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Cari Hesap Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari adı, vergi no, il veya telefon..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {(['All', 'Müşteri', 'Tedarikçi', 'Personel'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'All' ? 'Tüm Tipler' : type}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <select
            value={balanceFilter}
            onChange={e => setBalanceFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">Tüm Bakiyeler</option>
            <option value="Receivable">Sadece Alacaklı (Müşteri)</option>
            <option value="Payable">Sadece Borçlu (Tedarikçi)</option>
            <option value="Zero">Bakiyesi Sıfır Olanlar</option>
          </select>
        </div>
      </div>

      {/* Caris Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredCaris.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Aradığınız kriterlere uygun cari hesap bulunamadı.</p>
            <p className="text-xs text-slate-500 mt-1">Arama filtrenizi temizleyebilir veya yeni cari ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Cari Ünvanı / Adı</th>
                  <th className="py-3.5 px-4">Tür</th>
                  <th className="py-3.5 px-4">İletişim</th>
                  <th className="py-3.5 px-4">Vergi No / Daire</th>
                  <th className="py-3.5 px-4 text-right">Bakiye</th>
                  <th className="py-3.5 px-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCaris.map(cari => {
                  const isPositive = cari.balance > 0;
                  const isNegative = cari.balance < 0;

                  return (
                    <tr
                      key={cari.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectCari(cari)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {cari.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                              {cari.name}
                            </div>
                            {cari.city && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span>{cari.city}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            cari.type === 'Müşteri'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50'
                              : cari.type === 'Tedarikçi'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50'
                          }`}
                        >
                          {cari.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-slate-500">
                          {cari.phone && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{cari.phone}</span>
                            </div>
                          )}
                          {cari.email && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]">{cari.email}</span>
                            </div>
                          )}
                          {!cari.phone && !cari.email && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {cari.taxNumber ? (
                          <div className="font-mono text-[11px]">
                            <div>{cari.taxNumber}</div>
                            {cari.taxOffice && <div className="text-[10px] text-slate-400">{cari.taxOffice} V.D.</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-bold tabular-nums text-sm ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {formatCurrency(cari.balance)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isPositive ? 'Alacağımız var' : isNegative ? 'Borcumuz var' : 'Bakiye kapalı'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectCari(cari)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Ekstre ve Detaylar"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditCari(cari)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCariToDelete(cari)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Modal */}
      {cariToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cari Hesabı Silmek İstiyor Musunuz?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              <strong className="text-slate-700 dark:text-slate-300">{cariToDelete.name}</strong> cari kartı
              {isAdmin ? ' kalıcı olarak silinecektir.' : ' için yönetici onay talebi oluşturulacaktır.'}
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setCariToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleDelete(cariToDelete)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                {isAdmin ? 'Evet, Sil' : 'Onaya Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
