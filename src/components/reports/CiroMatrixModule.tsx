import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const currentYearStr = '2025';
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [filterGroup, setFilterGroup] = useState<'ALL' | 'BEYAZ EŞYA' | 'MOBİLYA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Year modal
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  // Ciro Importer Modal
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Direct Inline Cell Editing State: rowId + month (or 'margin')
  const [inlineEditingCell, setInlineEditingCell] = useState<{
    rowId: string;
    field: number | 'margin'; // number: 1..12 month, 'margin': profit margin %
  } | null>(null);

  const [inlineValue, setInlineValue] = useState<string>('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Focus input when inline editing starts
  useEffect(() => {
    if (inlineEditingCell && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [inlineEditingCell]);

  // Core Matrix Calculations (Auto-calculation Engine)
  const matrixResult = useMemo(() => {
    return calculateCiroMatrix(selectedYear, ciroMatrixData, sales);
  }, [selectedYear, ciroMatrixData, sales]);

  // Start inline editing a month cell
  const startInlineMonthEdit = (rowId: string, month: number, currentManual: number, currentTotal: number) => {
    setInlineEditingCell({ rowId, field: month });
    // Default to the current manual value (or current total if manual is 0)
    setInlineValue(String(currentManual || currentTotal || ''));
  };

  // Start inline editing profit margin %
  const startInlineMarginEdit = (rowId: string, currentMargin: number) => {
    setInlineEditingCell({ rowId, field: 'margin' });
    setInlineValue(String(currentMargin));
  };

  // Commit inline edit
  const commitInlineEdit = () => {
    if (!inlineEditingCell) return;

    if (inlineEditingCell.field === 'margin') {
      const parsedMargin = parseFloat(inlineValue.replace(',', '.')) || 0;
      if (parsedMargin >= 0 && parsedMargin <= 100) {
        updateCiroRowMargin(selectedYear, inlineEditingCell.rowId, parsedMargin);
      }
    } else {
      const monthNum = inlineEditingCell.field as number;
      const cleanStr = inlineValue.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
      const parsedAmount = parseFloat(cleanStr) || 0;
      updateCiroCell(selectedYear, inlineEditingCell.rowId, monthNum, {
        manualAmount: parsedAmount,
      });
    }

    setInlineEditingCell(null);
  };

  // Handle keyboard events in inline input
  const handleInlineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInlineEdit();
    } else if (e.key === 'Escape') {
      setInlineEditingCell(null);
    }
  };

  // Add Year
  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newYearInput.trim();
    if (!clean || isNaN(Number(clean)) || clean.length !== 4) {
      showToast('Lütfen geçerli 4 haneli bir yıl girin (örn: 2027)', 'error');
      return;
    }
    addNewCiroYear(clean);
    setSelectedYear(clean);
    setIsAddYearModalOpen(false);
    setNewYearInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Ciro ve Finansal Analiz Matrisi
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Excel Şablonu Uyumlu
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Kategori ve marka bazlı 12 aylık ciro, dinamik kârlılık, alt toplam payları ve 2025 büyüme analizi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer active:scale-95"
            title="Ciro Excel Dosyası Yükle (Data Importer)"
          >
            <Upload className="w-4 h-4" />
            Ciro Excel İçe Aktar
          </button>
          <button
            onClick={() => exportCiroMatrixToExcel(matrixResult)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
            title="Ciro Matrisini Excel Dosyası (.xlsx) Olarak İndir"
          >
            <Download className="w-4 h-4" />
            Excel'e Aktar (.xlsx)
          </button>
          <button
            onClick={() => {
              if (window.confirm('Ciro matrisi fabrika başlangıç verilerine döndürülsün mü?')) {
                resetCiroMatrixToDefault();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
            title="Fabrika Başlangıç Verilerini Geri Yükle"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Varsayılana Sıfırla
          </button>
        </div>
      </div>

      {/* Year Tabs & Filtering Toolbar */}
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
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tüm Gruplar ({matrixResult.rows.length})
            </button>
            <button
              onClick={() => setFilterGroup('BEYAZ EŞYA')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterGroup === 'BEYAZ EŞYA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Beyaz Eşya ({matrixResult.beyazEsyaRows.length})
            </button>
            <button
              onClick={() => setFilterGroup('MOBİLYA')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-48"
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

      {/* KPI Cards: Dynamic Formulas & 2025 Growth Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Grand Total */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold">{selectedYear} Genel Toplam</span>
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(matrixResult.grandTotal.yearTotal)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Aylık Ortalama:</span>
            <span className="text-slate-200 font-semibold font-mono">
              {formatCurrency(matrixResult.grandTotal.monthlyAverage)}
            </span>
          </div>
        </div>

        {/* Year Comparison & Growth (Handles Kuruluş Yılı) */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold">
              {matrixResult.isFoundationYear ? 'Kuruluş Yılı (2024)' : `${matrixResult.comparisonYear} Büyüme Farkı`}
            </span>
            <span
              className={`p-1 rounded-lg ${
                matrixResult.isFoundationYear
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : matrixResult.grandTotal.growthAmount >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {matrixResult.isFoundationYear ? (
                <Sparkles className="w-4 h-4" />
              ) : matrixResult.grandTotal.growthAmount >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </span>
          </div>
          <div
            className={`text-xl font-bold font-mono tracking-tight ${
              matrixResult.isFoundationYear
                ? 'text-indigo-400'
                : matrixResult.grandTotal.growthAmount >= 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {matrixResult.isFoundationYear ? 'İlk Faaliyet Yılı' : `${matrixResult.grandTotal.growthAmount >= 0 ? '+' : ''}${formatCurrency(matrixResult.grandTotal.growthAmount)}`}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{matrixResult.isFoundationYear ? 'Geçmiş Yıl Verisi:' : 'Büyüme Oranı:'}</span>
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                matrixResult.isFoundationYear
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : matrixResult.grandTotal.growthRate >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {matrixResult.isFoundationYear ? 'Kuruluş Yılı (N/A)' : `%${matrixResult.grandTotal.growthRate.toFixed(1)}`}
            </span>
          </div>
        </div>

        {/* Beyaz Eşya Subtotal & Share */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold">Beyaz Eşya Grubu</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              Payı: %{matrixResult.beyazEsyaSubtotal.sharePercent.toFixed(1)}
            </span>
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono tracking-tight">
            {formatCurrency(matrixResult.beyazEsyaSubtotal.yearTotal)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tahmini Kâr:</span>
            <span className="text-sky-300 font-semibold font-mono">
              {formatCurrency(matrixResult.beyazEsyaSubtotal.estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Mobilya Subtotal & Share */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold">Mobilya Grubu</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Payı: %{matrixResult.mobilyaSubtotal.sharePercent.toFixed(1)}
            </span>
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono tracking-tight">
            {formatCurrency(matrixResult.mobilyaSubtotal.yearTotal)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tahmini Kâr:</span>
            <span className="text-amber-300 font-semibold font-mono">
              {formatCurrency(matrixResult.mobilyaSubtotal.estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Total Estimated Gross Profit & Weighted Margin */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold">Tahmini Brüt Kâr</span>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight">
            {formatCurrency(matrixResult.grandTotal.totalEstimatedProfit)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ağırlıklı Kârlılık:</span>
            <span className="font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
              %{matrixResult.grandTotal.weightedMargin.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Guidance Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="text-white">Excel Doğrudan Düzenleme:</strong> Tablodaki herhangi bir ay hücresine veya <span className="text-emerald-400 font-semibold">Ortalama Kârlılık %</span> alanına tıklayıp doğrudan yeni tutarı yazabilirsiniz. Enter veya dışarı tıklama ile anında tüm alt toplamlar ve kârlar hesaplanır.
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Canlı Satıştan Gelen</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Doğrudan Düzenlenebilir</span>
          </span>
        </div>
      </div>

      {/* MAIN CIRO MATRIX TABLE CONTAINER - AUTO-HEIGHT (NO INNER VERTICAL SCROLLBAR) */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Only horizontal scroll for the wide 22-column set, NO VERTICAL SCROLLBAR (auto-height) */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            {/* Table Header */}
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-300 font-semibold sticky top-0 z-20">
              <tr>
                {/* 1. Grup */}
                <th className="py-3.5 px-3 text-slate-400 font-bold min-w-[100px] border-r border-slate-800/60 uppercase text-[10px] tracking-wider">
                  Grup
                </th>
                {/* 2. Kategori / Marka (Sticky Column) */}
                <th className="py-3.5 px-3.5 sticky left-0 z-30 bg-slate-950 font-bold text-white min-w-[150px] shadow-sm border-r border-slate-800">
                  Kategori / Marka
                </th>
                {/* 3. Ortalama Kârlılık (%) */}
                <th className="py-3.5 px-3 text-center font-bold text-emerald-400 min-w-[90px] border-r border-slate-800/60">
                  Ort. Kârlılık (%)
                </th>
                {/* 4. 12 Aylık Ciro Sütunları */}
                {CIRO_MONTHS.map(m => (
                  <th key={m.no} className="py-3.5 px-3 text-right font-semibold text-slate-300 min-w-[105px] border-r border-slate-800/40">
                    {m.name}
                  </th>
                ))}
                {/* 5. Genel Toplam (TL) */}
                <th className="py-3.5 px-3.5 text-right font-bold text-white bg-slate-950/90 min-w-[130px] border-r border-slate-800">
                  Genel Toplam (TL)
                </th>
                {/* 6. Aylık Ortalama (TL) */}
                <th className="py-3.5 px-3.5 text-right font-semibold text-indigo-300 min-w-[125px] border-r border-slate-800/60">
                  Aylık Ortalama (TL)
                </th>
                {/* 7. Önceki Yıl Toplamı (TL) */}
                <th className="py-3.5 px-3.5 text-right font-semibold text-slate-400 min-w-[125px] border-r border-slate-800/60">
                  {matrixResult.isFoundationYear ? 'Geçmiş Yıl (Kuruluş Yılı)' : `${matrixResult.comparisonYear} Yılı Toplamı (TL)`}
                </th>
                {/* 8. Büyüme (TL) */}
                <th className="py-3.5 px-3.5 text-right font-semibold text-slate-300 min-w-[115px] border-r border-slate-800/60">
                  Büyüme (TL)
                </th>
                {/* 9. Büyüme Oranı (%) */}
                <th className="py-3.5 px-3 text-center font-bold text-slate-300 min-w-[95px] border-r border-slate-800/60">
                  Büyüme Oranı (%)
                </th>
                {/* 10. Tahmini Brüt Kâr (TL) */}
                <th className="py-3.5 px-4 text-right font-bold text-emerald-400 bg-emerald-950/20 min-w-[135px]">
                  Tahmini Brüt Kâr (TL)
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {/* GROUP 1: BEYAZ EŞYA */}
              {(filterGroup === 'ALL' || filterGroup === 'BEYAZ EŞYA') && (
                <>
                  {matrixResult.beyazEsyaRows
                    .filter(r => !searchQuery.trim() || r.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(row => renderDataRow(row))}

                  {/* Beyaz Eşya Subtotal Row */}
                  {renderSubtotalRow(matrixResult.beyazEsyaSubtotal, 'sky')}
                </>
              )}

              {/* GROUP 2: MOBİLYA */}
              {(filterGroup === 'ALL' || filterGroup === 'MOBİLYA') && (
                <>
                  {matrixResult.mobilyaRows
                    .filter(r => !searchQuery.trim() || r.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(row => renderDataRow(row))}

                  {/* Mobilya Subtotal Row */}
                  {renderSubtotalRow(matrixResult.mobilyaSubtotal, 'amber')}
                </>
              )}

              {/* GRAND TOTAL: GENEL FİRMA TOPLAMI */}
              {renderGrandTotalRow(matrixResult.grandTotal)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Year Modal */}
      {isAddYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
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
                  Yıl (örn: 2027)
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/30"
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

  // Helper: Render Data Row with Direct Excel-style Inline Editing
  function renderDataRow(row: ComputedRowData) {
    const isPositive = row.growthAmount >= 0;
    const isEditingMargin = inlineEditingCell?.rowId === row.id && inlineEditingCell?.field === 'margin';

    return (
      <tr key={row.id} className="hover:bg-slate-800/40 transition-colors group">
        {/* 1. Grup */}
        <td className="py-3 px-3 text-slate-400 font-sans font-medium border-r border-slate-800/60">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
              row.group === 'BEYAZ EŞYA'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {row.group}
          </span>
        </td>

        {/* 2. Kategori / Marka (Sticky Column) */}
        <td className="py-3 px-3.5 sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-850 font-sans font-bold text-white border-r border-slate-800 shadow-xs">
          <span>{row.displayName}</span>
        </td>

        {/* 3. Ortalama Kârlılık (%) - Direct Inline Editable */}
        <td
          onClick={() => {
            if (!isEditingMargin) startInlineMarginEdit(row.id, row.profitMargin);
          }}
          className="py-2.5 px-3 text-center border-r border-slate-800/60 cursor-pointer transition-colors hover:bg-indigo-500/15"
          title="Doğrudan tıklayarak kârlılık oranını değiştirin"
        >
          {isEditingMargin ? (
            <div className="flex items-center justify-center">
              <input
                ref={inlineInputRef}
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={inlineValue}
                onChange={e => setInlineValue(e.target.value)}
                onBlur={commitInlineEdit}
                onKeyDown={handleInlineKeyDown}
                className="w-16 bg-slate-950 border border-indigo-500 rounded px-1.5 py-1 text-center font-mono font-bold text-emerald-400 text-xs outline-none shadow-inner"
              />
            </div>
          ) : (
            <span className="font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded inline-block">
              %{row.profitMargin.toFixed(0)}
            </span>
          )}
        </td>

        {/* 4. 12 Aylık Ciro Sütunları - Direct Inline Editable */}
        {CIRO_MONTHS.map(m => {
          const cell = row.months[m.no];
          const isEditingThisCell = inlineEditingCell?.rowId === row.id && inlineEditingCell?.field === m.no;
          const hasSales = cell.liveSalesAmount > 0;
          const isZero = cell.totalAmount === 0;

          return (
            <td
              key={m.no}
              onClick={() => {
                if (!isEditingThisCell) {
                  startInlineMonthEdit(row.id, m.no, cell.manualAmount, cell.totalAmount);
                }
              }}
              className={`py-2.5 px-3 text-right cursor-pointer transition-all border-r border-slate-800/40 hover:bg-indigo-500/20 ${
                isZero
                  ? 'text-slate-600 hover:text-slate-300'
                  : 'text-slate-200 font-medium'
              } ${hasSales ? 'bg-emerald-500/5' : ''}`}
              title={`${row.displayName} - ${m.name}: ${formatCurrency(cell.totalAmount)} (Doğrudan düzenlemek için tıklayın)`}
            >
              {isEditingThisCell ? (
                <div className="flex items-center justify-end">
                  <input
                    ref={inlineInputRef}
                    type="number"
                    step="any"
                    value={inlineValue}
                    onChange={e => setInlineValue(e.target.value)}
                    onBlur={commitInlineEdit}
                    onKeyDown={handleInlineKeyDown}
                    className="w-24 bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-right font-mono font-bold text-white text-xs outline-none shadow-inner"
                    placeholder="0"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-end gap-1.5">
                  {hasSales && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                      title={`ERP Satışlarından gelen: ${formatCurrency(cell.liveSalesAmount)}`}
                    />
                  )}
                  <span>
                    {isZero ? '-' : Math.round(cell.totalAmount).toLocaleString('tr-TR')}
                  </span>
                </div>
              )}
            </td>
          );
        })}

        {/* 5. Genel Toplam (TL) */}
        <td className="py-3 px-3.5 text-right font-bold text-white bg-slate-950/40 border-r border-slate-800">
          {formatCurrency(row.yearTotal)}
        </td>

        {/* 6. Aylık Ortalama (TL) [Aktif Ay Sayısına Bölünmüş] */}
        <td
          className="py-3 px-3.5 text-right text-indigo-300 font-medium border-r border-slate-800/60"
          title={`Genel Toplam / ${row.activeMonthsCount} Aktif Ay`}
        >
          {formatCurrency(row.monthlyAverage)}
        </td>

        {/* 7. Önceki Yıl Toplamı (TL) */}
        <td className="py-3 px-3.5 text-right text-slate-400 border-r border-slate-800/60 font-mono">
          {matrixResult.isFoundationYear ? '-' : formatCurrency(row.pastYearTotal)}
        </td>

        {/* 8. Büyüme (TL) */}
        <td
          className={`py-3 px-3.5 text-right font-semibold border-r border-slate-800/60 font-mono ${
            matrixResult.isFoundationYear ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {matrixResult.isFoundationYear ? '-' : `${isPositive ? '+' : ''}${formatCurrency(row.growthAmount)}`}
        </td>

        {/* 9. Büyüme Oranı (%) */}
        <td className="py-3 px-3 text-center border-r border-slate-800/60 font-mono">
          {matrixResult.isFoundationYear ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
              Kuruluş Yılı
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? '+' : ''}
              {row.growthRate.toFixed(1)}%
            </span>
          )}
        </td>

        {/* 10. Tahmini Brüt Kâr (TL) */}
        <td className="py-3 px-4 text-right font-bold text-emerald-400 bg-emerald-950/10">
          {formatCurrency(row.estimatedProfit)}
        </td>
      </tr>
    );
  }

  // Helper: Render Subtotal Row
  function renderSubtotalRow(subtotal: typeof matrixResult.beyazEsyaSubtotal, theme: 'sky' | 'amber') {
    const isPositive = subtotal.growthAmount >= 0;
    const isSky = theme === 'sky';
    const bgClass = isSky ? 'bg-sky-950/30 text-sky-200' : 'bg-amber-950/30 text-amber-200';
    const borderClass = isSky ? 'border-sky-800/60' : 'border-amber-800/60';
    const labelTitle = isSky ? 'BEYAZ EŞYA ALT TOPLAM' : 'MOBİLYA ALT TOPLAM';

    return (
      <tr className={`font-bold ${bgClass} border-t-2 border-b-2 ${borderClass}`}>
        {/* 1. Grup */}
        <td className="py-3.5 px-3 uppercase text-[11px] font-sans tracking-wider border-r border-slate-800/60">
          {subtotal.group}
        </td>

        {/* 2. Kategori / Marka (Sticky) */}
        <td className="py-3.5 px-3.5 sticky left-0 z-10 bg-slate-900 font-sans tracking-tight border-r border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span>{labelTitle}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 font-bold text-white">
              Payı: %{subtotal.sharePercent.toFixed(1)}
            </span>
          </div>
        </td>

        {/* 3. Ağırlıklı Ortalama Kârlılık % */}
        <td className="py-3.5 px-3 text-center text-emerald-400 font-bold border-r border-slate-800/60">
          %{subtotal.weightedMargin.toFixed(1)}
        </td>

        {/* 4. 12 Aylar */}
        {CIRO_MONTHS.map(m => (
          <td key={m.no} className="py-3.5 px-3 text-right border-r border-slate-800/40">
            {Math.round(subtotal.months[m.no] || 0).toLocaleString('tr-TR')}
          </td>
        ))}

        {/* 5. Genel Toplam */}
        <td className="py-3.5 px-3.5 text-right text-white font-bold bg-slate-950/60 border-r border-slate-800">
          {formatCurrency(subtotal.yearTotal)}
        </td>

        {/* 6. Aylık Ortalama (Aktif Ay Sayısına Göre) */}
        <td className="py-3.5 px-3.5 text-right border-r border-slate-800/60 text-indigo-300">
          {formatCurrency(subtotal.monthlyAverage)}
        </td>

        {/* 7. Önceki Yıl Toplamı */}
        <td className="py-3.5 px-3.5 text-right text-slate-300 border-r border-slate-800/60 font-mono">
          {matrixResult.isFoundationYear ? '-' : formatCurrency(subtotal.pastYearTotal)}
        </td>

        {/* 8. Büyüme (TL) */}
        <td className={`py-3.5 px-3.5 text-right border-r border-slate-800/60 font-mono ${matrixResult.isFoundationYear ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {matrixResult.isFoundationYear ? '-' : `${isPositive ? '+' : ''}${formatCurrency(subtotal.growthAmount)}`}
        </td>

        {/* 9. Büyüme Oranı (%) */}
        <td className="py-3.5 px-3 text-center border-r border-slate-800/60 font-mono">
          {matrixResult.isFoundationYear ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-white/10 text-slate-300 border border-white/10">
              Kuruluş Yılı
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {isPositive ? '+' : ''}
              {subtotal.growthRate.toFixed(1)}%
            </span>
          )}
        </td>

        {/* 10. Tahmini Brüt Kâr */}
        <td className="py-3.5 px-4 text-right text-emerald-300 bg-emerald-950/20">
          {formatCurrency(subtotal.estimatedProfit)}
        </td>
      </tr>
    );
  }

  // Helper: Render Grand Total Row (GENEL FİRMA TOPLAMI)
  function renderGrandTotalRow(grand: typeof matrixResult.grandTotal) {
    const isPositive = grand.growthAmount >= 0;

    return (
      <tr className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 font-bold text-white border-t-4 border-indigo-500/70 text-xs shadow-lg">
        {/* 1. Grup */}
        <td className="py-4 px-3 font-sans tracking-wide text-indigo-300 uppercase text-[11px] border-r border-slate-800/60">
          GENEL
        </td>

        {/* 2. Kategori / Marka (Sticky) */}
        <td className="py-4 px-3.5 sticky left-0 z-10 bg-slate-950 font-sans tracking-wider text-indigo-300 flex items-center gap-2 border-r border-slate-800">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>GENEL FİRMA TOPLAMI</span>
        </td>

        {/* 3. Ağırlıklı Kârlılık % */}
        <td className="py-4 px-3 text-center text-emerald-400 font-bold border-r border-slate-800/60">
          %{grand.weightedMargin.toFixed(1)}
        </td>

        {/* 4. 12 Aylar */}
        {CIRO_MONTHS.map(m => (
          <td key={m.no} className="py-4 px-3 text-right font-mono border-r border-slate-800/40">
            {Math.round(grand.months[m.no] || 0).toLocaleString('tr-TR')}
          </td>
        ))}

        {/* 5. Genel Toplam */}
        <td className="py-4 px-3.5 text-right font-bold text-emerald-300 font-mono bg-slate-950/80 border-r border-slate-800 text-sm">
          {formatCurrency(grand.yearTotal)}
        </td>

        {/* 6. Aylık Ortalama */}
        <td className="py-4 px-3.5 text-right font-mono text-slate-200 border-r border-slate-800/60">
          {formatCurrency(grand.monthlyAverage)}
        </td>

        {/* 7. Önceki Yıl Toplamı */}
        <td className="py-4 px-3.5 text-right font-mono text-slate-300 border-r border-slate-800/60">
          {matrixResult.isFoundationYear ? '-' : formatCurrency(grand.pastYearTotal)}
        </td>

        {/* 8. Büyüme (TL) */}
        <td
          className={`py-4 px-3.5 text-right font-mono border-r border-slate-800/60 ${
            matrixResult.isFoundationYear ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {matrixResult.isFoundationYear ? '-' : `${isPositive ? '+' : ''}${formatCurrency(grand.growthAmount)}`}
        </td>

        {/* 9. Büyüme Oranı (%) */}
        <td className="py-4 px-3 text-center border-r border-slate-800/60">
          {matrixResult.isFoundationYear ? (
            <span className="px-2.5 py-0.5 rounded text-[11px] font-sans font-medium bg-slate-800 text-indigo-300 border border-slate-700">
              Kuruluş Yılı (İlk Yıl)
            </span>
          ) : (
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                isPositive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isPositive ? '+' : ''}
              {grand.growthRate.toFixed(1)}%
            </span>
          )}
        </td>

        {/* 10. Tahmini Brüt Kâr */}
        <td className="py-4 px-4 text-right font-bold text-emerald-400 font-mono bg-emerald-950/30 text-sm">
          {formatCurrency(grand.totalEstimatedProfit)}
        </td>
      </tr>
    );
  }
};
