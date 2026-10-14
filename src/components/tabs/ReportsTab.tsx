import React, { useState, useMemo, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import {
  FileBarChart2,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const {
    transactions,
    accounts,
    caris,
    upcomingDues,
    exportDataToExcel,
    exportDataAsJson,
    importDataFromJson,
    importDataFromExcel,
    clearAllToZero,
    isAdmin,
    permissions,
    showToast,
  } = useFinance();

  const fileInputExcelRef = useRef<HTMLInputElement>(null);
  const fileInputJsonRef = useRef<HTMLInputElement>(null);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInputConfirm, setClearInputConfirm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    transactions.forEach(t => {
      if (t.date && t.date.length >= 4) {
        const y = parseInt(t.date.slice(0, 4));
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Year Monthly Summary
  const monthlySummary = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = String(i + 1).padStart(2, '0');
      const prefix = `${selectedYear}-${monthStr}`;

      const monthTxs = transactions.filter(t => t.date.startsWith(prefix) && t.status !== 'İptal');
      const income = monthTxs.filter(t => t.type === 'Gelir').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'Gider' || t.type === 'Mal Alışı').reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;

      return {
        monthIndex: i,
        monthName: [
          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
        ][i],
        income,
        expense,
        net,
        txCount: monthTxs.length,
      };
    });

    return months;
  }, [transactions, selectedYear]);

  const yearTotalIncome = monthlySummary.reduce((sum, m) => sum + m.income, 0);
  const yearTotalExpense = monthlySummary.reduce((sum, m) => sum + m.expense, 0);
  const yearNetProfit = yearTotalIncome - yearTotalExpense;

  const handleJsonDownload = () => {
    const jsonStr = exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arslan_finans_yedek_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Tüm finansal veriler JSON formatında yedeklendi.', 'success');
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const content = ev.target?.result as string;
        const success = importDataFromJson(content);
        if (success) {
          showToast('JSON yedeği başarıyla geri yüklendi!', 'success');
        } else {
          showToast('JSON dosyası okunamadı veya biçimi geçersiz.', 'error');
        }
      } catch (err) {
        showToast('Dosya işleme hatası oluştu.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputJsonRef.current) fileInputJsonRef.current.value = '';
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const result = await importDataFromExcel(file);
      showToast(
        `Excel'den ${result.transactionsCount} hareket ve ${result.carisCount} cari aktarıldı.`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Excel içe aktarma başarısız oldu.', 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputExcelRef.current) fileInputExcelRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (clearInputConfirm !== 'SIFIRLA') {
      showToast('Lütfen onay kutusuna SIFIRLA yazın.', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      await clearAllToZero();
      showToast('Tüm veritabanı başarıyla sıfırlandı.', 'info');
      setShowClearConfirm(false);
      setClearInputConfirm('');
    } catch (err) {
      showToast('Sıfırlama işlemi sırasında hata oluştu.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {selectedYear} Yıllık Toplam Gelir
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(yearTotalIncome)}
          </div>
          <p className="text-xs text-slate-500 mt-1">12 aylık tamamlanan gelir hareketleri</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {selectedYear} Yıllık Toplam Gider
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(yearTotalExpense)}
          </div>
          <p className="text-xs text-slate-500 mt-1">İşletme giderleri ve mal alışları toplamı</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {selectedYear} Yıllık Net Faaliyet Kârı
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                yearNetProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              <FileBarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold tabular-nums ${
              yearNetProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(yearNetProfit)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {yearNetProfit >= 0 ? 'Net dönem kârı elde edildi' : 'Net dönem zararı oluştu'}
          </p>
        </div>
      </div>

      {/* Year Selector & Month Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Aylık Gelir - Gider & Kâr/Zarar Tablosu
            </h3>
            <p className="text-xs text-slate-500">
              Seçilen yıla ait 12 aylık finansal performans dağılımı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Yıl:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ay</th>
                <th className="py-3 px-4 text-center">İşlem Adedi</th>
                <th className="py-3 px-4 text-right">Gelir</th>
                <th className="py-3 px-4 text-right">Gider & Mal Alışı</th>
                <th className="py-3 px-4 text-right">Aylık Net Kâr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {monthlySummary.map(m => {
                const isNetPositive = m.net > 0;
                const isNetNegative = m.net < 0;

                return (
                  <tr key={m.monthIndex} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {m.monthName}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {m.txCount}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(m.income)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatCurrency(m.expense)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      <span
                        className={
                          isNetPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isNetNegative
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {formatCurrency(m.net)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Backup & Restore & Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export / Backup */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Veri Yedekleme & Dışa Aktar
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Tüm gelir-gider hareketlerini, cari hesapları, banka bakiyelerini ve vade kayıtlarını Excel veya JSON formatında bilgisayarınıza indirin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportDataToExcel}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Olarak İndir (.xlsx)</span>
            </button>
            <button
              onClick={handleJsonDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              <span>JSON Yedek Al</span>
            </button>
          </div>
        </div>

        {/* Import / Restore */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Veri Geri Yükleme & İçe Aktar
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Önceden aldığınız JSON yedeğini veya Arslan Finans uyumlu Excel dosyasını seçerek kayıtları sisteme geri aktarın.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputExcelRef}
              onChange={handleExcelUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputExcelRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Excel İçe Aktar</span>
            </button>

            <input
              type="file"
              ref={fileInputJsonRef}
              onChange={handleJsonUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputJsonRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-all"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              <span>JSON Geri Yükle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Danger Zone */}
      {isAdmin && (
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Yönetici Sıfırlama Bölgesi (Kritik İşlem)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tüm finans hareketlerini, cari bakiyelerini ve vade takvimini sıfırlayarak temiz bir başlangıç yapabilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              Tüm Veritabanını Sıfırla
            </button>
          </div>
        </div>
      )}

      {/* Clear Database Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Veritabanını Sıfırlamak Üzeresiniz!
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Bu işlem tüm gelir/gider hareketlerini, carileri ve vade kayıtlarını kalıcı olarak silecektir. Devam etmek için aşağıdaki kutuya <strong className="text-rose-600 dark:text-rose-400 font-mono">SIFIRLA</strong> yazın:
            </p>

            <div className="mt-4">
              <input
                type="text"
                placeholder="SIFIRLA"
                value={clearInputConfirm}
                onChange={e => setClearInputConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-center font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearInputConfirm('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Vazgeç
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearInputConfirm !== 'SIFIRLA' || isProcessing}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-xs"
              >
                {isProcessing ? 'Sıfırlanıyor...' : 'Kalıcı Olarak Sıfırla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
