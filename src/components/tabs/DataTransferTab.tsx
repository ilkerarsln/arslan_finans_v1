import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CiroMatrixRow, SaleRecord, Transaction } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

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
    setIsCiroWizardOpen,
    showToast,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'ciro' | 'sales' | 'payments'>('ciro');

  // -------------------------------------------------------------
  // TAB 1: CIRO AKTAR STATE & HANDLERS
  // -------------------------------------------------------------
  const [ciroYear, setCiroYear] = useState<number>(2025);
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
  // TAB 2: SATIŞ AKTAR STATE & HANDLERS
  // -------------------------------------------------------------
  const [salesFileName, setSalesFileName] = useState<string>('');
  const [salesParsedRows, setSalesParsedRows] = useState<Partial<SaleRecord>[]>([]);
  const [salesError, setSalesError] = useState<string>('');
  const [salesSearch, setSalesSearch] = useState<string>('');
  const salesFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSalesTemplate = () => {
    try {
      const headers = [
        'Tarih (YYYY-MM-DD)',
        'Müşteri / Cari Adı',
        'Ana Kategori',
        'Alt Kategori',
        'Ürün Grubu',
        'Marka',
        'Satış Tipi (Senetli / Peşin / Kredi Kartı)',
        'Satış Cirosu (₺)',
        'Birim Maliyet (₺)',
        'Net Kâr (₺)',
        'Satış Personeli',
        'Açıklama / Not',
      ];
      const sample = [
        ['2026-10-15', 'Ahmet Yılmaz', 'BEYAZ EŞYA', 'ALTUS', 'ALTUS ÇAMAŞIR MAKİNESİ', 'ALTUS', 'Senetli', 28500, 22000, 6500, 'Kasa Personeli', '12 ay elden senet'],
        ['2026-10-16', 'Zeynep Kaya', 'MOBİLYA', 'BAMBİ', 'BAMBİ YATAK & BAZA', 'BAMBİ', 'Peşin', 42000, 24000, 18000, 'İlker Arslan', 'Nakit elden tahsil edildi'],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Satis_Sablon');
      XLSX.writeFile(wb, 'arslan_satis_sablonu.xlsx');
      showToast('Satış içe aktarım şablonu indirildi.', 'info');
    } catch {
      showToast('Satış şablonu indirilemedi.', 'error');
    }
  };

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
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawJson.length < 2) {
          setSalesError('Excel dosyasında yeterli veri satırı bulunamadı.');
          return;
        }

        const parsed: Partial<SaleRecord>[] = [];
        for (let r = 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const dateStr = String(row[0] || '').trim() || new Date().toISOString().split('T')[0];
          const customer = String(row[1] || 'Perakende Müşteri').trim();
          const category = String(row[2] || 'BEYAZ EŞYA').trim();
          const subCategory = String(row[3] || '').trim();
          const productGroup = String(row[4] || '').trim();
          const brand = String(row[5] || '').trim();
          const saleType = (String(row[6] || 'Peşin').trim()) as any;
          const totalSaleAmount = Number(row[7]) || 0;
          const cost = Number(row[8]) || 0;
          const netProfit = Number(row[9]) || Math.max(0, totalSaleAmount - cost);
          const salesPerson = String(row[10] || 'Kasa Personeli').trim();
          const notes = String(row[11] || '').trim();

          if (totalSaleAmount <= 0) continue;

          parsed.push({
            date: dateStr,
            customerName: customer,
            category,
            subCategory,
            productGroup,
            brand,
            saleType,
            quantity: 1,
            costPrice: cost,
            totalCost: cost,
            effectiveCost: cost,
            salePrice: totalSaleAmount,
            totalSaleAmount,
            netProfit,
            profitMargin: totalSaleAmount > 0 ? (netProfit / totalSaleAmount) * 100 : 0,
            salesPerson,
            notes,
          });
        }

        if (parsed.length === 0) {
          setSalesError('Geçerli satış satırı tespit edilemedi.');
          return;
        }

        setSalesParsedRows(parsed);
        showToast(`${parsed.length} adet satış kaydı hazırlandı.`, 'success');
      } catch (err: any) {
        setSalesError(`Satış dosyası okuma hatası: ${err.message || 'Bilinmeyen hata'}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleApplySalesImport = () => {
    if (salesParsedRows.length === 0) return;
    let count = 0;
    salesParsedRows.forEach(s => {
      addSaleRecord(s as any);
      count++;
    });
    showToast(`${count} adet satış işlemi sisteme aktarıldı.`, 'success');
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
        'ID',
        'Tarih',
        'Müşteri / Cari',
        'Ana Kategori',
        'Alt Kategori',
        'Ürün Grubu',
        'Marka',
        'Satış Tipi',
        'Satış Cirosu (₺)',
        'Maliyet (₺)',
        'Net Kâr (₺)',
        'Kâr Marjı (%)',
        'Satış Personeli',
        'Notlar',
      ];
      const dataRows = sales.map(s => [
        s.id,
        s.date,
        s.customerName,
        s.category,
        s.subCategory || '-',
        s.productGroup || '-',
        s.brand || '-',
        s.saleType,
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

          const dateStr = String(row[0] || '').trim() || new Date().toISOString().split('T')[0];
          const accName = String(row[1] || '').trim();
          const typeStr = String(row[2] || 'Gelir').trim().toLowerCase().includes('gider') ? 'Gider' : 'Gelir';
          const cat = String(row[3] || 'Genel').trim();
          const amount = Number(row[4]) || 0;
          const cariName = String(row[5] || '').trim();
          const desc = String(row[6] || '').trim();

          if (amount <= 0) continue;

          // Match account id or fallback to first account
          const matchedAcc = accounts.find(a => a.name.toLowerCase() === accName.toLowerCase());
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
              Veri Aktarım & Entegrasyon Merkezi
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                Excel & JSON
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tüm içe aktar (import) ve dışa aktar (export) işlemleri tek bir merkezde toplanmıştır.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCiroWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Veri Ciro Sihirbazını Aç</span>
        </button>
      </div>

      {/* Main Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('ciro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'ciro'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'sales'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-sky-500" />
          <span>Satış Aktar</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {sales.length} Kayıt
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSubTab === 'payments'
              ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
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
                      Excel dosyasından 12 aylık ciro verilerini okuyup matrise yükleyin.
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
                  {ciroFileName || 'Excel Dosyasını Seçin veya Buraya Sürükleyin'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Desteklenen formatlar: .xlsx, .xls, .csv
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
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Örnek Şablon (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyCiroImport}
                  disabled={ciroParsedRows.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{ciroParsedRows.length > 0 ? `${ciroParsedRows.length} Satırı Matrise Aktar` : 'Aktarımı Uygula'}</span>
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
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{ciroYear} Ciro Matrisini İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Ciro Rows Preview (if loaded) */}
          {ciroParsedRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  İçe Aktarılacak Ciro Önizlemesi ({ciroParsedRows.length} Marka)
                </h4>
                <button
                  onClick={() => setCiroParsedRows([])}
                  className="text-xs text-slate-400 hover:text-slate-600"
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
      {/* SECTION 2: SATIŞ AKTAR */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Satış İçe Aktarma */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Satış Kayıtlarını İçe Aktar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Geçmiş veya harici satış kayıtlarını Excel üzerinden topluca aktarın.
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
                  {salesFileName || 'Satış Excel Dosyasını Seçin (.xlsx, .csv)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format: Tarih, Müşteri, Kategori, Tutar, Maliyet, Personel
                </span>
              </div>

              {salesError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{salesError}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSalesTemplate}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Örnek Satış Şablonu</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplySalesImport}
                  disabled={salesParsedRows.length === 0}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{salesParsedRows.length > 0 ? `${salesParsedRows.length} Satışı Yükle` : 'Aktarımı Başlat'}</span>
                </button>
              </div>
            </div>

            {/* Satış Dışa Aktarma */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <DownloadCloud className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Satış Veritabanını Dışa Aktar
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sistemdeki tüm satışları, kâr marjlarını ve personel hareketlerini Excel olarak yedekleyin.
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
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportSalesExcel}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Tüm Satışları İndir (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sales Parsed Preview */}
          {salesParsedRows.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Yüklenecek Satışlar ({salesParsedRows.length} Adet)
                </h4>
                <button
                  onClick={() => setSalesParsedRows([])}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Temizle
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Tarih</th>
                      <th className="py-2 px-3">Müşteri</th>
                      <th className="py-2 px-3">Kategori</th>
                      <th className="py-2 px-2">Tip</th>
                      <th className="py-2 px-3 text-right">Tutar</th>
                      <th className="py-2 px-3 text-right">Kâr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {salesParsedRows.map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3">{s.date}</td>
                        <td className="py-1.5 px-3 font-sans font-bold">{s.customerName}</td>
                        <td className="py-1.5 px-3 font-sans text-slate-600">{s.category}</td>
                        <td className="py-1.5 px-2 font-sans">{s.saleType}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-600">
                          {formatCurrency(s.totalSaleAmount || 0)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-sky-600">
                          {formatCurrency(s.netProfit || 0)}
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
                    Banka dekontları veya kasa tahsilat/tediye listelerini Excel ile yükleyin.
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
                  {paymentsFileName || 'Kasa/Ödeme Excel Dosyasını Seçin (.xlsx, .csv)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format: Tarih, Hesap, Tür (Gelir/Gider), Tutar, Cari, Açıklama
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
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Örnek Kasa Şablonu</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyPaymentsImport}
                  disabled={paymentsParsedRows.length === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
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

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportPaymentsExcel}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
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
                  className="text-xs text-slate-400 hover:text-slate-600"
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
                        <td className="py-1.5 px-3 font-sans text-slate-600">{p.category}</td>
                        <td className="py-1.5 px-3 font-sans">{p.cariName || '-'}</td>
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
