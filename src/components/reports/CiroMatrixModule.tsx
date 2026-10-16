import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Edit3,
  Download,
  Plus,
  RefreshCw,
  Check,
  X,
  FileSpreadsheet,
  Percent,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  Upload,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CIRO_MONTHS, CIRO_ROW_DEFINITIONS } from '../../data/initialCiroMatrix';
import { calculateCiroMatrix, ComputedRowData, ComputedCellData } from '../../utils/ciroCalculations';
import { exportCiroMatrixToExcel } from '../../utils/ciroExcelExport';
import { CiroDataImporter } from '../importer/CiroDataImporter';

export const CiroMatrixModule: React.FC = () => {
  const {
    sales,
    ciroMatrixData,
    updateCiroCell,
    updateCiroRowMargin,
    addNewCiroYear,
    resetCiroMatrixToDefault,
    showToast,
  } = useFinance();

  const now = new Date();
  const currentYearStr = String(now.getFullYear());

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [filterGroup, setFilterGroup] = useState<'ALL' | 'BEYAZ EŞYA' | 'MOBİLYA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSalesBreakdown, setShowSalesBreakdown] = useState(false);

  // New Year modal
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  // Ciro Importer Modal
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Cell Edit Modal State
  const [editingCell, setEditingCell] = useState<{
    year: string;
    rowId: string;
    rowName: string;
    month: number;
    monthName: string;
    manualAmount: number;
    liveSalesAmount: number;
    currentTotal: number;
    note?: string;
    contributingSales: any[];
  } | null>(null);

  const [inputManualAmount, setInputManualAmount] = useState<string>('0');
  const [inputCellNote, setInputCellNote] = useState<string>('');

  // Profit Margin Edit Modal State
  const [editingMargin, setEditingMargin] = useState<{
    year: string;
    rowId: string;
    rowName: string;
    currentMargin: number;
  } | null>(null);

  const [inputMargin, setInputMargin] = useState<string>('25');

  // Core Matrix Calculations
  const matrixResult = useMemo(() => {
    return calculateCiroMatrix(selectedYear, ciroMatrixData, sales);
  }, [selectedYear, ciroMatrixData, sales]);

  // Open Cell Edit Modal
  const handleCellClick = (row: ComputedRowData, monthNum: number) => {
    const cell = row.months[monthNum];
    const monthObj = CIRO_MONTHS.find(m => m.no === monthNum);

    setEditingCell({
      year: selectedYear,
      rowId: row.id,
      rowName: row.displayName,
      month: monthNum,
      monthName: monthObj?.name || `${monthNum}. Ay`,
      manualAmount: cell.manualAmount,
      liveSalesAmount: cell.liveSalesAmount,
      currentTotal: cell.totalAmount,
      note: cell.note || '',
      contributingSales: cell.contributingSales || [],
    });
    setInputManualAmount(String(cell.manualAmount));
    setInputCellNote(cell.note || '');
  };

  // Save Cell
  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    const parsed = parseFloat(inputManualAmount.replace(/\./g, '').replace(',', '.')) || 0;
    updateCiroCell(editingCell.year, editingCell.rowId, editingCell.month, {
      manualAmount: parsed,
      note: inputCellNote.trim() || undefined,
    });
    setEditingCell(null);
  };

  // Open Margin Edit Modal
  const handleMarginClick = (row: ComputedRowData) => {
    setEditingMargin({
      year: selectedYear,
      rowId: row.id,
      rowName: row.displayName,
      currentMargin: row.profitMargin,
    });
    setInputMargin(String(row.profitMargin));
  };

  // Save Margin
  const handleSaveMargin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMargin) return;

    const parsed = parseFloat(inputMargin.replace(',', '.')) || 0;
    if (parsed < 0 || parsed > 100) {
      showToast('Kâr marjı %0 ile %100 arasında olmalıdır', 'error');
      return;
    }
    updateCiroRowMargin(editingMargin.year, editingMargin.rowId, parsed);
    setEditingMargin(null);
  };

  // Add Year
  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newYearInput.trim();
    if (!clean || isNaN(Number(clean)) || clean.length !== 4) {
      showToast('Lütfen geçerli 4 haneli bir yıl girin (Örn: 2027)', 'error');
      return;
    }
    addNewCiroYear(clean);
    setSelectedYear(clean);
    setIsAddYearModalOpen(false);
    setNewYearInput('');
  };

  // Filter rows based on search and group
  const filteredRows = useMemo(() => {
    return matrixResult.rows.filter(r => {
      if (filterGroup !== 'ALL' && r.group !== filterGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.displayName.toLowerCase().includes(q) && !r.group.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [matrixResult.rows, filterGroup, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Ciro ve Finansal Analiz Matrisi
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Excel Şablonu Uyumlu
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Yıllık ve aylık kategori/marka bazlı ciro, ortalama kârlılık, alt toplamlar ve geçmiş yıl büyüme karşılaştırması.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
            title="Ciro Excel Dosyasını Sisteme Aktar"
          >
            <Upload className="w-4 h-4" />
            Ciro Excel İçe Aktar
          </button>

          <button
            onClick={() => exportCiroMatrixToExcel(matrixResult)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
            title="Ciro Matrisini Excel Dosyası (.xlsx) olarak İndir"
          >
            <Download className="w-4 h-4" />
            Excel'e Aktar (.xlsx)
          </button>

          <button
            onClick={() => {
              if (window.confirm('Ciro matrisi fabrika verilerine döndürülsün mü?')) {
                resetCiroMatrixToDefault();
              }
            }}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Fabrika Başlangıç Verilerini Geri Yükle"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Varsayılana Sıfırla
          </button>
        </div>
      </div>

      {/* Year Tabs & Filtering Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        {/* Year Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Yıl:
          </span>
          {matrixResult.availableYears.map(year => {
            const isActive = selectedYear === year;
            return (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {year} Yılı
              </button>
            );
          })}

          <button
            onClick={() => setIsAddYearModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900/40 text-slate-400 hover:text-indigo-300 hover:bg-slate-850 border border-dashed border-slate-700 transition-all shrink-0 cursor-pointer"
            title="Yeni Yıl Ekle"
          >
            <Plus className="w-3.5 h-3.5" /> Yıl Ekle
          </button>
        </div>

        {/* Group Filter and Search */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
            <button
              onClick={() => setFilterGroup('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({matrixResult.rows.length})
            </button>
            <button
              onClick={() => setFilterGroup('BEYAZ EŞYA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'BEYAZ EŞYA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Beyaz Eşya ({matrixResult.beyazEsyaRows.length})
            </button>
            <button
              onClick={() => setFilterGroup('MOBİLYA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'MOBİLYA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mobilya ({matrixResult.mobilyaRows.length})
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Marka / Kategori ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-44"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards: Dynamic Calculations & Comparison with Past Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Grand Total */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{selectedYear} Genel Cirosu</span>
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(matrixResult.grandTotal.yearTotal)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Aylık Ort:</span>
            <span className="text-slate-300 font-semibold">
              {formatCurrency(matrixResult.grandTotal.monthlyAverage)}
            </span>
          </div>
        </div>

        {/* Growth Comparison vs Past Year */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Geçmiş Yıl ({matrixResult.pastYear}) Kıyas</span>
            <span
              className={`p-1 rounded-lg ${
                matrixResult.grandTotal.growthAmount >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {matrixResult.grandTotal.growthAmount >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
          <div
            className={`text-xl font-bold tracking-tight ${
              matrixResult.grandTotal.growthAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {matrixResult.grandTotal.growthAmount >= 0 ? '+' : ''}
            {formatCurrency(matrixResult.grandTotal.growthAmount)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Büyüme:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                matrixResult.grandTotal.growthRate >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              %{matrixResult.grandTotal.growthRate.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Beyaz Eşya Subtotal & Share */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Beyaz Eşya Cirosu</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Payı: %{matrixResult.beyazEsyaSubtotal.sharePercent.toFixed(1)}
            </span>
          </div>
          <div className="text-xl font-bold text-sky-400 tracking-tight">
            {formatCurrency(matrixResult.beyazEsyaSubtotal.yearTotal)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Kâr: {formatCurrency(matrixResult.beyazEsyaSubtotal.estimatedProfit)}</span>
            <span className="text-sky-300 font-semibold">%{matrixResult.beyazEsyaSubtotal.weightedMargin.toFixed(1)} Marj</span>
          </div>
        </div>

        {/* Mobilya Subtotal & Share */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Mobilya Cirosu</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Payı: %{matrixResult.mobilyaSubtotal.sharePercent.toFixed(1)}
            </span>
          </div>
          <div className="text-xl font-bold text-amber-400 tracking-tight">
            {formatCurrency(matrixResult.mobilyaSubtotal.yearTotal)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Kâr: {formatCurrency(matrixResult.mobilyaSubtotal.estimatedProfit)}</span>
            <span className="text-amber-300 font-semibold">%{matrixResult.mobilyaSubtotal.weightedMargin.toFixed(1)} Marj</span>
          </div>
        </div>

        {/* Total Estimated Gross Profit & Weighted Margin */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Tahmini Brüt Kâr</span>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(matrixResult.grandTotal.totalEstimatedProfit)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ağırlıklı Ortalama:</span>
            <span className="font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              %{matrixResult.grandTotal.weightedMargin.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Helpful Hint banner */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="text-slate-300">İpucu:</strong> Matristeki herhangi bir <span className="text-indigo-300 font-semibold">ay hücresine</span> veya satır başındaki <span className="text-emerald-300 font-semibold">Kârlılık %</span> değerine tıklayarak doğrudan düzenleme yapabilirsiniz. Sistemdeki onaylı satışlar hücrelere anlık yansıtılır.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Otomatik ERP Satışı</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            <span>Manuel Kayıt</span>
          </span>
        </div>
      </div>

      {/* Main Ciro Matrix Table */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            {/* Table Header */}
            <thead className="bg-slate-950/90 sticky top-0 z-20 backdrop-blur-md border-b border-slate-800 text-slate-300">
              <tr>
                <th className="py-3 px-3.5 sticky left-0 z-30 bg-slate-950 font-bold min-w-[170px] shadow-sm">
                  Kategori / Marka
                </th>
                <th className="py-3 px-2.5 text-center font-bold text-emerald-400 min-w-[70px]">
                  Kârlılık
                </th>
                {CIRO_MONTHS.map(m => (
                  <th key={m.no} className="py-3 px-2 text-right font-semibold text-slate-300 min-w-[95px]">
                    {m.name}
                  </th>
                ))}
                <th className="py-3 px-3 text-right font-bold text-white bg-slate-900/80 min-w-[120px]">
                  Genel Toplam
                </th>
                <th className="py-3 px-3 text-right font-semibold text-slate-300 min-w-[110px]">
                  Aylık Ort.
                </th>
                <th className="py-3 px-3 text-right font-semibold text-slate-400 min-w-[115px]">
                  {matrixResult.pastYear} Toplamı
                </th>
                <th className="py-3 px-3 text-right font-semibold text-slate-300 min-w-[105px]">
                  Büyüme (TL)
                </th>
                <th className="py-3 px-3 text-center font-bold text-slate-300 min-w-[85px]">
                  Büyüme %
                </th>
                <th className="py-3 px-3 text-right font-bold text-emerald-400 min-w-[115px]">
                  Tahmini Kâr
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {/* Group 1: BEYAZ EŞYA */}
              {(filterGroup === 'ALL' || filterGroup === 'BEYAZ EŞYA') && (
                <>
                  {/* Group Header Row */}
                  <tr className="bg-sky-950/20 text-sky-300 font-sans font-bold">
                    <td colSpan={18} className="py-2 px-3.5 text-xs tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                      BEYAZ EŞYA GRUBU ({matrixResult.beyazEsyaRows.length} Marka)
                    </td>
                  </tr>

                  {matrixResult.beyazEsyaRows
                    .filter(r => !searchQuery.trim() || r.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(row => renderDataRow(row))}

                  {/* Beyaz Eşya Subtotal Row */}
                  {renderSubtotalRow(matrixResult.beyazEsyaSubtotal, 'sky')}
                </>
              )}

              {/* Group 2: MOBİLYA */}
              {(filterGroup === 'ALL' || filterGroup === 'MOBİLYA') && (
                <>
                  {/* Group Header Row */}
                  <tr className="bg-amber-950/20 text-amber-300 font-sans font-bold">
                    <td colSpan={18} className="py-2.5 px-3.5 text-xs tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      MOBİLYA GRUBU ({matrixResult.mobilyaRows.length} Kategori/Marka)
                    </td>
                  </tr>

                  {matrixResult.mobilyaRows
                    .filter(r => !searchQuery.trim() || r.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(row => renderDataRow(row))}

                  {/* Mobilya Subtotal Row */}
                  {renderSubtotalRow(matrixResult.mobilyaSubtotal, 'amber')}
                </>
              )}

              {/* Grand Total Row */}
              {renderGrandTotalRow(matrixResult.grandTotal)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingCell.rowName} — {editingCell.monthName} {editingCell.year} Cirosu
                  </h3>
                  <p className="text-[11px] text-slate-400">Hücre değerini manuel düzenleyin veya güncelleyin</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCell} className="p-5 space-y-4">
              {/* Live Sales Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    Sistem Satışlarından Gelen (Otomatik):
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(editingCell.liveSalesAmount)}
                  </span>
                </div>
                {editingCell.contributingSales.length > 0 && (
                  <div className="text-[10px] text-slate-500">
                    * Bu ay onaylanan {editingCell.contributingSales.length} adet faturadan otomatik hesaplanmaktadır.
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Manuel / Geçmiş Ciro Tutarı (TL)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₺</span>
                  <input
                    type="number"
                    step="any"
                    value={inputManualAmount}
                    onChange={e => setInputManualAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Excel geçmişinden aktarılan veya manuel eklenen net tutar.
                </p>
              </div>

              {/* Net Computed Cell Preview */}
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-medium">Bu Ayki Net Hücre Toplamı:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatCurrency((parseFloat(inputManualAmount) || 0) + editingCell.liveSalesAmount)}
                </span>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Açıklama / Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={inputCellNote}
                  onChange={e => setInputCellNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="Örn: Yıl sonu bayi kampanyası, toplu ihale satışı vb."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-950/40 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Değeri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Margin Edit Modal */}
      {editingMargin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Percent className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingMargin.rowName} Kârlılık Oranı (%)
                  </h3>
                  <p className="text-[11px] text-slate-400">Tahmini brüt kâr hesaplamasında kullanılır</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMargin(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMargin} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ortalama Kâr Oranı (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={inputMargin}
                    onChange={e => setInputMargin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    placeholder="25"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 mr-1">Hızlı Seç:</span>
                {[20, 22, 25, 28, 30, 32, 35, 38].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setInputMargin(String(rate))}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    %{rate}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMargin(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Kâr Oranını Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Year Modal */}
      {isAddYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Yeni Yıl Sekmesi Ekle
              </h3>
              <button onClick={() => setIsAddYearModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yıl (Örn: 2027)
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  value={newYearInput}
                  onChange={e => setNewYearInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  placeholder="2027"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddYearModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Yılı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ciro Excel Importer Modal */}
      {isImporterOpen && (
        <CiroDataImporter
          defaultYear={selectedYear}
          onClose={() => setIsImporterOpen(false)}
          onImportComplete={(year) => {
            setSelectedYear(year);
            setIsImporterOpen(false);
          }}
        />
      )}
    </div>
  );

  // Helper to render individual brand/category row
  function renderDataRow(row: ComputedRowData) {
    const isPositive = row.growthAmount >= 0;

    return (
      <tr key={row.id} className="hover:bg-slate-800/40 transition-colors group">
        {/* Name and Group Badge */}
        <td className="py-2.5 px-3.5 sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-850 font-sans font-semibold text-white border-r border-slate-800/50 flex items-center justify-between gap-2 shadow-xs">
          <span className="truncate">{row.displayName}</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
              row.group === 'BEYAZ EŞYA'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {row.group === 'BEYAZ EŞYA' ? 'B.EŞYA' : 'MOB'}
          </span>
        </td>

        {/* Profit Margin (Clickable) */}
        <td
          onClick={() => handleMarginClick(row)}
          className="py-2 px-2 text-center text-emerald-400 font-bold hover:bg-emerald-500/10 cursor-pointer transition-colors border-r border-slate-800/40"
          title="Kâr marjını düzenlemek için tıklayın"
        >
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20">
            %{row.profitMargin.toFixed(0)}
          </span>
        </td>

        {/* 12 Months Cells (Clickable) */}
        {CIRO_MONTHS.map(m => {
          const cell = row.months[m.no];
          const hasSales = cell.liveSalesAmount > 0;
          const isZero = cell.totalAmount === 0;

          return (
            <td
              key={m.no}
              onClick={() => handleCellClick(row, m.no)}
              className={`py-2 px-2 text-right cursor-pointer transition-all hover:bg-indigo-500/20 border-r border-slate-800/30 ${
                isZero
                  ? 'text-slate-600 hover:text-slate-300'
                  : 'text-slate-200 font-medium'
              } ${hasSales ? 'bg-emerald-500/5' : ''}`}
              title={`${row.displayName} - ${m.name}: ${formatCurrency(cell.totalAmount)} (Düzenlemek için tıkla)`}
            >
              <div className="flex items-center justify-end gap-1">
                {hasSales && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                    title={`Sistemden otomatik: ${formatCurrency(cell.liveSalesAmount)}`}
                  />
                )}
                <span>
                  {isZero ? '-' : Math.round(cell.totalAmount).toLocaleString('tr-TR')}
                </span>
              </div>
            </td>
          );
        })}

        {/* Year Total */}
        <td className="py-2.5 px-3 text-right font-bold text-white bg-slate-950/40 border-r border-slate-800/50">
          {formatCurrency(row.yearTotal)}
        </td>

        {/* Monthly Average */}
        <td className="py-2.5 px-3 text-right text-slate-300 border-r border-slate-800/30">
          {formatCurrency(row.monthlyAverage)}
        </td>

        {/* Past Year Total */}
        <td className="py-2.5 px-3 text-right text-slate-400 border-r border-slate-800/30">
          {formatCurrency(row.pastYearTotal)}
        </td>

        {/* Growth TL */}
        <td
          className={`py-2.5 px-3 text-right font-semibold border-r border-slate-800/30 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {formatCurrency(row.growthAmount)}
        </td>

        {/* Growth Rate % */}
        <td className="py-2.5 px-2 text-center border-r border-slate-800/30">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {row.growthRate.toFixed(1)}%
          </span>
        </td>

        {/* Estimated Profit */}
        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 bg-emerald-950/10">
          {formatCurrency(row.estimatedProfit)}
        </td>
      </tr>
    );
  }

  // Helper to render Subtotal row
  function renderSubtotalRow(subtotal: typeof matrixResult.beyazEsyaSubtotal, theme: 'sky' | 'amber') {
    const isPositive = subtotal.growthAmount >= 0;
    const bgClass = theme === 'sky' ? 'bg-sky-950/30 text-sky-200' : 'bg-amber-950/30 text-amber-200';
    const borderClass = theme === 'sky' ? 'border-sky-800/50' : 'border-amber-800/50';

    return (
      <tr className={`font-bold ${bgClass} border-t-2 border-b-2 ${borderClass}`}>
        <td className="py-3 px-3.5 sticky left-0 z-10 bg-slate-900 font-sans tracking-tight">
          <div className="flex items-center justify-between">
            <span>{subtotal.group} ALT TOPLAM</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10">
              Payı: %{subtotal.sharePercent.toFixed(1)}
            </span>
          </div>
        </td>
        <td className="py-3 px-2 text-center text-emerald-400 font-bold">
          %{subtotal.weightedMargin.toFixed(1)}
        </td>
        {CIRO_MONTHS.map(m => (
          <td key={m.no} className="py-3 px-2 text-right">
            {Math.round(subtotal.months[m.no] || 0).toLocaleString('tr-TR')}
          </td>
        ))}
        <td className="py-3 px-3 text-right text-white font-bold bg-slate-950/60">
          {formatCurrency(subtotal.yearTotal)}
        </td>
        <td className="py-3 px-3 text-right">
          {formatCurrency(subtotal.monthlyAverage)}
        </td>
        <td className="py-3 px-3 text-right text-slate-300">
          {formatCurrency(subtotal.pastYearTotal)}
        </td>
        <td className={`py-3 px-3 text-right ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}
          {formatCurrency(subtotal.growthAmount)}
        </td>
        <td className="py-3 px-2 text-center">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {isPositive ? '+' : ''}
            {subtotal.growthRate.toFixed(1)}%
          </span>
        </td>
        <td className="py-3 px-3 text-right text-emerald-300">
          {formatCurrency(subtotal.estimatedProfit)}
        </td>
      </tr>
    );
  }

  // Helper to render Grand Total row
  function renderGrandTotalRow(grand: typeof matrixResult.grandTotal) {
    const isPositive = grand.growthAmount >= 0;

    return (
      <tr className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 font-bold text-white border-t-4 border-indigo-500/60 text-xs shadow-lg">
        <td className="py-3.5 px-3.5 sticky left-0 z-10 bg-slate-950 font-sans tracking-wide text-indigo-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          GENEL CİRO TOPLAMI
        </td>
        <td className="py-3.5 px-2 text-center text-emerald-400 font-bold">
          %{grand.weightedMargin.toFixed(1)}
        </td>
        {CIRO_MONTHS.map(m => (
          <td key={m.no} className="py-3.5 px-2 text-right font-mono">
            {Math.round(grand.months[m.no] || 0).toLocaleString('tr-TR')}
          </td>
        ))}
        <td className="py-3.5 px-3 text-right font-bold text-emerald-300 font-mono bg-slate-950/80">
          {formatCurrency(grand.yearTotal)}
        </td>
        <td className="py-3.5 px-3 text-right font-mono text-slate-200">
          {formatCurrency(grand.monthlyAverage)}
        </td>
        <td className="py-3.5 px-3 text-right font-mono text-slate-300">
          {formatCurrency(grand.pastYearTotal)}
        </td>
        <td
          className={`py-3.5 px-3 text-right font-mono ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isPositive ? '+' : ''}
          {formatCurrency(grand.growthAmount)}
        </td>
        <td className="py-3.5 px-2 text-center">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isPositive ? '+' : ''}
            {grand.growthRate.toFixed(1)}%
          </span>
        </td>
        <td className="py-3.5 px-3 text-right font-bold text-emerald-400 font-mono bg-emerald-950/20">
          {formatCurrency(grand.totalEstimatedProfit)}
        </td>
      </tr>
    );
  }
};
