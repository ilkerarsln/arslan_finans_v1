import React, { useRef, useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  FileText,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Printer,
  Calendar,
  FileSpreadsheet,
  Cloud,
  Smartphone,
  RefreshCw,
  Lock,
  Trash2,
  Building,
  Boxes,
  ChevronRight,
  X,
} from 'lucide-react';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const ReportsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    caris,
    upcomingDues,
    stockItems,
    sales,
    productCategories,
    productSubCategories,
    setActiveTab,
    exportDataToExcel,
    clearAllToZero,
    exportDataAsJson,
    importDataFromJson,
    importDataFromExcel,
    showToast,
    user,
    isAdmin,
    isCloudSyncing,
    loginWithGoogle,
    logout,
    syncLocalToCloud,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });
    upcomingDues.forEach(d => {
      if (d.dueDate && d.dueDate.length >= 7) {
        monthSet.add(d.dueDate.slice(0, 7));
      }
    });

    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(currentYm);
    return Array.from(monthSet).sort().reverse();
  }, [transactions, upcomingDues]);

  const now = new Date();
  const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(
    availableMonths.includes(defaultYm) ? defaultYm : (availableMonths[0] || defaultYm)
  );

  const selectedMonthLabel = useMemo(() => {
    const [y, m] = selectedYearMonth.split('-');
    const mIndex = parseInt(m, 10) - 1;
    return `${MONTH_NAMES_TR[mIndex] || m} ${y}`;
  }, [selectedYearMonth]);

  const selectedMonthTransactions = useMemo(() => {
    return transactions.filter(
      t => t.date.startsWith(selectedYearMonth) && t.status !== 'İptal'
    );
  }, [transactions, selectedYearMonth]);

  const totalIncome = selectedMonthTransactions
    .filter(t => t.type === 'Gelir')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = selectedMonthTransactions
    .filter(t => t.type === 'Gider' || t.type === 'Mal Alımı')
    .reduce((s, t) => s + t.amount, 0);

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Gider & Masraf Takibi Ay ve Yıl Filtresi
  const [expenseYear, setExpenseYear] = useState<string>('2026');
  const [expenseMonth, setExpenseMonth] = useState<string>('10');
  const [selectedDetailItem, setSelectedDetailItem] = useState<{
    type: 'category' | 'supplier';
    name: string;
    totalAmount: number;
  } | null>(null);

  const filteredExpenseTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.status === 'İptal') return false;
      if (t.type !== 'Gider' && t.type !== 'Mal Alımı') return false;
      if (expenseYear !== 'ALL' && !t.date.startsWith(expenseYear)) return false;
      if (expenseMonth !== 'ALL') {
        const m = t.date.substring(5, 7);
        if (m !== expenseMonth) return false;
      }
      return true;
    });
  }, [transactions, expenseYear, expenseMonth]);

  const categoryExpenses = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    filteredExpenseTransactions.forEach(t => {
      const cat = t.category || 'Genel Gider';
      const cur = map.get(cat) || { count: 0, total: 0 };
      map.set(cat, { count: cur.count + 1, total: cur.total + t.amount });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenseTransactions]);

  const supplierExpenses = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    filteredExpenseTransactions.forEach(t => {
      const sup = t.supplierCariName || t.cariName || 'Diğer Tedarikçiler';
      const cur = map.get(sup) || { count: 0, total: 0 };
      map.set(sup, { count: cur.count + 1, total: cur.total + t.amount });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenseTransactions]);

  const detailTransactions = useMemo(() => {
    if (!selectedDetailItem) return [];
    return filteredExpenseTransactions.filter(t => {
      if (selectedDetailItem.type === 'category') {
        return (t.category || 'Genel Gider') === selectedDetailItem.name;
      } else {
        return (t.supplierCariName || t.cariName || 'Diğer Tedarikçiler') === selectedDetailItem.name;
      }
    });
  }, [filteredExpenseTransactions, selectedDetailItem]);

  const categoryDistribution = useMemo(() => {
    const totalWarehouseValue = stockItems.reduce((sum, s) => sum + s.totalValue, 0) || 1;
    return productCategories.map(cat => {
      const catStockItems = stockItems.filter(
        s => s.category.toLowerCase().trim() === cat.name.toLowerCase().trim() ||
             (cat.type && s.category.toLowerCase().includes(cat.type.toLowerCase()))
      );
      const stokDegeri = catStockItems.reduce((sum, s) => sum + s.totalValue, 0);
      const stokPayi = +((stokDegeri / totalWarehouseValue) * 100).toFixed(1);

      const catSales = sales.filter(
        s => s.category.toLowerCase().trim() === cat.name.toLowerCase().trim() ||
             (cat.type && s.category.toLowerCase().includes(cat.type.toLowerCase()))
      );
      const satisCirosu = catSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
      const brutKar = catSales.reduce((sum, s) => sum + s.netProfit, 0);
      const margin = satisCirosu > 0 ? (brutKar / satisCirosu) * 100 : 0;
      const count = catStockItems.reduce((sum, s) => sum + s.quantity, 0);

      const subNames = productSubCategories
        .filter(sub => sub.categoryId === cat.id || sub.categoryName === cat.name)
        .map(sub => sub.name)
        .slice(0, 3)
        .join(', ');

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || '#0ea5e9',
        itemCount: count,
        subPreview: subNames || 'Genel',
        stokDegeri,
        stokPayi,
        satisCirosu,
        brutKar,
        margin,
      };
    });
  }, [productCategories, productSubCategories, stockItems, sales]);

  const totalDistStockValue = categoryDistribution.reduce((sum, c) => sum + c.stokDegeri, 0);
  const totalDistSales = categoryDistribution.reduce((sum, c) => sum + c.satisCirosu, 0);
  const totalDistGrossProfit = categoryDistribution.reduce((sum, c) => sum + c.brutKar, 0);
  const totalDistMargin = totalDistSales > 0 ? (totalDistGrossProfit / totalDistSales) * 100 : 0;

  const liquidCash = accounts
    .filter(a => a.type !== 'Şirket Kredi Kartı')
    .reduce((s, a) => s + a.balance, 0);
  const averageMonthlyExpense = totalExpense > 0 ? totalExpense : 30000;
  const runwayMonths = averageMonthlyExpense > 0 ? liquidCash / averageMonthlyExpense : 0;

  const upcomingThisMonthIncome = upcomingDues
    .filter(d => !d.isCompleted && d.dueDate.startsWith(selectedYearMonth) && d.type === 'Gelir')
    .reduce((s, d) => s + d.amount, 0);
  const upcomingThisMonthExpense = upcomingDues
    .filter(d => !d.isCompleted && d.dueDate.startsWith(selectedYearMonth) && d.type === 'Gider')
    .reduce((s, d) => s + d.amount, 0);
  const projected30DayCash = liquidCash + upcomingThisMonthIncome - upcomingThisMonthExpense;

  const upcomingFutureMonths = useMemo(() => {
    const result: { ym: string; label: string; income: number; expense: number; net: number }[] = [];
    const [currY, currM] = selectedYearMonth.split('-').map(Number);
    for (let i = 1; i <= 3; i++) {
      let targetM = currM + i;
      let targetY = currY;
      if (targetM > 12) {
        targetM -= 12;
        targetY += 1;
      }
      const ymStr = `${targetY}-${String(targetM).padStart(2, '0')}`;
      const labelStr = `${MONTH_NAMES_TR[targetM - 1]} ${targetY}`;
      const inc = upcomingDues
        .filter(d => !d.isCompleted && d.dueDate.startsWith(ymStr) && d.type === 'Gelir')
        .reduce((sum, d) => sum + d.amount, 0);
      const exp = upcomingDues
        .filter(d => !d.isCompleted && d.dueDate.startsWith(ymStr) && d.type === 'Gider')
        .reduce((sum, d) => sum + d.amount, 0);
      result.push({
        ym: ymStr,
        label: labelStr,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }
    return result;
  }, [selectedYearMonth, upcomingDues]);

  const handleExportJson = () => {
    const data = exportDataAsJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arslan_finans_yedek_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Tüm finansal veriler JSON olarak yedeklendi', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        importDataFromJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingExcel(true);
    try {
      await importDataFromExcel(file);
    } finally {
      setIsUploadingExcel(false);
      e.target.value = '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Ay Seçici */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Mali Raporlar & Nakit Akışı Analizi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kâr-Zarar (P&L), Likidite Dayanımı (Runway) ve Dönemsel Raporlama
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <select
              value={selectedYearMonth}
              onChange={e => setSelectedYearMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {availableMonths.map(ym => {
                const [y, m] = ym.split('-');
                const mIdx = parseInt(m, 10) - 1;
                return (
                  <option key={ym} value={ym} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    {MONTH_NAMES_TR[mIdx] || m} {y}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            onClick={exportDataToExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Dışa Aktar (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Raporu Yazdır
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" /> JSON Yedek
          </button>
        </div>
      </div>

      {/* Financial Health & Runway Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {selectedMonthLabel} Net Kâr
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                netProfit >= 0
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
              }`}
            >
              {netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <h3
            className={`text-2xl font-bold font-mono-num mt-2 ${
              netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(netProfit)}
          </h3>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span>Kâr Marjı:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              %{profitMargin.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Nakit Dayanımı (Runway)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {runwayMonths.toFixed(1)} Ay
          </h3>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span>Seçilen Ayın Gideri:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(totalExpense)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              {selectedMonthLabel} Tahmini Nakit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatCurrency(projected30DayCash)}
          </h3>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
            <span>Net Vade Etkisi:</span>
            <span
              className={`font-semibold ${
                upcomingThisMonthIncome - upcomingThisMonthExpense >= 0
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {formatCurrency(upcomingThisMonthIncome - upcomingThisMonthExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* P&L Statement Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Gelir - Gider Tablosu Özeti (P&L)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {selectedMonthLabel} Dönemi
          </span>
        </div>
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-1">
              <span>A. TOPLAM GELİRLER & TAHSİLATLAR</span>
              <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
              {Object.entries(
                selectedMonthTransactions
                  .filter(t => t.type === 'Gelir')
                  .reduce((acc: { [cat: string]: number }, curr) => {
                    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                    return acc;
                  }, {})
              ).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between">
                  <span>{cat}</span>
                  <span className="font-mono-num font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(amt as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-1">
              <span>B. TOPLAM GİDERLER & FAALİYET HARCAMALARI</span>
              <span className="font-mono-num text-rose-600 dark:text-rose-400">
                -{formatCurrency(totalExpense)}
              </span>
            </div>
            <div className="pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
              {Object.entries(
                selectedMonthTransactions
                  .filter(t => t.type === 'Gider' || t.type === 'Mal Alımı')
                  .reduce((acc: { [cat: string]: number }, curr) => {
                    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                    return acc;
                  }, {})
              ).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between">
                  <span>{cat}</span>
                  <span className="font-mono-num font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(amt as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between font-bold text-sm">
            <span className="text-slate-900 dark:text-white">NET FAALİYET SONUCU (A - B)</span>
            <span
              className={`font-mono-num text-base ${
                netProfit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Rapor 1: Mobilya ve Beyaz Eşya Kategorilerine Göre Stok & Kâr Dağılımı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Mobilya ve Beyaz Eşya Kategorilerine Göre Stok & Kâr Dağılımı
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ana ürün kategorilerine göre güncel depo stok değeri, stok payı (%), satış cirosu ve elde edilen brüt kâr analizi
            </p>
          </div>
          <button
            onClick={() => setActiveTab('stock')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>Stok Kartlarını Yönet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Kategori Çeşidi</th>
                <th className="py-3 px-4">Alt Kategori Detayları</th>
                <th className="py-3 px-3 text-center">Stok Adedi</th>
                <th className="py-3 px-4 text-right">Stok Değeri</th>
                <th className="py-3 px-4 text-center">Stok Payı (%)</th>
                <th className="py-3 px-4 text-right">Satış Cirosu</th>
                <th className="py-3 px-4 text-right">Elde Edilen Brüt Kâr</th>
                <th className="py-3 px-4 text-center">Kâr Marjı %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categoryDistribution.map(cat => (
                <tr
                  key={cat.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                    {cat.subPreview}
                  </td>
                  <td className="py-3 px-3 text-center font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                    {cat.itemCount} adet
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {formatCurrency(cat.stokDegeri)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono-num font-bold text-slate-700 dark:text-slate-300">
                        %{cat.stokPayi}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(cat.satisCirosu)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{formatCurrency(cat.brutKar)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`font-mono-num font-bold px-2 py-0.5 rounded text-[11px] ${
                        cat.margin >= 20
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : cat.margin > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      %{cat.margin.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/90 font-bold border-t-2 border-slate-200 dark:border-slate-700 text-xs">
              <tr>
                <td className="py-3 px-4 text-slate-900 dark:text-white" colSpan={3}>
                  GENEL TOPLAM DEPO STOK & SATIŞ
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-slate-900 dark:text-white">
                  {formatCurrency(totalDistStockValue)}
                </td>
                <td className="py-3 px-4 text-center font-mono-num text-slate-900 dark:text-white">
                  %100.0
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-slate-900 dark:text-white">
                  {formatCurrency(totalDistSales)}
                </td>
                <td className="py-3 px-4 text-right font-mono-num text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(totalDistGrossProfit)}
                </td>
                <td className="py-3 px-4 text-center font-mono-num text-purple-600 dark:text-purple-400">
                  %{totalDistMargin.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Rapor 2: Gider & Masraf Takibi ve Tedarikçi Harcamaları */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Gider & Masraf Takibi ve Tedarikçi Harcama Raporu
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tedarikçi veya masraf satırları üzerine tıklayarak ilgili döneme ait aylık fatura ve işlem dökümlerini görebilirsiniz.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-500">Ay:</span>
              <select
                value={expenseMonth}
                onChange={e => setExpenseMonth(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Aylar</option>
                <option value="01">Ocak</option>
                <option value="02">Şubat</option>
                <option value="03">Mart</option>
                <option value="04">Nisan</option>
                <option value="05">Mayıs</option>
                <option value="06">Haziran</option>
                <option value="07">Temmuz</option>
                <option value="08">Ağustos</option>
                <option value="09">Eylül</option>
                <option value="10">Ekim</option>
                <option value="11">Kasım</option>
                <option value="12">Aralık</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-medium text-slate-500">Yıl:</span>
              <select
                value={expenseYear}
                onChange={e => setExpenseYear(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Yıllar</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Gider & Masraf Kalemleri ({categoryExpenses.length})
              </h4>
              <span className="text-[11px] text-slate-400">Detay için satıra tıklayın</span>
            </div>
            <div className="space-y-2">
              {categoryExpenses.map(item => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedDetailItem({ type: 'category', name: item.name, totalAmount: item.total })}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800 transition flex items-center justify-between group"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.count} adet işlem kaydı
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-xs text-rose-600 dark:text-rose-400">
                      {formatCurrency(item.total)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Tedarikçi Alım & Harcamaları ({supplierExpenses.length})
              </h4>
              <span className="text-[11px] text-slate-400">Detay için satıra tıklayın</span>
            </div>
            <div className="space-y-2">
              {supplierExpenses.map(item => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedDetailItem({ type: 'supplier', name: item.name, totalAmount: item.total })}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800 transition flex items-center justify-between group"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.count} adet fatura/mal alımı
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formatCurrency(item.total)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail for Expenses */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {selectedDetailItem.type === 'category' ? 'Masraf Kategorisi Aylık Dökümü' : 'Tedarikçi Aylık Harcama Detayı'}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {selectedDetailItem.name}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-num font-bold text-sm text-rose-600 dark:text-rose-400">
                  Toplam: {formatCurrency(selectedDetailItem.totalAmount)}
                </span>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Belge / Açıklama</th>
                    <th className="py-2.5 px-3">Kategori / Cari</th>
                    <th className="py-2.5 px-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        {tx.documentNo && <span className="font-mono text-[10px] text-slate-400 block">{tx.documentNo}</span>}
                        <span>{tx.desc}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {selectedDetailItem.type === 'category' ? (tx.supplierCariName || tx.cariName || '-') : tx.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        -{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gelecek Dönem Projeksiyonları */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Gelecek Dönem Nakit Projeksiyonları (Önümüzdeki 3 Ay)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vade takvimindeki kayıtlı çek, senet ve planlı ödemelere göre gelecek aylar
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingFutureMonths.map(fm => (
            <div
              key={fm.ym}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  {fm.label}
                </span>
                <span
                  className={`text-xs font-mono-num font-bold ${
                    fm.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  Net: {formatCurrency(fm.net)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Gelir:</span>
                  <span className="font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(fm.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-600 dark:text-rose-400 font-medium">Gider:</span>
                  <span className="font-mono-num font-semibold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(fm.expense)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Sync & Backup Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Veri Güvenliği, Yedekleme & İçe/Dışa Aktarma
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tüm işlem ve cari kayıtları JSON veya Excel (.xlsx / .xls) ile cihazınıza aktarabilir, yedek yükleyebilir veya sıfırlayabilirsiniz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Yedek Dosyası Al (JSON)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            Yedekten Geri Yükle (JSON)
          </button>
          <input
            type="file"
            ref={excelInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => excelInputRef.current?.click()}
            disabled={isUploadingExcel}
            className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {isUploadingExcel ? 'Excel Yükleniyor...' : "Excel'den Veri İçe Aktar (.xlsx / .xls)"}
          </button>
          <button
            onClick={exportDataToExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Excel'e Dışa Aktar (.xlsx)
          </button>
          {isAdmin ? (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'DİKKAT: Tüm şirket veritabanı (işlemler, cariler, vadeler) sıfırlanacaktır. Bu işlem geri alınamaz! Devam etmek istiyor musunuz?'
                  )
                ) {
                  clearAllToZero();
                }
              }}
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Tüm Verileri Sıfırla (Admin)
            </button>
          ) : (
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Veri Sıfırlama: Yalnızca Admin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
