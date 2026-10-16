import React, { useState, useMemo, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Boxes,
  Plus,
  Search,
  Download,
  Upload,
  Calendar,
  Building,
  FileText,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StockItem, StockPurchaseRecord, PurchaseItemDetail } from '../../types/finance';
import { ProductMatchModal, UnmatchedResolution } from '../modals/ProductMatchModal';
import * as XLSX from 'xlsx';

export const StockTab: React.FC = () => {
  const {
    stockItems,
    purchases,
    caris,
    accounts,
    productCategories,
    productBrands,
    addStockPurchase,
    deleteStockPurchase,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    adjustStockQuantity,
    importStockItemsBulk,
    setSaleModalPrefillProduct,
    setActiveTab,
    isAdmin,
    openDataImporter,
    showToast,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const purchaseExcelRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'purchases'>('inventory');
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Purchase Modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseDocNo, setPurchaseDocNo] = useState(`İRS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [paymentType, setPaymentType] = useState<'Vadeli (Cari Borca Ekle)' | 'Peşin Kasa/Banka'>('Vadeli (Cari Borca Ekle)');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [purchaseAccountId, setPurchaseAccountId] = useState(accounts[0]?.id || 'acc-banka');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemDetail[]>([
    {
      name: '',
      category: 'Beyaz Eşya',
      subCategory: 'Buzdolabı',
      brand: 'Bosch',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      salePrice: 0,
    },
  ]);

  // Stock Item Modal state
  const [isStockItemModalOpen, setIsStockItemModalOpen] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<StockItem | null>(null);
  const [stockItemName, setStockItemName] = useState('');
  const [stockItemCode, setStockItemCode] = useState('');
  const [stockItemCategory, setStockItemCategory] = useState('Beyaz Eşya');
  const [stockItemSubCategory, setStockItemSubCategory] = useState('Buzdolabı');
  const [stockItemBrand, setStockItemBrand] = useState('Bosch');
  const [stockItemSupplierId, setStockItemSupplierId] = useState('');
  const [stockItemQuantity, setStockItemQuantity] = useState(1);
  const [stockItemPurchasePrice, setStockItemPurchasePrice] = useState(0);
  const [stockItemSalePrice, setStockItemSalePrice] = useState(0);
  const [stockItemNotes, setStockItemNotes] = useState('');

  // Missing product matching state for purchases
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [unmatchedNamesForPurchase, setUnmatchedNamesForPurchase] = useState<string[]>([]);
  const [pendingParsedPurchases, setPendingParsedPurchases] = useState<any[]>([]);

  const suppliers = useMemo(() => {
    return caris.filter(c => c.type === 'Tedarikçi');
  }, [caris]);

  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedBrand !== 'ALL' && item.brand !== selectedBrand) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = (item.code || '').toLowerCase().includes(q);
        const matchesBrand = (item.brand || '').toLowerCase().includes(q);
        const matchesSupplier = (item.supplierName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesBrand && !matchesSupplier) {
          return false;
        }
      }
      return true;
    });
  }, [stockItems, selectedCategory, selectedBrand, searchTerm]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (selectedYear !== 'ALL' && !p.date.startsWith(selectedYear)) return false;
      if (selectedMonth !== 'ALL') {
        const pMonth = p.date.substring(5, 7);
        if (pMonth !== selectedMonth) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesSupplier = p.supplierName.toLowerCase().includes(q);
        const matchesDoc = p.documentNo.toLowerCase().includes(q);
        const matchesItem = p.items.some(i => i.name.toLowerCase().includes(q));
        if (!matchesSupplier && !matchesDoc && !matchesItem) return false;
      }
      return true;
    });
  }, [purchases, selectedYear, selectedMonth, searchTerm]);

  const totalStockCount = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalStockCostValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
  const totalStockSaleValue = stockItems.reduce((sum, item) => sum + item.quantity * item.salePrice, 0);
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  const modalPurchaseTotalAmount = purchaseItems.reduce(
    (sum, item) => sum + Number(item.totalPrice || 0),
    0
  );

  const handleUpdateItemLine = (index: number, field: keyof PurchaseItemDetail, value: any) => {
    setPurchaseItems(prev => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        current.totalPrice = +(current.quantity * current.unitPrice).toFixed(2);
        if (field === 'unitPrice' && (!current.salePrice || current.salePrice === 0)) {
          current.salePrice = +(current.unitPrice * 1.35).toFixed(2);
        }
      }
      updated[index] = current;
      return updated;
    });
  };

  const handleAddItemLine = () => {
    setPurchaseItems(prev => [
      ...prev,
      {
        name: '',
        category: 'Beyaz Eşya',
        subCategory: 'Buzdolabı',
        brand: 'Bosch',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        salePrice: 0,
      },
    ]);
  };

  const handleRemoveItemLine = (index: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) {
      alert('Lütfen mal alışı yapılan tedarikçiyi seçin.');
      return;
    }
    if (purchaseItems.some(i => !i.name.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      alert('Lütfen tüm ürün kalemlerinin adını, adedini ve birim alış fiyatını eksiksiz girin.');
      return;
    }

    addStockPurchase({
      date: purchaseDate,
      documentNo: purchaseDocNo.trim() || `İRS-${Date.now()}`,
      supplierId: sup.id,
      supplierName: sup.name,
      items: purchaseItems,
      totalAmount: modalPurchaseTotalAmount,
      paymentType,
      dueDate: paymentType === 'Vadeli (Cari Borca Ekle)' ? dueDate : undefined,
      accountId: paymentType === 'Peşin Kasa/Banka' ? purchaseAccountId : undefined,
      notes: purchaseNotes.trim() || undefined,
    });

    setIsPurchaseModalOpen(false);
    setSelectedSupplierId('');
    setPurchaseItems([
      {
        name: '',
        category: 'Beyaz Eşya',
        subCategory: 'Buzdolabı',
        brand: 'Bosch',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        salePrice: 0,
      },
    ]);
    setPurchaseNotes('');
  };

  const handleSaveStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === stockItemSupplierId);

    if (editingStockItem) {
      updateStockItem({
        ...editingStockItem,
        code: stockItemCode.trim() || undefined,
        name: stockItemName.trim(),
        category: stockItemCategory,
        subCategory: stockItemSubCategory || undefined,
        brand: stockItemBrand || undefined,
        supplierId: stockItemSupplierId || editingStockItem.supplierId,
        supplierName: sup?.name || editingStockItem.supplierName,
        quantity: Number(stockItemQuantity) || 0,
        purchasePrice: Number(stockItemPurchasePrice) || 0,
        salePrice: Number(stockItemSalePrice) || 0,
        totalValue: +(Number(stockItemQuantity) * Number(stockItemPurchasePrice)).toFixed(2),
        notes: stockItemNotes.trim() || undefined,
      });
    } else {
      addStockItem({
        code: stockItemCode.trim() || undefined,
        name: stockItemName.trim(),
        category: stockItemCategory,
        subCategory: stockItemSubCategory || undefined,
        brand: stockItemBrand || undefined,
        supplierId: stockItemSupplierId || undefined,
        supplierName: sup?.name || undefined,
        quantity: Number(stockItemQuantity) || 1,
        unit: 'Adet',
        purchasePrice: Number(stockItemPurchasePrice) || 0,
        totalValue: +(Number(stockItemQuantity) * Number(stockItemPurchasePrice)).toFixed(2),
        salePrice: Number(stockItemSalePrice) || 0,
        notes: stockItemNotes.trim() || undefined,
      });
    }
    setIsStockItemModalOpen(false);
    setEditingStockItem(null);
  };

  const handleOpenEditStock = (item: StockItem) => {
    setEditingStockItem(item);
    setStockItemName(item.name);
    setStockItemCode(item.code || '');
    setStockItemCategory(item.category);
    setStockItemSubCategory(item.subCategory || 'Buzdolabı');
    setStockItemBrand(item.brand || 'Bosch');
    setStockItemSupplierId(item.supplierId || '');
    setStockItemQuantity(item.quantity);
    setStockItemPurchasePrice(item.purchasePrice);
    setStockItemSalePrice(item.salePrice);
    setStockItemNotes(item.notes || '');
    setIsStockItemModalOpen(true);
  };

  const handleSellDirectly = (item: StockItem) => {
    setSaleModalPrefillProduct(item);
    setActiveTab('profit');
  };

  // Excel upload for Stock and Purchases with Missing Product Matching
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (!rows || rows.length === 0) {
          alert('Excel dosyasında okunabilecek kayıt bulunamadı.');
          return;
        }

        const unmatchedNamesSet = new Set<string>();
        const parsedRows: any[] = [];

        rows.forEach(row => {
          const name = row['Ürün Adı'] || row['Urun Adi'] || row['Ürün'] || row['Name'] || row['Açıklama'];
          if (name) {
            const rawName = String(name).trim();
            const matched = stockItems.find(
              s => s.name.toLowerCase() === rawName.toLowerCase() ||
                   (s.code && s.code.toLowerCase() === rawName.toLowerCase())
            );

            if (!matched) {
              unmatchedNamesSet.add(rawName);
            }

            parsedRows.push({
              rawName,
              matched,
              category: row['Kategori'] || row['Category'] || 'Beyaz Eşya',
              subCategory: row['Alt Kategori'] ? String(row['Alt Kategori']).trim() : undefined,
              brand: row['Marka'] || row['Brand'] || 'Genel',
              quantity: Number(row['Adet'] || row['Miktar'] || row['Stok'] || row['Quantity'] || 1),
              unit: row['Birim'] ? String(row['Birim']).trim() : 'Adet',
              purchasePrice: Number(row['Alış Fiyatı'] || row['Maliyet'] || row['Alis Fiyati'] || row['Cost'] || 0),
              salePrice: Number(row['Satış Fiyatı'] || row['Satis Fiyati'] || row['Price'] || 0),
              supplierName: row['Tedarikçi'] ? String(row['Tedarikçi']).trim() : undefined,
              notes: 'Excel toplu yükleme',
            });
          }
        });

        if (unmatchedNamesSet.size > 0) {
          setUnmatchedNamesForPurchase(Array.from(unmatchedNamesSet));
          setPendingParsedPurchases(parsedRows);
          setIsMatchModalOpen(true);
        } else {
          const newStockItems: Array<Omit<StockItem, 'id'>> = parsedRows.map(r => ({
            name: r.rawName,
            category: r.category,
            subCategory: r.subCategory,
            brand: r.brand,
            quantity: r.quantity,
            unit: r.unit,
            purchasePrice: r.purchasePrice,
            totalValue: +(r.quantity * r.purchasePrice).toFixed(2),
            salePrice: r.salePrice || Math.round(r.purchasePrice * 1.35),
            supplierName: r.supplierName,
            notes: r.notes,
          }));
          importStockItemsBulk(newStockItems);
        }
      } catch (err: any) {
        alert('Excel okuma hatası: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePurchaseMatchComplete = (resolutions: Record<string, UnmatchedResolution>) => {
    const newStockItems: Array<Omit<StockItem, 'id'>> = pendingParsedPurchases.map(r => {
      const res = resolutions[r.rawName];
      const finalName = res ? res.productName : r.rawName;
      const finalCat = res ? res.category : r.category;
      const finalSub = res?.subCategory || r.subCategory;
      const finalBrand = res?.brand || r.brand;
      const finalCost = (res && res.costPrice > 0) ? res.costPrice : r.purchasePrice;
      const finalSalePrice = (res && res.salePrice > 0) ? res.salePrice : (r.salePrice || Math.round(finalCost * 1.35));

      return {
        name: finalName,
        category: finalCat,
        subCategory: finalSub,
        brand: finalBrand,
        quantity: r.quantity,
        unit: r.unit,
        purchasePrice: finalCost,
        totalValue: +(r.quantity * finalCost).toFixed(2),
        salePrice: finalSalePrice,
        supplierName: r.supplierName,
        notes: r.notes,
      };
    });

    importStockItemsBulk(newStockItems);
    setPendingParsedPurchases([]);
    setUnmatchedNamesForPurchase([]);
  };

  const handleExportStockCSV = () => {
    if (filteredStock.length === 0) {
      alert('Dışa aktarılacak stok kaydı bulunamadı.');
      return;
    }
    const headers = ['Ürün Kodu', 'Ürün Adı', 'Kategori', 'Alt Kategori', 'Marka', 'Tedarikçi', 'Stok Miktarı', 'Birim', 'Alış Maliyeti (TL)', 'Toplam Stok Değeri (TL)', 'Satış Fiyatı (TL)'];
    const rows = filteredStock.map(s => [
      `"${s.code || '-'}"`,
      `"${s.name}"`,
      `"${s.category}"`,
      `"${s.subCategory || '-'}"`,
      `"${s.brand || '-'}"`,
      `"${s.supplierName || '-'}"`,
      s.quantity,
      s.unit,
      s.purchasePrice,
      s.totalValue,
      s.salePrice,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arslan_mobilya_stok_listesi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-sky-950 p-5 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Boxes className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Mal Alış & Stok Yönetimi</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Tedarikçilerden yapılan mal alımları kaydedildiğinde ürün stokları ve ilgili tedarikçinin cari borcu otomatik güncellenir. Excel ile toplu irsaliye/fatura yükleme ve eksik ürün eşleştirme desteklenir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleExcelFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => openDataImporter('stok')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-sky-500/20 active:scale-95"
            title="Excel/CSV Şablonu indir, sütun eşleştir ve toplu mal alımı/stok aktar"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-200" />
            <span>İçe Aktarma Sihirbazı</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
            title="Excel dosyasından toplu stok/mal alımı yükle"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Hızlı Excel Yükle</span>
          </button>
          <button
            onClick={() => {
              setEditingStockItem(null);
              setStockItemName('');
              setStockItemCode('');
              setStockItemCategory('Beyaz Eşya');
              setStockItemQuantity(1);
              setStockItemPurchasePrice(0);
              setStockItemSalePrice(0);
              setIsStockItemModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Stok Kartı</span>
          </button>
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Yeni Mal Alışı (İrsaliye)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Toplam Stok Miktarı</span>
            <Boxes className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {totalStockCount} <span className="text-xs font-normal text-slate-400">ürün / adet</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stockItems.length} farklı stok kartı
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Toplam Stok Maliyeti</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalStockCostValue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Depodaki malların toplam alış tutarı
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Perakende Satış Değeri</span>
            <Building className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalStockSaleValue)}
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block font-medium">
            Beklenen brüt kâr: {formatCurrency(totalStockSaleValue - totalStockCostValue)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Dönem Mal Alımları</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalPurchasesAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredPurchases.length} adet alım faturası ({selectedYear} {selectedMonth !== 'ALL' ? `/${selectedMonth}` : ''})
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'inventory'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Mevcut Depo & Mağaza Stokları</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeSubTab === 'inventory' ? 'bg-sky-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {stockItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'purchases'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mal Alım Faturaları / İrsaliyeleri</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeSubTab === 'purchases' ? 'bg-sky-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {purchases.length}
          </span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Ürün adı, barkod, marka, tedarikçi veya belge no ara..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
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

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Yıllar</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Tüm Kategoriler</option>
            {productCategories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Tüm Markalar</option>
            {productBrands.map(b => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportStockCSV}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>Excel İndir</span>
        </button>
      </div>

      {/* SUB-TAB 1: MEVCUT STOKLAR TABLOSU */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Boxes className="w-4 h-4 text-sky-600" />
              Depo ve Mağaza Stok Listesi ({filteredStock.length})
            </h3>
            <span className="text-xs text-slate-400">
              Toplam Stok Değeri: {formatCurrency(totalStockCostValue)}
            </span>
          </div>

          {filteredStock.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Boxes className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Stok kaydı bulunamadı
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">Ürün Adı & Model</th>
                    <th className="py-3 px-3.5">Kategori / Alt Kategori</th>
                    <th className="py-3 px-3.5">Marka</th>
                    <th className="py-3 px-3.5">Tedarikçi</th>
                    <th className="py-3 px-3.5 text-center">Mevcut Stok & Hızlı Sayım</th>
                    <th className="py-3 px-3.5 text-right">Alış Fiyatı</th>
                    <th className="py-3 px-3.5 text-right">Toplam Değer</th>
                    <th className="py-3 px-3.5 text-right">Satış Fiyatı</th>
                    <th className="py-3 px-3 text-center">İşlem & Satış</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStock.map(item => {
                    const isLowStock = item.minStockLevel && item.quantity <= item.minStockLevel;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        <td className="py-3 px-3.5 max-w-[260px]">
                          <span className="font-semibold text-slate-900 dark:text-white block truncate">
                            {item.name}
                          </span>
                          {item.code && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Kod: {item.code}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.category}
                          </span>
                          {item.subCategory && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.subCategory}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {item.brand || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                          {item.supplierName || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => adjustStockQuantity(item.id, -1)}
                              className="w-5 h-5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                              title="1 adet azalt"
                            >
                              -
                            </button>
                            <span
                              className={`font-mono-num font-bold px-2 py-0.5 rounded-lg text-xs ${
                                item.quantity === 0
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                  : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {item.quantity} {item.unit || 'Adet'}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustStockQuantity(item.id, 1)}
                              className="w-5 h-5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                              title="1 adet artır"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono-num text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatCurrency(item.purchasePrice)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono-num font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(item.totalValue)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(item.salePrice)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSellDirectly(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                              title="Bu ürünü doğrudan müşteriye sat (Kâr Takip sekmesinde aç)"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>Satış Yap</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditStock(item)}
                              title="Stok Kartı Düzenle"
                              className="p-1 text-slate-400 hover:text-sky-600 rounded transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => deleteStockItem(item.id)}
                                title="Stok Kartı Sil"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: YAPILAN MAL ALIM İRSALİYELERİ */}
      {activeSubTab === 'purchases' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              Mal Alım Faturaları / İrsaliyeleri ({filteredPurchases.length})
            </h3>
            <span className="text-xs text-slate-400">
              Tedarikçi borcuna işlenen toplam alım: {formatCurrency(totalPurchasesAmount)}
            </span>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Seçilen döneme ait mal alım kaydı bulunamadı
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">İrsaliye / Fatura No</th>
                    <th className="py-3 px-4">Tedarikçi Cari</th>
                    <th className="py-3 px-4">Alınan Ürün Kalemleri</th>
                    <th className="py-3 px-4">Ödeme / Vade Durumu</th>
                    <th className="py-3 px-4 text-right">Toplam Tutar</th>
                    <th className="py-3 px-4 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPurchases.map(pur => (
                    <tr
                      key={pur.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                        {formatDate(pur.date)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {pur.documentNo}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate">
                          {pur.supplierName}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                          Cari Borcuna İşlendi
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[300px]">
                        <div className="space-y-1">
                          {pur.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="truncate max-w-[200px]">
                                • {item.name} ({item.quantity} Adet)
                              </span>
                              <span className="font-mono text-slate-500">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pur.paymentType === 'Vadeli (Cari Borca Ekle)'
                              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}
                        >
                          {pur.paymentType}
                        </span>
                        {pur.dueDate && (
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            Vade: {formatDate(pur.dueDate)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-bold text-slate-900 dark:text-white whitespace-nowrap text-sm">
                        {formatCurrency(pur.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAdmin && (
                          <button
                            onClick={() => deleteStockPurchase(pur.id)}
                            title="Alım Kaydını Sil (Yönetici)"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: YENİ MAL ALIMI */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Yeni Mal Alışı (Tedarikçi İrsaliyesi / Faturası)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Alım kaydedildiğinde ürün stokları ve ilgili tedarikçinin cari borcu otomatik güncellenir.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tedarikçi Cari Firma *
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="">Tedarikçi Seçin...</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} {sup.balance !== 0 ? `(Mevcut Borç: ₺${Math.abs(sup.balance).toLocaleString('tr-TR')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İrsaliye / Fatura No *
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseDocNo}
                    onChange={e => setPurchaseDocNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alım Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ödeme Şekli *
                  </label>
                  <select
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="Vadeli (Cari Borca Ekle)">Vadeli (Tedarikçi Borcuna Ekle)</option>
                    <option value="Peşin Kasa/Banka">Peşin (Kasa / Bankadan Öde)</option>
                  </select>
                </div>
                <div>
                  {paymentType === 'Vadeli (Cari Borca Ekle)' ? (
                    <>
                      <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        Ödeme Vade Tarihi
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                        Ödeme Yapılan Hesap
                      </label>
                      <select
                        value={purchaseAccountId}
                        onChange={e => setPurchaseAccountId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (₺{acc.balance.toLocaleString('tr-TR')})
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* ÜRÜN KALEMLERİ */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-sky-500" />
                    Alınan Ürün Kalemleri ({purchaseItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-500 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Satır Ekle</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
                  {purchaseItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Ürün Adı / Modeli (Örn: Bosch Çamaşır Makinesi)..."
                            value={item.name}
                            onChange={e => handleUpdateItemLine(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                          />
                        </div>
                        <div>
                          <select
                            value={item.category}
                            onChange={e => handleUpdateItemLine(idx, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                          >
                            {productCategories.map(c => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={item.brand}
                            onChange={e => handleUpdateItemLine(idx, 'brand', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                          >
                            {productBrands.map(b => (
                              <option key={b.id} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Adet</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={e => handleUpdateItemLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Birim Alış (₺)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.unitPrice}
                            onChange={e => handleUpdateItemLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Tavsiye Satış (₺)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.salePrice || ''}
                            onChange={e => handleUpdateItemLine(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                            placeholder="Satış fiyatı"
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-3">
                          <span className="font-mono-num font-bold text-slate-900 dark:text-white">
                            {formatCurrency(item.totalPrice)}
                          </span>
                          {purchaseItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemLine(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-sky-800 dark:text-sky-300 font-semibold block">
                    Tedarikçi Cari Borcuna Eklenecek Tutar:
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Stok miktarları ve alış maliyeti otomatik işlenecektir.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono-num text-sky-700 dark:text-sky-300">
                    {formatCurrency(modalPurchaseTotalAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İrsaliye Notları / Açıklama
                </label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={e => setPurchaseNotes(e.target.value)}
                  placeholder="Sevkiyat ambar no, sipariş referansı vb..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Alışı Kaydet & Cari Borca İşle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOK KARTI DÜZENLE */}
      {isStockItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStockItem ? 'Stok Kartı Düzenle' : 'Yeni Stok Kartı Oluştur'}
              </h3>
              <button
                onClick={() => setIsStockItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ürün Adı ve Modeli *
                </label>
                <input
                  type="text"
                  required
                  value={stockItemName}
                  onChange={e => setStockItemName(e.target.value)}
                  placeholder="Bosch NoFrost Buzdolabı..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={stockItemCategory}
                    onChange={e => setStockItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {productCategories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marka
                  </label>
                  <select
                    value={stockItemBrand}
                    onChange={e => setStockItemBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {productBrands.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Adedi *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockItemQuantity}
                    onChange={e => setStockItemQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alış Maliyeti (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={stockItemPurchasePrice}
                    onChange={e => setStockItemPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1">
                    Satış Fiyatı (₺)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={stockItemSalePrice}
                    onChange={e => setStockItemSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-400 rounded-xl text-xs outline-none font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tedarikçi Firma
                </label>
                <select
                  value={stockItemSupplierId}
                  onChange={e => setStockItemSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Tedarikçi Seçin...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-sm"
                >
                  {editingStockItem ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MISSING PRODUCT MATCHING MODAL FOR PURCHASES */}
      <ProductMatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        unmatchedNames={unmatchedNamesForPurchase}
        sourceType="purchase"
        onComplete={handlePurchaseMatchComplete}
      />
    </div>
  );
};
