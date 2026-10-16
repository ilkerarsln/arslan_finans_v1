import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { db, auth } from '../../firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import {
  Sparkles,
  Link as LinkIcon,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShoppingCart,
  Boxes,
  X,
  Check,
  CreditCard,
  Building,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
  Tag,
  DollarSign,
  Percent,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StockItem, SaleType, SaleRecord } from '../../types/finance';
import * as XLSX from 'xlsx';

export interface SalesLineItem {
  id: string;
  rawCode?: string;
  rawName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  kdvRate: number;
  category: string;
  status: 'matched' | 'unmatched' | 'missing_price';
  matchedStockId?: string;
  matchedStockName?: string;
  notes?: string;
}

export const SmartSalesMatching: React.FC<{
  onClose?: () => void;
  onSaleCompleted?: (saleId: string) => void;
}> = ({ onClose, onSaleCompleted }) => {
  const {
    stockItems,
    caris,
    accounts,
    productCategories,
    addStockItem,
    addSaleRecord,
    getVadeRateForMonth,
    userProfile,
    user,
    showToast,
  } = useFinance();

  const dataStoreUid = userProfile?.uid || user?.uid || 'guest-admin';

  // Sales Order Meta
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [salesPerson, setSalesPerson] = useState<string>(
    userProfile?.displayName || userProfile?.username || 'Satış Temsilcisi'
  );
  const [saleType, setSaleType] = useState<SaleType>('Peşin');
  const [installmentsCount, setInstallmentsCount] = useState<number>(6);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Initial Sample Sales Items demonstrating detection
  const [lineItems, setLineItems] = useState<SalesLineItem[]>([
    {
      id: 'item-1',
      rawCode: 'BE-BOS-001',
      rawName: 'Bosch No-Frost Çift Kapılı Buzdolabı',
      quantity: 1,
      costPrice: 24500,
      salePrice: 34900,
      kdvRate: 20,
      category: 'Beyaz Eşya',
      status: 'matched',
    },
    {
      id: 'item-2',
      rawCode: 'MOB-KOL-999',
      rawName: 'İtalyan Nubuk Köşe Koltuk Takımı Gri (Bilinmeyen Kod)',
      quantity: 1,
      costPrice: 0,
      salePrice: 0,
      kdvRate: 10,
      category: 'Mobilya',
      status: 'unmatched', // Not in catalog!
    },
  ]);

  // Modals state
  // 1. Match Modal State
  const [matchingItem, setMatchingItem] = useState<SalesLineItem | null>(null);
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // 2. Quick Add & Price Modal State
  const [quickAddItem, setQuickAddItem] = useState<SalesLineItem | null>(null);
  const [qaCode, setQaCode] = useState('');
  const [qaName, setQaName] = useState('');
  const [qaCategory, setQaCategory] = useState('Beyaz Eşya');
  const [qaCostPrice, setQaCostPrice] = useState<number>(0);
  const [qaSalePrice, setQaSalePrice] = useState<number>(0);
  const [qaKdvRate, setQaKdvRate] = useState<number>(20);
  const [qaInitialStock, setQaInitialStock] = useState<number>(5);

  // New item manual add inputs
  const [newRawName, setNewRawName] = useState('');
  const [newRawCode, setNewRawCode] = useState('');
  const [newRawQty, setNewRawQty] = useState<number>(1);
  const [newRawPrice, setNewRawPrice] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Intelligent Automatic Match Detector
  const detectMatch = (code?: string, name?: string): { isMatched: boolean; stock?: StockItem } => {
    if (!name && !code) return { isMatched: false };

    const normCode = code ? code.toLowerCase().trim() : '';
    const normName = name ? name.toLowerCase().trim() : '';

    // 1. Exact code match
    if (normCode) {
      const byCode = stockItems.find(s => s.code && s.code.toLowerCase().trim() === normCode);
      if (byCode) return { isMatched: true, stock: byCode };
    }

    // 2. Exact name match
    if (normName) {
      const byName = stockItems.find(s => s.name.toLowerCase().trim() === normName);
      if (byName) return { isMatched: true, stock: byName };
    }

    // 3. Normalized fuzzy / containment match
    if (normName.length > 5) {
      const byFuzzy = stockItems.find(s => {
        const sNorm = s.name.toLowerCase().trim();
        return sNorm.includes(normName) || normName.includes(sNorm);
      });
      if (byFuzzy) return { isMatched: true, stock: byFuzzy };
    }

    return { isMatched: false };
  };

  // Re-run match detection whenever stockItems or lineItems change
  useEffect(() => {
    setLineItems(prev =>
      prev.map(item => {
        // If already matched and matchedStockId is present, verify it still exists
        if (item.matchedStockId) {
          const currentStock = stockItems.find(s => s.id === item.matchedStockId);
          if (currentStock) {
            return {
              ...item,
              status: item.salePrice > 0 ? 'matched' : 'missing_price',
              matchedStockName: currentStock.name,
              costPrice: item.costPrice > 0 ? item.costPrice : currentStock.purchasePrice,
            };
          }
        }

        // Run auto-match
        const { isMatched, stock } = detectMatch(item.rawCode, item.rawName);
        if (isMatched && stock) {
          return {
            ...item,
            status: (item.salePrice > 0 || stock.salePrice > 0) ? 'matched' : 'missing_price',
            matchedStockId: stock.id,
            matchedStockName: stock.name,
            costPrice: item.costPrice > 0 ? item.costPrice : stock.purchasePrice,
            salePrice: item.salePrice > 0 ? item.salePrice : stock.salePrice,
            category: item.category || stock.category,
            kdvRate: item.kdvRate || stock.kdvRate || 20,
          };
        } else {
          return {
            ...item,
            status: 'unmatched',
            matchedStockId: undefined,
            matchedStockName: undefined,
          };
        }
      })
    );
  }, [stockItems]);

  // Statistics
  const unmatchedCount = lineItems.filter(i => i.status === 'unmatched').length;
  const missingPriceCount = lineItems.filter(i => i.status === 'missing_price').length;
  const isAllValid = unmatchedCount === 0 && missingPriceCount === 0 && lineItems.length > 0;

  // Financial calculations
  const currentMonthKey = saleDate.slice(0, 7);
  const monthlyVadeRate = getVadeRateForMonth(currentMonthKey) || 3.5;

  const totals = useMemo(() => {
    let rawTotalSale = 0;
    let rawTotalCost = 0;

    lineItems.forEach(item => {
      const lineSale = item.salePrice * item.quantity;
      const lineCost = item.costPrice * item.quantity;
      rawTotalSale += lineSale;
      rawTotalCost += lineCost;
    });

    let effectiveCost = rawTotalCost;
    let vadeDiff = 0;

    if (saleType === 'Senetli Satış' && installmentsCount > 0) {
      vadeDiff = rawTotalCost * (monthlyVadeRate / 100) * (installmentsCount / 12);
      effectiveCost = rawTotalCost + vadeDiff;
    }

    const netProfit = rawTotalSale - effectiveCost;
    const profitMargin = rawTotalSale > 0 ? (netProfit / rawTotalSale) * 100 : 0;

    return {
      rawTotalSale,
      rawTotalCost,
      vadeDiff,
      effectiveCost,
      netProfit,
      profitMargin,
    };
  }, [lineItems, saleType, installmentsCount, monthlyVadeRate]);

  // ACTION 1: Open Match Modal
  const handleOpenMatchModal = (item: SalesLineItem) => {
    setMatchingItem(item);
    setMatchSearchQuery(item.rawName || item.rawCode || '');
    setSelectedCategoryFilter('ALL');
  };

  // Complete Matching with Existing Stock
  const handleConfirmMatch = (stock: StockItem) => {
    if (!matchingItem) return;

    setLineItems(prev =>
      prev.map(i => {
        if (i.id === matchingItem.id) {
          return {
            ...i,
            matchedStockId: stock.id,
            matchedStockName: stock.name,
            costPrice: stock.purchasePrice,
            salePrice: i.salePrice > 0 ? i.salePrice : stock.salePrice,
            category: stock.category,
            kdvRate: stock.kdvRate || 20,
            status: (i.salePrice > 0 || stock.salePrice > 0) ? 'matched' : 'missing_price',
          };
        }
        return i;
      })
    );

    showToast(`"${matchingItem.rawName}" ürünü "${stock.name}" stok kartı ile eşleştirildi.`, 'success');
    setMatchingItem(null);
  };

  // ACTION 2: Open Quick Add & Price Modal
  const handleOpenQuickAddModal = (item: SalesLineItem) => {
    setQuickAddItem(item);
    setQaCode(item.rawCode || `STK-${Date.now().toString().slice(-4)}`);
    setQaName(item.rawName);
    setQaCategory(item.category || 'Beyaz Eşya');
    setQaCostPrice(item.costPrice || 0);
    setQaSalePrice(item.salePrice || 0);
    setQaKdvRate(item.kdvRate || 20);
    setQaInitialStock(5);
  };

  // Submit Quick Add & Price: Write to Firestore + Catalog + Link to Line Item
  const handleSaveQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddItem || !qaName.trim() || qaSalePrice <= 0) {
      showToast('Lütfen geçerli ürün adı ve satış fiyatı giriniz.', 'error');
      return;
    }

    try {
      const newStockId = `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newStock: StockItem = {
        id: newStockId,
        code: qaCode.trim() || undefined,
        name: qaName.trim(),
        category: qaCategory,
        quantity: qaInitialStock,
        unit: 'Adet',
        purchasePrice: qaCostPrice,
        totalValue: +(qaInitialStock * qaCostPrice).toFixed(2),
        salePrice: qaSalePrice,
        kdvRate: qaKdvRate,
        lastPurchaseDate: saleDate,
        notes: 'Akıllı Satış Eşleştirme ile Hızlı Eklendi',
      };

      // 1. Write to Firestore if authenticated
      if (auth.currentUser && dataStoreUid) {
        try {
          const docRef = doc(db, 'users', dataStoreUid, 'stocks', newStockId);
          await setDoc(docRef, newStock);
        } catch (fErr) {
          console.warn('Firestore offline fallback save notice:', fErr);
        }
      }

      // 2. Add to FinanceContext catalog
      addStockItem(newStock);

      // 3. Link directly to current line item
      setLineItems(prev =>
        prev.map(i => {
          if (i.id === quickAddItem.id) {
            return {
              ...i,
              rawName: qaName.trim(),
              rawCode: qaCode.trim(),
              costPrice: qaCostPrice,
              salePrice: qaSalePrice,
              kdvRate: qaKdvRate,
              category: qaCategory,
              matchedStockId: newStockId,
              matchedStockName: qaName.trim(),
              status: 'matched',
            };
          }
          return i;
        })
      );

      showToast(`"${qaName}" yeni ürün kataloğuna kaydedildi ve satışa bağlandı!`, 'success');
      setQuickAddItem(null);
    } catch (err: any) {
      console.error('Quick Add error:', err);
      showToast(`Ürün eklenirken hata: ${err?.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

  // Manual Add Line Item
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawName.trim()) return;

    const newItem: SalesLineItem = {
      id: `line-${Date.now()}`,
      rawCode: newRawCode.trim() || undefined,
      rawName: newRawName.trim(),
      quantity: newRawQty || 1,
      costPrice: 0,
      salePrice: newRawPrice || 0,
      kdvRate: 20,
      category: 'Beyaz Eşya',
      status: 'unmatched',
    };

    setLineItems(prev => [newItem, ...prev]);
    setNewRawName('');
    setNewRawCode('');
    setNewRawQty(1);
    setNewRawPrice(0);
    showToast('Ürün satış listesine eklendi, eşleşme kontrol ediliyor...', 'info');
  };

  // Excel Sales Order Import
  const handleImportExcelSales = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length === 0) {
        showToast('Dosya boş!', 'error');
        return;
      }

      const importedItems: SalesLineItem[] = rows.map((r, idx) => {
        const rawName = r.urunAdi || r.UrunAdi || r['Ürün Adı'] || r.malzeme || `Ürün ${idx + 1}`;
        const rawCode = r.stokKodu || r.StokKodu || r['Stok Kodu'] || r.kod || undefined;
        const qty = Number(r.miktar || r.adet || r.quantity || 1) || 1;
        const price = Number(r.fiyat || r.satisFiyati || r['Satış Fiyatı'] || 0) || 0;

        return {
          id: `imp-${Date.now()}-${idx}`,
          rawCode,
          rawName,
          quantity: qty,
          costPrice: 0,
          salePrice: price,
          kdvRate: 20,
          category: r.kategori || 'Beyaz Eşya',
          status: 'unmatched',
        };
      });

      setLineItems(prev => [...importedItems, ...prev]);
      showToast(`${importedItems.length} kalem satış listesine aktarıldı. Otomatik eşleşme başlatıldı.`, 'success');
    } catch (err: any) {
      console.error('Import error:', err);
      showToast('Excel dosyası işlenirken hata oluştu', 'error');
    }
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  // Update Item field inline
  const handleUpdateItem = (id: string, field: keyof SalesLineItem, val: any) => {
    setLineItems(prev =>
      prev.map(i => {
        if (i.id === id) {
          const updated = { ...i, [field]: val };
          if (field === 'salePrice') {
            updated.status = val > 0 && updated.matchedStockId ? 'matched' : (updated.matchedStockId ? 'missing_price' : 'unmatched');
          }
          return updated;
        }
        return i;
      })
    );
  };

  // Finalize Sale
  const handleFinalizeSale = async () => {
    if (!isAllValid) {
      showToast('Lütfen önce tüm eksik ve eşleşmemiş ürünleri eşleştiriniz veya fiyat giriniz!', 'error');
      return;
    }

    if (!customerName.trim()) {
      showToast('Lütfen bir müşteri adı giriniz veya seçiniz.', 'error');
      return;
    }

    try {
      const saleId = `sale-${Date.now()}`;
      const batch = writeBatch(db);

      // Create individual SaleRecords
      for (const item of lineItems) {
        const newSale: Omit<SaleRecord, 'id' | 'createdAt'> = {
          date: saleDate,
          customerName: customerName.trim(),
          customerId: selectedCustomerId || undefined,
          productId: item.matchedStockId,
          productName: item.rawName,
          category: item.category,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalCost: +(item.costPrice * item.quantity).toFixed(2),
          saleType: saleType,
          installmentsCount: saleType === 'Senetli Satış' ? installmentsCount : undefined,
          vadeRateMonthly: saleType === 'Senetli Satış' ? monthlyVadeRate : undefined,
          vadeFarkiAmount: saleType === 'Senetli Satış' ? +( (item.costPrice * item.quantity) * (monthlyVadeRate / 100) * (installmentsCount / 12) ).toFixed(2) : 0,
          effectiveCost: saleType === 'Senetli Satış'
            ? +( (item.costPrice * item.quantity) + ((item.costPrice * item.quantity) * (monthlyVadeRate / 100) * (installmentsCount / 12)) ).toFixed(2)
            : +(item.costPrice * item.quantity).toFixed(2),
          salePrice: item.salePrice,
          totalSaleAmount: +(item.salePrice * item.quantity).toFixed(2),
          netProfit: +( (item.salePrice * item.quantity) - (item.costPrice * item.quantity) ).toFixed(2),
          profitMargin: +( (( (item.salePrice * item.quantity) - (item.costPrice * item.quantity) ) / (item.salePrice * item.quantity)) * 100 ).toFixed(1),
          salesPerson: salesPerson,
          accountId: selectedAccountId || undefined,
        };

        // Write to Firestore if authenticated
        if (auth.currentUser && dataStoreUid) {
          try {
            const docRef = doc(db, 'users', dataStoreUid, 'sales', `${saleId}-${item.id}`);
            batch.set(docRef, { ...newSale, id: `${saleId}-${item.id}`, createdAt: new Date().toISOString() });
          } catch (bErr) {
            console.warn('Batch write notice:', bErr);
          }
        }

        // Add to FinanceContext
        addSaleRecord(newSale);
      }

      if (auth.currentUser && dataStoreUid) {
        try {
          await batch.commit();
        } catch (cErr) {
          console.warn('Commit notice:', cErr);
        }
      }

      showToast(`Satış başarıyla onaylandı ve kaydedildi! (Toplam Ciro: ${formatCurrency(totals.rawTotalSale)})`, 'success');
      if (onSaleCompleted) {
        onSaleCompleted(saleId);
      }
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Finalize sale error:', err);
      showToast(`Satış kaydedilirken hata: ${err?.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

  // Filtered Stock Catalog for Match Search Dialog
  const searchableStocks = useMemo(() => {
    return stockItems.filter(s => {
      if (selectedCategoryFilter !== 'ALL' && s.category !== selectedCategoryFilter) return false;
      if (matchSearchQuery.trim()) {
        const q = matchSearchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.code?.toLowerCase().includes(q);
        const matchBrand = s.brand?.toLowerCase().includes(q);
        return matchName || matchCode || matchBrand;
      }
      return true;
    });
  }, [stockItems, matchSearchQuery, selectedCategoryFilter]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-w-6xl w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-linear-to-r from-emerald-500/10 via-sky-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Akıllı Satış Yönetimi & Eksik Ürün Eşleştirme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stokta bulunamayan veya kodu eksik ürünleri tespit edin, tek tıkla eşleştirin veya anında fiyat girin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcelSales}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/40 border border-sky-200 dark:border-sky-800 rounded-xl transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Excel Satış Listesi Yükle</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Sale Meta Information Bar */}
      <div className="p-4 sm:p-6 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Satış Tarihi
          </label>
          <input
            type="date"
            value={saleDate}
            onChange={e => setSaleDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Müşteri (Cari)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Müşteri Adı Soyadı..."
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Satış Şekli
          </label>
          <select
            value={saleType}
            onChange={e => setSaleType(e.target.value as SaleType)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-semibold"
          >
            <option value="Peşin">Peşin (Nakit / Havale)</option>
            <option value="Kredi Kartı">Kredi Kartı (Tek Çekim)</option>
            <option value="Senetli Satış">Senetli Satış (Taksitli Vade)</option>
          </select>
        </div>

        {saleType === 'Senetli Satış' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Taksit Sayısı & Vade Farkı
            </label>
            <div className="flex items-center gap-2">
              <select
                value={installmentsCount}
                onChange={e => setInstallmentsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value={3}>3 Taksit</option>
                <option value={6}>6 Taksit</option>
                <option value={9}>9 Taksit</option>
                <option value={12}>12 Taksit</option>
                <option value={18}>18 Taksit</option>
                <option value={24}>24 Taksit</option>
              </select>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                %{monthlyVadeRate}/ay
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Tahsilat Hesabı / Kasa
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            >
              <option value="">-- Kasa / Banka Seçiniz --</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Manual Quick Add Item Strip */}
      <form
        onSubmit={handleAddManualItem}
        className="p-4 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs"
      >
        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          <PlusCircle className="w-4 h-4 text-sky-500" /> Hızlı Kalem Ekle:
        </span>
        <input
          type="text"
          placeholder="Stok Kodu (İsteğe bağlı)"
          value={newRawCode}
          onChange={e => setNewRawCode(e.target.value)}
          className="w-32 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden"
        />
        <input
          type="text"
          required
          placeholder="Ürün Adı / Açıklaması..."
          value={newRawName}
          onChange={e => setNewRawName(e.target.value)}
          className="flex-1 min-w-[200px] px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden"
        />
        <input
          type="number"
          min={1}
          placeholder="Adet"
          value={newRawQty}
          onChange={e => setNewRawQty(Number(e.target.value))}
          className="w-16 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden"
        />
        <input
          type="number"
          min={0}
          placeholder="Satış Fiyatı (₺)"
          value={newRawPrice || ''}
          onChange={e => setNewRawPrice(Number(e.target.value))}
          className="w-28 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden"
        />
        <button
          type="submit"
          className="px-4 py-1.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs"
        >
          Listeye Ekle
        </button>
      </form>

      {/* Unmatched Alert Warning Banner */}
      {unmatchedCount > 0 && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                Tespit Edilen {unmatchedCount} Eksik / Eşleşmeyen Ürün Bulunmaktadır!
              </h4>
              <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                Aşağıdaki listede kırmızı renkle işaretli ürünler stok sisteminizde kayıtlı değildir. Satışı tamamlayabilmek için satırdaki <strong>"Eşleştir"</strong> veya <strong>"Hızlı Fiyat Gir & Ürün Aç"</strong> butonlarını kullanarak ürünleri sisteme bağlayınız.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Sales Lines with Matching Badges & Inline Actions */}
      <div className="p-6 overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3 px-4">Durum</th>
              <th className="py-3 px-4">Stok Kodu / Barkod</th>
              <th className="py-3 px-4">Ürün Adı</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4 text-center">Miktar</th>
              <th className="py-3 px-4 text-right">Alış (Maliyet)</th>
              <th className="py-3 px-4 text-right">Birim Satış</th>
              <th className="py-3 px-4 text-right">Toplam Satış</th>
              <th className="py-3 px-4 text-center">Eşleştirme & Hızlı Aksiyon</th>
              <th className="py-3 px-4 text-center">Sil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  Satış listesinde henüz ürün bulunmamaktadır. Yukarıdan manuel ürün ekleyin veya Excel yükleyin.
                </td>
              </tr>
            ) : (
              lineItems.map(item => {
                const isMatched = item.status === 'matched';
                const isMissingPrice = item.status === 'missing_price';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isMatched
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        : isMissingPrice
                        ? 'bg-amber-50/50 dark:bg-amber-950/20'
                        : 'bg-rose-50/50 dark:bg-rose-950/20'
                    }`}
                  >
                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {isMatched ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Eşleşti
                        </span>
                      ) : isMissingPrice ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Fiyat Girilmemiş
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                          <X className="w-3 h-3 text-rose-600" /> Eksik / Eşleşmedi
                        </span>
                      )}
                    </td>

                    {/* Stock Code */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {item.rawCode || <span className="text-slate-400 italic">Kodsul</span>}
                    </td>

                    {/* Product Name & Subtext */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-white">
                        {item.rawName}
                      </div>
                      {item.matchedStockName && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" /> Bağlı Stok: {item.matchedStockName}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {item.category || 'Beyaz Eşya'}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        className="w-16 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-hidden"
                      />
                    </td>

                    {/* Cost Price */}
                    <td className="py-3.5 px-4 text-right text-slate-500 font-medium">
                      {formatCurrency(item.costPrice)}
                    </td>

                    {/* Unit Sale Price */}
                    <td className="py-3.5 px-4 text-right">
                      <input
                        type="number"
                        min={0}
                        value={item.salePrice || ''}
                        onChange={e => handleUpdateItem(item.id, 'salePrice', Number(e.target.value))}
                        className={`w-28 px-2 py-1 text-right font-bold bg-white dark:bg-slate-900 border rounded-lg focus:outline-hidden ${
                          item.salePrice <= 0
                            ? 'border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-400/20'
                            : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white'
                        }`}
                      />
                    </td>

                    {/* Total Sale */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-white">
                      {formatCurrency(item.salePrice * item.quantity)}
                    </td>

                    {/* Smart Action Buttons: Match OR Quick Add & Price */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenMatchModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl text-sky-700 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 border border-sky-300 dark:border-sky-800 transition-colors shadow-2xs"
                          title="Sistemdeki mevcut başka bir ürünle eşleştir"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Eşleştir</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenQuickAddModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-colors shadow-2xs"
                          title="Yeni ürün açarak anlık fiyat ve maliyet tanımla"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Hızlı Fiyat Gir</span>
                        </button>
                      </div>
                    </td>

                    {/* Delete */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer & Finalize Bar */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Toplam Satış Cirosu</span>
            <span className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(totals.rawTotalSale)}</span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">
              {saleType === 'Senetli Satış' ? 'Efektif Maliyet (Vade Dahil)' : 'Toplam Ürün Maliyeti'}
            </span>
            <span className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(totals.effectiveCost)}</span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Net Kâr</span>
            <span className={`text-lg font-bold ${totals.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(totals.netProfit)}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Kâr Marjı</span>
            <span className="text-lg font-bold text-sky-600 dark:text-sky-400">%{totals.profitMargin.toFixed(1)}</span>
          </div>
        </div>

        {/* Finalize Button */}
        <div className="flex flex-col items-end gap-2">
          {!isAllValid && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              * Satışı tamamlamak için {unmatchedCount + missingPriceCount} adet eksik/fiyatsız kalemi gideriniz.
            </span>
          )}

          <button
            type="button"
            disabled={!isAllValid}
            onClick={handleFinalizeSale}
            className="flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl transition-all shadow-lg shadow-emerald-600/30"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Satışı Onayla ve Kaydet ({formatCurrency(totals.rawTotalSale)})</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: EŞLEŞTİR (MATCH) MODAL */}
      {matchingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-sky-500" />
                  Mevcut Stok Kartı İle Eşleştir
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aranan: <strong className="text-sky-600 dark:text-sky-400">{matchingItem.rawName}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMatchingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Stok adı, kodu veya markaya göre ara..."
                  value={matchSearchQuery}
                  onChange={e => setMatchSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="ALL">Tüm Kategoriler</option>
                {productCategories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-2xl p-2">
              {searchableStocks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Eşleşen stok bulunamadı. "Hızlı Fiyat Gir" seçeneğiyle yeni ürün kartı açabilirsiniz.
                </div>
              ) : (
                searchableStocks.map(stock => (
                  <div
                    key={stock.id}
                    onClick={() => handleConfirmMatch(stock)}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {stock.code && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                            {stock.code}
                          </span>
                        )}
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {stock.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {stock.category} • Stok: <strong>{stock.quantity} adet</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(stock.salePrice)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Maliyet: {formatCurrency(stock.purchasePrice)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 mt-4">
              <button
                type="button"
                onClick={() => setMatchingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HIZLI FİYAT GİR / YENİ ÜRÜN AÇ (QUICK ADD & PRICE) */}
      {quickAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-500" />
                  Hızlı Fiyat Gir & Yeni Ürün Kartı Aç
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bu ürünü anında hem stok kataloğuna kaydedin hem de satışa bağlayın.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setQuickAddItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  required
                  value={qaName}
                  onChange={e => setQaName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Stok Kodu / Barkod
                  </label>
                  <input
                    type="text"
                    value={qaCode}
                    onChange={e => setQaCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Kategori
                  </label>
                  <select
                    value={qaCategory}
                    onChange={e => setQaCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    {productCategories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Alış Fiyatı (Maliyet ₺)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={qaCostPrice}
                    onChange={e => setQaCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Perakende Satış Fiyatı (₺) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={qaSalePrice}
                    onChange={e => setQaSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-emerald-400 rounded-xl focus:outline-hidden font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    KDV Oranı (%)
                  </label>
                  <select
                    value={qaKdvRate}
                    onChange={e => setQaKdvRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value={20}>%20 (Standart Beyaz Eşya)</option>
                    <option value={10}>%10 (Mobilya)</option>
                    <option value={1}>%1</option>
                    <option value={0}>%0 (Muaf)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Açılış Stok Adedi
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={qaInitialStock}
                    onChange={e => setQaInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuickAddItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-md shadow-emerald-600/20"
                >
                  Kataloğa Kaydet ve Satışa Bağla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
