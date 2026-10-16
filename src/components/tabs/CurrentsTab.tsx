import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Phone,
  Mail,
  Building,
  User,
  Trash2,
  Edit2,
  FileText,
  CreditCard,
  Download,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Cari, CariType } from '../../types/finance';
import { CariModal } from '../modals/CariModal';
import { CariDetailModal } from '../modals/CariDetailModal';
import * as XLSX from 'xlsx';

export const CurrentsTab: React.FC = () => {
  const {
    caris,
    openInstallmentModal,
    deleteCari,
    isAdmin,
    showToast,
  } = useFinance();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'borc' | 'alacak' | 'zero'>('ALL');

  // Modal states
  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [selectedCariDetail, setSelectedCariDetail] = useState<Cari | null>(null);

  const filteredCaris = useMemo(() => {
    return caris.filter(c => {
      if (selectedType !== 'ALL' && c.type !== selectedType) return false;
      if (balanceFilter === 'borc' && c.balance >= 0) return false; // Borcumuz var (negatif)
      if (balanceFilter === 'alacak' && c.balance <= 0) return false; // Alacağımız var (pozitif)
      if (balanceFilter === 'zero' && c.balance !== 0) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mPhone = (c.phone || '').toLowerCase().includes(q);
        const mCity = (c.city || '').toLowerCase().includes(q);
        const mTax = (c.taxNumber || '').toLowerCase().includes(q);
        if (!mName && !mPhone && !mCity && !mTax) return false;
      }
      return true;
    });
  }, [caris, selectedType, balanceFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    let totalReceivable = 0; // Bizim alacağımız (pozitif)
    let totalPayable = 0; // Bizim borcumuz (negatif bakiye -> tedarikçiler vs)
    let supplierCount = 0;
    let customerCount = 0;

    caris.forEach(c => {
      if (c.type === 'Tedarikçi') supplierCount++;
      if (c.type === 'Müşteri') customerCount++;

      if (c.balance > 0) {
        totalReceivable += c.balance;
      } else if (c.balance < 0) {
        totalPayable += Math.abs(c.balance);
      }
    });

    return { totalReceivable, totalPayable, supplierCount, customerCount };
  }, [caris]);

  const handleOpenNewCari = () => {
    setEditingCari(null);
    setIsCariModalOpen(true);
  };

  const handleOpenEditCari = (cari: Cari) => {
    setEditingCari(cari);
    setIsCariModalOpen(true);
  };

  const handleExportExcel = () => {
    try {
      const rows = filteredCaris.map(c => ({
        Ünvan: c.name,
        Tür: c.type,
        Bakiye: c.balance,
        Telefon: c.phone || '-',
        Şehir: c.city || '-',
        VergiNo: c.taxNumber || '-',
        Eposta: c.email || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CariListesi');
      XLSX.writeFile(wb, 'Arslan_Mobilya_Cari_Listesi.xlsx');
      showToast('Cari listesi Excel olarak indirildi', 'success');
    } catch {
      showToast('Dışa aktarma başarısız', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Toplam Müşteri Alacağı</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            {formatCurrency(stats.totalReceivable)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.customerCount} Müşteri kaydı
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Toplam Tedarikçi Borcu</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-2">
            {formatCurrency(stats.totalPayable)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {stats.supplierCount} Tedarikçi & Fabrika borcu
          </span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Cari Pozisyonu</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono mt-2 ${
              stats.totalReceivable - stats.totalPayable >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(stats.totalReceivable - stats.totalPayable)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Alacak - Borç farkı</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="text-xs text-slate-400">Toplam Kayıtlı Cari</div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {caris.length} Firma / Şahıs
          </div>
          <span className="text-[11px] text-slate-500">Toptan & Perakende ortak cari havuzu</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewCari}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Cari Kart Ekle</span>
            </button>
            <button
              onClick={() => openInstallmentModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span>Senet / Taksit Planla</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Cari Türü
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tümü (Müşteri & Tedarikçi)</option>
              <option value="Tedarikçi">Tedarikçiler (Fabrikalar)</option>
              <option value="Müşteri">Müşteriler</option>
              <option value="Ortak">Ortaklar / Personel</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Bakiye Durumu
            </label>
            <select
              value={balanceFilter}
              onChange={e => setBalanceFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tüm Bakiyeler</option>
              <option value="borc">Borcumuz Olanlar (Tedarikçi Borcu)</option>
              <option value="alacak">Alacağımız Olanlar (Müşteri Alacağı)</option>
              <option value="zero">Bakiyesi Sıfır Olanlar</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Arama
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Firma ünvanı, tel, vergi no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Caris Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Cari Ünvanı / Adı</th>
                <th className="py-3 px-3">Tür</th>
                <th className="py-3 px-3">Telefon & İletişim</th>
                <th className="py-3 px-3">Şehir / Adres</th>
                <th className="py-3 px-4 text-right">Bakiye</th>
                <th className="py-3 px-4 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-num">
              {filteredCaris.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    Aranan kriterlere uygun cari kart bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredCaris.map(cari => {
                  const isSupplier = cari.type === 'Tedarikçi';
                  const isDebt = cari.balance < 0; // Borcumuz var
                  const isCredit = cari.balance > 0; // Alacağımız var

                  return (
                    <tr
                      key={cari.id}
                      onClick={() => setSelectedCariDetail(cari)}
                      className="hover:bg-slate-850/60 transition group cursor-pointer"
                    >
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          {isSupplier ? (
                            <Building className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{cari.name}</span>
                        </div>
                        {cari.taxNumber && (
                          <span className="text-[10px] text-slate-500 block ml-5">
                            VN: {cari.taxNumber} {cari.taxOffice ? `(${cari.taxOffice})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSupplier
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {cari.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 whitespace-nowrap">
                        {cari.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{cari.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-400 whitespace-nowrap">
                        {cari.city || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            isCredit
                              ? 'text-emerald-400'
                              : isDebt
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {isDebt ? `-${formatCurrency(Math.abs(cari.balance))}` : formatCurrency(cari.balance)}
                        </span>
                        <span className="block text-[9px] font-sans font-normal text-slate-500">
                          {isDebt
                            ? '(Borçluyuz)'
                            : isCredit
                            ? '(Alacaklıyız)'
                            : '(Bakiye Sıfır)'}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-center whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedCariDetail(cari)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 rounded-lg transition"
                            title="Ekstre ve Detay"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                          </button>
                          <button
                            onClick={() => handleOpenEditCari(cari)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`${cari.name} cari kartını silmek istediğinize emin misiniz?`)) {
                                deleteCari(cari.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-750 rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Cari Modal */}
      <CariModal
        isOpen={isCariModalOpen}
        onClose={() => setIsCariModalOpen(false)}
        editingCari={editingCari}
      />

      {/* Cari Detail Modal */}
      <CariDetailModal
        cari={selectedCariDetail}
        onClose={() => setSelectedCariDetail(null)}
        onEdit={(c) => {
          setSelectedCariDetail(null);
          handleOpenEditCari(c);
        }}
      />
    </div>
  );
};
