import React, { useRef, useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  FileText,
  Download,
  Upload,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Printer,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Cloud,
  Smartphone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const MONTH_NAMES_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const ReportsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    caris,
    upcomingDues,
    resetToDefaultData,
    exportDataAsJson,
    importDataFromJson,
    importDataFromExcel,
    showToast,
    user,
    isCloudSyncing,
    loginWithGoogle,
    logout,
    syncLocalToCloud,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);

  // 1. Dinamik olarak sistemdeki işlem ve vade tarihlerinden ayları topla (YYYY-MM formatında)
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

  // Varsayılan olarak güncel ay
  const now = new Date();
  const defaultYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(
    availableMonths.includes(defaultYm) ? defaultYm : (availableMonths[0] || defaultYm)
  );

  // Seçilen ayın etiketi (Örn: "Ekim 2026")
  const selectedMonthLabel = useMemo(() => {
    const [y, m] = selectedYearMonth.split('-');
    const mIndex = parseInt(m, 10) - 1;
    return `${MONTH_NAMES_TR[mIndex] || m} ${y}`;
  }, [selectedYearMonth]);

  // 2. Seçilen aya ait işlemlerin filtrelenmesi
  const selectedMonthTransactions = useMemo(() => {
    return transactions.filter(
      t => t.date.startsWith(selectedYearMonth) && t.status !== 'İptal'
    );
  }, [transactions, selectedYearMonth]);

  const totalIncome = selectedMonthTransactions
    .filter(t => t.type === 'Gelir')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = selectedMonthTransactions
    .filter(t => t.type === 'Gider')
    .reduce((s, t) => s + t.amount, 0);

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // Likit Varlıklar ve Runway hesaplamaları
  const liquidCash = accounts
    .filter(a => a.type !== 'Şirket Kredi Kartı')
    .reduce((s, a) => s + a.balance, 0);

  const averageMonthlyExpense = totalExpense > 0 ? totalExpense : 30000;
  const runwayMonths = averageMonthlyExpense > 0 ? liquidCash / averageMonthlyExpense : 0;

  // Seçilen aya ait yaklaşan vade projeksiyonu
  const upcomingThisMonthIncome = upcomingDues
    .filter(d => !d.isCompleted && d.dueDate.startsWith(selectedYearMonth) && d.type === 'Gelir')
    .reduce((s, d) => s + d.amount, 0);

  const upcomingThisMonthExpense = upcomingDues
    .filter(d => !d.isCompleted && d.dueDate.startsWith(selectedYearMonth) && d.type === 'Gider')
    .reduce((s, d) => s + d.amount, 0);

  const projected30DayCash = liquidCash + upcomingThisMonthIncome - upcomingThisMonthExpense;

  // 3. Gelecek 3 Ayın Nakit Projeksiyonu Kutuları İçin Hesaplama
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

  // Export JSON file
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

  // Import JSON file
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

  // Import Excel file (.xlsx / .xls)
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
            Mali Raporlar & Nakit Akış Analizi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kar-Zarar (P&L), Likidite Dayanımı (Runway) ve Dönemsel Raporlama
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Ay ve Yıl Seçici Dropdown */}
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
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Raporu Yazdır
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> JSON Yedek
          </button>
        </div>
      </div>

      {/* Financial Health & Runway Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Kar / Zarar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {selectedMonthLabel} Net Kar
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
            <span>Kar Marjı:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              %{profitMargin.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Card 2: Nakit Dayanımı (Runway) */}
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

        {/* Card 3: Projeksiyon */}
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

      {/* P&L Statement Table (Gelir Tablosu Özeti) */}
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
          {/* Income block */}
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
              ).length === 0 ? (
                <div className="text-slate-400 py-1">Bu ay için gelir kaydı bulunmuyor.</div>
              ) : (
                Object.entries(
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
                ))
              )}
            </div>
          </div>

          {/* Expense block */}
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
                  .filter(t => t.type === 'Gider')
                  .reduce((acc: { [cat: string]: number }, curr) => {
                    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                    return acc;
                  }, {})
              ).length === 0 ? (
                <div className="text-slate-400 py-1">Bu ay için gider kaydı bulunmuyor.</div>
              ) : (
                Object.entries(
                  selectedMonthTransactions
                    .filter(t => t.type === 'Gider')
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
                ))
              )}
            </div>
          </div>

          {/* Bottom Net block */}
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

      {/* Gelecek Dönem Nakit Projeksiyon Kutuları (Önümüzdeki 3 Ay) */}
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

      {/* Cloud Synchronization & Multi-Device Sync Card */}
      <div className="bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-blue-900/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/40 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Çoklu Cihaz Bulut Eşitleme (Firebase Firestore)
                </h3>
                {user ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Bağlı & Canlı Eşitleniyor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    Cihaz İçi Yerel Mod
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ofis bilgisayarınız, telefonunuz ve tabletiniz aynı veritabanını kullanır. Yapılan her işlem tüm cihazlarınızda eşzamanlı görünür.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <button
                  onClick={syncLocalToCloud}
                  disabled={isCloudSyncing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  title="Mevcut tüm yerel verileri bulut veritabanına aktarır"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  Tüm Verileri Buluta Eşitle
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <button
                onClick={loginWithGoogle}
                disabled={isCloudSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-xs"
              >
                <Cloud className="w-4 h-4" />
                Google ile Giriş Yap & Senkronize Et
              </button>
            )}
          </div>
        </div>

        {user && (
          <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span>
              Aktif Hesap: <strong>{user.displayName || user.email}</strong> ({user.email})
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Gerçek zamanlı Firestore aktif
            </span>
          </div>
        )}
      </div>

      {/* Backup and Data Maintenance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Veri Güvenliği, Yedekleme & İçe/Dışa Aktarma
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tüm işlem ve cari kayıtlarınızı JSON veya Excel (.xlsx / .xls) ile cihazınıza aktarabilir, yedek yükleyebilir veya sıfırlayabilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* JSON Export */}
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Yedek Dosyası Al (JSON)
          </button>

          {/* JSON Import */}
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

          {/* Excel Import (.xlsx / .xls) */}
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
            className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {isUploadingExcel ? 'Excel Yükleniyor...' : "Excel'den Veri İçe Aktar (.xlsx / .xls)"}
          </button>

          {/* Reset To Initial */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Varsayılan örnek finansal verilere sıfırlamak istediğinize emin misiniz? Yapılan tüm son değişiklikler sıfırlanacaktır.'
                )
              ) {
                resetToDefaultData();
              }
            }}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Örnek Demo Verilere Sıfırla
          </button>
        </div>

        {/* Excel Sütun Eşleme Bilgilendirme Kutusu */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex items-start gap-3 mt-3">
          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Otomatik Excel Sütun Eşleme (.xlsx / .xls):
            </p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Yüklediğiniz Excel tablosundaki sütun başlıkları otomatik algılanır:{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Tarih</span>,{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Tür</span>,{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Kategori</span>,{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Cari / Firma</span>,{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Açıklama</span>,{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Hesap</span>,{' '}
              <span className="inline-block bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300">Tutar</span>.{' '}
              Tablodaki veriler hem <strong className="text-slate-700 dark:text-slate-300">İşlemler (Transactions)</strong> hem de <strong className="text-slate-700 dark:text-slate-300">Cari Hesaplar (Caris)</strong> yapısına dönüştürülüp hesap bakiyeleri güncellenir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};