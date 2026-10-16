import React, { useState, useRef, useMemo } from 'react';
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
  RefreshCw,
  Building2,
  Calendar,
  Percent,
  TrendingUp,
  CreditCard,
  Check,
  X,
  FileCheck,
  Tag,
  DollarSign,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, roundUpTo10TL } from '../../utils/formatters';
import {
  LeanImportPreviewItem,
  LeanMalAlimiConfig,
  ImportVadeOption,
  PriceListEntry,
} from '../../types/finance';

export const DataImporter: React.FC<{
  onClose?: () => void;
  defaultTemplate?: 'stok' | 'fiyatListesi' | 'cari';
  onImportComplete?: (count: number) => void;
}> = ({ onClose, onImportComplete }) => {
  const {
    priceLists,
    caris,
    accounts,
    stockItems,
    executeBatchLeanMalAlimi,
    showToast,
  } = useFinance();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Wizard Steps: 1: Parameters & File Upload, 2: Preview & Approval, 3: Success Result
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // 1. Parametreler
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>(() => {
    return priceLists[0]?.id || '';
  });
  const [donemMonthKey, setDonemMonthKey] = useState<string>(currentMonthKey);
  const [genelIskontoOrani, setGenelIskontoOrani] = useState<number>(10);
  const [karMarjiOrani, setKarMarjiOrani] = useState<number>(35); // Varsayılan kâr marjı %35 (kullanıcı değiştirebilir)
  const [vadeOption, setVadeOption] = useState<ImportVadeOption>('30gun');
  const [customDueDate, setCustomDueDate] = useState<string>(defaultDueDate);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc-banka');
  const [documentNo, setDocumentNo] = useState<string>(() => `İRS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState<string>('');

  // File Upload State
  const [fileName, setFileName] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Items Table
  const [previewItems, setPreviewItems] = useState<LeanImportPreviewItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'warning'>('all');

  // Sonuç State
  const [resultSummary, setResultSummary] = useState<{
    totalCount: number;
    totalCost: number;
    totalQty: number;
  } | null>(null);

  // Seçili Fiyat Listesi ve Tedarikçi
  const selectedPriceList: PriceListEntry | undefined = useMemo(() => {
    return priceLists.find(p => p.id === selectedPriceListId);
  }, [priceLists, selectedPriceListId]);

  const selectedSupplier = useMemo(() => {
    if (selectedPriceList?.supplierId) {
      return caris.find(c => c.id === selectedPriceList.supplierId);
    }
    return undefined;
  }, [selectedPriceList, caris]);

  // Şablon İndirme (Yalnızca 2 Kolon: stokKodu, alisAdeti)
  const handleDownloadSampleTemplate = (format: 'xlsx' | 'csv') => {
    try {
      const sampleRows = [
        { stokKodu: 'BOSCH-KGN56', alisAdeti: 4 },
        { stokKodu: 'BOSCH-WAU28', alisAdeti: 6 },
        { stokKodu: 'BAMBI-MAGNA', alisAdeti: 8 },
        { stokKodu: 'BSH-SMS46', alisAdeti: 3 },
        { stokKodu: 'YENI-KOD-001', alisAdeti: 2 },
      ];
      const ws = XLSX.utils.json_to_sheet(sampleRows, { header: ['stokKodu', 'alisAdeti'] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'MalAlimi');
      const sampleFileName = `Arslan_Mobilya_Yalin_Mal_Alimi_Sablonu.${format}`;
      if (format === 'xlsx') {
        XLSX.writeFile(wb, sampleFileName);
      } else {
        XLSX.writeFile(wb, sampleFileName, { bookType: 'csv' });
      }
      showToast(`2 Kolonlu Yalın Mal Alımı ${format.toUpperCase()} şablonu indirildi`, 'success');
    } catch (err) {
      console.error('Template download error:', err);
      showToast('Şablon indirilemedi', 'error');
    }
  };

  // Helper: Normalize string for matching
  const normalize = (val: any) => String(val || '').toLowerCase().trim().replace(/[\s\-_]/g, '');

  // Dosya Yükleme ve Otomatik Hesaplama Motoru
  const processUploadedFile = async (file: File) => {
    if (!selectedPriceList) {
      showToast('Lütfen önce bir Fiyat Listesi seçiniz.', 'error');
      return;
    }

    setIsParsing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rawRows.length === 0) {
        showToast('Yüklenen dosya boş veya okunamadı!', 'error');
        setIsParsing(false);
        return;
      }

      // 1. Fiyat Listesi ve Stok Haritalarını Hazırla
      const priceListMap = new Map<string, { name: string; price: number; brand?: string; category?: string }>();
      (selectedPriceList.items || []).forEach(item => {
        const itemCode = item.stokKodu || item.code || '';
        const itemPrice =
          selectedPriceList.listType === 'Toptan'
            ? (item.toptanFiyat ?? item.costPrice ?? item.perakendeFiyat ?? 0)
            : (item.perakendeFiyat ?? item.salePrice ?? item.toptanFiyat ?? 0);

        if (itemCode) {
          priceListMap.set(normalize(itemCode), {
            name: item.urunAdi || item.name || itemCode,
            price: Number(itemPrice) || 0,
            brand: item.brand,
            category: item.category,
          });
        }
      });

      // 2. Ana Stok Listesi Haritası (Fallback kontrolü)
      const stockCodeMap = new Map<string, { id: string; name: string; price: number; brand?: string; category?: string }>();
      stockItems.forEach(s => {
        if (s.code) {
          stockCodeMap.set(normalize(s.code), {
            id: s.id,
            name: s.name,
            price: s.purchasePrice || 0,
            brand: s.brand,
            category: s.category,
          });
        }
      });

      // 3. Dosyadaki Satırları Eşleştir ve Hesapla
      const parsedItems: LeanImportPreviewItem[] = [];

      rawRows.forEach((row, idx) => {
        // Kolon aliasları: stokKodu, stok_kodu, kod, barkod, code, sku
        const rawCode = String(
          row['stokKodu'] ??
          row['stok_kodu'] ??
          row['Stok Kodu'] ??
          row['StokKodu'] ??
          row['kod'] ??
          row['barkod'] ??
          row['code'] ??
          row['SKU'] ??
          ''
        ).trim();

        // Kolon aliasları: alisAdeti, alis_adeti, adet, miktar, alim, gelen, quantity, qty
        const rawQty = Number(
          row['alisAdeti'] ??
          row['alis_adeti'] ??
          row['Alış Adeti'] ??
          row['Alis Adeti'] ??
          row['AlışAdeti'] ??
          row['adet'] ??
          row['miktar'] ??
          row['alim'] ??
          row['gelen'] ??
          row['quantity'] ??
          row['qty'] ??
          1
        );

        if (!rawCode) return; // Boş kodları atla

        const cleanQty = Math.max(1, isNaN(rawQty) ? 1 : rawQty);
        const normCode = normalize(rawCode);

        let urunAdi = '';
        let bazFiyat = 0;
        let isMatched = false;
        let matchedStockId: string | undefined = undefined;
        let category = 'Beyaz Eşya';
        let brand = 'Genel';

        // Öncelik 1: Seçili Fiyat Listesinde var mı?
        if (priceListMap.has(normCode)) {
          const match = priceListMap.get(normCode)!;
          urunAdi = match.name;
          bazFiyat = match.price;
          category = match.category || category;
          brand = match.brand || brand;
          isMatched = true;

          // Varsa mevcut stok ID'si ile bağla
          if (stockCodeMap.has(normCode)) {
            matchedStockId = stockCodeMap.get(normCode)!.id;
          }
        }
        // Öncelik 2: Mevcut Stok Kartlarında var mı?
        else if (stockCodeMap.has(normCode)) {
          const match = stockCodeMap.get(normCode)!;
          urunAdi = match.name;
          bazFiyat = match.price;
          category = match.category || category;
          brand = match.brand || brand;
          matchedStockId = match.id;
          isMatched = true;
        }
        // Eşleşmedi: Kullanıcıdan baz fiyat istenecek
        else {
          urunAdi = `Yeni Ürün (${rawCode})`;
          bazFiyat = 0;
          isMatched = false;
        }

        // HESAPLAMA KURALLARI:
        // netMaliyet = bazFiyat * (1 - genelIskontoOrani / 100)
        const netMaliyet = +(bazFiyat * (1 - genelIskontoOrani / 100)).toFixed(2);

        // hesaplananSatisFiyati = 10 TL'nin tam katına yukarı yuvarlama
        // Math.ceil((netMaliyet * (1 + karMarjiOrani / 100)) / 10) * 10
        const hamSatis = netMaliyet * (1 + karMarjiOrani / 100);
        const hesaplananSatisFiyati = roundUpTo10TL(hamSatis);

        parsedItems.push({
          id: `preview-${idx}-${Date.now()}`,
          stokKodu: rawCode,
          urunAdi,
          gelenAdet: cleanQty,
          bazFiyat,
          netMaliyet,
          hesaplananSatisFiyati,
          toplamMaliyet: +(cleanQty * netMaliyet).toFixed(2),
          toplamSatis: +(cleanQty * hesaplananSatisFiyati).toFixed(2),
          isMatched,
          matchedStockId,
          category,
          brand,
          hasManualPrice: false,
        });
      });

      if (parsedItems.length === 0) {
        showToast('Dosyada "stokKodu" sütunu veya geçerli satır bulunamadı!', 'error');
        setIsParsing(false);
        return;
      }

      setPreviewItems(parsedItems);
      setStep(2); // Ön İzleme ve Onay Ekranına Geç
      showToast(`${file.name} okundu (${parsedItems.length} ürün eşleştirildi)`, 'info');
    } catch (err: any) {
      console.error('File parsing error:', err);
      showToast(`Dosya okunurken hata: ${err?.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // İskonto veya Kâr Marjı değiştiğinde tüm ön izleme satırlarını anında güncelle
  const handleRecalculateAll = (newIskonto: number, newKarMarji: number) => {
    setPreviewItems(prev =>
      prev.map(item => {
        const netMaliyet = +(item.bazFiyat * (1 - newIskonto / 100)).toFixed(2);
        const hamSatis = netMaliyet * (1 + newKarMarji / 100);
        const hesaplananSatisFiyati = roundUpTo10TL(hamSatis);

        return {
          ...item,
          netMaliyet,
          hesaplananSatisFiyati,
          toplamMaliyet: +(item.gelenAdet * netMaliyet).toFixed(2),
          toplamSatis: +(item.gelenAdet * hesaplananSatisFiyati).toFixed(2),
        };
      })
    );
  };

  // Satır bazında manuel baz fiyat düzenleme (Listede olmayan veya özel fiyatlar için)
  const handleInlineBazFiyatChange = (id: string, newBazFiyat: number) => {
    setPreviewItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const cleanBaz = Math.max(0, newBazFiyat || 0);
          const netMaliyet = +(cleanBaz * (1 - genelIskontoOrani / 100)).toFixed(2);
          const hamSatis = netMaliyet * (1 + karMarjiOrani / 100);
          const hesaplananSatisFiyati = roundUpTo10TL(hamSatis);

          return {
            ...item,
            bazFiyat: cleanBaz,
            netMaliyet,
            hesaplananSatisFiyati,
            toplamMaliyet: +(item.gelenAdet * netMaliyet).toFixed(2),
            toplamSatis: +(item.gelenAdet * hesaplananSatisFiyati).toFixed(2),
            isMatched: cleanBaz > 0,
            hasManualPrice: true,
          };
        }
        return item;
      })
    );
  };

  // Satır bazında adet düzenleme
  const handleInlineAdetChange = (id: string, newAdet: number) => {
    setPreviewItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const cleanAdet = Math.max(1, newAdet || 1);
          return {
            ...item,
            gelenAdet: cleanAdet,
            toplamMaliyet: +(cleanAdet * item.netMaliyet).toFixed(2),
            toplamSatis: +(cleanAdet * item.hesaplananSatisFiyati).toFixed(2),
          };
        }
        return item;
      })
    );
  };

  // Satır bazında ürün adı düzenleme
  const handleInlineUrunAdiChange = (id: string, newName: string) => {
    setPreviewItems(prev =>
      prev.map(item => (item.id === id ? { ...item, urunAdi: newName } : item))
    );
  };

  // Satır silme
  const handleDeletePreviewItem = (id: string) => {
    setPreviewItems(prev => prev.filter(i => i.id !== id));
  };

  // Toplam İstatistikler
  const summary = useMemo(() => {
    const totalLines = previewItems.length;
    const totalQty = previewItems.reduce((sum, i) => sum + i.gelenAdet, 0);
    const totalNetCost = previewItems.reduce((sum, i) => sum + i.toplamMaliyet, 0);
    const totalExpectedRevenue = previewItems.reduce((sum, i) => sum + i.toplamSatis, 0);
    const expectedProfit = totalExpectedRevenue - totalNetCost;
    const profitMargin = totalExpectedRevenue > 0 ? (expectedProfit / totalExpectedRevenue) * 100 : 0;
    const unmatchedCount = previewItems.filter(i => !i.isMatched || i.bazFiyat <= 0).length;

    return {
      totalLines,
      totalQty,
      totalNetCost,
      totalExpectedRevenue,
      expectedProfit,
      profitMargin,
      unmatchedCount,
    };
  }, [previewItems]);

  // Filtrelenmiş Ön İzleme Satırları
  const displayedRows = useMemo(() => {
    return previewItems.filter(item => {
      if (statusFilter === 'matched' && (!item.isMatched || item.bazFiyat <= 0)) return false;
      if (statusFilter === 'warning' && (item.isMatched && item.bazFiyat > 0)) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const mCode = item.stokKodu.toLowerCase().includes(q);
        const mName = item.urunAdi.toLowerCase().includes(q);
        if (!mCode && !mName) return false;
      }
      return true;
    });
  }, [previewItems, statusFilter, searchFilter]);

  // ON ONAY & VERİTABANINA TOPLU YAZIM
  const handleConfirmAndSave = async () => {
    if (summary.unmatchedCount > 0) {
      if (
        !window.confirm(
          `Dikkat: Fiyatı girilmemiş / eşleşmeyen ${summary.unmatchedCount} adet ürün var. Baz fiyatı 0 olan ürünler 0 TL maliyetle işlenecektir. Onaylayıp devam etmek istiyor musunuz?`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const config: LeanMalAlimiConfig = {
        priceListId: selectedPriceListId,
        supplierId: selectedPriceList?.supplierId,
        supplierName: selectedPriceList?.supplierName || selectedSupplier?.name,
        donemMonthKey,
        genelIskontoOrani,
        karMarjiOrani,
        vadeOption,
        customDueDate: vadeOption === 'ozel' ? customDueDate : undefined,
        accountId: vadeOption === 'pesin' ? selectedAccountId : undefined,
        documentNo,
        notes: notes.trim() || undefined,
      };

      const result = await executeBatchLeanMalAlimi(config, previewItems);

      if (result.success) {
        setResultSummary({
          totalCount: result.totalCount,
          totalCost: result.totalCost,
          totalQty: summary.totalQty,
        });
        setStep(3); // Tamamlandı ekranına geç
        if (onImportComplete) {
          onImportComplete(result.totalCount);
        }
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(`Kaydetme hatası: ${err?.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPreviewItems([]);
    setFileName('');
    setResultSummary(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-6xl w-full mx-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
      {/* HEADER */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-sky-500/10 via-emerald-500/5 to-transparent flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Yalın Mal Alımı & Fiyat Listesi Entegrasyonu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Yalnızca <code className="font-mono font-bold text-sky-600 dark:text-sky-400">stokKodu</code> ve <code className="font-mono font-bold text-sky-600 dark:text-sky-400">alisAdeti</code> içeren dosyalardan otomatik maliyet, 10 TL katına yukarı yuvarlama ve cari borçlandırma
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* STEP 1: PARAMETRELER, FİYAT LİSTESİ SEÇİMİ VE YALIN DOSYA YÜKLEME */}
      {step === 1 && (
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Parametre Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            {/* 1. Fiyat Listesi Kaynağı */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-sky-500" />
                Fiyat Listesi Kaynağı *
              </label>
              <select
                value={selectedPriceListId}
                onChange={e => setSelectedPriceListId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
              >
                {priceLists.map(pl => (
                  <option key={pl.id} value={pl.id}>
                    [{pl.listType}] {pl.title} {pl.supplierName ? `(${pl.supplierName})` : ''}
                  </option>
                ))}
              </select>
              {selectedPriceList && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-0.5">
                  <span>Tür: <strong className="text-sky-600 dark:text-sky-400">{selectedPriceList.listType}</strong></span>
                  <span>{selectedPriceList.items?.length || selectedPriceList.itemsCount} ürün</span>
                </div>
              )}
            </div>

            {/* 2. Alım Yapılan Ay / Dönem */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Alım Yapılan Ay / Dönem *
              </label>
              <input
                type="month"
                required
                value={donemMonthKey}
                onChange={e => setDonemMonthKey(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 block pt-0.5">
                İşlemin ait olduğu mali dönem
              </span>
            </div>

            {/* 3. Genel İskonto Oranı (%) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                Genel İskonto Oranı (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={genelIskontoOrani}
                  onChange={e => setGenelIskontoOrani(Number(e.target.value) || 0)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-0.5">
                Net maliyet = Baz Fiyat - %{genelIskontoOrani}
              </span>
            </div>

            {/* 4. Hedef Kâr Marjı (10 TL Yuvarlama) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                Hedef Kâr Marjı (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="300"
                  step="1"
                  value={karMarjiOrani}
                  onChange={e => setKarMarjiOrani(Number(e.target.value) || 0)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block pt-0.5">
                Fiyat 10 TL katına yukarı yuvarlanır
              </span>
            </div>
          </div>

          {/* Vade & Finans Parametreleri (Peşin, 30 Gün, 60 Gün, Özel) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500" />
                Ödeme Vadesi & Tedarikçi Cari Borçlandırması
              </span>
              <span className="text-[11px] text-slate-400">
                Tedarikçi: <strong className="text-slate-800 dark:text-slate-200">{selectedPriceList?.supplierName || selectedSupplier?.name || 'Tedarikçi'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setVadeOption('pesin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  vadeOption === 'pesin'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Peşin (Kasa/Banka)</span>
              </button>
              <button
                type="button"
                onClick={() => setVadeOption('30gun')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  vadeOption === '30gun'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>30 Gün Vade</span>
              </button>
              <button
                type="button"
                onClick={() => setVadeOption('60gun')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  vadeOption === '60gun'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>60 Gün Vade</span>
              </button>
              <button
                type="button"
                onClick={() => setVadeOption('ozel')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  vadeOption === 'ozel'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Özel Vade Tarihi</span>
              </button>
            </div>

            {vadeOption === 'ozel' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Özel Vade Tarihi Seçin:
                </span>
                <input
                  type="date"
                  value={customDueDate}
                  onChange={e => setCustomDueDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                />
              </div>
            )}

            {vadeOption === 'pesin' && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Çıkış Yapılacak Kasa / Banka Hesabı:
                </span>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type}) - Bakiye: ₺{a.balance.toLocaleString('tr-TR')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Şablon İndirme & Bilgi Şeridi */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-sky-950 dark:text-sky-200 block">
                  Yalın 2 Sütunlu Dosya Formatı (stokKodu, alisAdeti)
                </span>
                <span className="text-[11px] text-sky-800/80 dark:text-sky-300/80">
                  Excel dosyasında başka hiçbir karmaşık kolon gerekmez; fiyatlar seçilen listeden otomatik çekilir.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadSampleTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Örnek Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSampleTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop Alanı */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-3 shadow-inner">
              {isParsing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              {isParsing ? 'Dosya Analiz Ediliyor ve Eşleştiriliyor...' : 'Excel veya CSV Dosyasını Buraya Bırakın'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              Dosyanızdaki <code className="font-mono font-bold text-slate-700 dark:text-slate-300">stokKodu</code> ve <code className="font-mono font-bold text-slate-700 dark:text-slate-300">alisAdeti</code> satırları okunarak anında ön izleme tablosu oluşturulacaktır.
            </p>
            <button
              type="button"
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-md shadow-sky-600/20 pointer-events-none"
            >
              Bilgisayardan Dosya Seç
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ÖN İZLEME VE ONAY (PREVIEW & APPROVAL) */}
      {step === 2 && (
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Üst İstatistik Şeridi */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Gelen Ürün Çeşidi</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-800 dark:text-white">
                {summary.totalLines} Kalem
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Toplam Adet</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-800 dark:text-white">
                {summary.totalQty} Adet
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Net Alış Maliyeti (Borç)</span>
              <span className="text-base sm:text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(summary.totalNetCost)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">Beklenen Satış Cirosu</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.totalExpectedRevenue)}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">Tahmini Brüt Kâr</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {formatCurrency(summary.expectedProfit)} (%{summary.profitMargin.toFixed(1)})
              </span>
            </div>
          </div>

          {/* Eksik Fiyat Uyarısı */}
          {summary.unmatchedCount > 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold block">
                  {summary.unmatchedCount} adet stok kodu Fiyat Listesinde bulunamadı!
                </span>
                <span>
                  Aşağıdaki tabloda sarı renkli satırlarda doğrudan <strong>Baz Fiyat</strong> girebilirsiniz. Girdiğiniz tutara göre net maliyet ve <strong>10 TL'ye yuvarlanmış satış fiyatı</strong> otomatik hesaplanacaktır.
                </span>
              </div>
            </div>
          )}

          {/* Canlı İskonto / Kâr Marjı ve Arama Filtresi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">İskonto:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={genelIskontoOrani}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setGenelIskontoOrani(val);
                    handleRecalculateAll(val, karMarjiOrani);
                  }}
                  className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border rounded-lg font-mono font-bold text-center"
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Kâr Marjı:</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={karMarjiOrani}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    setKarMarjiOrani(val);
                    handleRecalculateAll(genelIskontoOrani, val);
                  }}
                  className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border rounded-lg font-mono font-bold text-center"
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>

              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium hidden md:inline">
                * Satış fiyatı daima 10 TL katına yukarı yuvarlanır.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Stok kodu veya ürün ara..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
              >
                <option value="all">Tüm Satırlar ({previewItems.length})</option>
                <option value="matched">Eşleşenler ({previewItems.length - summary.unmatchedCount})</option>
                <option value="warning">Eksik/Uyarılı ({summary.unmatchedCount})</option>
              </select>
            </div>
          </div>

          {/* ÖN İZLEME TABLOSU */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-2.5 px-3">Durum</th>
                  <th className="py-2.5 px-3">Stok Kodu</th>
                  <th className="py-2.5 px-3">Ürün Adı & Modeli</th>
                  <th className="py-2.5 px-3 text-center">Gelen Adet</th>
                  <th className="py-2.5 px-3 text-right">Baz Fiyat</th>
                  <th className="py-2.5 px-3 text-right">Net Maliyet (-%{genelIskontoOrani})</th>
                  <th className="py-2.5 px-3 text-right">Hesaplanan Satış (10 TL Yuvarlama)</th>
                  <th className="py-2.5 px-3 text-right">Satır Toplamı</th>
                  <th className="py-2.5 px-3 text-center">Sil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Filtreye uygun satır bulunamadı
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((item, idx) => {
                    const isMissing = !item.isMatched || item.bazFiyat <= 0;
                    return (
                      <tr
                        key={item.id}
                        className={`transition ${
                          isMissing
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/50'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Durum */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isMissing ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Fiyat Girin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Eşleşti
                            </span>
                          )}
                        </td>

                        {/* Stok Kodu */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {item.stokKodu}
                        </td>

                        {/* Ürün Adı */}
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <input
                            type="text"
                            value={item.urunAdi}
                            onChange={e => handleInlineUrunAdiChange(item.id, e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-sky-500 focus:outline-none font-medium text-slate-800 dark:text-slate-200 text-xs py-0.5"
                          />
                        </td>

                        {/* Gelen Adet */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.gelenAdet}
                            onChange={e => handleInlineAdetChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-0.5 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold text-xs"
                          />
                        </td>

                        {/* Baz Fiyat (Düzenlenebilir) */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.bazFiyat || ''}
                            onChange={e => handleInlineBazFiyatChange(item.id, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className={`w-24 px-2 py-0.5 text-right rounded-lg font-mono font-bold text-xs ${
                              item.bazFiyat <= 0
                                ? 'bg-amber-100 dark:bg-amber-900/60 border border-amber-400 text-amber-900 dark:text-amber-100'
                                : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                            }`}
                          />
                        </td>

                        {/* Net Maliyet */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatCurrency(item.netMaliyet)}
                        </td>

                        {/* Hesaplanan Satış Fiyatı (10 TL katına yuvarlanmış) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.hesaplananSatisFiyati)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            (%{karMarjiOrani} kâr / 10 TL katı)
                          </span>
                        </td>

                        {/* Satır Toplamı */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(item.toplamMaliyet)}
                        </td>

                        {/* Sil */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePreviewItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Alt Onay ve Eylem Butonları */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri (Dosya & Parametreler)</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                  Toplam Tedarikçi Borcu:
                </span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(summary.totalNetCost)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting || previewItems.length === 0}
                onClick={handleConfirmAndSave}
                className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Onayla ve Kaydet ({previewItems.length} Kalem)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TAMAMLANDI VE SONUÇ BİLDİRİMİ */}
      {step === 3 && resultSummary && (
        <div className="p-8 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              Mal Alımı Başarıyla Onaylandı ve Kaydedildi!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Stok adetleri gelen miktar kadar artırıldı, tedarikçi cari hesabına borç işlendi ve vade takvimine ödeme kaydı oluşturuldu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block font-semibold">İşlenen Kalem</span>
              <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                {resultSummary.totalCount} Kalem
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block font-semibold">Toplam Adet</span>
              <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                +{resultSummary.totalQty} Adet
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">Cariye İşlenen Borç</span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(resultSummary.totalCost)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
            >
              Yeni Bir Mal Alımı Yükle
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-md shadow-sky-600/20"
              >
                Pencereyi Kapat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
