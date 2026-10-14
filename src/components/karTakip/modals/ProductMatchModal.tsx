import React, { useState, useMemo, useEffect } from 'react';
import { useKarTakip } from '../../../context/KarTakipContext';
import {
  X,
  Link2,
  Search,
  CheckCircle2,
  Layers,
  ArrowRight,
  Trash2,
  Sparkles,
  Info,
  Building2,
  Check,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export interface ProductMatchTarget {
  sourceProductCode: string;
  sourceProductName?: string;
  currentSalePrice?: number;
  periodMonth?: string;
  salesRep?: string;
  saleRecordId?: string;
}

interface ProductMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: ProductMatchTarget | null;
}

export const ProductMatchModal: React.FC<ProductMatchModalProps> = ({
  isOpen,
  onClose,
  targetItem
}) => {
  const {
    wholesalePrices,
    productAliasMappings,
    addProductAliasMapping,
    deleteProductAliasMapping,
    currentUser,
    sales
  } = useKarTakip();

  const [activeTab, setActiveTab] = useState<'match' | 'registered'>('match');
  const [sourceCode, setSourceCode] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [targetCatalogSearch, setTargetCatalogSearch] = useState('');
  const [selectedTargetSku, setSelectedTargetSku] = useState<string>('');
  const [saveAsPermanentRule, setSaveAsPermanentRule] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (targetItem) {
      setSourceCode(targetItem.sourceProductCode || '');
      setSourceName(targetItem.sourceProductName || '');
      setSelectedTargetSku('');
      setSuccessMessage(null);
      setActiveTab('match');
    }
  }, [targetItem, isOpen]);

  const catalogProducts = useMemo(() => {
    const map = new Map<string, {
      productCode: string;
      productName: string;
      category: string;
      latestPrice: number;
      supplier?: string;
      periodMonth: string;
    }>();

    wholesalePrices.forEach(wp => {
      const code = wp.productCode.trim().toUpperCase();
      const existing = map.get(code);
      if (!existing || wp.periodMonth.localeCompare(existing.periodMonth) > 0) {
        map.set(code, {
          productCode: code,
          productName: wp.productName,
          category: wp.category,
          latestPrice: wp.wholesalePrice,
          supplier: wp.supplier,
          periodMonth: wp.periodMonth
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.productName.localeCompare(b.productName, 'tr'));
  }, [wholesalePrices]);

  if (!isOpen) return null;

  const filteredCatalog = catalogProducts.filter(p => {
    if (!targetCatalogSearch.trim()) return true;
    const q = targetCatalogSearch.toLowerCase().trim();
    return (
      p.productCode.toLowerCase().includes(q) ||
      p.productName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.supplier && p.supplier.toLowerCase().includes(q))
    );
  });

  const suggestedProducts = catalogProducts.filter(p => {
    if (!sourceName && !sourceCode) return false;
    const cleanSource = (sourceName || sourceCode).toLowerCase();
    const sourceTokens = cleanSource
      .split(/\s+/)
      .map(t => t.replace(/[^\wçğıöşü]/gi, ''))
      .filter(t => t.length > 2);

    const targetText = `${p.productCode} ${p.productName} ${p.category}`.toLowerCase();
    return sourceTokens.some(token => targetText.includes(token));
  }).slice(0, 3);

  const selectedCatalogItem = catalogProducts.find(p => p.productCode === selectedTargetSku);

  const unitCost = selectedCatalogItem?.latestPrice || 0;
  const salePrice = targetItem?.currentSalePrice || 0;
  const projectedProfit = salePrice > 0 && unitCost > 0 ? salePrice - unitCost : null;
  const projectedMargin =
    projectedProfit !== null && salePrice > 0 ? Math.round((projectedProfit / salePrice) * 1000) / 10 : null;

  const matchingSalesCount = sales.filter(s => {
    const matchCode = sourceCode && s.productCode.trim().toUpperCase() === sourceCode.trim().toUpperCase();
    const matchName = sourceName && s.productName.trim().toLowerCase() === sourceName.trim().toLowerCase();
    return matchCode || matchName;
  }).length;

  const handleSaveMatch = () => {
    if (!sourceCode.trim() && !sourceName.trim()) return;
    if (!selectedCatalogItem) return;

    addProductAliasMapping({
      sourceProductCode: sourceCode.trim().toUpperCase(),
      sourceProductName: sourceName.trim() || undefined,
      targetProductCode: selectedCatalogItem.productCode,
      targetProductName: selectedCatalogItem.productName,
      targetCategory: selectedCatalogItem.category,
      targetSupplier: selectedCatalogItem.supplier,
      targetWholesalePrice: selectedCatalogItem.latestPrice,
      createdByName: currentUser?.name || 'Yönetici',
      notes: notes.trim() || undefined
    });

    setSuccessMessage(
      `"${sourceCode || sourceName}" ürünü, toptan liste "${selectedCatalogItem.productName}" (${selectedCatalogItem.productCode}) ile başarıyla eşleştirildi.`
    );

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Ürün Eşleştirme & Otomatik Tanıma Sihirbazı
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Akıllı Eşleşme
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Satış raporundaki ürün adı veya SKU'yu ana toptan ürün listesindeki doğru ürünle kalıcı eşleştirin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'match'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Yeni Ürün Eşleştir</span>
          </button>

          <button
            onClick={() => setActiveTab('registered')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'registered'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kayıtlı Eşleştirmeler ({productAliasMappings.length})</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {successMessage && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in duration-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {activeTab === 'match' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
                      1. Satış Raporundaki Ürün (Kaynak)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                      Toptan Fiyatı Yok
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kaynak Ürün Kodu / SKU
                    </label>
                    <input
                      type="text"
                      value={sourceCode}
                      onChange={e => setSourceCode(e.target.value)}
                      placeholder="Örn: SEH-707 veya BRJ-808"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Kaynak Ürün Adı
                    </label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={e => setSourceName(e.target.value)}
                      placeholder="Örn: Akasya Yan Sehpa (3'lü C Sehpa)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {targetItem && (
                    <div className="bg-white dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                      <div className="text-slate-500 flex items-center justify-between">
                        <span>Satış Fiyatı:</span>
                        <span className="text-slate-900 dark:text-white font-bold font-mono-num">
                          {targetItem.currentSalePrice ? `${targetItem.currentSalePrice.toLocaleString('tr-TR')} ₺` : 'Belirtilmedi'}
                        </span>
                      </div>
                      {targetItem.salesRep && (
                        <div className="text-slate-500 flex items-center justify-between">
                          <span>Satıcı Personel:</span>
                          <span className="text-cyan-600 dark:text-cyan-300 font-medium">{targetItem.salesRep}</span>
                        </div>
                      )}
                      {targetItem.periodMonth && (
                        <div className="text-slate-500 flex items-center justify-between">
                          <span>Dönem:</span>
                          <span className="text-slate-700 dark:text-slate-300">{targetItem.periodMonth}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      Bu ürün sistemdeki <strong>{matchingSalesCount} adet</strong> satış kaydında geçmektedir.
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      2. Eşleşecek Toptan Katalog Ürünü (Hedef)
                    </span>
                    {selectedCatalogItem && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                        {selectedCatalogItem.latestPrice.toLocaleString('tr-TR')} ₺ Maliyet
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={targetCatalogSearch}
                      onChange={e => setTargetCatalogSearch(e.target.value)}
                      placeholder="Toptan katalogda ürün adı, SKU veya üretici ara..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {suggestedProducts.length > 0 && !targetCatalogSearch && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Akıllı Öneri (Benzerlik Tespiti)</span>
                      </div>
                      <div className="space-y-1">
                        {suggestedProducts.map(p => (
                          <div
                            key={p.productCode}
                            onClick={() => setSelectedTargetSku(p.productCode)}
                            className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              selectedTargetSku === p.productCode
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono text-[10px] opacity-80 mr-1.5">[{p.productCode}]</span>
                              <span>{p.productName}</span>
                            </div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 font-mono-num">
                              {p.latestPrice.toLocaleString('tr-TR')} ₺
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900/50">
                    {filteredCatalog.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Aramanızla eşleşen toptan ürün bulunamadı.
                      </div>
                    ) : (
                      filteredCatalog.map(item => {
                        const isSelected = selectedTargetSku === item.productCode;
                        return (
                          <div
                            key={item.productCode}
                            onClick={() => setSelectedTargetSku(item.productCode)}
                            className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="truncate pr-2 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-mono text-[10px] px-1 py-0.2 rounded border ${
                                  isSelected ? 'border-indigo-400 bg-indigo-700 text-white' : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {item.productCode}
                                </span>
                                <span className="truncate">{item.productName}</span>
                              </div>
                              <div className="text-[10px] opacity-75 truncate mt-0.5 text-slate-400">
                                {item.category} {item.supplier ? `• ${item.supplier}` : ''}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className={isSelected ? 'text-white font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold font-mono-num'}>
                                {item.latestPrice.toLocaleString('tr-TR')} ₺
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {selectedCatalogItem && (
                <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-950/40 via-purple-50 dark:via-purple-950/30 to-slate-50 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Eşleştirme Sonrası Kârlılık Simülasyonu</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Birim Satış Fiyatı</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-num">
                        {salePrice > 0 ? `${salePrice.toLocaleString('tr-TR')} ₺` : 'Belirlenmedi'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Eşleşen Toptan Maliyet</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                        {unitCost.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Hesaplanan Birim Kâr</span>
                      <span
                        className={`text-xs font-bold font-mono-num ${
                          projectedProfit !== null && projectedProfit >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : projectedProfit !== null
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {projectedProfit !== null ? `${projectedProfit.toLocaleString('tr-TR')} ₺` : '-'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Kâr Marjı %</span>
                      <span
                        className={`text-xs font-bold font-mono-num ${
                          projectedMargin !== null && projectedMargin >= 20
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : projectedMargin !== null && projectedMargin > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {projectedMargin !== null ? `%${projectedMargin}` : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-200 dark:border-slate-800/80">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={saveAsPermanentRule}
                        onChange={e => setSaveAsPermanentRule(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>
                        <strong>Kalıcı Eşleştirme Kuralı Olarak Kaydet:</strong> Sonraki Excel satış raporu yüklemelerinde bu ürün otomatik olarak tanınacak.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  İptal
                </button>

                <button
                  type="button"
                  onClick={handleSaveMatch}
                  disabled={!selectedCatalogItem || (!sourceCode.trim() && !sourceName.trim())}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-40"
                >
                  <Check className="w-4 h-4" />
                  <span>Eşleştirmeyi Kaydet ve Kârlılığı Hesapla</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Sisteme kayıtlı <strong>{productAliasMappings.length} adet</strong> otomatik ürün eşleştirme kuralı bulunmaktadır.
                </span>
                <span className="text-[11px] text-slate-400">
                  Excel yüklemelerinde bu kurallar otomatik işletilir.
                </span>
              </div>

              {productAliasMappings.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Link2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Henüz kayıtlı bir ürün eşleştirmesi bulunmuyor.</p>
                  <p className="text-xs">
                    Satış raporlarında eksik toptan fiyat uyarısı veren ürünleri yukarıdaki sekmeden eşleştirebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                  {productAliasMappings.map(mapping => (
                    <div
                      key={mapping.id}
                      className="p-4 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 text-[10px]">
                            {mapping.sourceProductCode}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">
                            {mapping.sourceProductName || 'İsimsiz Kaynak Ürün'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-[10px]">
                            {mapping.targetProductCode}
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            {mapping.targetProductName}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-3">
                          {mapping.targetSupplier && (
                            <span>Üretici: {mapping.targetSupplier}</span>
                          )}
                          {mapping.targetWholesalePrice !== undefined && (
                            <span>Toptan Maliyet: {mapping.targetWholesalePrice.toLocaleString('tr-TR')} ₺</span>
                          )}
                          <span>Kayıt Tarihi: {mapping.createdAt.split('T')[0]}</span>
                          {mapping.createdByName && <span>Ekleyen: {mapping.createdByName}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteProductAliasMapping(mapping.id)}
                        className="self-end sm:self-center p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 dark:border-slate-800 transition-colors"
                        title="Bu eşleştirme kuralını sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
