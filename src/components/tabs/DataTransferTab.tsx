import React, { useState, useRef, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  UploadCloud,
  DownloadCloud,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowLeftRight,
  Sparkles,
  Calendar,
  Layers,
  Search,
  Filter,
  Check,
  RefreshCw,
  Info,
  AlertTriangle,
  Edit2,
  Trash2,
  Database,
  Building2,
  Users,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CiroMatrixRow, SaleRecord, Transaction, SaleType, CategoryHierarchyItem } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { parseExcelDate, parseExcelAmount } from '../../utils/excelImport';
import { INITIAL_CATEGORY_HIERARCHY } from '../../data/initialCategories';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/**
 * Turkish-aware text normalizer for accurate matching
 */
function normalizeTr(str: any): string {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export interface ParsedSalesRow {
  id: string;
  rowNumber: number;
  date: string;
  satisNo: string;
  customerName: string;
  rawUrunKisaKodu: string;
  quantity: number;
  unitPrice: number;
  totalSaleAmount: number;
  teslimDurumu: string;
  rawSatisOzelKodu: string;
  saleType: SaleType;
  taksitSayisi: number;
  salesPerson: string;
  rawUrunGrubu: string;

  // Auto-matching outputs
  anaKategori: string;
  altKategori: string;
  productGroup: string;
  matchedCategory: boolean;

  matchedStockId?: string;
  matchedStockCode?: string;
  matchedStockName?: string;
  costPrice: number;
  effectiveCost: number;
  netProfit: number;
  profitMargin: number;

  // Installment validation
  isSenetli: boolean;
  hasTaksitError: boolean; // SENETLİ SATIŞ and taksit <= 1
  isTaksitEditing?: boolean;
}

export const DataTransferTab: React.FC = () => {
  const {
    ciroMatrixData,
    importCiroMatrixFromExcel,
    sales,
    addSaleRecord,
    transactions,
    addTransaction,
    accounts,
    caris,
    stockItems,
    getVadeRateForMonth,
    exportDataToExcel,
    setIsCiroWizardOpen,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'ciro' | 'sales' | 'payments'>('sales');

  // -------------------------------------------------------------
  // TAB 1: CİRO AKTAR STATE & HANDLERS
  // -------------------------------------------------------------
  const [ciroYear, setCiroYear] = useState<number>(new Date().getFullYear());
  const [ciroFileName, setCiroFileName] = useState<string>('');
  const [ciroParsedRows, setCiroParsedRows] = useState<CiroMatrixRow[]>([]);
  const [ciroError, setCiroError] = useState<string>('');
  const ciroFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadCiroTemplate = () => {
    try {
      const headers = ['GRUP', 'Kategori / Marka', 'Ort. Kârlılık (%)', ...MONTH_NAMES];
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
      XLSX.writeFile(wb, `arslan_ciro_sablonu_${ciroYear}.xlsx`);
      showToast('Ciro Excel şablonu indirildi.', 'info');
    } catch {
      showToast('Şablon indirilemedi.', 'error');
    }
  };

  const handleCiroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCiroFileName(file.name);
    setCiroError('');

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          setCiroError('Excel dosyasında yeterli veri satırı bulunamadı.');
          return;
        }

        const rows: CiroMatrixRow[] = [];
        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;
          const groupRaw = String(row[0] || '').trim().toUpperCase();
          const name = String(row[1] || '').trim().toUpperCase();
          if (!name || name.includes('TOPLAM')) continue;

          let group: 'BEYAZ EŞYA' | 'MOBİLYA' = 'BEYAZ EŞYA';
          if (groupRaw.includes('MOBİLYA') || groupRaw.includes('MOBILYA')) {
            group = 'MOBİLYA';
          }

          const profitMargin = Number(row[2]) || (group === 'MOBİLYA' ? 50 : 20);
          const months: { [m: number]: number } = {};
          for (let m = 0; m < 12; m++) {
            const val = Number(row[3 + m]);
            months[m] = isNaN(val) ? 0 : Math.round(val);
          }

          rows.push({
            id: `imp-${ciroYear}-${group.toLowerCase().replace(/[^a-z0-9]/g, '')}-${name.toLowerCase()}-${r}`,
            group,
            name,
            profitMargin,
            months,
            isLiveSynced: false,
          });
        }

        if (rows.length === 0) {
          setCiroError('Dosyada geçerli ciro satırı tespit edilemedi.');
          return;
        }

        setCiroParsedRows(rows);
        showToast(`${rows.length} ciro satırı başarıyla okundu.`, 'success');
      } catch (err: any) {
        setCiroError(`Dosya okuma hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleApplyCiroImport = () => {
    if (ciroParsedRows.length === 0) return;
    importCiroMatrixFromExcel(ciroYear, ciroParsedRows);
    showToast(`${ciroYear} yılı için ${ciroParsedRows.length} marka ciro verisi matrise aktarıldı.`, 'success');
    setCiroParsedRows([]);
    setCiroFileName('');
  };

  const handleExportCiroExcel = () => {
    try {
      const yearData = ciroMatrixData.find(y => y.year === ciroYear);
      if (!yearData || yearData.rows.length === 0) {
        showToast(`${ciroYear} yılı için dışa aktarılacak ciro verisi bulunamadı.`, 'info');
        return;
      }
      const headers = ['GRUP', 'Kategori / Marka', 'Ort. Kârlılık (%)', ...MONTH_NAMES, 'YILLIK TOPLAM'];
      const dataRows = yearData.rows.map(row => {
        const mValues = MONTH_NAMES.map((_, i) => row.months[i] || 0);
        const rowTotal = mValues.reduce((a, b) => a + b, 0);
        return [row.group, row.name, row.profitMargin, ...mValues, rowTotal];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Ciro_${ciroYear}`);
      XLSX.writeFile(wb, `arslan_finans_ciro_matrisi_${ciroYear}.xlsx`);
      showToast(`${ciroYear} ciro matrisi Excel olarak indirildi.`, 'success');
    } catch {
      showToast('Ciro dışa aktarılamadı.', 'error');
    }
  };

  // -------------------------------------------------------------
  // TAB 2: SATIŞ AKTAR (ÖZEL ŞABLON UYARLAMALI) STATE & HANDLERS
  // -------------------------------------------------------------
  const [salesFileName, setSalesFileName] = useState<string>('');
  const [salesParsedRows, setSalesParsedRows] = useState<ParsedSalesRow[]>([]);
  const [salesError, setSalesError] = useState<string>('');
  const [salesSearch, setSalesSearch] = useState<string>('');
  const [bulkTaksitValue, setBulkTaksitValue] = useState<number>(12);
  const salesFileInputRef = useRef<HTMLInputElement>(null);

  // Download exact "Satış Şablonu"
  const handleDownloadSalesTemplate = () => {
    try {
      // Use the direct pre-packaged template file if present
      const a = document.createElement('a');
      a.href = '/satis_sablon.xlsx';
      a.download = 'satış şablon.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Resmi Satış Şablonu (.xlsx) indiriliyor.', 'info');
    } catch {
      // Fallback generator
      const headers = [
        'Satış Tarihi',
        'Satış No',
        'Müşteri Adı',
        'Ürün Kısa Kodu',
        'Miktar',
        'Tutar',
        'Satır Tutarı',
        'Teslim Durumu',
        'Satış Özel Kodu',
        'Taksit Sayısı',
        'Satış Temsilcisi',
        'Ürün Grubu',
      ];
      const sample = [
        ['2026-10-18', 1766, 'AKIN YILMAZ', 'MODAŞ BAZA', 1, 7500, 7500, 'Tam Teslim', 'KREDİ KARTI', 1, 'İLKER Temsilci 1', 'FİENTO'],
        ['2026-10-18', 1768, 'NEVZAT EKMEKÇİ', 'USP 2000 GDG SU SEBİLİ', 1, 15000, 15000, 'Tam Teslim', 'SENETLİ SATIŞ', 12, 'İLKER Temsilci 1', 'UGUR SU ARITMA'],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1');
      XLSX.writeFile(wb, 'satış şablon.xlsx');
      showToast('Satış şablonu Excel olarak oluşturuldu.', 'success');
    }
  };

  /**
   * Parse uploaded Sales Excel file specifically tailored to "satış şablon.xlsx"
   */
  const handleSalesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSalesFileName(file.name);
    setSalesError('');

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          setSalesError('Excel dosyasında yeterli veri satırı bulunamadı.');
          return;
        }

        // Find header row: scan until we find row containing "Satış Tarihi" or "Ürün Kısa Kodu"
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(15, rawJson.length); i++) {
          const row = rawJson[i];
          if (!row || !Array.isArray(row)) continue;
          const rowStr = row.map(c => normalizeTr(c)).join(' ');
          if (
            (rowStr.includes('SATIS TARIHI') || rowStr.includes('TARIH')) &&
            (rowStr.includes('SATIS NO') || rowStr.includes('MUSTERI') || rowStr.includes('URUN KISA KODU') || rowStr.includes('URUN GRUBU'))
          ) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0; // fallback to top row
        }

        const headers = (rawJson[headerRowIdx] || []).map((h: any) => normalizeTr(h));
        const colMap: Record<string, number> = {};

        headers.forEach((h: string, idx: number) => {
          if (h === 'SATIS TARIHI' || (h.includes('TARIH') && colMap.tarih === undefined)) colMap.tarih = idx;
          if (h.includes('SATIS NO') || h.includes('BELGE NO') || h.includes('FATURA NO')) colMap.satisNo = idx;
          if (h.includes('MUSTERI') || h.includes('CARI')) colMap.musteri = idx;
          if (h.includes('KISA KOD') || h.includes('URUN ADI') || h.includes('URUN KODU')) colMap.urunKisaKodu = idx;
          if (h.includes('MIKTAR') || h.includes('ADET')) colMap.miktar = idx;
          if (h === 'TUTAR' || h.includes('BIRIM FIYAT')) colMap.tutar = idx;
          if (h.includes('SATIR TUTARI') || h.includes('TOPLAM TUTAR')) colMap.satirTutari = idx;
          if (h.includes('TESLIM')) colMap.teslimDurumu = idx;
          if (h.includes('OZEL KOD') || h.includes('SATIS TIPI') || h.includes('ODEME TIPI')) colMap.satisOzelKodu = idx;
          if (h.includes('TAKSIT')) colMap.taksitSayisi = idx;
          if (h.includes('TEMSILCI') || h.includes('PERSONEL')) colMap.satisTemsilcisi = idx;
          if (h.includes('URUN GRUBU') || h.includes('GRUP')) colMap.urunGrubu = idx;
        });

        // Fallback default column indexes if standard 12-column layout
        if (colMap.tarih === undefined) colMap.tarih = 0;
        if (colMap.satisNo === undefined) colMap.satisNo = 1;
        if (colMap.musteri === undefined) colMap.musteri = 2;
        if (colMap.urunKisaKodu === undefined) colMap.urunKisaKodu = 3;
        if (colMap.miktar === undefined) colMap.miktar = 4;
        if (colMap.tutar === undefined) colMap.tutar = 5;
        if (colMap.satirTutari === undefined) colMap.satirTutari = 6;
        if (colMap.teslimDurumu === undefined) colMap.teslimDurumu = 7;
        if (colMap.satisOzelKodu === undefined) colMap.satisOzelKodu = 8;
        if (colMap.taksitSayisi === undefined) colMap.taksitSayisi = 9;
        if (colMap.satisTemsilcisi === undefined) colMap.satisTemsilcisi = 10;
        if (colMap.urunGrubu === undefined) colMap.urunGrubu = 11;

        const parsedList: ParsedSalesRow[] = [];

        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          // Check if total summary row
          const rowText = row.map((c: any) => String(c || '')).join(' ');
          if (rowText.includes('GENEL TOPLAM') || rowText.includes('İPTAL TOPLAM') || rowText.includes('IPTAL TOPLAM')) {
            continue;
          }

          const rawDate = row[colMap.tarih];
          const rawSatisNo = String(row[colMap.satisNo] || '').trim();
          const rawCustomer = String(row[colMap.musteri] || '').trim();
          const rawKisaKod = String(row[colMap.urunKisaKodu] || '').trim();
          const rawMiktar = Number(row[colMap.miktar]) || 1;
          const rawTutar = Number(row[colMap.tutar]) || 0;
          const rawSatirTutari = Number(row[colMap.satirTutari]) || (rawMiktar * rawTutar);
          const rawTeslim = String(row[colMap.teslimDurumu] || 'Tam Teslim').trim();
          const rawOzelKod = String(row[colMap.satisOzelKodu] || 'PEŞİN SATIŞ').trim();
          const rawTaksit = Number(row[colMap.taksitSayisi]) || 1;
          const rawTemsilci = String(row[colMap.satisTemsilcisi] || 'Kasa Personeli').trim();
          const rawUrunGrubu = String(row[colMap.urunGrubu] || '').trim();

          // Skip completely empty lines
          if (!rawCustomer && rawSatirTutari <= 0 && !rawKisaKod) continue;

          const dateStr = parseExcelDate(rawDate);
          const totalAmount = rawSatirTutari > 0 ? rawSatirTutari : (rawMiktar * rawTutar);

          // 1. Determine Sale Type
          const normOzel = normalizeTr(rawOzelKod);
          let saleType: SaleType = 'Peşin';
          let isSenetli = false;
          if (normOzel.includes('SENET')) {
            saleType = 'Senetli Satış';
            isSenetli = true;
          } else if (normOzel.includes('KART') || normOzel.includes('KREDI') || normOzel.includes('POS')) {
            saleType = 'Kredi Kartı';
          } else {
            saleType = 'Peşin';
          }

          // 2. REQUIREMENT: Senetli Satışlarda Taksit Kontrolü
          // Eğer "Satış Özel Kodu" SENETLİ SATIŞ ise VE Taksit Sayısı 1 ise -> HATA!
          const hasTaksitError = isSenetli && rawTaksit <= 1;

          // 3. REQUIREMENT: Ürün Grubu ve Kategori Otomatik Eşleştirme
          // Excel'deki "Ürün Grubu" sütunundaki veriyi okuyarak, sistemde tanımlı Ana Kategori ve Alt Kategori ile eşleştir
          const normGroup = normalizeTr(rawUrunGrubu);
          let matchedHierarchy = INITIAL_CATEGORY_HIERARCHY.find((h: CategoryHierarchyItem) => normalizeTr(h.urunGrubu) === normGroup);

          if (!matchedHierarchy) {
            matchedHierarchy = INITIAL_CATEGORY_HIERARCHY.find((h: CategoryHierarchyItem) =>
              normGroup.includes(normalizeTr(h.urunGrubu)) ||
              normalizeTr(h.urunGrubu).includes(normGroup)
            );
          }

          if (!matchedHierarchy) {
            matchedHierarchy = INITIAL_CATEGORY_HIERARCHY.find((h: CategoryHierarchyItem) => normalizeTr(h.altKategori) === normGroup);
          }

          let anaKategori = 'BEYAZ EŞYA';
          let altKategori = rawUrunGrubu || 'DİĞER';
          let productGroup = rawUrunGrubu || 'DİĞER';
          let matchedCategory = false;

          if (matchedHierarchy) {
            anaKategori = matchedHierarchy.anaKategori;
            altKategori = matchedHierarchy.altKategori;
            productGroup = matchedHierarchy.urunGrubu;
            matchedCategory = true;
          } else {
            // Smart inference if not directly found
            if (
              normGroup.includes('MOBİLYA') ||
              normGroup.includes('YATAK') ||
              normGroup.includes('SEHPA') ||
              normGroup.includes('MASA') ||
              normGroup.includes('SANDALYE') ||
              normGroup.includes('KOLTUK') ||
              normGroup.includes('KANEPE') ||
              normGroup.includes('BAMBİ') ||
              normGroup.includes('BAMBI') ||
              normGroup.includes('MEDİSA')
            ) {
              anaKategori = 'MOBİLYA';
            } else {
              anaKategori = 'BEYAZ EŞYA';
            }
          }

          // 4. REQUIREMENT: Ürün Kısa Kodu Otomatik Eşleştirme
          // Excel'deki "Ürün Kısa Kodu" verisini okuyarak, sistemde tanımlı ürün kodu kayıtlarıyla otomatik eşleştir
          const normKisaKod = normalizeTr(rawKisaKod);
          let matchedStock = stockItems.find(stk => normalizeTr(stk.code || '') === normKisaKod);

          if (!matchedStock) {
            matchedStock = stockItems.find(stk => normalizeTr(stk.name) === normKisaKod);
          }

          if (!matchedStock) {
            matchedStock = stockItems.find(stk =>
              (stk.code && normKisaKod.includes(normalizeTr(stk.code))) ||
              normalizeTr(stk.name).includes(normKisaKod) ||
              normKisaKod.includes(normalizeTr(stk.name))
            );
          }

          // Token overlap check
          if (!matchedStock && normKisaKod.length > 2) {
            const tokens = normKisaKod.split(' ').filter(t => t.length >= 2);
            matchedStock = stockItems.find(stk => {
              const fullStk = (normalizeTr(stk.code || '') + ' ' + normalizeTr(stk.name)).split(' ');
              const matchCount = tokens.filter(t => fullStk.includes(t)).length;
              return matchCount >= 2;
            });
          }

          // Cost price resolution: from matched stock or inferred margin
          let costPrice = 0;
          if (matchedStock && matchedStock.purchasePrice > 0) {
            costPrice = matchedStock.purchasePrice;
          } else {
            // Estimated default margin (Mobilya ~40-50%, Beyaz Eşya ~20-25%)
            const estMargin = anaKategori === 'MOBİLYA' ? 0.45 : 0.25;
            costPrice = Math.round((totalAmount / rawMiktar) * (1 - estMargin));
          }

          const effectiveTaksit = hasTaksitError ? 1 : rawTaksit;
          const vadeRate = getVadeRateForMonth(dateStr);
          const vadeFarki = isSenetli && effectiveTaksit > 1 ? (totalAmount * (vadeRate / 100) * (effectiveTaksit / 12)) : 0;
          const effectiveCost = (costPrice * rawMiktar) + vadeFarki;
          const netProfit = Math.max(0, totalAmount - effectiveCost);
          const profitMargin = totalAmount > 0 ? (netProfit / totalAmount) * 100 : 0;

          parsedList.push({
            id: `row-${r}-${Date.now()}`,
            rowNumber: r + 1,
            date: dateStr,
            satisNo: rawSatisNo || String(1000 + r),
            customerName: rawCustomer || 'Perakende Müşteri',
            rawUrunKisaKodu: rawKisaKod,
            quantity: rawMiktar,
            unitPrice: rawTutar,
            totalSaleAmount: totalAmount,
            teslimDurumu: rawTeslim,
            rawSatisOzelKodu: rawOzelKod,
            saleType,
            taksitSayisi: rawTaksit,
            salesPerson: rawTemsilci,
            rawUrunGrubu: rawUrunGrubu,

            anaKategori,
            altKategori,
            productGroup,
            matchedCategory,

            matchedStockId: matchedStock?.id,
            matchedStockCode: matchedStock?.code,
            matchedStockName: matchedStock?.name,
            costPrice,
            effectiveCost,
            netProfit,
            profitMargin,

            isSenetli,
            hasTaksitError,
          });
        }

        if (parsedList.length === 0) {
          setSalesError('Geçerli satış satırı tespit edilemedi.');
          return;
        }

        setSalesParsedRows(parsedList);

        const errorCount = parsedList.filter(p => p.hasTaksitError).length;
        if (errorCount > 0) {
          showToast(
            `${parsedList.length} satış satırı okundu. ${errorCount} adet senetli satışın taksit sayısı eksik (1), lütfen taksit sayılarını giriniz.`,
            'info'
          );
        } else {
          showToast(`${parsedList.length} adet satış kaydı hazırlandı ve eşleştirildi.`, 'success');
        }
      } catch (err: any) {
        setSalesError(`Satış dosyası okuma hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  /**
   * Update an individual row's installment count
   */
  const handleUpdateRowTaksit = (rowId: string, newTaksit: number) => {
    if (!newTaksit || newTaksit <= 0) return;
    setSalesParsedRows(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        const vadeRate = getVadeRateForMonth(row.date);
        const vadeFarki = row.isSenetli && newTaksit > 1 ? (row.totalSaleAmount * (vadeRate / 100) * (newTaksit / 12)) : 0;
        const effectiveCost = (row.costPrice * row.quantity) + vadeFarki;
        const netProfit = Math.max(0, row.totalSaleAmount - effectiveCost);
        const profitMargin = row.totalSaleAmount > 0 ? (netProfit / row.totalSaleAmount) * 100 : 0;

        return {
          ...row,
          taksitSayisi: newTaksit,
          hasTaksitError: false,
          isTaksitEditing: false,
          effectiveCost,
          netProfit,
          profitMargin,
        };
      })
    );
    showToast('Taksit sayısı güncellendi.', 'success');
  };

  /**
   * Bulk set installment count for all rows with missing installment error
   */
  const handleApplyBulkTaksit = () => {
    if (!bulkTaksitValue || bulkTaksitValue <= 1) {
      showToast('Lütfen 1\'den büyük geçerli bir taksit sayısı giriniz (örn: 6, 12, 18, 24).', 'error');
      return;
    }
    setSalesParsedRows(prev =>
      prev.map(row => {
        if (!row.hasTaksitError) return row;
        const vadeRate = getVadeRateForMonth(row.date);
        const vadeFarki = row.isSenetli && bulkTaksitValue > 1 ? (row.totalSaleAmount * (vadeRate / 100) * (bulkTaksitValue / 12)) : 0;
        const effectiveCost = (row.costPrice * row.quantity) + vadeFarki;
        const netProfit = Math.max(0, row.totalSaleAmount - effectiveCost);
        const profitMargin = row.totalSaleAmount > 0 ? (netProfit / row.totalSaleAmount) * 100 : 0;

        return {
          ...row,
          taksitSayisi: bulkTaksitValue,
          hasTaksitError: false,
          effectiveCost,
          netProfit,
          profitMargin,
        };
      })
    );
    showToast(`Tüm eksik senetli satışlara ${bulkTaksitValue} taksit uygulandı.`, 'success');
  };

  /**
   * Delete parsed row from preview
   */
  const handleDeleteParsedRow = (rowId: string) => {
    setSalesParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  /**
   * Commit parsed sales rows to the database
   */
  const handleApplySalesImport = () => {
    const errorCount = salesParsedRows.filter(p => p.hasTaksitError).length;
    if (errorCount > 0) {
      showToast(
        `Aktarılamaz: ${errorCount} adet senetli satışın taksit sayısı eksik (1 girilmiş). Lütfen önce taksit sayılarını giriniz.`,
        'error'
      );
      return;
    }

    if (salesParsedRows.length === 0) return;

    let importedCount = 0;
    salesParsedRows.forEach(row => {
      // Find or create customer
      const matchedCari = caris.find(c => normalizeTr(c.name) === normalizeTr(row.customerName));
      const customerId = matchedCari ? matchedCari.id : undefined;

      addSaleRecord({
        date: row.date,
        documentNo: row.satisNo,
        customerId,
        customerName: row.customerName,
        productId: row.matchedStockId,
        productName: row.matchedStockName || row.rawUrunKisaKodu,
        category: row.anaKategori,
        subCategory: row.altKategori,
        productGroup: row.productGroup,
        brand: row.altKategori,
        quantity: row.quantity,
        costPrice: row.costPrice,
        totalCost: row.costPrice * row.quantity,
        saleType: row.saleType,
        installmentsCount: row.isSenetli ? row.taksitSayisi : undefined,
        vadeRateMonthly: row.isSenetli ? getVadeRateForMonth(row.date) : undefined,
        vadeFarkiAmount: row.effectiveCost - (row.costPrice * row.quantity),
        effectiveCost: row.effectiveCost,
        salePrice: row.unitPrice || (row.totalSaleAmount / row.quantity),
        totalSaleAmount: row.totalSaleAmount,
        netProfit: row.netProfit,
        profitMargin: row.profitMargin,
        salesPerson: row.salesPerson,
        accountId: accounts[0]?.id,
        notes: `Excel Şablonundan İçe Aktarıldı (Belge: ${row.satisNo}, Teslim: ${row.teslimDurumu})`,
      });
      importedCount++;
    });

    showToast(`${importedCount} adet satış işlemi başarıyla Kâr Takip ve ERP sistemine aktarıldı.`, 'success');
    setSalesParsedRows([]);
    setSalesFileName('');
  };

  const handleExportSalesExcel = () => {
    try {
      if (sales.length === 0) {
        showToast('Dışa aktarılacak satış kaydı bulunmuyor.', 'info');
        return;
      }
      const headers = [
        'Satış Tarihi',
        'Satış No',
        'Müşteri Adı',
        'Ürün Adı / Kısa Kodu',
        'Ana Kategori',
        'Alt Kategori',
        'Ürün Grubu',
        'Satış Tipi',
        'Taksit Sayısı',
        'Miktar',
        'Birim Fiyat (₺)',
        'Satış Cirosu (₺)',
        'Maliyet (₺)',
        'Net Kâr (₺)',
        'Kâr Marjı (%)',
        'Satış Temsilcisi',
        'Notlar',
      ];
      const dataRows = sales.map(s => [
        s.date,
        s.documentNo || s.id,
        s.customerName,
        s.productName,
        s.category,
        s.subCategory || '-',
        s.productGroup || '-',
        s.saleType,
        s.installmentsCount || 1,
        s.quantity,
        s.salePrice,
        s.totalSaleAmount,
        s.effectiveCost,
        s.netProfit,
        s.profitMargin?.toFixed(1),
        s.salesPerson,
        s.notes || '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Satislar');
      XLSX.writeFile(wb, `arslan_finans_satislar_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast(`${sales.length} adet satış kaydı Excel olarak indirildi.`, 'success');
    } catch {
      showToast('Satışlar dışa aktarılamadı.', 'error');
    }
  };

  // -------------------------------------------------------------
  // TAB 3: ÖDEME & KASA HAREKETLERİ AKTAR STATE & HANDLERS
  // -------------------------------------------------------------
  const [paymentsFileName, setPaymentsFileName] = useState<string>('');
  const [paymentsParsedRows, setPaymentsParsedRows] = useState<Partial<Transaction>[]>([]);
  const [paymentsError, setPaymentsError] = useState<string>('');
  const paymentsFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadPaymentsTemplate = () => {
    try {
      const headers = [
        'Tarih (YYYY-MM-DD)',
        'Hesap Adı (Kasa / Banka)',
        'İşlem Türü (Gelir / Gider)',
        'Kategori',
        'Tutar (₺)',
        'Cari / Muhatap',
        'Açıklama',
      ];
      const sample = [
        ['2026-10-15', 'Nakit Merkez Kasa', 'Gelir', 'Müşteri Tahsilat', 15000, 'Ahmet Yılmaz', 'Senet taksit tahsilatı'],
        ['2026-10-16', 'İş Bankası Ticari', 'Gider', 'Tedarikçi Ödeme', 25000, 'Bosch Ev Aletleri', 'Fatura ödemesi'],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Odeme_Kasa_Sablon');
      XLSX.writeFile(wb, 'arslan_kasa_odeme_sablonu.xlsx');
      showToast('Kasa & ödeme hareketleri şablonu indirildi.', 'info');
    } catch {
      showToast('Şablon indirilemedi.', 'error');
    }
  };

  const handlePaymentsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPaymentsFileName(file.name);
    setPaymentsError('');

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          setPaymentsError('Excel dosyasında yeterli veri satırı bulunamadı.');
          return;
        }

        const parsed: Partial<Transaction>[] = [];
        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const dateStr = parseExcelDate(row[0]);
          const accName = String(row[1] || '').trim();
          const typeStr = String(row[2] || 'Gelir').trim().toLowerCase().includes('gider') ? 'Gider' : 'Gelir';
          const cat = String(row[3] || 'Genel').trim();
          const amount = parseExcelAmount(row[4]);
          const cariName = String(row[5] || '').trim();
          const desc = String(row[6] || '').trim();

          if (amount <= 0) continue;

          const matchedAcc = accounts.find(a => normalizeTr(a.name) === normalizeTr(accName));
          const accId = matchedAcc ? matchedAcc.id : accounts[0]?.id || 'acc-1';

          parsed.push({
            date: dateStr,
            accountId: accId,
            type: typeStr as any,
            category: cat,
            amount,
            desc: desc || `${cat} hareketi`,
            cariName: cariName || undefined,
            status: 'Tamamlandı',
          });
        }

        if (parsed.length === 0) {
          setPaymentsError('Geçerli kasa/ödeme satırı tespit edilemedi.');
          return;
        }

        setPaymentsParsedRows(parsed);
        showToast(`${parsed.length} adet kasa/ödeme hareketi hazırlandı.`, 'success');
      } catch (err: any) {
        setPaymentsError(`Kasa dosyası okuma hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleApplyPaymentsImport = () => {
    if (paymentsParsedRows.length === 0) return;
    let count = 0;
    paymentsParsedRows.forEach(p => {
      addTransaction(p as any);
      count++;
    });
    showToast(`${count} adet kasa & ödeme hareketi sisteme aktarıldı.`, 'success');
    setPaymentsParsedRows([]);
    setPaymentsFileName('');
  };

  const handleExportPaymentsExcel = () => {
    try {
      if (transactions.length === 0) {
        showToast('Dışa aktarılacak işlem bulunmuyor.', 'info');
        return;
      }
      const headers = ['ID', 'Tarih', 'Hesap', 'Tür', 'Kategori', 'Tutar (₺)', 'Cari', 'Durum', 'Açıklama'];
      const dataRows = transactions.map(t => {
        const acc = accounts.find(a => a.id === t.accountId);
        return [
          t.id,
          t.date,
          acc?.name || t.accountId,
          t.type,
          t.category,
          t.amount,
          t.cariName || '-',
          t.status,
          t.desc,
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kasa_Odemeler');
      XLSX.writeFile(wb, `arslan_finans_kasa_odemeler_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast(`${transactions.length} adet işlem Excel olarak indirildi.`, 'success');
    } catch {
      showToast('Kasa işlemleri dışa aktarılamadı.', 'error');
    }
  };

  // Filtered sales rows
  const filteredSalesRows = useMemo(() => {
    if (!salesSearch.trim()) return salesParsedRows;
    const q = normalizeTr(salesSearch);
    return salesParsedRows.filter(
      r =>
        normalizeTr(r.customerName).includes(q) ||
        normalizeTr(r.rawUrunKisaKodu).includes(q) ||
        normalizeTr(r.rawUrunGrubu).includes(q) ||
        normalizeTr(r.satisNo).includes(q) ||
        normalizeTr(r.salesPerson).includes(q)
    );
  }, [salesParsedRows, salesSearch]);

  const salesTaksitErrorCount = useMemo(() => {
    return salesParsedRows.filter(r => r.hasTaksitError).length;
  }, [salesParsedRows]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md">
            <ArrowLeftRight className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Veri Aktar (İçe & Dışa Aktarım Merkezi)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                Excel & Şablon Entegrasyonu
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tüm içe aktar (import) ve dışa aktar (export) işlemleri tek bir merkezde toplanmıştır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCiroWizardOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Veri Ciro Sihirbazı</span>
          </button>
        </div>
      </div>

      {/* Main Sub-Navigation Bar: 3 Tabs (Ciro Aktar, Satış Aktar, Ödeme Aktar) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('ciro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'ciro'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Ciro Aktar</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {ciroMatrixData.length} Yıl
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'sales'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-sky-500" />
          <span>Satış Aktar</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {sales.length} Kayıt
          </span>
          {salesTaksitErrorCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
              {salesTaksitErrorCount} Eksik Taksit
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-purple-500" />
          <span>Ödeme Aktar</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {transactions.length} Hareket
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: CİRO AKTAR */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'ciro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ciro İçe Aktarma Kartı */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Upload className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Ciro Matrisi İçe Aktar
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Excel dosyasından 12 aylık ciro verilerini okuyup matrise aktarın.
                    </p>
                  </div>
                </div>

                <select
                  value={ciroYear}
                  onChange={e => setCiroYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => ciroFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <input
                  type="file"
                  ref={ciroFileInputRef}
                  onChange={handleCiroFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 mx-auto mb-2 transition" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {ciroFileName || 'Ciro Excel Dosyasını Seçin (.xlsx, .xls, .csv)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format: GRUP, Kategori/Marka, Ort. Kârlılık, 12 Ay
                </span>
              </div>

              {ciroError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ciroError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCiroTemplate}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Örnek Ciro Şablonu (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyCiroImport}
                  disabled={ciroParsedRows.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{ciroParsedRows.length > 0 ? `${ciroParsedRows.length} Markayı Matrise Aktar` : 'Aktarımı Uygula'}</span>
                </button>
              </div>
            </div>

            {/* Ciro Dışa Aktarma Kartı */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <DownloadCloud className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Ciro Matrisini Dışa Aktar (Excel)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sistemde kayıtlı yıllık ciro matrisinizi tam formatlı Excel tablosu olarak indirin.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Mevcut Ciro Yılları:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {ciroMatrixData.map(y => y.year).join(', ') || 'Yok'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>{ciroYear} Yılı Marka Sayısı:</span>
                    <span className="font-bold font-mono">
                      {ciroMatrixData.find(y => y.year === ciroYear)?.rows.length || 0} Marka
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportCiroExcel}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{ciroYear} Ciro Matrisini İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Ciro Rows Preview */}
          {ciroParsedRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  İçe Aktarılacak Ciro Önizlemesi ({ciroParsedRows.length} Marka)
                </h4>
                <button
                  onClick={() => setCiroParsedRows([])}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Temizle
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Grup</th>
                      <th className="py-2 px-3">Marka</th>
                      <th className="py-2 px-2 text-center">Kâr %</th>
                      <th className="py-2 px-3 text-right">Yıllık Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {ciroParsedRows.map(row => {
                      const total = Object.values(row.months).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={row.id}>
                          <td className="py-1.5 px-3 font-sans font-semibold text-slate-700 dark:text-slate-300">
                            {row.group}
                          </td>
                          <td className="py-1.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                            {row.name}
                          </td>
                          <td className="py-1.5 px-2 text-center text-amber-600 font-bold">
                            %{row.profitMargin}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: SATIŞ AKTAR (UYARLANMIŞ RESMİ ŞABLON DESTEĞİ) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Satış İçe Aktarma Kartı */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    Satış Aktar (İçe Aktarma)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800">
                      Resmi Şablon Uyumlu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    "satış şablon.xlsx" formatındaki satış raporunuzu seçerek otomatik kategori ve ürün eşleştirmesiyle aktarın.
                  </p>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => salesFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <input
                  type="file"
                  ref={salesFileInputRef}
                  onChange={handleSalesFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-sky-500 mx-auto mb-2 transition" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {salesFileName || 'Satış Excel Dosyasını Seçin (satış şablon.xlsx)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Desteklenen Sütunlar: Satış Tarihi, Satış No, Müşteri Adı, Ürün Kısa Kodu, Miktar, Tutar, Satış Özel Kodu, Taksit Sayısı, Ürün Grubu
                </span>
              </div>

              {salesError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{salesError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSalesTemplate}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Resmi Satış Şablonu (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplySalesImport}
                  disabled={salesParsedRows.length === 0 || salesTaksitErrorCount > 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer ${
                    salesTaksitErrorCount > 0
                      ? 'bg-amber-600 text-white hover:bg-amber-500'
                      : 'bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white'
                  }`}
                  title={salesTaksitErrorCount > 0 ? `${salesTaksitErrorCount} adet senetli satışın taksit sayısı eksik!` : ''}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {salesParsedRows.length === 0
                      ? 'Aktarımı Başlat'
                      : salesTaksitErrorCount > 0
                      ? `⚠️ ${salesTaksitErrorCount} Eksik Taksit Var (Düzeltiniz)`
                      : `${salesParsedRows.length} Satışı Sisteme Aktar`}
                  </span>
                </button>
              </div>
            </div>

            {/* Satış Dışa Aktarma Kartı */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <DownloadCloud className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Satış Veritabanını Dışa Aktar (Excel)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sistemdeki tüm satışları, kâr marjlarını, maliyetleri ve personel hareketlerini Excel olarak indirin.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Kayıtlı Toplam Satış:</span>
                    <span className="font-bold font-mono text-sky-600 dark:text-sky-400">
                      {sales.length} Fiş / İşlem
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Toplam Satış Hacmi:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sales.reduce((sum, s) => sum + s.totalSaleAmount, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Toplam Net Kâr:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sales.reduce((sum, s) => sum + s.netProfit, 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportSalesExcel}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tüm Satışları İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Sales Preview & Installment Control Section */}
          {salesParsedRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-sky-500/40 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-sky-500" />
                    Satış Önizleme & Otomatik Eşleştirme Sonuçları ({salesParsedRows.length} Satır)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Excel'deki Ürün Grubu ve Ürün Kısa Kodu sistem kayıtlarıyla otomatik eşleştirilmiştir.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Müşteri, ürün veya kod ara..."
                      value={salesSearch}
                      onChange={e => setSalesSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500 w-52"
                    />
                  </div>
                  <button
                    onClick={() => setSalesParsedRows([])}
                    className="text-xs text-slate-400 hover:text-rose-500 px-2 py-1 transition cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              {/* CRITICAL WARNING BANNER: Senetli Satışlarda Taksit Kontrolü */}
              {salesTaksitErrorCount > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-200">
                        Senetli Satışlarda Taksit Kontrolü Uyarısı ({salesTaksitErrorCount} Satır Eksik!)
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Satış Özel Kodu <strong>SENETLİ SATIŞ</strong> olan ve Taksit Sayısı <strong>1</strong> girilmiş kayıtlar doğrudan aktarılamaz.
                        Lütfen ilgili satırlardaki <strong>"Taksit sayısı eksik, taksit sayısını gir"</strong> butonuna tıklayarak doğru taksit sayısını belirleyiniz.
                      </div>
                    </div>
                  </div>

                  {/* Bulk Fix Helper */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-200 dark:border-amber-800/80 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Tümüne Uygula:
                    </span>
                    <select
                      value={bulkTaksitValue}
                      onChange={e => setBulkTaksitValue(Number(e.target.value))}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value={6}>6 Taksit</option>
                      <option value={10}>10 Taksit</option>
                      <option value={12}>12 Taksit</option>
                      <option value={18}>18 Taksit</option>
                      <option value={24}>24 Taksit</option>
                      <option value={36}>36 Taksit</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBulkTaksit}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      Tüm Eksiklere Ata
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Parsed Rows */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[500px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="py-2.5 px-3">Tarih / No</th>
                      <th className="py-2.5 px-3">Müşteri</th>
                      <th className="py-2.5 px-3">Ürün Kısa Kodu (Excel) & Sistem Eşleşmesi</th>
                      <th className="py-2.5 px-3">Ürün Grubu & Kategori Eşleşmesi</th>
                      <th className="py-2.5 px-2 text-center">Özel Kod / Satış Tipi</th>
                      <th className="py-2.5 px-3 text-center min-w-[200px]">Taksit Sayısı & Kontrol</th>
                      <th className="py-2.5 px-3 text-right">Tutar</th>
                      <th className="py-2.5 px-2 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSalesRows.map(row => (
                      <tr
                        key={row.id}
                        className={`transition ${
                          row.hasTaksitError
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 border-l-4 border-l-amber-500'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Tarih & Satış No */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {row.date}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Fiş: #{row.satisNo}
                          </span>
                        </td>

                        {/* Müşteri */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {row.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Temsilci: {row.salesPerson}
                          </span>
                        </td>

                        {/* Ürün Kısa Kodu & Eşleşen Ürün */}
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <span className="font-semibold text-slate-900 dark:text-white block truncate" title={row.rawUrunKisaKodu}>
                            {row.rawUrunKisaKodu}
                          </span>
                          {row.matchedStockCode ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono mt-0.5">
                              <Check className="w-3 h-3 text-emerald-500" />
                              Kod: {row.matchedStockCode} (Maliyet: {formatCurrency(row.costPrice)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono mt-0.5">
                              Tahmini Maliyet: {formatCurrency(row.costPrice)}
                            </span>
                          )}
                        </td>

                        {/* Ürün Grubu & Kategori Eşleştirmesi */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                              {row.rawUrunGrubu || '-'}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300 font-medium">
                              <span className="px-1.5 py-0.2 bg-sky-50 dark:bg-sky-950/80 rounded border border-sky-200 dark:border-sky-800">
                                {row.anaKategori}
                              </span>
                              <span>&gt;</span>
                              <span className="px-1.5 py-0.2 bg-sky-50 dark:bg-sky-950/80 rounded border border-sky-200 dark:border-sky-800">
                                {row.altKategori}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Satış Özel Kodu / Türü */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.isSenetli
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : row.saleType === 'Kredi Kartı'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            }`}
                          >
                            {row.rawSatisOzelKodu || row.saleType}
                          </span>
                        </td>

                        {/* Taksit Sayısı & Kontrol (SENETLİ SATIŞ KONTROLÜ) */}
                        <td className="py-2.5 px-3">
                          {row.hasTaksitError ? (
                            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-amber-100/80 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700">
                              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Taksit sayısı eksik (1)</span>
                              </div>

                              {/* Button / Input directly on the row as explicitly requested */}
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {[6, 12, 18, 24].map(num => (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleUpdateRowTaksit(row.id, num)}
                                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold transition cursor-pointer active:scale-95"
                                  >
                                    {num} Ay
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-1 mt-0.5">
                                <input
                                  type="number"
                                  min={2}
                                  max={60}
                                  placeholder="Örn: 12"
                                  id={`input-taksit-${row.id}`}
                                  defaultValue={12}
                                  className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-bold text-slate-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const el = document.getElementById(`input-taksit-${row.id}`) as HTMLInputElement;
                                    const val = Number(el?.value);
                                    if (val && val > 1) {
                                      handleUpdateRowTaksit(row.id, val);
                                    } else {
                                      showToast('Lütfen 1\'den büyük geçerli bir taksit sayısı giriniz.', 'error');
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Taksiti Kaydet</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {row.taksitSayisi} Taksit
                              </span>
                              {row.isSenetli && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded font-semibold border border-emerald-300 dark:border-emerald-800">
                                  ✓ Doğrulandı
                                </span>
                              )}
                              {/* Edit Taksit Button */}
                              {row.isSenetli && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextVal = row.taksitSayisi === 12 ? 24 : 12;
                                    handleUpdateRowTaksit(row.id, nextVal);
                                  }}
                                  className="text-slate-400 hover:text-sky-500 p-0.5"
                                  title="Taksit Sayısını Değiştir"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Tutar & Satır Tutarı */}
                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {formatCurrency(row.totalSaleAmount)}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                            Kâr: {formatCurrency(row.netProfit)} (%{row.profitMargin.toFixed(0)})
                          </span>
                        </td>

                        {/* Satır Sil */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteParsedRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Bu satırı listeden kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Toplam Satır: <strong>{salesParsedRows.length}</strong></span>
                  <span>Toplam Ciro: <strong className="text-emerald-600 font-mono">{formatCurrency(salesParsedRows.reduce((s, r) => s + r.totalSaleAmount, 0))}</strong></span>
                  <span>Eksik Taksitli Senet: <strong className={salesTaksitErrorCount > 0 ? 'text-rose-600' : 'text-emerald-600'}>{salesTaksitErrorCount}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handleApplySalesImport}
                  disabled={salesTaksitErrorCount > 0}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md cursor-pointer ${
                    salesTaksitErrorCount > 0
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {salesTaksitErrorCount > 0
                      ? `${salesTaksitErrorCount} Eksik Taksiti Tamamlayın`
                      : `Tüm Kontroller Başarılı (${salesParsedRows.length} Satışı İçe Aktar)`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: ÖDEME AKTAR */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kasa / Ödeme İçe Aktarma */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Ödeme & Kasa Hareketlerini İçe Aktar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Banka dekontları, kasa tahsilat veya tediye listelerini Excel ile yükleyin.
                  </p>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => paymentsFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <input
                  type="file"
                  ref={paymentsFileInputRef}
                  onChange={handlePaymentsFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-purple-500 mx-auto mb-2 transition" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {paymentsFileName || 'Kasa/Ödeme Excel Dosyasını Seçin (.xlsx, .xls, .csv)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Sütunlar: Tarih, Hesap, Tür (Gelir/Gider), Kategori, Tutar, Cari, Açıklama
                </span>
              </div>

              {paymentsError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentsError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPaymentsTemplate}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Örnek Ödeme Şablonu (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyPaymentsImport}
                  disabled={paymentsParsedRows.length === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{paymentsParsedRows.length > 0 ? `${paymentsParsedRows.length} Hareketi Yükle` : 'Aktarımı Başlat'}</span>
                </button>
              </div>
            </div>

            {/* Kasa / Ödeme Dışa Aktarma */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <DownloadCloud className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Kasa & Banka Hareketlerini Dışa Aktar
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tüm kasa gelir/gider hareketlerini, cari tahsilat ve tediye geçmişini indirin.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Toplam Kasa Hareketi:</span>
                    <span className="font-bold font-mono text-purple-600 dark:text-purple-400">
                      {transactions.length} İşlem
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Tanımlı Hesap Sayısı:</span>
                    <span className="font-bold font-mono">
                      {accounts.length} Kasa / Banka
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={exportDataToExcel}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="İşlemler, Hesaplar, Cariler ve Vadeleri içeren tam finansal veritabanı yedeği"
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Tam Finans Yedeği (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPaymentsExcel}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Kasa & Ödemeleri İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Payments Parsed Preview */}
          {paymentsParsedRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Yüklenecek Kasa Hareketleri ({paymentsParsedRows.length} Adet)
                </h4>
                <button
                  onClick={() => setPaymentsParsedRows([])}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Temizle
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Tarih</th>
                      <th className="py-2 px-2">Tür</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-3">Cari</th>
                      <th className="py-2 px-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {paymentsParsedRows.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3">{p.date}</td>
                        <td className={`py-1.5 px-2 font-sans font-bold ${p.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {p.type}
                        </td>
                        <td className="py-1.5 px-3 font-sans text-slate-600 dark:text-slate-300">{p.category}</td>
                        <td className="py-1.5 px-3 font-sans text-slate-800 dark:text-slate-200">{p.cariName || '-'}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(p.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
