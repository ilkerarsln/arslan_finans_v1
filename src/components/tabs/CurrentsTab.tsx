import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Cari, CariType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  Users,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Building,
  Phone,
  Mail,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

interface CurrentsTabProps {
  onOpenAddCari: () => void;
  onEditCari: (cari: Cari) => void;
  onSelectCariDetail: (cari: Cari) => void;
}

export const CurrentsTab: React.FC<CurrentsTabProps> = ({
  onOpenAddCari,
  onEditCari,
  onSelectCariDetail,
}) => {
  const { caris, deleteCari, openTransactionModal } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | CariType>('All');

  const filteredCaris = caris.filter(c => {
    if (typeFilter !== 'All' && c.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchTax = c.taxNumber?.toLowerCase().includes(q);
      const matchCity = c.city?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      if (!matchName && !matchTax && !matchCity && !matchPhone) return false;
    }
    return true;
  });

  // KPI Calculations
  const totalReceivables = caris
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);

  const totalPayables = caris
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const netCariBalance = totalReceivables - totalPayables;

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`'${name}' cari hesabını silmek istediğinize emin misiniz?`)) {
      deleteCari(id);
    }
  };

  const handleQuickCollect = (cari: Cari, e: React.MouseEvent) => {
    e.stopPropagation();
    openTransactionModal({
      type: 'Gelir',
      cariId: cari.id,
      cariName: cari.name,
      category: 'Cari Hesap Tahsilatı',
      desc: `${cari.name} cari tahsilatı`,
      amount: cari.balance > 0 ? cari.balance : undefined,
    });
  };

  const handleQuickPay = (cari: Cari, e: React.MouseEvent) => {
    e.stopPropagation();
    openTransactionModal({
      type: 'Gider',
      cariId: cari.id,
      cariName: cari.name,
      category: 'Stok & Mal Alımı',
      desc: `${cari.name} cari ödemesi`,
      amount: cari.balance < 0 ? Math.abs(cari.balance) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & New Cari button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Cari Hesaplar (Müşteri & Tedarikçi)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Borç, alacak ve hesap mutabakatlarının takibi
          </p>
        </div>
        <button
          onClick={onOpenAddCari}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Cari Kart Ekle
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Toplam Müşteri Alacağı
          </span>
          <h3 className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalReceivables)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {caris.filter(c => c.balance > 0).length} aktif borçlu müşteri
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Toplam Tedarikçi Borcu
          </span>
          <h3 className="text-2xl font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalPayables)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {caris.filter(c => c.balance < 0).length} aktif alacaklı tedarikçi
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Net Cari Bakiye Pozisyonu
          </span>
          <h3
            className={`text-2xl font-bold font-mono-num mt-1 ${
              netCariBalance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(netCariBalance)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {netCariBalance >= 0 ? 'Net Cari Alacaklıyız' : 'Net Cari Borçluyuz'}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari firma adı, vergi no, şehir veya telefon ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Segmented controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          {(['All', 'Müşteri', 'Tedarikçi', 'Personel'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition ${
                typeFilter === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'All' ? 'Tümü' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Caris Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCaris.map(cari => {
          const isReceivable = cari.balance > 0;
          const isPayable = cari.balance < 0;

          return (
            <div
              key={cari.id}
              onClick={() => onSelectCariDetail(cari)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 shadow-xs transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      cari.type === 'Müşteri'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : cari.type === 'Tedarikçi'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    }`}
                  >
                    {cari.type}
                  </span>
                  <div
                    className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEditCari(cari)}
                      title="Düzenle"
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cari.id, cari.name)}
                      title="Sil"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Company Name */}
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  {cari.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cari.city || 'Şehir belirtilmedi'} {cari.taxOffice ? `· ${cari.taxOffice}` : ''}
                </p>

                {/* Balance display */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      Bakiye
                    </span>
                    <div
                      className={`text-lg font-bold font-mono-num ${
                        isReceivable
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isPayable
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {formatCurrency(cari.balance)}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      isReceivable
                        ? 'text-emerald-700 bg-emerald-100/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isPayable
                        ? 'text-rose-700 bg-rose-100/60 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {isReceivable ? 'Alacaklıyız' : isPayable ? 'Borçluyuz' : 'Kapalı'}
                  </span>
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div
                className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => onSelectCariDetail(cari)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Ekstre Gör
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => handleQuickCollect(cari, e)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <ArrowDownRight className="w-3 h-3" /> Tahsilat
                  </button>
                  <button
                    onClick={e => handleQuickPay(cari, e)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <ArrowUpRight className="w-3 h-3" /> Ödeme
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
