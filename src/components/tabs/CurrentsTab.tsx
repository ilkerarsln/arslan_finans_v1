import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Eye,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Cari, CariType } from '../../types/finance';
import { CariModal } from '../modals/CariModal';
import { CariDetailModal } from '../modals/CariDetailModal';

export const CurrentsTab: React.FC = () => {
  const {
    caris,
    deleteCari,
    isAdmin,
    requestDeleteCari,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [detailCari, setDetailCari] = useState<Cari | null>(null);

  const filteredCaris = useMemo(() => {
    return caris.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [caris, searchTerm, typeFilter]);

  const handleOpenNew = () => {
    setEditingCari(null);
    setIsCariModalOpen(true);
  };

  const handleOpenEdit = (c: Cari) => {
    setEditingCari(c);
    setIsCariModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (isAdmin) {
      if (window.confirm(`"${name}" cari hesabını silmek istediğinize emin misiniz?`)) {
        deleteCari(id);
      }
    } else {
      const reason = window.prompt(`Silme gerekçesi:`, 'Cari kayıt silme talebi');
      if (reason) {
        requestDeleteCari(id, reason);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Cari Hesaplar (Müşteri & Tedarikçiler)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Müşteriler, tedarikçiler ve çalışanların cari bakiyelerini ve hareketlerini görüntüleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Cari Ekle
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/60">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari adı, telefon, şehir ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Cari Türleri</option>
          <option value="Müşteri">Müşteriler</option>
          <option value="Tedarikçi">Tedarikçiler</option>
          <option value="Personel">Personel</option>
          <option value="Diğer">Diğer</option>
        </select>
      </div>

      {/* Caris Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Cari Ünvanı / Adı</th>
                <th className="p-3.5">Tür</th>
                <th className="p-3.5">Telefon / İletişim</th>
                <th className="p-3.5">Şehir</th>
                <th className="p-3.5 text-right">Bakiye</th>
                <th className="p-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCaris.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Kayıtlı cari bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCaris.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap font-medium text-white">
                      <button
                        onClick={() => setDetailCari(c)}
                        className="hover:text-indigo-400 text-left transition-colors font-semibold"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.type === 'Müşteri'
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-800/50'
                            : c.type === 'Tedarikçi'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400">
                      {c.phone ? (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400">
                      {c.city || '-'}
                    </td>
                    <td
                      className={`p-3.5 whitespace-nowrap text-right font-bold text-sm ${
                        c.balance > 0
                          ? 'text-emerald-400'
                          : c.balance < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(c.balance)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailCari(c)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Ekstre / Hareketler"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CariModal
        isOpen={isCariModalOpen}
        onClose={() => setIsCariModalOpen(false)}
        editingCari={editingCari}
      />

      <CariDetailModal
        cari={detailCari}
        onClose={() => setDetailCari(null)}
        onEdit={c => {
          setDetailCari(null);
          setEditingCari(c);
          setIsCariModalOpen(true);
        }}
      />
    </div>
  );
};
