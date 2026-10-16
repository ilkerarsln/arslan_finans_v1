import React, { useState } from 'react';
import { StockItem, ProductCategory, ProductBrand } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Check,
  X,
  Search,
  Boxes,
  Tag,
  DollarSign,
  Layers,
} from 'lucide-react';

export interface UnmatchedImportItem {
  rawName: string;
  defaultQty?: number;
  defaultCost?: number;
  defaultSalePrice?: number;
  defaultCategory?: string;
  defaultBrand?: string;
  defaultSupplier?: string;
  rowData?: any;
}

export interface ResolvedMatchItem {
  rawName: string;
  resolvedProductId: string;
  resolvedProduct: StockItem;
  qty: number;
  costPrice: number;
  salePrice: number;
  rowData?: any;
}

interface ProductMatcherModalProps {
  isOpen: boolean;
  unmatchedItems: UnmatchedImportItem[];
  existingStock: StockItem[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  onResolve: (resolved: ResolvedMatchItem[]) => void;
  onClose: () => void;
  addStockItem: (item: Omit<StockItem, 'id'>) => StockItem;
}

export const ProductMatcherModal: React.FC<ProductMatcherModalProps> = ({
  isOpen,
  unmatchedItems,
  existingStock,
  categories,
  brands,
  onResolve,
  onClose,
  addStockItem,
}) => {
  // Map of decisions for each rawName: { mode: 'match' | 'new', selectedStockId: string, newCost: number, newPrice: number, newCategory: string, newBrand: string }
  const [decisions, setDecisions] = useState<
    Record<
      string,
      {
        mode: 'match' | 'new';
        selectedStockId: string;
        newCost: number;
        newPrice: number;
        newCategory: string;
        newBrand: string;
      }
    >
  >(() => {
    const init: Record<string, any> = {};
    unmatchedItems.forEach(item => {
      // Check if there is an exact or fuzzy match
      const lower = item.rawName.toLowerCase();
      const candidate = existingStock.find(s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase()));
      init[item.rawName] = {
        mode: candidate ? 'match' : 'new',
        selectedStockId: candidate ? candidate.id : (existingStock[0]?.id || ''),
        newCost: item.defaultCost || 0,
        newPrice: item.defaultSalePrice || (item.defaultCost ? item.defaultCost * 1.35 : 0),
        newCategory: item.defaultCategory || 'Beyaz Eşya',
        newBrand: item.defaultBrand || 'Genel',
      };
    });
    return init;
  });

  if (!isOpen || unmatchedItems.length === 0) return null;

  const handleModeChange = (rawName: string, mode: 'match' | 'new') => {
    setDecisions(prev => ({
      ...prev,
      [rawName]: {
        ...prev[rawName],
        mode,
      },
    }));
  };

  const handleStockSelect = (rawName: string, stockId: string) => {
    const stock = existingStock.find(s => s.id === stockId);
    setDecisions(prev => ({
      ...prev,
      [rawName]: {
        ...prev[rawName],
        selectedStockId: stockId,
        newCost: stock ? stock.purchasePrice : prev[rawName]?.newCost || 0,
        newPrice: stock ? stock.salePrice : prev[rawName]?.newPrice || 0,
      },
    }));
  };

  const handleFieldChange = (
    rawName: string,
    field: 'newCost' | 'newPrice' | 'newCategory' | 'newBrand',
    val: any
  ) => {
    setDecisions(prev => ({
      ...prev,
      [rawName]: {
        ...prev[rawName],
        [field]: val,
      },
    }));
  };

  const handleConfirmResolutions = () => {
    const resolvedList: ResolvedMatchItem[] = [];

    unmatchedItems.forEach(item => {
      const dec = decisions[item.rawName];
      const qty = item.defaultQty || 1;

      if (dec?.mode === 'match') {
        const matchedStock = existingStock.find(s => s.id === dec.selectedStockId) || existingStock[0];
        resolvedList.push({
          rawName: item.rawName,
          resolvedProductId: matchedStock.id,
          resolvedProduct: matchedStock,
          qty,
          costPrice: matchedStock.purchasePrice || dec.newCost,
          salePrice: matchedStock.salePrice || dec.newPrice,
          rowData: item.rowData,
        });
      } else {
        // Create as new stock item on the fly
        const cost = Number(dec?.newCost) || 0;
        const price = Number(dec?.newPrice) || cost * 1.35;
        const newProduct = addStockItem({
          name: item.rawName.trim(),
          category: dec?.newCategory || 'Beyaz Eşya',
          brand: dec?.newBrand || 'Genel',
          quantity: 0,
          unit: 'Adet',
          purchasePrice: cost,
          totalValue: 0,
          salePrice: price,
          notes: 'Excel yüklemesi sırasında anlık tanımlandı',
        });

        resolvedList.push({
          rawName: item.rawName,
          resolvedProductId: newProduct.id,
          resolvedProduct: newProduct,
          qty,
          costPrice: cost,
          salePrice: price,
          rowData: item.rowData,
        });
      }
    });

    onResolve(resolvedList);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Eksik Ürün Eşleştirme & Fiyat Tanımlama
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Yüklenen Excel dosyasındaki {unmatchedItems.length} ürün mevcut stok/fiyat listesinde bulunamadı.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
            <strong>Nasıl Çalışır?</strong> Her ürün için sistemdeki mevcut bir ürünü seçebilir ("Mevcutla Eşleştir") veya anlık olarak birim maliyet/satış fiyatı girerek sisteme kaydedebilirsiniz ("Fiyat Gir & Yeni Kaydet").
          </div>

          <div className="space-y-3">
            {unmatchedItems.map((item, idx) => {
              const dec = decisions[item.rawName] || {
                mode: 'new',
                selectedStockId: existingStock[0]?.id || '',
                newCost: item.defaultCost || 0,
                newPrice: item.defaultSalePrice || 0,
                newCategory: 'Beyaz Eşya',
                newBrand: 'Genel',
              };

              return (
                <div
                  key={`${item.rawName}-${idx}`}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Excel'deki Ürün Adı #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {item.rawName}
                      </h4>
                      {item.defaultQty && (
                        <span className="text-xs text-slate-400 font-mono">
                          Miktar: {item.defaultQty} Adet
                        </span>
                      )}
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => handleModeChange(item.rawName, 'match')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          dec.mode === 'match'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Mevcutla Eşleştir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange(item.rawName, 'new')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          dec.mode === 'new'
                            ? 'bg-blue-500 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fiyat Gir & Yeni Kaydet</span>
                      </button>
                    </div>
                  </div>

                  {dec.mode === 'match' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Eşleştirilecek Mevcut Ürün
                        </label>
                        <select
                          value={dec.selectedStockId}
                          onChange={e => handleStockSelect(item.rawName, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {existingStock.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.category} · {s.brand || '-'} · Maliyet: {formatCurrency(s.purchasePrice)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        {(() => {
                          const s = existingStock.find(st => st.id === dec.selectedStockId);
                          if (!s) return 'Seçilen ürün bilgisi yüklenemedi.';
                          return (
                            <div className="flex items-center justify-between">
                              <span>Birim Alış: <strong className="text-white font-mono">{formatCurrency(s.purchasePrice)}</strong></span>
                              <span>Satış: <strong className="text-emerald-400 font-mono">{formatCurrency(s.salePrice)}</strong></span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Kategori
                        </label>
                        <select
                          value={dec.newCategory}
                          onChange={e => handleFieldChange(item.rawName, 'newCategory', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Marka
                        </label>
                        <select
                          value={dec.newBrand}
                          onChange={e => handleFieldChange(item.rawName, 'newBrand', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Genel">Genel</option>
                          {brands.map(b => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Birim Alış Maliyeti (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dec.newCost || ''}
                          onChange={e => handleFieldChange(item.rawName, 'newCost', Number(e.target.value))}
                          placeholder="Maliyet"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Birim Satış Fiyatı (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dec.newPrice || ''}
                          onChange={e => handleFieldChange(item.rawName, 'newPrice', Number(e.target.value))}
                          placeholder="Satış Fiyatı"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {unmatchedItems.length} ürün eşleştirildiğinde kayıtlar otomatik aktarılacaktır.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Vazgeç
            </button>
            <button
              onClick={handleConfirmResolutions}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Eşleştirmeleri Onayla & Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
