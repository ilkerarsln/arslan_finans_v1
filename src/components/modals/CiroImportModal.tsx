import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CiroMatrixRow } from '../../types/finance';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const CiroImportModal: React.FC = () => {
  const {
    isCiroImportModalOpen,
    setIsCiroImportModalOpen,
    importCiroMatrixFromExcel,
    showToast,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [parsedRows, setParsedRows] = useState<CiroMatrixRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');

  if (!isCiroImportModalOpen) return null;

  const handleClose = () => {
    setIsCiroImportModalOpen(false);
    setParsedRows([]);
    setFileName('');
    setParseError('');
  };

  // Download sample Excel template
  const handleDownloadSampleTemplate = () => {
    try {
      const headers = [
        'GRUP',
        'Kategori / Marka',
        'Ort. Kârlılık (%)',
        ...MONTH_NAMES,
      ];
      const sampleData = [
        ['BEYAZ EŞYA', 'ALTUS', 20, 157500, 189300, 150250, 466940, 384809, 221600, 411690, 345000, 410000, 480000, 390000, 512000],
        ['BEYAZ EŞYA', 'UĞUR', 15, 160250, 147800, 274250, 368450, 664100, 211120, 124800, 180000, 210000, 240000, 195000, 280000],
        ['BEYAZ EŞYA', 'BOSCH', 30, 0, 0, 0, 0, 31000, 102000, 155000, 220000, 310000, 380000, 420000, 490000],
        ['MOBİLYA', 'MEDİSA', 60, 0, 0, 30000, 11000, 0, 29600, 137000, 150000, 170000, 190000, 160000, 220000],
        ['MOBİLYA', 'MOBİLYA', 60, 34100, 299570, 336700, 510095, 46957, 98085, 200790, 240000, 270000, 300000, 260000, 350000],
        ['MOBİLYA', 'BAMBİ', 45, 0, 23500, 0, 0, 0, 81680, 100000, 120000, 135000, 150000, 130000, 170000],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ciro_Sablon');
      XLSX.writeFile(wb, 'ornek_ciro_matrisi_sablonu.xlsx');
      showToast('Örnek ciro şablonu indirildi.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Şablon indirilemedi.', 'error');
    }
  };

  // Process uploaded Excel / CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          setParseError('Excel dosyasında yeterli veri satırı bulunamadı.');
          return;
        }

        const rows: CiroMatrixRow[] = [];
        // Skip header row
        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;
          const groupRaw = String(row[0] || '').trim().toUpperCase();
          const name = String(row[1] || '').trim().toUpperCase();
          if (!name) continue;
          // Ignore subtotal rows if present in Excel
          if (name.includes('TOPLAM')) continue;

          const group: 'BEYAZ EŞYA' | 'MOBİLYA' =
            groupRaw.includes('MOB') ? 'MOBİLYA' : 'BEYAZ EŞYA';

          let margin = 30;
          if (row[2] !== undefined) {
            const mStr = String(row[2]).replace('%', '').trim();
            margin = parseFloat(mStr) || 30;
          }

          const months: { [idx: number]: number } = {};
          for (let m = 0; m < 12; m++) {
            const val = parseFloat(String(row[3 + m] || '0').replace(/[^0-9.-]/g, '')) || 0;
            months[m] = Math.max(0, val);
          }

          rows.push({
            id: `cm-${selectedYear}-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            group,
            name,
            profitMargin: margin,
            months,
          });
        }

        if (rows.length === 0) {
          setParseError('Dosyadan geçerli satır okunamadı. Lütfen şablonu inceleyin.');
          return;
        }

        setParsedRows(rows);
      } catch (err: any) {
        console.error(err);
        setParseError(`Dosya okunurken hata oluştu: ${err.message || 'Geçersiz format'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyImport = () => {
    if (parsedRows.length === 0) return;
    importCiroMatrixFromExcel(selectedYear, parsedRows);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ciro Excel İçe Aktar Sihirbazı
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12 aylık marka/kategori ciro matrisini Excel (.xlsx / .csv) üzerinden toplu yükleyin.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Year selector & Template button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hedef Yıl:
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
              >
                <option value={2024}>2024 Yılı</option>
                <option value={2025}>2025 Yılı</option>
                <option value={2026}>2026 Yılı</option>
                <option value={2027}>2027 Yılı</option>
              </select>
            </div>

            <button
              onClick={handleDownloadSampleTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Örnek Excel Şablonunu İndir</span>
            </button>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-900/30 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : 'Excel dosyasını buraya sürükleyin veya seçin'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              .xlsx, .xls veya .csv formatı desteklenir.
            </p>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-xl text-xs border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{parsedRows.length} adet marka/kategori satırı başarıyla okundu</span>
                </span>
                <span className="text-slate-400">
                  {selectedYear} yılına uygulanacak
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {parsedRows.map((r, i) => {
                  const total = Object.values(r.months).reduce((s, v) => s + v, 0);
                  return (
                    <div key={i} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {r.group}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {r.name}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          (%{r.profitMargin} Kâr)
                        </span>
                      </div>
                      <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                        ₺{total.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Vazgeç
          </button>
          <button
            onClick={handleApplyImport}
            disabled={parsedRows.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition shadow-sm ${
              parsedRows.length > 0
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                : 'bg-slate-400 cursor-not-allowed opacity-50'
            }`}
          >
            {selectedYear} Matrisine Aktar
          </button>
        </div>
      </div>
    </div>
  );
};
