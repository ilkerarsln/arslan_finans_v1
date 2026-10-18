import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Search,
  TrendingUp,
  Percent,
  Info,
  Check,
  Building2,
  PieChart,
  BarChart3,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { MonthlyFlowChart } from '../charts/MonthlyFlowChart';
import { CategoryBreakdownChart } from '../charts/CategoryBreakdownChart';
import * as XLSX from 'xlsx';

const MONTH_NAMES_SHORT = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const CiroMatrixTab: React.FC = () => {
  const {
    ciroMatrixData,
    updateMatrixCell,
    updateMatrixMargin,
    resetMatrixData,
    addMatrixYear,
    setIsCiroImportModalOpen,
    exportDataToExcel,
    sales,
    transactions,
    upcomingDues,
    showToast,
  } = useFinance();

  // Sub-tabs: matrix, trend, categories
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'flow_trend' | 'category_chart'>('matrix');

  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedGroup, setSelectedGroup] = useState<'ALL' | 'BEYAZ EŞYA' | 'MOBİLYA'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Editing state: { rowId: string, monthIndex?: number, isMargin?: boolean }
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    monthIndex?: number;
    isMargin?: boolean;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Available Years
  const availableYears = useMemo(() => {
    return ciroMatrixData.map(d => d.year).sort((a, b) => a - b);
  }, [ciroMatrixData]);

  // Current Year Data
  const currentYearData = useMemo(() => {
    return ciroMatrixData.find(d => d.year === selectedYear) || ciroMatrixData[0];
  }, [ciroMatrixData, selectedYear]);

  // Previous Year Data for growth calculation
  const previousYearData = useMemo(() => {
    return ciroMatrixData.find(d => d.year === selectedYear - 1);
  }, [ciroMatrixData, selectedYear]);

  // Rows of current year
  const rawRows = useMemo(() => {
    return currentYearData?.rows || [];
  }, [currentYearData]);

  // Filtered rows for display
  const displayRows = useMemo(() => {
    return rawRows.filter(r => {
      if (selectedGroup !== 'ALL' && r.group !== selectedGroup) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.group.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [rawRows, selectedGroup, searchTerm]);

  // Separate rows by group
  const beyazEsyaRows = useMemo(() => {
    return displayRows.filter(r => r.group === 'BEYAZ EŞYA');
  }, [displayRows]);

  const mobilyaRows = useMemo(() => {
    return displayRows.filter(r => r.group === 'MOBİLYA');
  }, [displayRows]);

  // Helper to compute row total
  const getRowTotal = (months: { [idx: number]: number }) => {
    return Object.values(months).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Helper to compute row gross profit
  const getRowGrossProfit = (row: { months: { [idx: number]: number }; profitMargin: number }) => {
    const total = getRowTotal(row.months);
    return (total * row.profitMargin) / 100;
  };

  // Group Totals Calculation
  const calculateGroupTotals = (rows: typeof rawRows) => {
    const monthsTotals: { [idx: number]: number } = {};
    for (let i = 0; i < 12; i++) {
      monthsTotals[i] = rows.reduce((sum, r) => sum + (r.months[i] || 0), 0);
    }
    const totalRevenue = getRowTotal(monthsTotals);
    const totalProfit = rows.reduce((sum, r) => sum + getRowGrossProfit(r), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      monthsTotals,
      totalRevenue,
      totalProfit,
      avgMargin,
    };
  };

  const allBeyazEsyaRows = useMemo(() => rawRows.filter(r => r.group === 'BEYAZ EŞYA'), [rawRows]);
  const allMobilyaRows = useMemo(() => rawRows.filter(r => r.group === 'MOBİLYA'), [rawRows]);

  const beyazEsyaTotals = useMemo(() => calculateGroupTotals(allBeyazEsyaRows), [allBeyazEsyaRows]);
  const mobilyaTotals = useMemo(() => calculateGroupTotals(allMobilyaRows), [allMobilyaRows]);
  const grandTotals = useMemo(() => calculateGroupTotals(rawRows), [rawRows]);

  // Shares (%)
  const beyazEsyaShare = grandTotals.totalRevenue > 0
    ? +((beyazEsyaTotals.totalRevenue / grandTotals.totalRevenue) * 100).toFixed(1)
    : 0;
  const mobilyaShare = grandTotals.totalRevenue > 0
    ? +((mobilyaTotals.totalRevenue / grandTotals.totalRevenue) * 100).toFixed(1)
    : 0;

  // Previous year grand total
  const prevYearGrandTotal = useMemo(() => {
    if (!previousYearData) return 0;
    return previousYearData.rows.reduce((sum, r) => sum + getRowTotal(r.months), 0);
  }, [previousYearData]);

  const growthDiff = grandTotals.totalRevenue - prevYearGrandTotal;
  const growthRate = prevYearGrandTotal > 0 ? +((growthDiff / prevYearGrandTotal) * 100).toFixed(1) : 0;
  const monthlyAverage = grandTotals.totalRevenue / 12;

  // Live sales count and sum for selected year
  const liveSalesForYear = useMemo(() => {
    return sales.filter(s => s.date.startsWith(String(selectedYear)));
  }, [sales, selectedYear]);

  // Cell editing handlers
  const handleStartEditCell = (rowId: string, monthIndex: number, currentVal: number) => {
    setEditingCell({ rowId, monthIndex });
    setEditValue(currentVal > 0 ? String(currentVal) : '');
  };

  const handleStartEditMargin = (rowId: string, currentMargin: number) => {
    setEditingCell({ rowId, isMargin: true });
    setEditValue(String(currentMargin));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const num = parseFloat(editValue.replace(/\./g, '').replace(',', '.')) || 0;

    if (editingCell.isMargin) {
      updateMatrixMargin(selectedYear, editingCell.rowId, num);
    } else if (editingCell.monthIndex !== undefined) {
      updateMatrixCell(selectedYear, editingCell.rowId, editingCell.monthIndex, num);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Add Year Prompt
  const handleAddYearPrompt = () => {
    const nextYear = Math.max(...availableYears) + 1;
    const inputYear = prompt('Eklemek istediğiniz yılı girin:', String(nextYear));
    if (inputYear) {
      const parsed = parseInt(inputYear.trim(), 10);
      if (parsed >= 2020 && parsed <= 2035) {
        addMatrixYear(parsed);
        setSelectedYear(parsed);
      } else {
        alert('Lütfen 2020 ile 2035 arasında geçerli bir yıl giriniz.');
      }
    }
  };

  // Export Matrix to Excel (.xlsx)
  const handleExportMatrixExcel = () => {
    try {
      const headers = [
        'GRUP',
        'Kategori / Marka',
        'Ort. Kârlılık (%)',
        ...MONTH_NAMES_SHORT,
        'Yıllık Toplam (TL)',
        'Tahmini Brüt Kâr (TL)',
      ];

      const dataRows = rawRows.map(r => {
        const totalRev = getRowTotal(r.months);
        const profit = (totalRev * r.profitMargin) / 100;
        return [
          r.group,
          r.name,
          `%${r.profitMargin}`,
          ...MONTH_NAMES_SHORT.map((_, i) => r.months[i] || 0),
          totalRev,
          profit,
        ];
      });

      // Add Subtotals
      dataRows.push([
        'BEYAZ EŞYA',
        'BEYAZ EŞYA ALT TOPLAM',
        `%${beyazEsyaTotals.avgMargin.toFixed(1)}`,
        ...MONTH_NAMES_SHORT.map((_, i) => beyazEsyaTotals.monthsTotals[i] || 0),
        beyazEsyaTotals.totalRevenue,
        beyazEsyaTotals.totalProfit,
      ]);

      dataRows.push([
        'MOBİLYA',
        'MOBİLYA ALT TOPLAM',
        `%${mobilyaTotals.avgMargin.toFixed(1)}`,
        ...MONTH_NAMES_SHORT.map((_, i) => mobilyaTotals.monthsTotals[i] || 0),
        mobilyaTotals.totalRevenue,
        mobilyaTotals.totalProfit,
      ]);

      // Grand Total
      dataRows.push([
        'GENEL',
        'GENEL TOPLAM',
        `%${grandTotals.avgMargin.toFixed(1)}`,
        ...MONTH_NAMES_SHORT.map((_, i) => grandTotals.monthsTotals[i] || 0),
        grandTotals.totalRevenue,
        grandTotals.totalProfit,
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Ciro_${selectedYear}`);
      XLSX.writeFile(wb, `arslan_mobilya_ciro_matrisi_${selectedYear}.xlsx`);
      showToast(`${selectedYear} yılı Ciro Matrisi Excel olarak indirildi.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Excel dışa aktarılırken bir hata oluştu.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Üst Banner: Finansal Raporlar & Analizler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 shadow-sm text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Finansal Raporlar & Analizler
            </h2>
            <p className="text-xs text-slate-300">
              Excel uyumlu ciro matrisi, nakit akış projeksiyonları ve kategori bazlı finansal analizler.
            </p>
          </div>
        </div>

        <button
          onClick={exportDataToExcel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30 active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Tüm ERP Verilerini Excel'e Aktar</span>
        </button>
      </div>

      {/* 2. Alt Sekmeler Gezintisi */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ciro & Finansal Analiz Matrisi (Excel Uyumlu)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('flow_trend')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'flow_trend'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Aylık Nakit Akış Trendi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('category_chart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'category_chart'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Kategori Dağılım Grafiği</span>
        </button>
      </div>

      {/* Görünüm 1: Ciro ve Finansal Analiz Matrisi */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* Matris Başlık Kartı ve Hızlı Aksiyonlar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Ciro ve Finansal Analiz Matrisi
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Excel Şablonu Uyumlu
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kategori ve marka bazlı 12 aylık ciro, dinamik kârlılık, alt toplam payları ve {selectedYear} büyüme analizi.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsCiroImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-sm active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ciro Excel İçe Aktar</span>
              </button>

              <button
                onClick={handleExportMatrixExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel'e Aktar (.xlsx)</span>
              </button>

              <button
                onClick={resetMatrixData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition active:scale-95 border border-slate-200 dark:border-slate-700"
                title="Değişiklikleri fabrika başlangıç değerlerine döndür"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Varsayılana Sıfırla</span>
              </button>
            </div>
          </div>

          {/* Filtre Çubuğu: Yıl Butonları, Grup Filtreleri, Arama */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Yıl Butonları */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Yıl:</span>
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedYear === year
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {year} Yılı
                </button>
              ))}

              <button
                onClick={handleAddYearPrompt}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 transition"
                title="Yeni bir yıl ekle"
              >
                <Plus className="w-3 h-3" />
                <span>Yıl Ekle</span>
              </button>
            </div>

            {/* Grup Filtreleri & Arama */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  onClick={() => setSelectedGroup('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedGroup === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tüm Gruplar ({rawRows.length})
                </button>
                <button
                  onClick={() => setSelectedGroup('BEYAZ EŞYA')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedGroup === 'BEYAZ EŞYA'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Beyaz Eşya ({allBeyazEsyaRows.length})
                </button>
                <button
                  onClick={() => setSelectedGroup('MOBİLYA')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    selectedGroup === 'MOBİLYA'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mobilya ({allMobilyaRows.length})
                </button>
              </div>

              {/* Arama Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Marka / Kategori ara..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                />
              </div>
            </div>
          </div>

          {/* 3. 5 Adet Finansal Metrik KPI Kartı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Kart 1: Yıl Genel Toplam */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{selectedYear} Genel Toplam</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-white mt-1.5">
                {formatCurrency(grandTotals.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Aylık Ortalama:</span>
                <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(monthlyAverage)}
                </span>
              </div>
            </div>

            {/* Kart 2: Önceki Yıl Büyüme Farkı */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{selectedYear - 1} Büyüme Farkı</span>
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  ↗
                </span>
              </div>
              <div className="text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1.5">
                +{formatCurrency(growthDiff)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Büyüme Oranı:</span>
                <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                  %{growthRate}
                </span>
              </div>
            </div>

            {/* Kart 3: Beyaz Eşya Grubu */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                <span>Beyaz Eşya Grubu</span>
                <span className="text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-1.5 py-0.2 rounded-full font-mono">
                  Payı: %{beyazEsyaShare}
                </span>
              </div>
              <div className="text-xl font-bold font-mono-num text-sky-600 dark:text-sky-400 mt-1.5">
                {formatCurrency(beyazEsyaTotals.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Tahmini Kâr:</span>
                <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(beyazEsyaTotals.totalProfit)}
                </span>
              </div>
            </div>

            {/* Kart 4: Mobilya Grubu */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Mobilya Grubu</span>
                <span className="text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded-full font-mono">
                  Payı: %{mobilyaShare}
                </span>
              </div>
              <div className="text-xl font-bold font-mono-num text-amber-600 dark:text-amber-400 mt-1.5">
                {formatCurrency(mobilyaTotals.totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Tahmini Kâr:</span>
                <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(mobilyaTotals.totalProfit)}
                </span>
              </div>
            </div>

            {/* Kart 5: Tahmini Brüt Kâr */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/10 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Tahmini Brüt Kâr</span>
                <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                  <Percent className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-1.5">
                {formatCurrency(grandTotals.totalProfit)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Ağırlıklı Kârlılık:</span>
                <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                  %{grandTotals.avgMargin.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Canlı Düzenleme Rehber Kutusu & Lejant */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong className="text-white">Excel Doğrudan Düzenleme:</strong> Tablodaki herhangi bir ay hücresine veya <strong className="text-emerald-400">Ortalama Kârlılık %</strong> alanına tıklayıp doğrudan yeni tutarı yazabilirsiniz. Enter veya dışarı tıklama ile anında tüm alt toplamlar ve kârlar hesaplanır.
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Canlı Satıştan Gelen</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Doğrudan Düzenlenebilir</span>
              </span>
            </div>
          </div>

          {/* 5. Ciro ve Finansal Analiz Matrisi Tablosu */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-28 sticky left-0 z-20 bg-slate-900">GRUP</th>
                    <th className="py-3 px-3 w-44 sticky left-28 z-20 bg-slate-900">Kategori / Marka</th>
                    <th className="py-3 px-3 w-24 text-center">Ort. Kârlılık (%)</th>
                    {MONTH_NAMES_SHORT.map(mName => (
                      <th key={mName} className="py-3 px-3 text-right min-w-[100px]">
                        {mName}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right min-w-[120px] font-bold text-white bg-slate-800/80">
                      Yıllık Toplam
                    </th>
                    <th className="py-3 px-3 text-right min-w-[120px] font-bold text-emerald-400 bg-slate-800/80">
                      Tahmini Kâr
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-num text-slate-700 dark:text-slate-300">
                  {/* BEYAZ EŞYA GRUBU */}
                  {beyazEsyaRows.map(row => {
                    const rowTotal = getRowTotal(row.months);
                    const rowProfit = (rowTotal * row.profitMargin) / 100;
                    const isEditingMargin = editingCell?.rowId === row.id && editingCell?.isMargin;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            {row.group}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white sticky left-28 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 font-sans">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isEditingMargin ? (
                            <input
                              type="number"
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-16 px-1.5 py-0.5 text-center text-xs bg-indigo-50 dark:bg-indigo-950 border border-indigo-400 rounded focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartEditMargin(row.id, row.profitMargin)}
                              className="cursor-pointer px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 transition"
                              title="Kârlılık oranını değiştirmek için tıklayın"
                            >
                              %{row.profitMargin}
                            </span>
                          )}
                        </td>

                        {/* 12 Ay Hücreleri */}
                        {MONTH_NAMES_SHORT.map((_, idx) => {
                          const val = row.months[idx] || 0;
                          const isEditing = editingCell?.rowId === row.id && editingCell?.monthIndex === idx;

                          return (
                            <td key={idx} className="py-2.5 px-3 text-right">
                              {isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={handleSaveEdit}
                                  onKeyDown={handleKeyDown}
                                  className="w-24 px-1.5 py-0.5 text-right text-xs bg-indigo-50 dark:bg-indigo-950 border border-indigo-400 rounded focus:outline-none"
                                />
                              ) : (
                                <span
                                  onClick={() => handleStartEditCell(row.id, idx, val)}
                                  className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 px-1 py-0.5 rounded transition block"
                                  title="Tutarı düzenlemek için tıklayın"
                                >
                                  {val > 0 ? val.toLocaleString('tr-TR') : '-'}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Yıllık Toplam & Brüt Kâr */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                          {rowTotal > 0 ? formatCurrency(rowTotal) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50/50 dark:bg-slate-800/40">
                          {rowProfit > 0 ? formatCurrency(rowProfit) : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* BEYAZ EŞYA ALT TOPLAM SATIRI */}
                  {beyazEsyaRows.length > 0 && (
                    <tr className="bg-sky-950/30 text-sky-300 font-bold border-t-2 border-b-2 border-sky-800/50">
                      <td className="py-3 px-3 sticky left-0 z-10 bg-slate-900 border-r border-slate-800">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-900 text-sky-200">
                          BEYAZ EŞYA
                        </span>
                      </td>
                      <td className="py-3 px-3 sticky left-28 z-10 bg-slate-900 border-r border-slate-800 font-sans flex items-center justify-between gap-1">
                        <span>BEYAZ EŞYA ALT TOPLAM</span>
                        <span className="text-[10px] font-normal text-sky-400 bg-sky-900/60 px-1.5 py-0.2 rounded font-mono">
                          Payı: %{beyazEsyaShare}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-400">
                        %{beyazEsyaTotals.avgMargin.toFixed(1)}
                      </td>
                      {MONTH_NAMES_SHORT.map((_, idx) => (
                        <td key={idx} className="py-3 px-3 text-right">
                          {(beyazEsyaTotals.monthsTotals[idx] || 0).toLocaleString('tr-TR')}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right font-bold text-white bg-sky-950/60">
                        {formatCurrency(beyazEsyaTotals.totalRevenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 bg-sky-950/60">
                        {formatCurrency(beyazEsyaTotals.totalProfit)}
                      </td>
                    </tr>
                  )}

                  {/* MOBİLYA GRUBU */}
                  {mobilyaRows.map(row => {
                    const rowTotal = getRowTotal(row.months);
                    const rowProfit = (rowTotal * row.profitMargin) / 100;
                    const isEditingMargin = editingCell?.rowId === row.id && editingCell?.isMargin;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {row.group}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white sticky left-28 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 font-sans">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isEditingMargin ? (
                            <input
                              type="number"
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-16 px-1.5 py-0.5 text-center text-xs bg-indigo-50 dark:bg-indigo-950 border border-indigo-400 rounded focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartEditMargin(row.id, row.profitMargin)}
                              className="cursor-pointer px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 transition"
                              title="Kârlılık oranını değiştirmek için tıklayın"
                            >
                              %{row.profitMargin}
                            </span>
                          )}
                        </td>

                        {/* 12 Ay Hücreleri */}
                        {MONTH_NAMES_SHORT.map((_, idx) => {
                          const val = row.months[idx] || 0;
                          const isEditing = editingCell?.rowId === row.id && editingCell?.monthIndex === idx;

                          return (
                            <td key={idx} className="py-2.5 px-3 text-right">
                              {isEditing ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={handleSaveEdit}
                                  onKeyDown={handleKeyDown}
                                  className="w-24 px-1.5 py-0.5 text-right text-xs bg-indigo-50 dark:bg-indigo-950 border border-indigo-400 rounded focus:outline-none"
                                />
                              ) : (
                                <span
                                  onClick={() => handleStartEditCell(row.id, idx, val)}
                                  className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 px-1 py-0.5 rounded transition block"
                                  title="Tutarı düzenlemek için tıklayın"
                                >
                                  {val > 0 ? val.toLocaleString('tr-TR') : '-'}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Yıllık Toplam & Brüt Kâr */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                          {rowTotal > 0 ? formatCurrency(rowTotal) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-slate-50/50 dark:bg-slate-800/40">
                          {rowProfit > 0 ? formatCurrency(rowProfit) : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* MOBİLYA ALT TOPLAM SATIRI */}
                  {mobilyaRows.length > 0 && (
                    <tr className="bg-amber-950/30 text-amber-300 font-bold border-t-2 border-b-2 border-amber-800/50">
                      <td className="py-3 px-3 sticky left-0 z-10 bg-slate-900 border-r border-slate-800">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900 text-amber-200">
                          MOBİLYA
                        </span>
                      </td>
                      <td className="py-3 px-3 sticky left-28 z-10 bg-slate-900 border-r border-slate-800 font-sans flex items-center justify-between gap-1">
                        <span>MOBİLYA ALT TOPLAM</span>
                        <span className="text-[10px] font-normal text-amber-400 bg-amber-900/60 px-1.5 py-0.2 rounded font-mono">
                          Payı: %{mobilyaShare}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-400">
                        %{mobilyaTotals.avgMargin.toFixed(1)}
                      </td>
                      {MONTH_NAMES_SHORT.map((_, idx) => (
                        <td key={idx} className="py-3 px-3 text-right">
                          {(mobilyaTotals.monthsTotals[idx] || 0).toLocaleString('tr-TR')}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right font-bold text-white bg-amber-950/60">
                        {formatCurrency(mobilyaTotals.totalRevenue)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 bg-amber-950/60">
                        {formatCurrency(mobilyaTotals.totalProfit)}
                      </td>
                    </tr>
                  )}

                  {/* GENEL TOPLAM SATIRI */}
                  <tr className="bg-slate-900 text-white font-extrabold text-xs border-t-2 border-slate-700">
                    <td className="py-3.5 px-3 sticky left-0 z-20 bg-slate-900 text-indigo-400 uppercase tracking-wider">
                      GENEL
                    </td>
                    <td className="py-3.5 px-3 sticky left-28 z-20 bg-slate-900 text-white uppercase tracking-wider font-sans">
                      GENEL TOPLAM ({selectedYear})
                    </td>
                    <td className="py-3.5 px-3 text-center text-emerald-400">
                      %{grandTotals.avgMargin.toFixed(1)}
                    </td>
                    {MONTH_NAMES_SHORT.map((_, idx) => (
                      <td key={idx} className="py-3.5 px-3 text-right text-slate-100">
                        {(grandTotals.monthsTotals[idx] || 0).toLocaleString('tr-TR')}
                      </td>
                    ))}
                    <td className="py-3.5 px-3 text-right text-white bg-slate-800 font-mono text-sm">
                      {formatCurrency(grandTotals.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-400 bg-slate-800 font-mono text-sm">
                      {formatCurrency(grandTotals.totalProfit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Görünüm 2: Aylık Nakit Akış Trendi */}
      {activeSubTab === 'flow_trend' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Aylık Nakit Akış ve Tahsilat Trendi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Geçmiş ve mevcut ayların gelir, gider ve net likit değişim trend grafiği.
            </p>
            <MonthlyFlowChart transactions={transactions} upcomingDues={upcomingDues} />
          </div>
        </div>
      )}

      {/* Görünüm 3: Kategori Dağılım Grafiği */}
      {activeSubTab === 'category_chart' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Gelir ve Gider Kategori Dağılım Grafiği
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Şirket harcamaları ve satış gelirlerinin kategorisel dağılımı.
            </p>
            <CategoryBreakdownChart transactions={transactions} />
          </div>
        </div>
      )}
    </div>
  );
};
