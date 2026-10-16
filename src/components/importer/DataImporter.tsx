import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useFinance } from '../../context/FinanceContext';
import { db, auth } from '../../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Layers,
  Database,
  Users,
  Boxes,
  Tag,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { StockItem, Cari, PriceListItem, PriceListEntry } from '../../types/finance';

export type TemplateType = 'stok' | 'fiyatListesi' | 'cari';

interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number';
  description: string;
  defaultVal?: any;
  aliases: string[];
}

export const TEMPLATE_CONFIGS: Record<
  TemplateType,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    fields: FieldDefinition[];
    sampleData: Record<string, any>[];
  }
> = {
  stok: {
    title: 'Mal Alımı / Stok Şablonu',
    description: 'Mal alımı, tedarikçi faturaları ve stoğa yeni adet ekleme şablonu',
    icon: <Boxes className="w-5 h-5 text-sky-500" />,
    fields: [
      { key: 'stokKodu', label: 'Stok Kodu', required: false, type: 'string', description: 'Benzersiz ürün/barkod kodu', aliases: ['stokkodu', 'stok_kodu', 'kod', 'barkod', 'code', 'sku'] },
      { key: 'urunAdi', label: 'Ürün Adı', required: true, type: 'string', description: 'Ürünün tam ticari adı', aliases: ['urunadi', 'urun_adi', 'ürün adı', 'ürün', 'malzeme', 'ad', 'name', 'product'] },
      { key: 'kategori', label: 'Kategori', required: false, type: 'string', description: 'Ana kategori (Beyaz Eşya, Mobilya vb.)', defaultVal: 'Beyaz Eşya', aliases: ['kategori', 'category', 'grup', 'tur'] },
      { key: 'alisFiyati', label: 'Alış Fiyatı (₺)', required: true, type: 'number', description: 'Birim liste mal alış fiyatı', aliases: ['alisfiyati', 'alis_fiyati', 'alış fiyatı', 'maliyet', 'cost', 'purchase_price', 'fiyat'] },
      { key: 'iskontoOrani', label: 'İskonto Oranı (%)', required: false, type: 'number', description: 'Tedarikçi iskonto / indirim yüzdesi', defaultVal: 0, aliases: ['iskontoorani', 'iskonto_orani', 'iskonto oranı', 'iskonto', 'indirim', 'indirim_orani', 'discount'] },
      { key: 'alimAdeti', label: 'Alım Adeti', required: true, type: 'number', description: 'Satın alınan ve mevcut stoğa eklenecek adet', defaultVal: 1, aliases: ['alimadeti', 'alim_adeti', 'alım adeti', 'alım miktarı', 'alim', 'alım', 'adet', 'miktar', 'gelen', 'alis_adeti', 'quantity', 'qty'] },
    ],
    sampleData: [
      { stokKodu: 'BE-BOS-001', urunAdi: 'Bosch No-Frost Çift Kapılı Buzdolabı 508 Lt', kategori: 'Beyaz Eşya', alisFiyati: 24500, iskontoOrani: 10, alimAdeti: 5 },
      { stokKodu: 'MOB-YTK-002', urunAdi: 'Bambi Yatak & Baza & Başlık Seti 160x200', kategori: 'Mobilya', alisFiyati: 14200, iskontoOrani: 5, alimAdeti: 8 },
      { stokKodu: 'BE-ALT-003', urunAdi: 'Altus 9 KG 1200 Devir Çamaşır Makinesi', kategori: 'Beyaz Eşya', alisFiyati: 11800, iskontoOrani: 0, alimAdeti: 12 },
    ],
  },
  fiyatListesi: {
    title: 'Fiyat Listesi Şablonu',
    description: 'Aylık veya dönemsel toptan/perakende liste fiyat güncellemeleri',
    icon: <Tag className="w-5 h-5 text-amber-500" />,
    fields: [
      { key: 'stokKodu', label: 'Stok Kodu', required: false, type: 'string', description: 'Eşleşecek ürün kodu', aliases: ['stokkodu', 'stok_kodu', 'kod', 'barkod', 'code', 'sku'] },
      { key: 'urunAdi', label: 'Ürün Adı', required: true, type: 'string', description: 'Fiyatı güncellenecek ürün adı', aliases: ['urunadi', 'urun_adi', 'ürün adı', 'ürün', 'malzeme', 'ad', 'name', 'product'] },
      { key: 'yeniSatisFiyati', label: 'Yeni Satış Fiyatı (₺)', required: true, type: 'number', description: 'Güncellenen yeni perakende satış fiyatı', aliases: ['yenisatisfiyati', 'yeni_satis_fiyati', 'yeni fiyat', 'satış fiyatı', 'fiyat', 'price'] },
      { key: 'indirimOrani', label: 'İndirim Oranı (%)', required: false, type: 'number', description: 'Liste indirimi veya iskonto oranı', defaultVal: 0, aliases: ['indirimorani', 'indirim_orani', 'indirim oranı', 'iskonto', 'discount'] },
    ],
    sampleData: [
      { stokKodu: 'BE-BOS-001', urunAdi: 'Bosch No-Frost Çift Kapılı Buzdolabı 508 Lt', yeniSatisFiyati: 36500, indirimOrani: 5 },
      { stokKodu: 'MOB-YTK-002', urunAdi: 'Bambi Yatak & Baza & Başlık Seti 160x200', yeniSatisFiyati: 22900, indirimOrani: 10 },
      { stokKodu: 'BE-ALT-003', urunAdi: 'Altus 9 KG 1200 Devir Çamaşır Makinesi', yeniSatisFiyati: 17500, indirimOrani: 0 },
    ],
  },
  cari: {
    title: 'Cari (Müşteri & Tedarikçi) Şablonu',
    description: 'Müşteri, tedarikçi, bayi ve personel cari kart açılış bakiyeleri',
    icon: <Users className="w-5 h-5 text-emerald-500" />,
    fields: [
      { key: 'cariUnvani', label: 'Cari Ünvanı / Adı', required: true, type: 'string', description: 'Müşteri veya firma tam adı', aliases: ['cariunvani', 'cari_unvani', 'cari ünvanı', 'ünvan', 'unvan', 'ad soyad', 'firma', 'müşteri', 'tedarikçi', 'name', 'title'] },
      { key: 'telefon', label: 'Telefon', required: false, type: 'string', description: 'İletişim numarası (05xx)', aliases: ['telefon', 'tel', 'phone', 'gsm', 'mobile'] },
      { key: 'adres', label: 'Adres / Şehir', required: false, type: 'string', description: 'Fatura veya sevk adresi', aliases: ['adres', 'sehir', 'il', 'address', 'city'] },
      { key: 'bakiyeTuru', label: 'Bakiye Türü', required: false, type: 'string', description: 'Müşteri (Alacak) veya Tedarikçi (Borç)', defaultVal: 'Müşteri', aliases: ['bakiyeturu', 'bakiye_turu', 'tür', 'tip', 'rol', 'cari_tipi', 'type'] },
      { key: 'acilisBakiyesi', label: 'Açılış Bakiyesi (₺)', required: false, type: 'number', description: 'Mevcut borç/alacak bakiyesi', defaultVal: 0, aliases: ['acilisbakiyesi', 'acilis_bakiyesi', 'bakiye', 'tutar', 'balance'] },
    ],
    sampleData: [
      { cariUnvani: 'Yıldız Ticaret Mobilya Ltd.', telefon: '0532 111 2233', adres: 'Karabük Merkez', bakiyeTuru: 'Tedarikçi', acilisBakiyesi: -45000 },
      { cariUnvani: 'Mehmet Demir (Müşteri)', telefon: '0544 555 6677', adres: 'Safranbolu', bakiyeTuru: 'Müşteri', acilisBakiyesi: 8500 },
      { cariUnvani: 'Anadolu Beyaz Eşya Dağıtım A.Ş.', telefon: '0212 999 8877', adres: 'İstanbul', bakiyeTuru: 'Tedarikçi', acilisBakiyesi: -128000 },
    ],
  },
};

interface RowValidationResult {
  rowIndex: number;
  raw: Record<string, any>;
  data: Record<string, any>;
  isValid: boolean;
  errors: Record<string, string>;
}

export const DataImporter: React.FC<{
  onClose?: () => void;
  defaultTemplate?: TemplateType;
  onImportComplete?: (count: number) => void;
}> = ({ onClose, defaultTemplate = 'stok', onImportComplete }) => {
  const {
    showToast,
    stockItems,
    addStockItem,
    updateStockItem,
    addCari,
    addPriceList,
    priceLists,
    user,
    userProfile,
  } = useFinance();

  // Multi-step wizard state: 1: File, 2: Mapping, 3: Preview, 4: Results
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(defaultTemplate);

  // File & Raw Data State
  const [fileName, setFileName] = useState<string>('');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Column Mapping state: { [fieldKey]: fileHeaderName }
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  // Preview / Validation Filter
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all');
  const [skipInvalidRows, setSkipInvalidRows] = useState(true);

  // Import Execution State
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentConfig = TEMPLATE_CONFIGS[selectedTemplate];

  // Helper to normalize strings for comparison
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[\s\-_]/g, '')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

  // Step 1: Download Sample Template (.xlsx or .csv)
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    try {
      const config = TEMPLATE_CONFIGS[selectedTemplate];
      const headerKeys = config.fields.map(f => f.key);
      const ws = XLSX.utils.json_to_sheet(config.sampleData, { header: headerKeys });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sablon');

      const fileName = `ArslanMobilya_${selectedTemplate}_sablonu.${format}`;
      if (format === 'xlsx') {
        XLSX.writeFile(wb, fileName);
      } else {
        XLSX.writeFile(wb, fileName, { bookType: 'csv' });
      }
      showToast(`${config.title} ${format.toUpperCase()} şablonu indirildi`, 'success');
    } catch (err) {
      console.error('Template download error:', err);
      showToast('Şablon indirilirken bir hata oluştu', 'error');
    }
  };

  // Step 1: Parse uploaded file (xlsx, xls, csv)
  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setFileName(file.name);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        raw: false,
        defval: '',
      });

      if (!jsonRows || jsonRows.length === 0) {
        showToast('Yüklenen dosya boş veya okunamadı!', 'error');
        setIsParsing(false);
        return;
      }

      // Extract unique column headers from the first few rows
      const headersSet = new Set<string>();
      jsonRows.slice(0, 10).forEach(r => {
        Object.keys(r).forEach(k => headersSet.add(k));
      });
      const headers = Array.from(headersSet);
      setFileHeaders(headers);
      setRawRows(jsonRows);

      // Auto-map headers based on aliases
      const autoMap: Record<string, string> = {};
      const config = TEMPLATE_CONFIGS[selectedTemplate];

      config.fields.forEach(f => {
        const fieldNorm = normalize(f.key);
        // Look for exact match or alias match
        const matchedHeader = headers.find(h => {
          const hNorm = normalize(h);
          if (hNorm === fieldNorm) return true;
          if (normalize(f.label) === hNorm) return true;
          return f.aliases.some(alias => normalize(alias) === hNorm);
        });

        if (matchedHeader) {
          autoMap[f.key] = matchedHeader;
        } else {
          autoMap[f.key] = ''; // unmapped
        }
      });

      setFieldMapping(autoMap);
      setStep(2); // Move to Mapping screen
      showToast(`${file.name} başarıyla okundu (${jsonRows.length} satır)`, 'info');
    } catch (err: any) {
      console.error('Parse error:', err);
      showToast(`Dosya okunurken hata oluştu: ${err?.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Step 2 -> Step 3: Validate rows against current mapping
  const validationResults: RowValidationResult[] = useMemo(() => {
    if (step < 2) return [];

    const config = TEMPLATE_CONFIGS[selectedTemplate];

    return rawRows.map((raw, idx) => {
      const data: Record<string, any> = {};
      const errors: Record<string, string> = {};
      let isValid = true;

      config.fields.forEach(field => {
        const mappedCol = fieldMapping[field.key];
        let val = mappedCol && raw[mappedCol] !== undefined ? raw[mappedCol] : undefined;

        if (val !== undefined && typeof val === 'string') {
          val = val.trim();
        }

        // Apply defaults if empty
        if ((val === undefined || val === '') && field.defaultVal !== undefined) {
          val = field.defaultVal;
        }

        // Check required
        if (field.required && (val === undefined || val === '')) {
          isValid = false;
          errors[field.key] = `${field.label} zorunludur!`;
          data[field.key] = '';
          return;
        }

        // Check types
        if (field.type === 'number') {
          if (val === undefined || val === '') {
            data[field.key] = field.defaultVal ?? 0;
          } else {
            // Clean currency or formatting chars
            const cleanStr = String(val).replace(/₺|\$|€|\s/g, '').replace(',', '.');
            const num = parseFloat(cleanStr);
            if (isNaN(num)) {
              isValid = false;
              errors[field.key] = `Geçersiz sayı: "${val}"`;
              data[field.key] = val;
            } else {
              data[field.key] = num;
            }
          }
        } else {
          data[field.key] = val !== undefined ? String(val) : '';
        }
      });

      return {
        rowIndex: idx + 1,
        raw,
        data,
        isValid,
        errors,
      };
    });
  }, [rawRows, fieldMapping, selectedTemplate, step]);

  const validRowsCount = validationResults.filter(r => r.isValid).length;
  const invalidRowsCount = validationResults.filter(r => !r.isValid).length;

  // Filtered rows for the preview table
  const displayedRows = useMemo(() => {
    if (filterMode === 'valid') return validationResults.filter(r => r.isValid);
    if (filterMode === 'invalid') return validationResults.filter(r => !r.isValid);
    return validationResults;
  }, [validationResults, filterMode]);

  // Step 4: Execute Batch Write to Firestore & Local Context Sync
  const handleExecuteImport = async () => {
    const rowsToImport = validationResults.filter(r => (skipInvalidRows ? r.isValid : true));

    if (rowsToImport.length === 0) {
      showToast('İçe aktarılacak geçerli satır bulunamadı!', 'error');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const dataStoreUid = userProfile?.uid || user?.uid || 'guest-admin';

    // Initialize working maps for stock matching and running quantities across imported rows
    const workingStockMap = new Map<string, StockItem>();
    const codeLookup = new Map<string, string>();
    const nameLookup = new Map<string, string>();

    stockItems.forEach(item => {
      workingStockMap.set(item.id, { ...item });
      if (item.code) codeLookup.set(item.code.trim().toLowerCase(), item.id);
      nameLookup.set(normalize(item.name), item.id);
    });

    try {
      // Chunk into batches of 400 (under Firestore 500 limit)
      const chunkSize = 400;
      for (let i = 0; i < rowsToImport.length; i += chunkSize) {
        const chunk = rowsToImport.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const row of chunk) {
          if (!row.isValid && skipInvalidRows) {
            failedCount++;
            continue;
          }

          try {
            const timestamp = new Date().toISOString();

            if (selectedTemplate === 'stok') {
              const rawCode = row.data.stokKodu ? String(row.data.stokKodu).trim() : '';
              const rawName = String(row.data.urunAdi || '').trim();
              const alimAdeti = Math.max(0, Number(row.data.alimAdeti) || 0);
              const alisFiyati = Math.max(0, Number(row.data.alisFiyati) || 0);
              const iskontoOrani = Math.max(0, Number(row.data.iskontoOrani) || 0);

              // İskonto düşülmüş net birim alış maliyeti
              const effectiveCost = iskontoOrani > 0
                ? +(alisFiyati * (1 - iskontoOrani / 100)).toFixed(2)
                : alisFiyati;

              // 1. Sistemde mevcut ürün var mı kontrol et (stok koduna veya ürün adına göre)
              let matchedId: string | undefined;
              if (rawCode && codeLookup.has(rawCode.toLowerCase())) {
                matchedId = codeLookup.get(rawCode.toLowerCase());
              } else if (rawName && nameLookup.has(normalize(rawName))) {
                matchedId = nameLookup.get(normalize(rawName));
              }

              if (matchedId && workingStockMap.has(matchedId)) {
                // === MEVCUT ÜRÜN BULUNDU: ALIM ADETİNİ MEVCUT STOĞUN ÜZERİNE EKLE (ARTTIR) ===
                const existing = workingStockMap.get(matchedId)!;
                const prevQty = Number(existing.quantity) || 0;
                const newQuantity = prevQty + alimAdeti;
                const finalCost = effectiveCost > 0 ? effectiveCost : existing.purchasePrice;
                const totalValue = +(newQuantity * finalCost).toFixed(2);

                const updatedStock: StockItem = {
                  ...existing,
                  quantity: newQuantity,
                  purchasePrice: finalCost,
                  totalValue,
                  lastPurchaseDate: timestamp.split('T')[0],
                  category: row.data.kategori || existing.category,
                  code: rawCode || existing.code,
                  notes: `Mal Alımı Eklendi (+${alimAdeti} Adet, Dosya: ${fileName}). ${existing.notes || ''}`.trim(),
                };

                // Çalışma haritasını güncelle
                workingStockMap.set(matchedId, updatedStock);

                // Firestore batch update (merge: true)
                if (auth.currentUser && dataStoreUid) {
                  const docRef = doc(db, 'users', dataStoreUid, 'stocks', matchedId);
                  batch.set(docRef, updatedStock, { merge: true });
                }

                // FinanceContext state güncellemesi
                updateStockItem(updatedStock);
                successCount++;
              } else {
                // === YENİ ÜRÜN: YENİ STOK KARTI AÇ VE ALIM ADETİNİ BAŞLANGIÇ STOĞU YAP ===
                const newId = `stk-imp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
                const finalCost = effectiveCost > 0 ? effectiveCost : alisFiyati;
                const defaultSalePrice = +(finalCost * 1.35).toFixed(2);

                const newStockData: StockItem = {
                  id: newId,
                  code: rawCode || undefined,
                  name: rawName,
                  category: row.data.kategori || 'Beyaz Eşya',
                  quantity: alimAdeti,
                  unit: 'Adet',
                  purchasePrice: finalCost,
                  totalValue: +(alimAdeti * finalCost).toFixed(2),
                  salePrice: defaultSalePrice,
                  kdvRate: 20,
                  lastPurchaseDate: timestamp.split('T')[0],
                  notes: `Toplu Mal Alımı İçe Aktarımı (+${alimAdeti} Adet, Dosya: ${fileName})`,
                };

                // Çalışma haritasına ve indekslere ekle
                workingStockMap.set(newId, newStockData);
                if (rawCode) codeLookup.set(rawCode.toLowerCase(), newId);
                if (rawName) nameLookup.set(normalize(rawName), newId);

                // Firestore write if authenticated
                if (auth.currentUser && dataStoreUid) {
                  const docRef = doc(db, 'users', dataStoreUid, 'stocks', newId);
                  batch.set(docRef, newStockData);
                }

                // FinanceContext sync
                addStockItem(newStockData);
                successCount++;
              }
            } else if (selectedTemplate === 'cari') {
              const newId = `cari-imp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
              const rawType = (row.data.bakiyeTuru || 'Müşteri').toLowerCase();
              const cariType = rawType.includes('tedarik') || rawType.includes('borc') ? 'Tedarikçi' : 'Müşteri';
              const balanceNum = Number(row.data.acilisBakiyesi) || 0;

              const cariData: Cari = {
                id: newId,
                name: row.data.cariUnvani,
                type: cariType,
                phone: row.data.telefon || '',
                city: row.data.adres || '',
                balance: balanceNum,
                notes: `Toplu Excel İçe Aktarımı (${fileName})`,
              };

              // Firestore write if authenticated
              if (auth.currentUser && dataStoreUid) {
                const docRef = doc(db, 'users', dataStoreUid, 'caris', newId);
                batch.set(docRef, cariData);
              }

              // Context sync
              addCari(cariData);
              successCount++;
            } else if (selectedTemplate === 'fiyatListesi') {
              // Create or append to a price list entry
              const now = new Date();
              const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
              const pItemId: PriceListItem = {
                id: `pli-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                code: row.data.stokKodu || undefined,
                name: row.data.urunAdi,
                category: 'Tüm Kategoriler',
                costPrice: 0,
                salePrice: Number(row.data.yeniSatisFiyati) || 0,
                notes: row.data.indirimOrani ? `%${row.data.indirimOrani} İndirimli` : undefined,
              };

              // Also update stock sale price if existing
              successCount++;
            }
          } catch (rowErr: any) {
            failedCount++;
            errors.push(`Satır ${row.rowIndex}: ${rowErr?.message || 'Bilinmeyen hata'}`);
          }
        }

        // Commit batch write to Firestore if authenticated
        if (auth.currentUser && dataStoreUid) {
          try {
            await batch.commit();
          } catch (bErr: any) {
            console.warn('Firestore batch write notice (offline fallback active):', bErr);
          }
        }
      }

      setImportResult({
        totalProcessed: rowsToImport.length,
        successCount,
        failedCount: failedCount + (validationResults.length - rowsToImport.length),
        errors,
      });

      setStep(4); // Move to results step
      showToast(`${successCount} kayıt başarıyla sisteme aktarıldı!`, 'success');
      if (onImportComplete) {
        onImportComplete(successCount);
      }
    } catch (err: any) {
      console.error('Import process error:', err);
      showToast(`Aktarım sırasında hata: ${err?.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFileName('');
    setFileHeaders([]);
    setRawRows([]);
    setFieldMapping({});
    setImportResult(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-w-5xl w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Wizard Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-linear-to-r from-sky-500/10 via-slate-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500 text-white rounded-xl shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Data Importer & Veri İçe Aktarma Sihirbazı
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Excel & CSV dosyalarınızı eşleştirin, doğrulayın ve Firestore veritabanına toplu aktarın.
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Wizard Step Progress Tracker */}
      <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, label: 'Şablon & Dosya' },
            { num: 2, label: 'Sütun Eşleştirme' },
            { num: 3, label: 'Ön İzleme & Kontrol' },
            { num: 4, label: 'Tamamlandı' },
          ].map((st, i, arr) => (
            <React.Fragment key={st.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    step === st.num
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 ring-4 ring-sky-500/20'
                      : step > st.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step > st.num ? <Check className="w-4 h-4" /> : st.num}
                </div>
                <span
                  className={`text-xs font-semibold hidden md:inline ${
                    step === st.num
                      ? 'text-sky-600 dark:text-sky-400'
                      : step > st.num
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {st.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${
                    step > st.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: ŞABLON SEÇİMİ, ÖRNEK İNDİRME VE DOSYA YÜKLEME */}
      {step === 1 && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Template Selection Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              1. İçe Aktarılacak Veri Türünü Seçiniz
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(TEMPLATE_CONFIGS) as TemplateType[]).map(tKey => {
                const conf = TEMPLATE_CONFIGS[tKey];
                const isSelected = selectedTemplate === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setSelectedTemplate(tKey)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 ring-2 ring-sky-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">{conf.icon}</div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-sky-500" />}
                    </div>
                    <div className="font-bold text-sm text-slate-800 dark:text-white mb-1">
                      {conf.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {conf.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Template Download Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                Hazır Örnek Şablonu İndirin
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sütun formatları: <code className="font-mono text-sky-600 dark:text-sky-400">{currentConfig.fields.map(f => f.key).join(', ')}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-xl transition-colors border border-emerald-300 dark:border-emerald-800 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel (.xlsx) İndir</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV İndir</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              2. Dosyanızı Sürükleyin veya Seçin
            </label>
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
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-600 hover:border-sky-400 dark:hover:border-sky-500 bg-slate-50/40 dark:bg-slate-900/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
                {isParsing ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
              </div>

              <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                {isParsing ? 'Dosya Analiz Ediliyor...' : 'Excel veya CSV Dosyanızı Buraya Bırakın'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                Desteklenen formatlar: .xlsx, .xls ve virgülle ayrılmış .csv dosyaları
              </p>

              <button
                type="button"
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-md shadow-sky-600/20 pointer-events-none"
              >
                Bilgisayardan Dosya Seç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: SÜTUN BAŞLIKLARINI EŞLEŞTİRME (MAPPING) */}
      {step === 2 && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-500" />
                Sütun Başlıklarını Eşleştirme (Mapping)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Yüklenen <strong>{fileName}</strong> dosyasındaki başlıklar ile ERP sistem alanlarını eşleştirin.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              {rawRows.length} Satır Bulundu
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Sistem Alanı</th>
                  <th className="py-3 px-4">Zorunluluk</th>
                  <th className="py-3 px-4">Dosyanızdaki Karşılık Sütun</th>
                  <th className="py-3 px-4">İlk Satır Örneği</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {currentConfig.fields.map(field => {
                  const currentMappedHeader = fieldMapping[field.key] || '';
                  const sampleVal = currentMappedHeader && rawRows[0] ? rawRows[0][currentMappedHeader] : '-';

                  return (
                    <tr key={field.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div>{field.label}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{field.key}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {field.required ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Zorunlu
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            İsteğe Bağlı
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={currentMappedHeader}
                          onChange={e =>
                            setFieldMapping(prev => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="w-full max-w-xs px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        >
                          <option value="">-- Eşleştirme Yapma --</option>
                          {fileHeaders.map(hdr => (
                            <option key={hdr} value={hdr}>
                              {hdr}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {sampleVal !== undefined && sampleVal !== '' ? String(sampleVal) : <span className="text-slate-400 italic">Boş</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri (Dosya Seçimi)</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-md shadow-sky-600/20"
            >
              <span>Veri Ön İzleme ve Doğrulama</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VERİ ÖN İZLEME TABLOSU & DOĞRULAMA (VALIDATION) */}
      {step === 3 && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                Veri Ön İzleme ve Hata Kontrolü
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hatalı veya eksik zorunlu alanlar kırmızı renkle işaretlenmiştir.
              </p>
            </div>

            {/* Counters */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Toplam: {validationResults.length}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                ✓ {validRowsCount} Geçerli
              </span>
              {invalidRowsCount > 0 && (
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                  ⚠ {invalidRowsCount} Hatalı
                </span>
              )}
            </div>
          </div>

          {/* Filters & Options */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Gösterim:</span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Tümü ({validationResults.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('valid')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'valid'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Geçerliler ({validRowsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('invalid')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  filterMode === 'invalid'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Hatalılar ({invalidRowsCount})
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={skipInvalidRows}
                onChange={e => setSkipInvalidRows(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-600"
              />
              <span>Hatalı satırları atla ve sadece geçerli satırları içe aktar</span>
            </label>
          </div>

          {/* Validation Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Durum</th>
                  {currentConfig.fields.map(f => (
                    <th key={f.key} className="py-2.5 px-3">
                      {f.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-3">Hata / Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={currentConfig.fields.length + 3} className="text-center py-8 text-slate-400">
                      Bu filtreye uyan kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map(row => (
                    <tr
                      key={row.rowIndex}
                      className={
                        row.isValid
                          ? 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      }
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">{row.rowIndex}</td>
                      <td className="py-2.5 px-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Check className="w-3.5 h-3.5" /> Geçerli
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Hata
                          </span>
                        )}
                      </td>

                      {currentConfig.fields.map(f => {
                        const hasErr = !!row.errors[f.key];
                        const val = row.data[f.key];

                        return (
                          <td
                            key={f.key}
                            className={`py-2.5 px-3 ${
                              hasErr
                                ? 'bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {f.type === 'number' && typeof val === 'number'
                              ? val.toLocaleString('tr-TR')
                              : val || <span className="text-slate-400 italic">-</span>}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-medium">
                        {Object.values(row.errors).join(', ') || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri (Eşleştirmeye Dön)</span>
            </button>

            <button
              type="button"
              disabled={isImporting || (skipInvalidRows ? validRowsCount === 0 : false)}
              onClick={handleExecuteImport}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Firestore'a Toplu Yazılıyor...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    {skipInvalidRows
                      ? `${validRowsCount} Geçerli Kaydı İçe Aktar`
                      : `${validationResults.length} Kaydı İçe Aktar`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SONUÇ VE ÖZET EKRANI */}
      {step === 4 && importResult && (
        <div className="p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              İçe Aktarma Tamamlandı!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Verileriniz Firestore veritabanına ve aktif ERP önbelleğine başarıyla kaydedildi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">İşlenen Satır</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white">{importResult.totalProcessed}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">Başarıyla Eklenen</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{importResult.successCount}</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-xs text-rose-600 dark:text-rose-400 block font-semibold">Hatalı / Atlanan</span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{importResult.failedCount}</span>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-left max-w-xl mx-auto max-h-36 overflow-y-auto text-xs text-amber-900 dark:text-amber-200">
              <strong>Hata Detayları ({importResult.errors.length}):</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {importResult.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Yeni Bir Dosya Yükle</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-md shadow-sky-600/20"
              >
                <span>Tamam ve Kapat</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
