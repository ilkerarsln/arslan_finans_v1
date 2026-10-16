import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useFinance } from '../../context/FinanceContext';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  Layers,
  Percent,
  TrendingUp,
  RefreshCw,
  FileCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { CIRO_ROW_DEFINITIONS, CIRO_MONTHS } from '../../data/initialCiroMatrix';

interface ParsedCiroRow {
  rawName: string;
  matchedId: string;
  displayName: string;
  group: 'BEYAZ EŞYA' | 'MOBİLYA';
  profitMargin?: number;
  months: Record<number, number>; // 1..12
  rowTotal: number;
  isValid: boolean;
  warning?: string;
}

interface CiroDataImporterProps {
  onClose?: () => void;
  defaultYear?: string;
  onImportComplete?: (year: string, count: number) => void;
}

export const CiroDataImporter: React.FC<CiroDataImporterProps> = ({
  onClose,
  defaultYear,
  onImportComplete,
}) => {
  const { importCiroMatrixYearData, showToast } = useFinance();
  const now = new Date();
  const fallbackYear = String(now.getFullYear());
  const [targetYear, setTargetYear] = useState<string>(defaultYear || '2026');

  // Step 1: Upload & Config, Step 2: Preview & Confirm, Step 3: Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // File Upload State
  const [fileName, setFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed Data
  const [parsedRows, setParsedRows] = useState<ParsedCiroRow[]>([]);
  const [fileTotalTurnover, setFileTotalTurnover] = useState<number>(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Sample Template Generation
  const handleDownloadSampleTemplate = () => {
    try {
      const headers = [
        'Grup',
        'Kategori / Marka',
        'Ortalama Kârlılık (%)',
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık',
      ];
      const sampleRows = CIRO_ROW_DEFINITIONS.map(row => [
        row.group,
        row.displayName,
        row.defaultProfitMargin,
        250000,
        265000,
        290000,
        320000,
        350000,
        380000,
        365000,
        390000,
        415000,
        370000,
        395000,
        430000,
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 22 },
        { wch: 20 },
        ...Array(12).fill({ wch: 14 }),
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, targetYear || '2026');
      XLSX.writeFile(wb, `Arslan_Mobilya_Ciro_Sablonu_${targetYear || '2026'}.xlsx`);
      showToast('Ciro Excel şablonu başarıyla indirildi.', 'success');
    } catch (err) {
      console.error('Failed to download template:', err);
      showToast('Şablon indirilemedi.', 'error');
    }
  };

  // Match raw text to one of the 12 CIRO rows
  const matchCategoryName = (name: string): (typeof CIRO_ROW_DEFINITIONS)[0] | undefined => {
    const clean = String(name || '').toUpperCase().trim();
    if (!clean) return undefined;

    // Direct match with definition ID or displayName
    const exact = CIRO_ROW_DEFINITIONS.find(
      r => r.id.toUpperCase() === clean || r.displayName.toUpperCase() === clean
    );
    if (exact) return exact;

    // Alias match
    for (const def of CIRO_ROW_DEFINITIONS) {
      if (def.aliases.some(a => clean.includes(a.toUpperCase()))) {
        return def;
      }
    }

    // Specific brand fuzzy keywords
    if (clean.includes('ALTUS')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'ALTUS');
    if (clean.includes('UGUR') || clean.includes('UĞUR')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'UGUR');
    if (clean.includes('HOOVER')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'HOOVER');
    if (clean.includes('KEA') || clean.includes('KÜÇÜK') || clean.includes('TEFAL') || clean.includes('KARCHER'))
      return CIRO_ROW_DEFINITIONS.find(r => r.id === 'KEA');
    if (clean.includes('BOSCH')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'BOSCH');
    if (clean.includes('TV') || clean.includes('TELEVIZYON') || clean.includes('SKYTECH'))
      return CIRO_ROW_DEFINITIONS.find(r => r.id === 'TV');
    if (clean.includes('MEDISA') || clean.includes('MEDİSA')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'MEDISA');
    if (clean.includes('BAMBI') || clean.includes('BAMBİ')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'BAMBI');
    if (clean.includes('MASA') || clean.includes('SANDALYE')) return CIRO_ROW_DEFINITIONS.find(r => r.id === 'MASA');
    if (clean.includes('AKSESUAR') || clean.includes('SEHPA') || clean.includes('BURO') || clean.includes('BÜRO'))
      return CIRO_ROW_DEFINITIONS.find(r => r.id === 'AKSESUAR');
    if (clean.includes('YATAK') || clean.includes('BEDLIFE') || clean.includes('FIENTO') || clean.includes('FİENTO'))
      return CIRO_ROW_DEFINITIONS.find(r => r.id === 'YATAK');
    if (clean.includes('MOBILYA') || clean.includes('MOBİLYA'))
      return CIRO_ROW_DEFINITIONS.find(r => r.id === 'MOBILYA');

    return undefined;
  };

  const parseMonthIndex = (headerText: string, colIndex: number): number | null => {
    const clean = String(headerText || '').toLowerCase().trim();

    for (const m of CIRO_MONTHS) {
      if (clean.includes(m.name.toLowerCase()) || clean.includes(m.short.toLowerCase())) {
        return m.no;
      }
    }

    const numMatch = clean.match(/^(\d{1,2})$/) || clean.match(/(\d{1,2})\.?\s*ay/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 1 && num <= 12) return num;
    }

    if (colIndex >= 3 && colIndex <= 14) {
      return colIndex - 2;
    }
    return null;
  };

  const parseNumericValue = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let str = String(val).trim();
    str = str.replace(/[₺TLtl%]/g, '').trim();
    if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseSheetData = (sheet: XLSX.WorkSheet, sheetYearHint?: string) => {
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rawData || rawData.length === 0) {
      showToast('Seçilen çalışma sayfası boş!', 'error');
      return;
    }

    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const rowStr = rawData[i].map(c => String(c).toLowerCase()).join(' ');
      if (
        rowStr.includes('kategori') ||
        rowStr.includes('marka') ||
        rowStr.includes('ocak') ||
        rowStr.includes('karlılık') ||
        rowStr.includes('kârlılık')
      ) {
        headerRowIdx = i;
        break;
      }
    }

    const headerRow = rawData[headerRowIdx] || [];
    let categoryColIdx = 1;
    let marginColIdx = -1;
    const monthColMap: { colIdx: number; monthNo: number }[] = [];

    headerRow.forEach((col, idx) => {
      const colStr = String(col).toLowerCase().trim();
      if (colStr.includes('kategori') || colStr.includes('marka')) {
        categoryColIdx = idx;
      } else if (
        colStr.includes('karlılık') ||
        colStr.includes('kârlılık') ||
        colStr.includes('kar %') ||
        colStr.includes('marj') ||
        colStr.includes('oran')
      ) {
        marginColIdx = idx;
      } else {
        const monthNo = parseMonthIndex(colStr, idx);
        if (monthNo) {
          monthColMap.push({ colIdx: idx, monthNo });
        }
      }
    });

    if (marginColIdx === -1 && headerRow.length > 2) {
      marginColIdx = 2;
    }

    const results: ParsedCiroRow[] = [];
    let grandTotal = 0;

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      const rawCategoryName = String(row[categoryColIdx] || '').trim();
      if (!rawCategoryName) continue;

      const lowerCat = rawCategoryName.toLowerCase();
      if (
        lowerCat.includes('toplam') ||
        lowerCat.includes('ortalama') ||
        lowerCat.includes('büyüme') ||
        lowerCat.includes('grup')
      ) {
        continue;
      }

      const match = matchCategoryName(rawCategoryName);

      let parsedMargin: number | undefined = undefined;
      if (marginColIdx !== -1 && row[marginColIdx] !== undefined && row[marginColIdx] !== '') {
        let rawMargin = parseNumericValue(row[marginColIdx]);
        if (rawMargin > 0 && rawMargin < 1) {
          rawMargin = rawMargin * 100;
        }
        if (rawMargin > 0 && rawMargin <= 100) {
          parsedMargin = Math.round(rawMargin);
        }
      }

      const monthsData: Record<number, number> = {};
      let rowSum = 0;
      for (let m = 1; m <= 12; m++) {
        monthsData[m] = 0;
      }

      monthColMap.forEach(({ colIdx, monthNo }) => {
        if (row[colIdx] !== undefined) {
          const val = parseNumericValue(row[colIdx]);
          monthsData[monthNo] = val;
          rowSum += val;
        }
      });

      grandTotal += rowSum;

      if (match) {
        results.push({
          rawName: rawCategoryName,
          matchedId: match.id,
          displayName: match.displayName,
          group: match.group,
          profitMargin: parsedMargin !== undefined ? parsedMargin : match.defaultProfitMargin,
          months: monthsData,
          rowTotal: rowSum,
          isValid: true,
        });
      } else {
        results.push({
          rawName: rawCategoryName,
          matchedId: 'MOBILYA',
          displayName: rawCategoryName,
          group: 'MOBİLYA',
          profitMargin: parsedMargin || 30,
          months: monthsData,
          rowTotal: rowSum,
          isValid: false,
          warning: 'Standart kategoriye eşlenemedi, Mobilya grubuna yönlendirilecek.',
        });
      }
    }

    if (results.length === 0) {
      showToast('Dosyada geçerli kategori veya ciro satırı bulunamadı.', 'error');
      return;
    }

    setParsedRows(results);
    setFileTotalTurnover(grandTotal);

    if (sheetYearHint && /^\d{4}$/.test(sheetYearHint)) {
      setTargetYear(sheetYearHint);
    }
    setStep(2);
    showToast(`${results.length} kategori ve ciro satırı başarıyla okundu.`, 'success');
  };

  const processUploadedFile = async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      setRawWorkbook(wb);
      setSheetNames(wb.SheetNames);

      const fileNameYearMatch = file.name.match(/\b(202\d)\b/);
      const sheetYearMatch = wb.SheetNames[0]?.match(/\b(202\d)\b/);
      const detectedYear = fileNameYearMatch?.[1] || sheetYearMatch?.[1];
      if (detectedYear) {
        setTargetYear(detectedYear);
      }

      const activeSheetName = wb.SheetNames[0];
      setSelectedSheet(activeSheetName);
      parseSheetData(wb.Sheets[activeSheetName], detectedYear || activeSheetName);
    } catch (err) {
      console.error('File parsing error:', err);
      showToast('Dosya işlenirken hata oluştu. Lütfen dosya formatını kontrol edin.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!rawWorkbook) return;
    setSelectedSheet(sheetName);
    const sheetYearMatch = sheetName.match(/\b(202\d)\b/);
    parseSheetData(rawWorkbook.Sheets[sheetName], sheetYearMatch?.[1] || sheetName);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!targetYear || parsedRows.length === 0) {
      showToast('Aktarılacak geçerli veri bulunamadı.', 'error');
      return;
    }

    const payload = parsedRows.map(row => ({
      rowId: row.matchedId,
      profitMargin: row.profitMargin,
      months: row.months,
    }));

    importCiroMatrixYearData(targetYear, payload);
    setStep(3);
    if (onImportComplete) {
      onImportComplete(targetYear, parsedRows.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-indigo-400 border border-indigo-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Ciro Excel İçe Aktarma Sihirbazı
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {targetYear} Yılı
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Geçmiş ve cari ciro Excel tablolarını otomatik algılayıp ERP matrisine aktarır
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSampleTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Örnek Ciro Excel Şablonunu İndir"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Örnek Şablon (.xlsx)
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-slate-950/40 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-6">
            <span
              className={`flex items-center gap-2 font-medium ${
                step >= 1 ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                1
              </span>
              Dosya & Yıl Seçimi
            </span>
            <span className="text-slate-700">›</span>
            <span
              className={`flex items-center gap-2 font-medium ${
                step >= 2 ? 'text-indigo-400' : 'text-slate-500'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                2
              </span>
              Önizleme & Kategori Eşleme
            </span>
            <span className="text-slate-700">›</span>
            <span
              className={`flex items-center gap-2 font-medium ${
                step === 3 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </span>
              Tamamlandı
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {step === 1 && 'Adım 1/3'}
            {step === 2 && 'Adım 2/3'}
            {step === 3 && 'Adım 3/3'}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Upload & Configuration */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Hedef Ciro Yılı (Matris Tablosu):
                </label>
                <div className="flex items-center gap-2.5">
                  {['2024', '2025', '2026', '2027'].map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setTargetYear(yr)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        targetYear === yr
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-400/40'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {yr} Yılı
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Diğer Yıl"
                      value={targetYear}
                      onChange={e => setTargetYear(e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  * Yüklenen Excel'deki ciro değerleri ve kârlılık oranları {targetYear} yılı matrisine işlenecektir.
                </p>
              </div>

              {/* Drag and drop upload box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700/80 bg-slate-950/50 hover:bg-slate-950/80 hover:border-slate-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  {isParsing ? (
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {isParsing ? 'Excel Dosyası Okunuyor...' : 'Ciro Excel Dosyasını Buraya Sürükleyin veya Seçin'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Desteklenen formatlar: <strong className="text-slate-300">.xlsx, .xls, .csv</strong> (Grup, Kategori, Kârlılık %, 12 Aylık Cirolar)
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30">
                    Dosya Seç
                  </span>
                </div>
              </div>

              {/* Supported Columns hint */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Otomatik Tanınan Kategoriler & Kolonlar:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                    <strong className="text-sky-300 block">Beyaz Eşya:</strong>
                    ALTUS, UĞUR, HOOVER, KEA, TV, BOSCH
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                    <strong className="text-amber-300 block">Mobilya:</strong>
                    MEDİSA, MOBİLYA, YATAK, BAMBİ, MASA, AKSESUAR
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                    <strong className="text-emerald-300 block">Aylar (1..12):</strong>
                    Ocak'tan Aralık'a tüm aylık cirolar
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                    <strong className="text-indigo-300 block">Kârlılık Katsayısı:</strong>
                    Satır marjı (%) oranları
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {fileName}
                      <span className="text-xs font-normal text-slate-400">
                        ({parsedRows.length} kategori okundu)
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Hedef Yıl: <strong className="text-indigo-400">{targetYear}</strong> | Toplam Algılanan Ciro:{' '}
                      <strong className="text-emerald-400 font-mono">{formatCurrency(fileTotalTurnover)}</strong>
                    </p>
                  </div>
                </div>

                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Çalışma Sayfası:</span>
                    <select
                      value={selectedSheet}
                      onChange={e => handleSheetChange(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white"
                    >
                      {sheetNames.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Data Preview Table */}
              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Excel Başlığı</th>
                        <th className="py-2.5 px-3">Eşleşen Kategori</th>
                        <th className="py-2.5 px-3">Grup</th>
                        <th className="py-2.5 px-3 text-center">Kârlılık %</th>
                        {CIRO_MONTHS.map(m => (
                          <th key={m.no} className="py-2.5 px-2 text-right">
                            {m.short}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-right font-bold text-white">Satır Toplamı</th>
                        <th className="py-2.5 px-2.5 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 font-sans font-semibold text-slate-300">
                            {row.rawName}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                              {row.displayName}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                row.group === 'BEYAZ EŞYA'
                                  ? 'bg-sky-500/10 text-sky-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                            >
                              {row.group}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-emerald-400 font-bold">
                            %{row.profitMargin}
                          </td>
                          {CIRO_MONTHS.map(m => (
                            <td key={m.no} className="py-2 px-2 text-right text-slate-300">
                              {row.months[m.no] > 0 ? formatCurrency(row.months[m.no]) : '-'}
                            </td>
                          ))}
                          <td className="py-2 px-3 text-right font-bold text-white bg-slate-900/40">
                            {formatCurrency(row.rowTotal)}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Eşleşti
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-sans"
                                title={row.warning}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" /> Uyarı
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="max-w-md mx-auto text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Ciro Verileri Başarıyla Aktarıldı!</h3>
              <p className="text-xs text-slate-400">
                {targetYear} yılı için {parsedRows.length} kategori ve aylık ciro matrisi veritabanına kaydedildi. Tüm genel toplamlar, aylık ortalamalar ve büyüme oranları anlık olarak senkronize edildi.
              </p>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">İşlenen Yıl:</span>
                  <span className="font-bold text-white">{targetYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Aktarılan Toplam Ciro:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(fileTotalTurnover)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kategori Sayısı:</span>
                  <span className="font-bold text-indigo-400">{parsedRows.length} Kalem</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
                >
                  Rapor Matrisine Dön
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Geri Dön
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step !== 3 && onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Vazgeç
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleExecuteImport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {targetYear} Yılına Aktar ve Senkronize Et
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
