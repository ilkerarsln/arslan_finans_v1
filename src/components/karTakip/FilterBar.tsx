import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  Search,
  Filter,
  User,
  Calendar,
  Layers,
  RotateCcw,
  Download,
  FileSpreadsheet,
  Lock,
  ChevronDown,
  Building2
} from 'lucide-react';
import {
  downloadSalesTemplate,
  downloadWholesaleTemplate,
  downloadPurchasesTemplate,
  exportSalesToExcel
} from '../../utils/karTakipExcelParser';

export const FilterBar: React.FC = () => {
  const {
    filters,
    setFilters,
    resetFilters,
    uniqueCategories,
    uniqueSalesReps,
    uniquePeriods,
    uniqueSuppliers,
    currentUser,
    filteredSales
  } = useKarTakip();

  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const isRep = currentUser?.role === 'SALES_REP';

  const handleExport = () => {
    const filename = `kartakip_rapor_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportSalesToExcel(filteredSales, filename);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 mb-5 shadow-xs">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün adı, SKU, müşteri veya fatura..."
              value={filters.searchQuery}
              onChange={e => setFilters({ searchQuery: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative">
            {isRep ? (
              <div
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-300 text-xs rounded-xl cursor-not-allowed"
                title="Satış personeli rolündesiniz. Yalnızca kendi satış kayıtlarınızı görebilirsiniz."
              >
                <Lock className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-medium">{currentUser?.salesRepName || currentUser?.name}</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={filters.selectedSalesRep}
                  onChange={e => setFilters({ selectedSalesRep: e.target.value })}
                  className="appearance-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">Tüm Satış Personelleri</option>
                  {uniqueSalesReps.map(rep => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
                <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="relative">
            <select
              value={filters.selectedPeriod}
              onChange={e => setFilters({ selectedPeriod: e.target.value })}
              className="appearance-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Tüm Dönemler</option>
              {uniquePeriods.map(period => (
                <option key={period} value={period}>
                  {period} Dönemi
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filters.selectedCategory}
              onChange={e => setFilters({ selectedCategory: e.target.value })}
              className="appearance-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Tüm Kategoriler</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filters.selectedSupplier}
              onChange={e => setFilters({ selectedSupplier: e.target.value })}
              className="appearance-none bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl pl-8 pr-7 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[170px] truncate"
            >
              <option value="ALL">Tüm Tedarikçiler</option>
              {uniqueSuppliers.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
            <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filters.statusFilter}
              onChange={e => setFilters({ statusFilter: e.target.value as any })}
              className={`appearance-none text-xs rounded-xl pl-8 pr-7 py-2 border focus:outline-none cursor-pointer ${
                filters.statusFilter === 'MISSING_PRICE'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-medium'
                  : filters.statusFilter === 'UNPROFITABLE'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 font-medium'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <option value="ALL">Kârlılık Durumu (Tümü)</option>
              <option value="PROFITABLE">Yalnızca Kârlı Olanlar</option>
              <option value="UNPROFITABLE">Zararına Satışlar (Kritik)</option>
              <option value="MISSING_PRICE">Toptan Fiyatı Eksikler (Uyarılı)</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Tüm filtreleri varsayılana döndür"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Excel Şablonları</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showTemplateDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 text-left"
                onClick={() => setShowTemplateDropdown(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Hazır .xlsx Şablonları İndir
                </div>
                <button
                  onClick={downloadSalesTemplate}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-emerald-600 dark:text-emerald-300">Örnek Satış Raporu Şablonu</div>
                    <div className="text-[10px] text-slate-400">Temsilci, Ürün, Adet, Fiyat</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={downloadWholesaleTemplate}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-t border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <div className="font-medium text-teal-600 dark:text-teal-300">Toptan Fiyat Listesi Şablonu</div>
                    <div className="text-[10px] text-slate-400">Ürün Kodu, Toptan Maliyet</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={downloadPurchasesTemplate}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between border-t border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <div className="font-medium text-purple-600 dark:text-purple-300">Mal Alım (Satın Alma) Şablonu</div>
                    <div className="text-[10px] text-slate-400">Tedarikçi, Adet, Alış Maliyeti</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Filtrelenen satış ve kâr analizlerini Excel olarak indir"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel'e Aktar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
