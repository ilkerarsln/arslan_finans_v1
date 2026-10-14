import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Building2,
  Award,
  Layers,
  X,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';

export const DetayliStokView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categories,
    brands,
    suppliers,
    navigateToPurchase,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tümü');
  const [filterBrand, setFilterBrand] = useState('Tümü');
  const [filterSupplier, setFilterSupplier] = useState('Tümü');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Koltuk Takımları');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState(brands[0]?.name || 'Arslan Exclusive');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [stockQty, setStockQty] = useState(1);
  const [unit, setUnit] = useState('Takım');
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(2);
  const [notes, setNotes] = useState('');

  // Selected Category's subcategories
  const selectedCatDef = categories.find((c) => c.name === category);
  const availableSubCats = selectedCatDef ? selectedCatDef.subCategories : [];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(categories[0]?.name || 'Koltuk Takımları');
    setSubCategory('');
    setBrand(brands[0]?.name || 'Arslan Exclusive');
    setSupplierId(suppliers[0]?.id || '');
    setStockQty(5);
    setUnit('Takım');
    setCostPrice(15000);
    setSalePrice(25000);
    setMinStockAlert(2);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setSubCategory(p.subCategory || '');
    setBrand(p.brand || brands[0]?.name || 'Arslan Exclusive');
    setSupplierId(p.supplierId);
    setStockQty(p.stockQty);
    setUnit(p.unit);
    setCostPrice(p.costPrice);
    setSalePrice(p.salePrice);
    setMinStockAlert(p.minStockAlert);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sup = suppliers.find((s) => s.id === supplierId);
    const supplierName = sup ? sup.name : 'Ortak Tedarikçi';

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        sku,
        category,
        subCategory,
        brand,
        supplierId,
        supplierName,
        stockQty,
        unit,
        costPrice,
        salePrice,
        minStockAlert,
        notes,
      });
    } else {
      addProduct({
        name,
        sku,
        category,
        subCategory,
        brand,
        supplierId,
        supplierName,
        stockQty,
        unit,
        costPrice,
        salePrice,
        minStockAlert,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCat = filterCategory === 'Tümü' || p.category === filterCategory;
    const matchBrand = filterBrand === 'Tümü' || p.brand === filterBrand;
    const matchSup = filterSupplier === 'Tümü' || p.supplierId === filterSupplier;

    return matchSearch && matchCat && matchBrand && matchSup;
  });

  const totalStockCount = products.reduce((sum, p) => sum + p.stockQty, 0);
  const totalStockVal = products.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-1.5">
            <Boxes className="w-3.5 h-3.5" />
            <span>Kategori, Alt Kategori, Marka & Tedarikçi Hiyerarşisi</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Detaylı Stok & Envanter Yönetimi</h2>
          <p className="text-xs text-slate-400">
            Tüm ürünlerin marka, ana kategori, alt kategori ve ortak tedarikçi eşleşmelerini detaylı yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToPurchase('manuel')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Mal Alımı Yap</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.3]" />
            <span>+ Yeni Ürün Tanımla</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Toplam Ürün Çeşidi</span>
          <div className="text-xl font-bold text-white mt-1">{products.length} SKU</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Depodaki Toplam Adet</span>
          <div className="text-xl font-bold text-blue-400 mt-1">{formatNumber(totalStockCount)} Adet/Takım</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Toplam Envanter Değeri (Maliyet)</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalStockVal)}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Ürün adı, SKU, marka ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Tümü">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Tümü">Tüm Markalar</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Tümü">Tüm Tedarikçiler</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Ürün Adı</th>
                <th className="py-3 px-3">Marka</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Alt Kategori</th>
                <th className="py-3 px-3">Ortak Tedarikçi</th>
                <th className="py-3 px-3 text-right">Mevcut Stok</th>
                <th className="py-3 px-3 text-right">Alış Maliyeti</th>
                <th className="py-3 px-3 text-right">Satış Fiyatı</th>
                <th className="py-3 px-3 text-center">Durum</th>
                <th className="py-3 px-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const isCritical = p.stockQty <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-amber-400">{p.sku}</td>
                    <td className="py-3 px-3 font-medium text-white max-w-xs">{p.name}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-slate-300 font-semibold">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>{p.brand || 'Arslan'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.category}</td>
                    <td className="py-3 px-3 text-slate-400">{p.subCategory || '-'}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[140px]">{p.supplierName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {formatNumber(p.stockQty)} {p.unit}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {formatCurrency(p.costPrice)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold font-mono">
                      {formatCurrency(p.salePrice)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" /> Kritik
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Yeterli
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                          title="Ürünü Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Ürünü Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                <span>{editingProduct ? 'Ürün Bilgilerini Düzenle' : 'Yeni Stok Ürünü Tanımla'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Ürün Adı *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Venedik Nubuk Koltuk Takımı"
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Ürün SKU / Barkod Kodu *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="KLT-099"
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white uppercase font-mono"
                  />
                </div>
              </div>

              {/* Requirement 5: Category, Subcategory, Brand, Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-amber-300">
                    1. Ana Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      const cat = categories.find((c) => c.name === e.target.value);
                      setSubCategory(cat?.subCategories[0] || '');
                    }}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-amber-300">
                    2. Alt Kategori
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">Seçiniz veya Genel...</option>
                    {availableSubCats.map((sub, sIdx) => (
                      <option key={sIdx} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-amber-300">
                    3. Marka *
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-amber-300">
                    4. Ortak Tedarikçi *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock quantities & prices */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Mevcut Stok Adedi</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Birim</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Takım">Takım</option>
                    <option value="Adet">Adet</option>
                    <option value="Set">Set</option>
                    <option value="Metre">Metre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Alış Maliyeti (₺)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Kritik Stok Uyarı Limiti</label>
                <input
                  type="number"
                  min="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="w-32 bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  {editingProduct ? 'Değişiklikleri Kaydet' : 'Ürünü Stoğa Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
