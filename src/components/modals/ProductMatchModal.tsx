import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  Search,
  X,
  Sparkles,
} from 'lucide-react';

export interface UnmatchedResolution {
  action: 'match' | 'create_new';
  matchedProductId?: string;
  productName: string;
  category: string;
  subCategory?: string;
  brand?: string;
  costPrice: number;
  salePrice: number;
  addToStockCatalog: boolean;
}

interface ProductMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  unmatchedNames: string[];
  sourceType: 'sale' | 'purchase';
  onComplete: (resolutions: Record<string, UnmatchedResolution>) => void;
}

export const ProductMatchModal: React.FC<ProductMatchModalProps> = ({
  isOpen,
  onClose,
  unmatchedNames,
  onComplete,
}) => {
  const {
    stockItems,
    productCategories,
    productSubCategories,
    productBrands,
    addStockItem,
    showToast,
  } = useFinance();

  const [resolutions, setResolutions] = useState<Record<string, UnmatchedResolution>>(() => {
    const initial: Record<string, UnmatchedResolution> = {};
    unmatchedNames.forEach(rawName => {
      const lower = rawName.toLowerCase();
      const directMatch = stockItems.find(
        s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())
      );
      
      let defaultCat = 'Beyaz Eşya';
      if (lower.includes('koltuk') || lower.includes('yatak') || lower.includes('dolap') || lower.includes('sehpa')) {
        defaultCat = 'Mobilya';
      }

      initial[rawName] = {
        action: directMatch ? 'match' : 'create_new',
        matchedProductId: directMatch?.id,
        productName: directMatch ? directMatch.name : rawName,
        category: directMatch ? directMatch.category : defaultCat,
        subCategory: directMatch?.subCategory || 'Buzdolabı',
        brand: directMatch?.brand || 'Bosch',
        costPrice: directMatch ? directMatch.purchasePrice : 0,
        salePrice: directMatch ? directMatch.salePrice : 0,
        addToStockCatalog: true,
      };
    });
    return initial;
  });

  const [activeSearchTerms, setActiveSearchTerms] = useState<Record<string, string>>({});

  if (!isOpen || unmatchedNames.length === 0) return null;

  const handleResolutionChange = (rawName: string, updates: Partial<UnmatchedResolution>) => {
    setResolutions(prev => ({
      ...prev,
      [rawName]: {
        ...prev[rawName],
        ...updates,
      },
    }));
  };

  const handleSelectExisting = (rawName: string, productId: string) => {
    const item = stockItems.find(s => s.id === productId);
    if (!item) return;
    handleResolutionChange(rawName, {
      action: 'match',
      matchedProductId: item.id,
      productName: item.name,
      category: item.category,
      subCategory: item.subCategory,
      brand: item.brand,
      costPrice: item.purchasePrice,
      salePrice: item.salePrice,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    for (const rawName of unmatchedNames) {
      const res = resolutions[rawName];
      if (!res) continue;
      if (res.action === 'match' && !res.matchedProductId) {
        showToast(`Lütfen "${rawName}" için eşleştirilecek ürünü seçin.`, 'error');
        return;
      }
      if (res.action === 'create_new' && (!res.costPrice || res.costPrice <= 0) && (!res.salePrice || res.salePrice <= 0)) {
        showToast(`Lütfen "${rawName}" için geçerli maliyet veya satış fiyatı girin.`, 'error');
        return;
      }
    }

    unmatchedNames.forEach(rawName => {
      const res = resolutions[rawName];
      if (res && res.action === 'create_new' && res.addToStockCatalog) {
        const exists = stockItems.some(s => s.name.toLowerCase() === res.productName.toLowerCase());
        if (!exists) {
          addStockItem({
            name: res.productName,
            category: res.category,
            subCategory: res.subCategory,
            brand: res.brand,
            purchasePrice: Number(res.costPrice) || 0,
            salePrice: Number(res.salePrice) || 0,
            quantity: 0,
            unit: 'Adet',
            totalValue: 0,
            notes: 'Eksik ürün eşleştirme ile anlık tanımlandı',
          });
        }
      }
    });

    showToast('Tüm eksik ürünler başarıyla eşleştirildi ve fiyatlandırıldı!', 'success');
    onComplete(resolutions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Eksik Ürün Eşleştirme ve Fiyat Belirleme
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Yüklenen Excel dosyasında ana stok/fiyat listesinde doğrudan bulunamayan{' '}
              <strong className="text-amber-600 dark:text-amber-400">{unmatchedNames.length} ürün</strong> tespit edildi.
              Sistem hata vermek yerine mevcut ürünle eşleştirmenize veya anlık fiyat girerek devam etmenize olanak tanır.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Items Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {unmatchedNames.map((rawName, idx) => {
            const res = resolutions[rawName] || {
              action: 'create_new',
              productName: rawName,
              category: 'Beyaz Eşya',
              subCategory: 'Buzdolabı',
              brand: 'Bosch',
              costPrice: 0,
              salePrice: 0,
              addToStockCatalog: true,
            };

            const searchTerm = activeSearchTerms[rawName] || '';

            return (
              <div
                key={rawName + idx}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 space-y-3"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Gelen Kayıt Adı
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {rawName}
                      </span>
                    </div>
                  </div>

                  {/* Action Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleResolutionChange(rawName, { action: 'match' })}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                        res.action === 'match'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Mevcutla Eşleştir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolutionChange(rawName, { action: 'create_new' })}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                        res.action === 'create_new'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fiyat Gir & Yeni Kaydet</span>
                    </button>
                  </div>
                </div>

                {/* Option 1: Match Existing */}
                {res.action === 'match' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Mevcut stokta ara (isim, kod, marka)..."
                          value={searchTerm}
                          onChange={e =>
                            setActiveSearchTerms(prev => ({ ...prev, [rawName]: e.target.value }))
                          }
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <select
                        value={res.matchedProductId || ''}
                        onChange={e => handleSelectExisting(rawName, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Eşleşecek Ürünü Seçin --</option>
                        {stockItems.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.category} • {s.brand} • Alış: ₺{s.purchasePrice} • Satış: ₺{s.salePrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    {res.matchedProductId && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Eşleşen Ürün: <strong>{res.productName}</strong> | Kategori:{' '}
                          <strong>{res.category}</strong> | Alış: <strong>₺{res.costPrice}</strong> | Satış:{' '}
                          <strong>₺{res.salePrice}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 2: Enter Price & Create as New Product */}
                {res.action === 'create_new' && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Kayıt Adı
                        </label>
                        <input
                          type="text"
                          required
                          value={res.productName}
                          onChange={e => handleResolutionChange(rawName, { productName: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Ana Kategori
                        </label>
                        <select
                          value={res.category}
                          onChange={e => handleResolutionChange(rawName, { category: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {productCategories.map(c => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Marka
                        </label>
                        <select
                          value={res.brand || 'Bosch'}
                          onChange={e => handleResolutionChange(rawName, { brand: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {productBrands.map(b => (
                            <option key={b.id} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Alt Kategori
                        </label>
                        <select
                          value={res.subCategory || ''}
                          onChange={e => handleResolutionChange(rawName, { subCategory: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {productSubCategories
                            .filter(sub => sub.categoryName === res.category || !res.category)
                            .map(sub => (
                              <option key={sub.id} value={sub.name}>
                                {sub.name}
                              </option>
                            ))}
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Birim Alış Maliyeti (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={res.costPrice || ''}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            handleResolutionChange(rawName, {
                              costPrice: val,
                              salePrice: res.salePrice > 0 ? res.salePrice : Math.round(val * 1.35),
                            });
                          }}
                          placeholder="Örn: 14500"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono-num font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Birim Satış Fiyatı (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={res.salePrice || ''}
                          onChange={e => handleResolutionChange(rawName, { salePrice: Number(e.target.value) || 0 })}
                          placeholder="Örn: 21500"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono-num font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <input
                            type="checkbox"
                            checked={res.addToStockCatalog}
                            onChange={e => handleResolutionChange(rawName, { addToStockCatalog: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                          />
                          <span>Ana stok listesine de ekle</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <span className="text-xs text-slate-500">
              Toplam <strong>{unmatchedNames.length} kalem</strong> eşleştirilip işleme dahil edilecek.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Eşleştirmeleri Onayla ve Kaydet</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
