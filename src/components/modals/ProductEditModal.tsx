import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { StockItem } from '../../types/finance';
import { CategoryCascader } from '../ui/CategoryCascader';
import { POPULAR_BRANDS } from '../../data/initialCategories';
import { formatCurrency, roundUpTo10TL } from '../../utils/formatters';
import {
  X,
  Save,
  Boxes,
  Tag,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  AlertCircle,
  Building,
} from 'lucide-react';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: StockItem | null;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { updateStockItem, showToast } = useFinance();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [anaKategori, setAnaKategori] = useState('MOBİLYA');
  const [altKategori, setAltKategori] = useState('BAMBİ');
  const [urunGrubu, setUrunGrubu] = useState('BAMBİ YATAK');
  const [brand, setBrand] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [iskontoOrani, setIskontoOrani] = useState<number>(10);
  const [karMarjiOrani, setKarMarjiOrani] = useState<number>(35);
  const [vadeDays, setVadeDays] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (product) {
      setCode(product.code || '');
      setName(product.name || '');
      setAnaKategori(product.anaKategori || product.category || 'MOBİLYA');
      setAltKategori(product.altKategori || product.subCategory || 'BAMBİ');
      setUrunGrubu(product.urunGrubu || 'BAMBİ YATAK');
      setBrand(product.brand || '');
      setPurchasePrice(product.purchasePrice || 0);
      setSalePrice(product.salePrice || 0);
      setIskontoOrani(product.iskontoOrani ?? 10);
      setKarMarjiOrani(product.karMarjiOrani ?? 35);
      setVadeDays(product.vadeDays ?? 30);
      setQuantity(product.quantity || 0);
      setNotes(product.notes || '');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Auto calculate 10 TL rounded sale price based on purchase price and profit margin
  const handleRecalculateSalePrice = () => {
    const cost = Number(purchasePrice) || 0;
    const margin = Number(karMarjiOrani) || 0;
    const rawSale = cost * (1 + margin / 100);
    const rounded = roundUpTo10TL(rawSale);
    setSalePrice(rounded);
    showToast(`Satış fiyatı %${margin} marj ile 10 TL katına yuvarlandı: ${formatCurrency(rounded)}`, 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Lütfen ürün adını giriniz.', 'error');
      return;
    }
    if (!anaKategori || !altKategori || !urunGrubu) {
      showToast('3 Seviyeli Kategori (Ana Kategori, Alt Kategori, Ürün Grubu) zorunludur.', 'error');
      return;
    }

    const updatedItem: StockItem = {
      ...product,
      code: code.trim(),
      name: name.trim(),
      anaKategori: anaKategori.trim().toUpperCase(),
      altKategori: altKategori.trim().toUpperCase(),
      urunGrubu: urunGrubu.trim().toUpperCase(),
      category: anaKategori.trim().toUpperCase(),
      subCategory: altKategori.trim().toUpperCase(),
      brand: brand.trim().toUpperCase(),
      purchasePrice: Number(purchasePrice) || 0,
      salePrice: Number(salePrice) || 0,
      totalValue: (Number(quantity) || 0) * (Number(purchasePrice) || 0),
      iskontoOrani: Number(iskontoOrani) || 0,
      karMarjiOrani: Number(karMarjiOrani) || 0,
      vadeDays: Number(vadeDays) || 0,
      quantity: Number(quantity) || 0,
      notes: notes.trim(),
    };

    updateStockItem(updatedItem);
    showToast(`${updatedItem.name} ürün kartı başarıyla güncellendi`, 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Boxes className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Ürün Kartı Düzenle & Detaylar</span>
                {code && (
                  <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {code}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                3 seviyeli kategori, marka, fiyat, iskonto ve vade bilgilerini güncelleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Temel Bilgiler: Stok Kodu, Ürün Adı, Marka */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Stok Kodu (Barkod/SKU)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Örn: BAMBI-MAGNA-160"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Ürün Adı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Bambi Magna Yatak 160x200"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 2. ZORUNLU 3 SEVİYELİ KATEGORİ HİYERARŞİSİ */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                3 Seviyeli Zorunlu Kategori Hiyerarşisi
              </span>
              <span className="text-[10px] text-slate-500">
                Ana Kategori ➔ Alt Kategori ➔ Ürün Grubu
              </span>
            </div>
            <CategoryCascader
              anaKategori={anaKategori}
              altKategori={altKategori}
              urunGrubu={urunGrubu}
              onChange={updates => {
                setAnaKategori(updates.anaKategori);
                setAltKategori(updates.altKategori);
                setUrunGrubu(updates.urunGrubu);
              }}
            />
          </div>

          {/* 3. Marka ve Stok Miktarı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Marka (İsteğe Bağlı)</span>
              </label>
              <div className="relative">
                <input
                  list="popular-brands-list"
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value.toUpperCase())}
                  placeholder="Örn: BAMBI, BOSCH, ALTUS, MEDİSA..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-purple-500"
                />
                <datalist id="popular-brands-list">
                  {POPULAR_BRANDS.map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Depo Stok Miktarı (Adet)
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4. Fiyat, Maliyet, İskonto, Kâr Marjı ve Vade */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/90 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Fiyatlandırma, Kâr Marjı ve Vade Koşulları
              </span>
              <button
                type="button"
                onClick={handleRecalculateSalePrice}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>10 TL Katına Yuvarla</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Alış Fiyatı (Maliyet ₺)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-400 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Satış Fiyatı (₺)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={salePrice}
                  onChange={e => setSalePrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Kâr Marjı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  value={karMarjiOrani}
                  onChange={e => setKarMarjiOrani(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-sky-400 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Ödeme Vadesi (Gün)
                </label>
                <select
                  value={vadeDays}
                  onChange={e => setVadeDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>Peşin (0 Gün)</option>
                  <option value={30}>30 Gün</option>
                  <option value={60}>60 Gün</option>
                  <option value={90}>90 Gün</option>
                  <option value={120}>120 Gün</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Notlar */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Ürün Notları / Ek Açıklama
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Örn: 2026 Model Yeni Seri, Teşhir Ürünü vb."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
