import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPercent, formatCurrency } from '../../utils/formatters';
import {
  SlidersHorizontal,
  Tags,
  Building2,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  Layers,
  Award,
  FileSpreadsheet,
  Search,
  DollarSign,
  Boxes,
  HelpCircle,
  X,
} from 'lucide-react';
import { PriceListItem } from '../../types';

export const TanimlamalarView: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    subCategories,
    addSubCategory,
    deleteSubCategory,
    brands,
    addBrand,
    deleteBrand,
    suppliers,
    addSupplier,
    interestRates,
    updateMonthlyRate,
    priceLists,
    updatePriceListItem,
    addPriceListItem,
    products,
    showToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'fiyat_listeleri' | 'alt_kategoriler' | 'kategoriler' | 'vade_farki' | 'markalar' | 'tedarikciler'
  >('fiyat_listeleri');

  // =========================================================================
  // 1. FİYAT LİSTESİ STATES
  // =========================================================================
  const [selectedPriceMonth, setSelectedPriceMonth] = useState('2026-10');
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [isAddPriceItemOpen, setIsAddPriceItemOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<PriceListItem | null>(null);

  // New Price Item Form
  const [selectedProductForPrice, setSelectedProductForPrice] = useState(products[0]?.id || '');
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newCashPrice, setNewCashPrice] = useState<number>(0);
  const [newCardPrice, setNewCardPrice] = useState<number>(0);
  const [newInstallment12Price, setNewInstallment12Price] = useState<number>(0);

  // Months available for price lists
  const availablePriceMonths = [
    { code: '2026-10', name: 'Ekim 2026 (Güncel)' },
    { code: '2026-09', name: 'Eylül 2026' },
    { code: '2026-08', name: 'Ağustos 2026' },
    { code: '2026-11', name: 'Kasım 2026 (Gelecek Dönem)' },
  ];

  // Filtered price list
  const filteredPriceList = priceLists.filter((pl) => {
    const matchMonth = pl.monthCode === selectedPriceMonth;
    const matchSearch =
      pl.productName.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
      pl.productSku.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
      pl.category.toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
      (pl.brand && pl.brand.toLowerCase().includes(priceSearchQuery.toLowerCase()));
    return matchMonth && matchSearch;
  });

  // =========================================================================
  // 2. ALT KATEGORİ STATES
  // =========================================================================
  const [subCatParentFilter, setSubCatParentFilter] = useState('Tümü');
  const [subCatSearch, setSubCatSearch] = useState('');
  const [newSubCatParent, setNewSubCatParent] = useState(categories[0]?.name || 'Beyaz Eşya');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatDesc, setNewSubCatDesc] = useState('');

  // Filtered subcategories
  const filteredSubCategories = subCategories.filter((sub) => {
    const matchParent = subCatParentFilter === 'Tümü' || sub.categoryName === subCatParentFilter;
    const matchSearch =
      sub.name.toLowerCase().includes(subCatSearch.toLowerCase()) ||
      sub.categoryName.toLowerCase().includes(subCatSearch.toLowerCase()) ||
      (sub.description && sub.description.toLowerCase().includes(subCatSearch.toLowerCase()));
    return matchParent && matchSearch;
  });

  // =========================================================================
  // 3. VADE FARKI STATES
  // =========================================================================
  const [selectedMonthCode, setSelectedMonthCode] = useState('2026-10');
  const [inputRate, setInputRate] = useState<number>(2.8);

  // =========================================================================
  // 4. KATEGORİ STATES
  // =========================================================================
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatsInput, setNewSubCatsInput] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editSubCatsInput, setEditSubCatsInput] = useState('');

  // =========================================================================
  // 5. MARKA STATES
  // =========================================================================
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('Türkiye');

  // =========================================================================
  // 6. TEDARİKÇİ HIZLI EKLE
  // =========================================================================
  const [quickSupName, setQuickSupName] = useState('');
  const [quickSupPerson, setQuickSupPerson] = useState('');
  const [quickSupPhone, setQuickSupPhone] = useState('');
  const [quickSupCat, setQuickSupCat] = useState('Ahşap & İskelet');

  // Handlers
  const handleSaveInterestRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRate <= 0) return;
    updateMonthlyRate(selectedMonthCode, inputRate);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const subs = newSubCatsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    addCategory(newCatName.trim(), subs);
    setNewCatName('');
    setNewSubCatsInput('');
  };

  const handleStartEditCat = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditSubCatsInput(cat.subCategories.join(', '));
  };

  const handleSaveEditCat = () => {
    if (!editingCatId || !editCatName.trim()) return;
    const subs = editSubCatsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    updateCategory(editingCatId, editCatName.trim(), subs);
    setEditingCatId(null);
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    addBrand(newBrandName.trim(), newBrandCountry);
    setNewBrandName('');
  };

  const handleAddQuickSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSupName.trim()) return;
    addSupplier({
      code: `TED-00${suppliers.length + 1}`,
      name: quickSupName.trim(),
      contactPerson: quickSupPerson.trim() || 'Yetkili',
      phone: quickSupPhone.trim() || '0 (500) 000 00 00',
      email: `${quickSupName.toLowerCase().replace(/[^a-z0-9]/g, '')}@tedarik.com`,
      city: 'Bursa / İnegöl',
      type: 'tedarikci',
      category: quickSupCat,
    });
    setQuickSupName('');
    setQuickSupPerson('');
    setQuickSupPhone('');
  };

  const handleAddSubCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCatName.trim()) return;
    addSubCategory(newSubCatParent, newSubCatName.trim(), newSubCatDesc.trim());
    setNewSubCatName('');
    setNewSubCatDesc('');
  };

  const handleOpenAddPrice = () => {
    const prod = products.find((p) => p.id === selectedProductForPrice) || products[0];
    if (prod) {
      setNewCostPrice(prod.costPrice);
      setNewCashPrice(prod.salePrice);
      setNewCardPrice(Math.round(prod.salePrice * 1.05));
      setNewInstallment12Price(Math.round(prod.salePrice * 1.25));
    }
    setEditingPriceItem(null);
    setIsAddPriceItemOpen(true);
  };

  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductForPrice(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setNewCostPrice(prod.costPrice);
      setNewCashPrice(prod.salePrice);
      setNewCardPrice(Math.round(prod.salePrice * 1.05));
      setNewInstallment12Price(Math.round(prod.salePrice * 1.25));
    }
  };

  const handleSavePriceItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPriceItem) {
      updatePriceListItem(editingPriceItem.id, {
        costPrice: newCostPrice,
        cashSalePrice: newCashPrice,
        cardSalePrice: newCardPrice,
        installment12Price: newInstallment12Price,
      });
      showToast('Fiyat listesi güncellendi.', 'success');
    } else {
      const prod = products.find((p) => p.id === selectedProductForPrice);
      if (!prod) return;
      addPriceListItem({
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        category: prod.category,
        subCategory: prod.subCategory,
        brand: prod.brand,
        monthCode: selectedPriceMonth,
        costPrice: newCostPrice,
        cashSalePrice: newCashPrice,
        cardSalePrice: newCardPrice,
        installment12Price: newInstallment12Price,
      });
    }
    setIsAddPriceItemOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Merkezi Parametre, Fiyat Listesi & Kural Yönetimi</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sistem Tanımlamaları</h2>
          <p className="text-xs text-slate-400">
            Aylık fiyat listeleri, bağımsız alt kategoriler, ana kategoriler, senetli satış vade farkı oranları, markalar ve ortak tedarikçiler.
          </p>
        </div>
      </div>

      {/* Subtab Navigation Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {/* Requirement 4: Fiyat Listeleri Tab */}
          <button
            onClick={() => setActiveSubTab('fiyat_listeleri')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'fiyat_listeleri'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Aylık Fiyat Listeleri ({priceLists.length})</span>
          </button>

          {/* Requirement 4: Ayrı Alt Kategoriler Tab */}
          <button
            onClick={() => setActiveSubTab('alt_kategoriler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'alt_kategoriler'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Alt Kategoriler ({subCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kategoriler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'kategoriler'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ana Kategoriler ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vade_farki')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'vade_farki'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Aylık Vade Farkı Oranları</span>
          </button>

          <button
            onClick={() => setActiveSubTab('markalar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'markalar'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Markalar ({brands.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tedarikciler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'tedarikciler'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tedarikçiler ({suppliers.length})</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: AYLIK FİYAT LİSTELERİ (Requirement 4)
           ========================================================================= */}
        {activeSubTab === 'fiyat_listeleri' && (
          <div className="space-y-4">
            {/* Top Toolbar: Month Select & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">Liste Dönemi:</span>
                  <select
                    value={selectedPriceMonth}
                    onChange={(e) => setSelectedPriceMonth(e.target.value)}
                    className="bg-slate-900 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer font-medium"
                  >
                    {availablePriceMonths.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleOpenAddPrice}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 text-xs font-bold shadow transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Listeye Ürün Ekle</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ürün adı, SKU veya marka ara..."
                  value={priceSearchQuery}
                  onChange={(e) => setPriceSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Price List Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Ürün Adı</th>
                    <th className="py-3 px-3">Kategori & Marka</th>
                    <th className="py-3 px-3 text-right">Alış / Maliyet</th>
                    <th className="py-3 px-3 text-right">Peşin Fiyat</th>
                    <th className="py-3 px-3 text-right">Kredi Kartı Fiyatı</th>
                    <th className="py-3 px-3 text-right">12 Ay Senetli Fiyat</th>
                    <th className="py-3 px-3 text-center">Tahmini Kâr</th>
                    <th className="py-3 px-3 text-center">Son Güncelleme</th>
                    <th className="py-3 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {filteredPriceList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                        Bu ay dönemi için kayıtlı fiyat listesi kalemi bulunamadı. "Listeye Ürün Ekle" butonu ile yeni fiyat tanımı yapabilirsiniz.
                      </td>
                    </tr>
                  ) : (
                    filteredPriceList.map((pl) => {
                      const grossProfit = pl.cashSalePrice - pl.costPrice;
                      const margin = pl.cashSalePrice > 0 ? (grossProfit / pl.cashSalePrice) * 100 : 0;

                      return (
                        <tr key={pl.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-amber-400 font-semibold">{pl.productSku}</td>
                          <td className="py-3 px-3 font-medium text-white">{pl.productName}</td>
                          <td className="py-3 px-3 text-slate-400">
                            <div>{pl.category}</div>
                            <div className="text-[10px] text-slate-500">{pl.brand || 'Arslan'}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {formatCurrency(pl.costPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(pl.cashSalePrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-blue-300">
                            {formatCurrency(pl.cardSalePrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                            {formatCurrency(pl.installment12Price)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                              %{margin.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 text-[11px] font-mono">
                            {pl.lastUpdated}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setEditingPriceItem(pl);
                                setNewCostPrice(pl.costPrice);
                                setNewCashPrice(pl.cashSalePrice);
                                setNewCardPrice(pl.cardSalePrice);
                                setNewInstallment12Price(pl.installment12Price);
                                setIsAddPriceItemOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Fiyatı Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: AYRI ALT KATEGORİLER SEKMESİ (Requirement 4)
           ========================================================================= */}
        {activeSubTab === 'alt_kategoriler' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add New SubCategory Form */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Yeni Alt Kategori Tanımla
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ana kategoriye bağlı alt kategori ekleyin. Ürün ve stok girişinde anında seçilebilir olacaktır.
                </p>

                <form onSubmit={handleAddSubCategorySubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Bağlı Ana Kategori *</label>
                    <select
                      value={newSubCatParent}
                      onChange={(e) => setNewSubCatParent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Alt Kategori Adı *</label>
                    <input
                      type="text"
                      value={newSubCatName}
                      onChange={(e) => setNewSubCatName(e.target.value)}
                      placeholder="Örn: No-Frost Buzdolabı, Köşe Koltuk..."
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Açıklama / Not (Opsiyonel)</label>
                    <input
                      type="text"
                      value={newSubCatDesc}
                      onChange={(e) => setNewSubCatDesc(e.target.value)}
                      placeholder="Örn: Enerji tasarruflu inverter modeller"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Alt Kategoriyi Kaydet
                  </button>
                </form>
              </div>

              {/* SubCategories List & Parent Filter */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-400">Ana Kategori Filtresi:</span>
                    <select
                      value={subCatParentFilter}
                      onChange={(e) => setSubCatParentFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-white cursor-pointer"
                    >
                      <option value="Tümü">Tüm Kategoriler ({subCategories.length})</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Alt kategori ara..."
                      value={subCatSearch}
                      onChange={(e) => setSubCatSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSubCategories.map((sub) => {
                    const linkedProductsCount = products.filter(
                      (p) => p.subCategory === sub.name || (p.category === sub.categoryName && !p.subCategory)
                    ).length;

                    return (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-1">
                              {sub.categoryName}
                            </span>
                            <h5 className="font-bold text-white text-sm">{sub.name}</h5>
                          </div>
                          <button
                            onClick={() => deleteSubCategory(sub.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                            title="Alt Kategoriyi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {sub.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">{sub.description}</p>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Bağlı Ürünler</span>
                          <span className="font-semibold text-slate-300">{linkedProductsCount} Ürün</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: ANA KATEGORİLER
           ========================================================================= */}
        {activeSubTab === 'kategoriler' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Yeni Ana Kategori Ekle</span>
                </h4>

                <form onSubmit={handleAddCategory} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Kategori Adı *</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Örn: Beyaz Eşya, Ofis Mobilyası..."
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">
                      Alt Kategoriler (Virgülle Ayırarak)
                    </label>
                    <textarea
                      rows={3}
                      value={newSubCatsInput}
                      onChange={(e) => setNewSubCatsInput(e.target.value)}
                      placeholder="Örn: Çamaşır Makinesi, Bulaşık Makinesi, Ankastre..."
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Kategoriyi Kaydet
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{cat.name}</span>
                        {cat.name === 'Beyaz Eşya' && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                            Öne Çıkan Ana Kategori
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          {cat.subCategories.length} Alt Kategori
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditCat(cat)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingCatId === cat.id ? (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={editSubCatsInput}
                          onChange={(e) => setEditSubCatsInput(e.target.value)}
                          placeholder="Alt kategoriler (virgülle ayırın)"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingCatId(null)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                          >
                            İptal
                          </button>
                          <button
                            onClick={handleSaveEditCat}
                            className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cat.subCategories.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: VADE FARKI ORANLARI
           ========================================================================= */}
        {activeSubTab === 'vade_farki' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span>Aylık Vade Farkı Belirle</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Senetli satışlarda ürün maliyetine eklenecek aylık faiz/vade oranıdır.
                </p>

                <form onSubmit={handleSaveInterestRate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Uygulanacak Ay *</label>
                    <select
                      value={selectedMonthCode}
                      onChange={(e) => {
                        setSelectedMonthCode(e.target.value);
                        const current = interestRates.find((r) => r.monthCode === e.target.value);
                        if (current) setInputRate(current.rate);
                      }}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    >
                      {interestRates.map((r) => (
                        <option key={r.id} value={r.monthCode}>
                          {r.monthName} ({r.monthCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Aylık Vade Farkı Oranı (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={inputRate}
                      onChange={(e) => setInputRate(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Oranı Kaydet & Güncelle
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Dönem Kodu</th>
                      <th className="py-3 px-4">Ay / Yıl Adı</th>
                      <th className="py-3 px-4 text-center">Aylık Vade Oranı</th>
                      <th className="py-3 px-4 text-center">Yıllık Bileşik Oran (Yaklaşık)</th>
                      <th className="py-3 px-4 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {interestRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-amber-400">{rate.monthCode}</td>
                        <td className="py-3 px-4 font-medium text-white">{rate.monthName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            %{rate.rate.toFixed(1)} / Ay
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          %{(rate.rate * 12).toFixed(1)} / Yıl
                        </td>
                        <td className="py-3 px-4 text-center">
                          {rate.isDefault ? (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              Aktif Varsayılan
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Geçmiş Dönem</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: MARKALAR
           ========================================================================= */}
        {activeSubTab === 'markalar' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Yeni Marka Ekle</span>
                </h4>

                <form onSubmit={handleAddBrand} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Marka Adı *</label>
                    <input
                      type="text"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Örn: Bosch, Arçelik, Bellona..."
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Menşei Ülke</label>
                    <input
                      type="text"
                      value={newBrandCountry}
                      onChange={(e) => setNewBrandCountry(e.target.value)}
                      placeholder="Türkiye"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Markayı Kaydet
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brands.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-white text-sm">{b.name}</h5>
                      <span className="text-[11px] text-slate-400">{b.country || 'Türkiye'}</span>
                    </div>
                    <button
                      onClick={() => deleteBrand(b.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: TEDARİKÇİLER (HIZLI YÖNETİM)
           ========================================================================= */}
        {activeSubTab === 'tedarikciler' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Hızlı Tedarikçi Ekle</span>
                </h4>

                <form onSubmit={handleAddQuickSupplier} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Tedarikçi Ünvanı *</label>
                    <input
                      type="text"
                      value={quickSupName}
                      onChange={(e) => setQuickSupName(e.target.value)}
                      placeholder="Örn: Anadolu Beyaz Eşya A.Ş."
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Yetkili Kişi</label>
                    <input
                      type="text"
                      value={quickSupPerson}
                      onChange={(e) => setQuickSupPerson(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={quickSupPhone}
                      onChange={(e) => setQuickSupPhone(e.target.value)}
                      placeholder="0 (212) 000 00 00"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Sektör</label>
                    <select
                      value={quickSupCat}
                      onChange={(e) => setQuickSupCat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Beyaz Eşya">Beyaz Eşya</option>
                      <option value="Ahşap & İskelet">Ahşap & İskelet</option>
                      <option value="Sünger & Yatak">Sünger & Yatak</option>
                      <option value="Kumaş & Deri">Kumaş & Deri</option>
                      <option value="Panel & MDF & Kaplama">Panel & MDF & Kaplama</option>
                      <option value="Metal & Aksesuar">Metal & Aksesuar</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Tedarikçiyi Kaydet
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{s.name}</span>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {s.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.contactPerson} | {s.phone} | {s.category}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                      Borç: ₺{s.currentBalance.toLocaleString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Price Item Modal */}
      {isAddPriceItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <span>
                  {editingPriceItem ? 'Fiyat Listesi Kalemini Düzenle' : 'Aylık Fiyat Listesine Ürün Ekle'}
                </span>
              </h3>
              <button
                onClick={() => setIsAddPriceItemOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceItem} className="space-y-3.5 text-xs">
              {!editingPriceItem && (
                <div>
                  <label className="block text-slate-300 mb-1">Listeye Eklenecek Ürün *</label>
                  <select
                    value={selectedProductForPrice}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} - ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Maliyet Fiyatı (₺) *</label>
                  <input
                    type="number"
                    value={newCostPrice || ''}
                    onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Peşin Satış Fiyatı (₺) *</label>
                  <input
                    type="number"
                    value={newCashPrice || ''}
                    onChange={(e) => setNewCashPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Kredi Kartı Fiyatı (₺)</label>
                  <input
                    type="number"
                    value={newCardPrice || ''}
                    onChange={(e) => setNewCardPrice(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">12 Ay Senetli Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    value={newInstallment12Price || ''}
                    onChange={(e) => setNewInstallment12Price(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Tahmini Peşin Kâr:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(newCashPrice - newCostPrice)} (%
                    {newCashPrice > 0 ? (((newCashPrice - newCostPrice) / newCashPrice) * 100).toFixed(1) : 0})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dönem:</span>
                  <span className="font-semibold text-slate-200">{selectedPriceMonth}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPriceItemOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  {editingPriceItem ? 'Güncelle' : 'Listeye Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
