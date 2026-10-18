import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  SlidersHorizontal,
  Layers,
  FolderTree,
  Tag,
  Building,
  Percent,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  Download,
  Info,
  ChevronDown,
  ChevronRight,
  Boxes,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import {
  ProductCategory,
  ProductSubCategory,
  ProductGroup,
  ProductBrand,
  VadeRateEntry,
  PriceListEntry,
  Cari,
} from '../../types/finance';

export const DefinitionsTab: React.FC = () => {
  const {
    productCategories,
    productSubCategories,
    productGroups,
    productBrands,
    vadeRates,
    priceLists,
    caris,
    stockItems,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory,
    addProductSubCategory,
    updateProductSubCategory,
    deleteProductSubCategory,
    addProductGroup,
    updateProductGroup,
    deleteProductGroup,
    resetHierarchyAndStock,
    addProductBrand,
    deleteProductBrand,
    setVadeRate,
    addPriceList,
    deletePriceList,
    addCari,
    isAdmin,
    setActiveTab,
    setIsCiroWizardOpen,
  } = useFinance();

  // Active top-level section: 'categories' | 'vaderates' | 'pricelists' | 'suppliers'
  const [activeSection, setActiveSection] = useState<
    'categories' | 'vaderates' | 'pricelists' | 'suppliers'
  >('categories');

  // Categories Sub-Tab: 'categories' (Ana Kategori) | 'subcategories' (Alt Kategori) | 'productgroups' (Ürün Grubu) | 'brands' (Markalar) | 'tree' (Ağaç Görünümü)
  const [categorySubTab, setCategorySubTab] = useState<
    'categories' | 'subcategories' | 'productgroups' | 'brands' | 'tree'
  >('categories');

  // Price lists sub-tab: 'Toptan' | 'Perakende' | 'ALL'
  const [priceListFilter, setPriceListFilter] = useState<'Toptan' | 'Perakende' | 'ALL'>('Toptan');
  const [priceListType, setPriceListType] = useState<'Toptan' | 'Perakende'>('Toptan');

  const [searchTerm, setSearchTerm] = useState('');

  // 1. Ana Kategori State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0ea5e9');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // 2. Alt Kategori State
  const [newSubCatName, setNewSubCatName] = useState('');
  const [selectedParentCatId, setSelectedParentCatId] = useState(
    productCategories[0]?.id || 'pcat-mobilya'
  );
  const [filterParentCat, setFilterParentCat] = useState<string>('ALL');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');

  // 3. Ürün Grubu State
  const [selectedGroupParentCatId, setSelectedGroupParentCatId] = useState<string>(
    productCategories[0]?.id || 'pcat-mobilya'
  );
  const [selectedGroupSubCatId, setSelectedGroupSubCatId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [filterGroupCat, setFilterGroupCat] = useState<string>('ALL');
  const [filterGroupSub, setFilterGroupSub] = useState<string>('ALL');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Tree View Expand/Collapse State
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    'pcat-mobilya': true,
    'pcat-beyazesya': true,
  });
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({
    'sub-bambi': true,
    'sub-altus': true,
  });

  // 4. Marka State
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedBrandCategories, setSelectedBrandCategories] = useState<string[]>(['BEYAZ EŞYA']);

  // 5. Vade Farkı State
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [vadeMonth, setVadeMonth] = useState(currentMonthKey);
  const [vadeRateVal, setVadeRateVal] = useState<number>(3.5);
  const [vadeNotes, setVadeNotes] = useState('');

  // 6. Fiyat Listesi State
  const [priceListMonth, setPriceListMonth] = useState(currentMonthKey);
  const [priceListTitle, setPriceListTitle] = useState('');
  const [priceListCategory, setPriceListCategory] = useState('Tüm Kategoriler');
  const [priceListItemsCount, setPriceListItemsCount] = useState<number>(45);
  const [priceListNotes, setPriceListNotes] = useState('');

  // 7. Tedarikçi Ekleme Modal / State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Filtered Suppliers from unified Cari
  const suppliers = useMemo(() => {
    return caris.filter(c => c.type === 'Tedarikçi');
  }, [caris]);

  // Subcategories filtered for Add Group Form
  const subCategoriesForGroupForm = useMemo(() => {
    const parent = productCategories.find(c => c.id === selectedGroupParentCatId);
    if (!parent) return [];
    return productSubCategories.filter(
      s => s.categoryId === parent.id || s.categoryName === parent.name
    );
  }, [productCategories, productSubCategories, selectedGroupParentCatId]);

  // Keep selectedGroupSubCatId in sync when parent changes
  React.useEffect(() => {
    if (subCategoriesForGroupForm.length > 0) {
      if (!subCategoriesForGroupForm.some(s => s.id === selectedGroupSubCatId)) {
        setSelectedGroupSubCatId(subCategoriesForGroupForm[0].id);
      }
    } else {
      setSelectedGroupSubCatId('');
    }
  }, [subCategoriesForGroupForm, selectedGroupSubCatId]);

  // Subcategories for group filter dropdown
  const subCategoriesForFilter = useMemo(() => {
    if (filterGroupCat === 'ALL') return productSubCategories;
    return productSubCategories.filter(s => s.categoryName === filterGroupCat);
  }, [productSubCategories, filterGroupCat]);

  // Filtered Product Groups for Table
  const filteredProductGroups = useMemo(() => {
    return productGroups.filter(g => {
      if (filterGroupCat !== 'ALL' && g.categoryName !== filterGroupCat) return false;
      if (filterGroupSub !== 'ALL' && g.subCategoryName !== filterGroupSub) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesSub = g.subCategoryName.toLowerCase().includes(q);
        const matchesCat = g.categoryName.toLowerCase().includes(q);
        if (!matchesName && !matchesSub && !matchesCat) return false;
      }
      return true;
    });
  }, [productGroups, filterGroupCat, filterGroupSub, searchTerm]);

  // Handle Add Main Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addProductCategory({
      name: newCatName.trim().toUpperCase(),
      type: newCatName.trim().toUpperCase(),
      color: newCatColor,
    });
    setNewCatName('');
  };

  // Handle Edit Category
  const handleSaveEditCategory = (cat: ProductCategory) => {
    if (!editingCatName.trim()) return;
    updateProductCategory({
      ...cat,
      name: editingCatName.trim().toUpperCase(),
      type: editingCatName.trim().toUpperCase(),
    });
    setEditingCatId(null);
  };

  // Handle Add Subcategory
  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCatName.trim()) return;
    const parent = productCategories.find(c => c.id === selectedParentCatId);
    if (!parent) return;
    addProductSubCategory({
      categoryId: parent.id,
      categoryName: parent.name,
      name: newSubCatName.trim().toUpperCase(),
    });
    setNewSubCatName('');
  };

  // Handle Edit Subcategory
  const handleSaveEditSubCategory = (sub: ProductSubCategory) => {
    if (!editingSubName.trim()) return;
    updateProductSubCategory({
      ...sub,
      name: editingSubName.trim().toUpperCase(),
    });
    setEditingSubId(null);
  };

  // Handle Add Product Group
  const handleAddProductGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const parent = productCategories.find(c => c.id === selectedGroupParentCatId);
    const sub = subCategoriesForGroupForm.find(s => s.id === selectedGroupSubCatId);
    if (!parent || !sub) {
      alert('Lütfen hem Ana Kategori hem de Alt Kategori seçin.');
      return;
    }
    addProductGroup({
      categoryId: parent.id,
      categoryName: parent.name,
      subCategoryId: sub.id,
      subCategoryName: sub.name,
      name: newGroupName.trim().toUpperCase(),
      code: newGroupCode.trim() || undefined,
    });
    setNewGroupName('');
    setNewGroupCode('');
  };

  // Handle Edit Product Group
  const handleSaveEditProductGroup = (group: ProductGroup) => {
    if (!editingGroupName.trim()) return;
    updateProductGroup({
      ...group,
      name: editingGroupName.trim().toUpperCase(),
    });
    setEditingGroupId(null);
  };

  // Quick prompt to reset 3-level standard hierarchy
  const handleConfirmReset = () => {
    if (
      window.confirm(
        'DİKKAT: Tanımlı 3 seviyeli zorunlu hiyerarşik yapı (MOBİLYA & BEYAZ EŞYA altındaki 12 alt kategori ve 76 ürün grubu) ile örnek stok kartları baştan sıfırlanıp temiz yüklenecektir. Onaylıyor musunuz?'
      )
    ) {
      resetHierarchyAndStock();
    }
  };

  // Handle Add Brand
  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    addProductBrand({
      name: newBrandName.trim(),
      categoryNames: selectedBrandCategories,
    });
    setNewBrandName('');
  };

  // Handle Set Vade Rate
  const handleSaveVadeRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vadeMonth) return;
    setVadeRate(vadeMonth, Number(vadeRateVal) || 0, vadeNotes.trim() || undefined);
    setVadeNotes('');
  };

  // Handle Add Price List
  const handleAddPriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceListTitle.trim()) return;
    addPriceList({
      monthKey: priceListMonth,
      title: priceListTitle.trim(),
      categoryName: priceListCategory,
      itemsCount: Number(priceListItemsCount) || 0,
      type: priceListType,
      notes: priceListNotes.trim() || undefined,
    });
    setPriceListTitle('');
    setPriceListNotes('');
  };

  // Handle Add Supplier
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    addCari({
      name: supplierName.trim(),
      type: 'Tedarikçi',
      phone: supplierPhone.trim() || undefined,
      email: supplierEmail.trim() || undefined,
      city: supplierCity.trim() || undefined,
      balance: 0,
      notes: supplierNotes.trim() || undefined,
    });
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierCity('');
    setSupplierNotes('');
    setIsSupplierModalOpen(false);
  };

  const toggleCatExpand = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleSubExpand = (subId: string) => {
    setExpandedSubs(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              ERP Sistem Tanımlamaları & 3 Seviyeli Kategori Hiyerarşisi
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zorunlu 3 seviyeli yapı:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ana Kategori</span> &gt;{' '}
            <span className="font-semibold text-sky-600 dark:text-sky-400">Alt Kategori</span> &gt;{' '}
            <span className="font-semibold text-purple-600 dark:text-purple-400">Ürün Grubu</span>. Tüm stok ve satışlar bu hiyerarşiyle yönetilir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCiroWizardOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95"
            title="Veri Ciro Sihirbazı ile hızlı hedefleme ve dağıtım yapın"
          >
            <Sparkles className="w-4 h-4" />
            <span>Veri Ciro Sihirbazı</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleConfirmReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-semibold transition shadow-xs active:scale-95"
              title="Tüm kategorileri ve stokları standart 3 seviyeli yapıyla sıfırdan yükle"
            >
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Standart Hiyerarşiyi Sıfırla</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('profit')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Kâr Takip Sekmesi</span>
          </button>
        </div>
      </div>

      {/* Top-Level Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
        <button
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSection === 'categories'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>Kategoriler</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {productCategories.length + productSubCategories.length + productGroups.length + productBrands.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('vaderates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSection === 'vaderates'
              ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4 text-rose-500" />
          <span>Vade Oranları</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {vadeRates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('pricelists')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSection === 'pricelists'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          <span>Fiyat Listeleri</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {priceLists.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition ${
            activeSection === 'suppliers'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4 text-amber-500" />
          <span>Ortak Tedarikçiler</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* Sub-Bar for Categories: Ana Kategoriler, Alt Kategoriler, Ürün Grupları, Markalar */}
      {activeSection === 'categories' && (
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
          <button
            onClick={() => setCategorySubTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              categorySubTab === 'categories'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>1. Ana Kategoriler ({productCategories.length})</span>
          </button>

          <button
            onClick={() => setCategorySubTab('subcategories')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              categorySubTab === 'subcategories'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-sky-500" />
            <span>2. Alt Kategoriler ({productSubCategories.length})</span>
          </button>

          <button
            onClick={() => setCategorySubTab('productgroups')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              categorySubTab === 'productgroups'
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-purple-500" />
            <span>3. Ürün Grupları ({productGroups.length})</span>
          </button>

          <button
            onClick={() => setCategorySubTab('brands')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              categorySubTab === 'brands'
                ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-violet-500" />
            <span>4. Markalar ({productBrands.length})</span>
          </button>

          <button
            onClick={() => setCategorySubTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ml-auto ${
              categorySubTab === 'tree'
                ? 'bg-slate-800 text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ağaç Görünümü (Tree View)</span>
          </button>
        </div>
      )}

      {/* SECTION 0: TREE VIEW */}
      {activeSection === 'categories' && categorySubTab === 'tree' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  3 Seviyeli Canlı Hiyerarşi Haritası
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  Her Ana Kategori altındaki Alt Kategorileri ve bunlara bağlı Ürün Gruplarını ağaç dalları halinde inceleyin, düzenleyin veya yeni dallar ekleyin.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                {productCategories.length} Ana Kategori
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[11px]">
                {productSubCategories.length} Alt Kategori
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                {productGroups.length} Ürün Grubu
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {productCategories.map(cat => {
              const subs = productSubCategories.filter(
                s => s.categoryId === cat.id || s.categoryName === cat.name
              );
              const isCatExpanded = expandedCats[cat.id] ?? true;
              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
                >
                  <div
                    onClick={() => toggleCatExpand(cat.id)}
                    className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {isCatExpanded ? (
                          <ChevronDown className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#0ea5e9' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                            1. SEVİYE ANA KATEGORİ
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {cat.name}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {subs.length} Alt Kategori •{' '}
                          {productGroups.filter(g => g.categoryName === cat.name).length} Ürün Grubu
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedParentCatId(cat.id);
                          setActiveSection('subcategories');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Alt Kategori Ekle</span>
                      </button>
                    </div>
                  </div>

                  {isCatExpanded && (
                    <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                      {subs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-3">
                          Bu ana kategoriye henüz alt kategori eklenmedi.
                        </p>
                      ) : (
                        subs.map(sub => {
                          const groups = productGroups.filter(
                            g => g.subCategoryId === sub.id || g.subCategoryName === sub.name
                          );
                          const isSubExpanded = expandedSubs[sub.id] ?? false;
                          return (
                            <div
                              key={sub.id}
                              className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30 overflow-hidden ml-2 sm:ml-6"
                            >
                              <div
                                onClick={() => toggleSubExpand(sub.id)}
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800/60"
                              >
                                <div className="flex items-center gap-2.5">
                                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    {isSubExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-sky-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                                    2. SEVİYE ALT
                                  </span>
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                    {sub.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    ({groups.length} Ürün Grubu)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setSelectedGroupParentCatId(cat.id);
                                      setSelectedGroupSubCatId(sub.id);
                                      setActiveSection('productgroups');
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[11px] font-semibold transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Grup Ekle</span>
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `'${sub.name}' alt kategorisini ve altındaki tüm ürün gruplarını silmek istediğinize emin misiniz?`
                                          )
                                        ) {
                                          deleteProductSubCategory(sub.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                      title="Alt Kategoriyi Sil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isSubExpanded && (
                                <div className="p-3 bg-white dark:bg-slate-900/60">
                                  {groups.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">
                                      Bu alt kategoriye henüz ürün grubu atanmadı.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {groups.map(group => {
                                        const stockCount = stockItems.filter(
                                          s => s.productGroup === group.name
                                        ).length;
                                        return (
                                          <div
                                            key={group.id}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200"
                                          >
                                            <span className="font-semibold">{group.name}</span>
                                            {stockCount > 0 && (
                                              <span className="px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-800 text-[10px] font-bold text-purple-800 dark:text-purple-200">
                                                {stockCount} stok
                                              </span>
                                            )}
                                            {isAdmin && (
                                              <button
                                                onClick={() => {
                                                  if (
                                                    window.confirm(
                                                      `'${group.name}' ürün grubunu silmek istediğinize emin misiniz?`
                                                    )
                                                  ) {
                                                    deleteProductGroup(group.id);
                                                  }
                                                }}
                                                className="text-purple-400 hover:text-rose-600 ml-1 transition"
                                                title="Sil"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: Ana Kategoriler */}
      {activeSection === 'categories' && categorySubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              1. Seviye: Yeni Ana Kategori Ekle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              En üst düzey sektör kategorisi (Örn: MOBİLYA, BEYAZ EŞYA).
            </p>
            <form onSubmit={handleAddCategory} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ana Kategori Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Örn: MOBİLYA, BEYAZ EŞYA..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tema Rengi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-500">{newCatColor}</span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Ana Kategori Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tanımlı 1. Seviye Ana Kategoriler ({productCategories.length})
              </h3>
              <span className="text-xs text-slate-400">
                Tüm alt kategorilerin ve ürün gruplarının ana çatısı
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productCategories.map(cat => {
                const subCount = productSubCategories.filter(
                  s => s.categoryId === cat.id || s.categoryName === cat.name
                ).length;
                const groupCount = productGroups.filter(
                  g => g.categoryId === cat.id || g.categoryName === cat.name
                ).length;
                const isEditing = editingCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-xs mt-0.5"
                          style={{ backgroundColor: cat.color || '#0ea5e9' }}
                        />
                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={e => setEditingCatName(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                              <button
                                onClick={() => handleSaveEditCategory(cat)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {cat.name}
                            </h4>
                          )}
                          <span className="text-xs text-slate-400">
                            {subCount} Alt Kategori • {groupCount} Ürün Grubu
                          </span>
                        </div>
                      </div>

                      {isAdmin && !isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.name);
                            }}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded transition"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `'${cat.name}' ana kategorisini ve bağlı tüm alt kategorileri silmek istediğinize emin misiniz?`
                                )
                              ) {
                                deleteProductCategory(cat.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Kategoriyi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Alt Kategoriler (2. Seviye) */}
      {activeSection === 'categories' && categorySubTab === 'subcategories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              2. Seviye: Yeni Alt Kategori Ekle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ana kategoriye bağlı alt çeşitleri tanımlayın (Örn: BAMBİ, ALTUS, BOSCH, HOOVER, UGUR, MEDİSA, MASA...).
            </p>
            <form onSubmit={handleAddSubCategory} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Seviye: Bağlı Olduğu Ana Kategori *
                </label>
                <select
                  value={selectedParentCatId}
                  onChange={e => setSelectedParentCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {productCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alt Kategori Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                  placeholder="Örn: BAMBİ, ALTUS, BOSCH..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Alt Kategori Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Tanımlı 2. Seviye Alt Kategoriler ({productSubCategories.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Ana Kategori Filtresi:</span>
                <select
                  value={filterParentCat}
                  onChange={e => setFilterParentCat(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">Tüm Ana Kategoriler</option>
                  {productCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">1. Seviye (Ana Kategori)</th>
                    <th className="py-2.5 px-3 font-semibold">2. Seviye (Alt Kategori)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Bağlı Ürün Grubu</th>
                    <th className="py-2.5 px-3 font-semibold text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productSubCategories
                    .filter(s => filterParentCat === 'ALL' || s.categoryName === filterParentCat)
                    .map(sub => {
                      const groupCount = productGroups.filter(
                        g => g.subCategoryId === sub.id || g.subCategoryName === sub.name
                      ).length;
                      const isEditing = editingSubId === sub.id;
                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded text-[11px]">
                              {sub.categoryName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingSubName}
                                  onChange={e => setEditingSubName(e.target.value)}
                                  className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white outline-none"
                                />
                                <button
                                  onClick={() => handleSaveEditSubCategory(sub)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSubId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold">{sub.name}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[11px]">
                              {groupCount} grup
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isAdmin && !isEditing && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingSubId(sub.id);
                                    setEditingSubName(sub.name);
                                  }}
                                  className="p-1 text-slate-400 hover:text-sky-600 rounded transition"
                                  title="Düzenle"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `'${sub.name}' alt kategorisini ve bağlı ürün gruplarını silmek istediğinize emin misiniz?`
                                      )
                                    ) {
                                      deleteProductSubCategory(sub.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Ürün Grupları (3. Seviye) */}
      {activeSection === 'categories' && categorySubTab === 'productgroups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              3. Seviye: Yeni Ürün Grubu Ekle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alt kategoriye bağlı en detaylı ürün grubunu tanımlayın (Örn: BAMBİ YATAK, ALTUS FIRINLAR, UGUR CEKMECELI DONDURUCU...).
            </p>
            <form onSubmit={handleAddProductGroup} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Seviye (Ana Kategori) *
                </label>
                <select
                  value={selectedGroupParentCatId}
                  onChange={e => setSelectedGroupParentCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {productCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Seviye (Alt Kategori - Otomatik Filtreli) *
                </label>
                <select
                  value={selectedGroupSubCatId}
                  onChange={e => setSelectedGroupSubCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {subCategoriesForGroupForm.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Seviye (Ürün Grubu Adı) *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Örn: BAMBİ YATAK, ALTUS BUZDOLAPLARI..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Grup Kodu (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={newGroupCode}
                  onChange={e => setNewGroupCode(e.target.value)}
                  placeholder="Örn: PG-ALTUS-01"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Ürün Grubu Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Tanımlı 3. Seviye Ürün Grupları ({filteredProductGroups.length} / {productGroups.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Kademeli filtreleme ile listeyi daraltabilirsiniz.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterGroupCat}
                  onChange={e => {
                    setFilterGroupCat(e.target.value);
                    setFilterGroupSub('ALL');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">Tüm Ana Kat.</option>
                  {productCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterGroupSub}
                  onChange={e => setFilterGroupSub(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">Tüm Alt Kat.</option>
                  {subCategoriesForFilter.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Grup ara..."
                    className="pl-8 pr-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none w-32 focus:w-44 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">1. Seviye (Ana Kategori)</th>
                    <th className="py-2.5 px-3 font-semibold">2. Seviye (Alt Kategori)</th>
                    <th className="py-2.5 px-3 font-semibold">3. Seviye (Ürün Grubu)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Stok</th>
                    <th className="py-2.5 px-3 font-semibold text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProductGroups.map(group => {
                    const isEditing = editingGroupId === group.id;
                    const stockCount = stockItems.filter(
                      s => s.productGroup === group.name
                    ).length;

                    return (
                      <tr
                        key={group.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">
                            {group.categoryName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded text-[11px]">
                            {group.subCategoryName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingGroupName}
                                onChange={e => setEditingGroupName(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-slate-900 dark:text-white outline-none"
                              />
                              <button
                                onClick={() => handleSaveEditProductGroup(group)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingGroupId(null)}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 dark:text-white">
                              {group.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {stockCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                              {stockCount} adet
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isAdmin && !isEditing && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingGroupId(group.id);
                                  setEditingGroupName(group.name);
                                }}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded transition"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `'${group.name}' ürün grubunu silmek istediğinize emin misiniz?`
                                    )
                                  ) {
                                    deleteProductGroup(group.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Markalar */}
      {activeSection === 'categories' && categorySubTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              Yeni Marka Ekle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ürünlerin ve stokların bağlı olduğu üretici marka kartlarını tanımlayın.
            </p>
            <form onSubmit={handleAddBrand} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marka Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  placeholder="Örn: Bosch, Altus, Bambi..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İlişkili Ana Kategoriler
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {productCategories.map(cat => {
                    const isSelected = selectedBrandCategories.includes(cat.name);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedBrandCategories(prev => prev.filter(c => c !== cat.name));
                          } else {
                            setSelectedBrandCategories(prev => [...prev, cat.name]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Marka Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Tanımlı Markalar ({productBrands.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {productBrands.map(brand => (
                <div
                  key={brand.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {brand.name}
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {brand.categoryNames?.map(cn => (
                        <span
                          key={cn}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium"
                        >
                          {cn}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteProductBrand(brand.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Markayı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Ortak Tedarikçiler */}
      {activeSection === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Ortak Tedarikçi Listesi ({suppliers.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mal alımları ve stok kayıtlarında ortak kullanılan tedarikçi carileri.
              </p>
            </div>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Tedarikçi Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(sup => (
              <div
                key={sup.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Building className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {sup.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                    Tedarikçi
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400 pt-1">
                  {sup.phone && <div>Tel: <span className="text-slate-800 dark:text-slate-200 font-medium">{sup.phone}</span></div>}
                  {sup.email && <div>E-posta: <span className="text-slate-800 dark:text-slate-200 font-medium">{sup.email}</span></div>}
                  {sup.city && <div>Şehir: <span className="text-slate-800 dark:text-slate-200 font-medium">{sup.city}</span></div>}
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Güncel Bakiye:</span>
                  <span
                    className={`font-bold font-mono-num ${
                      sup.balance < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(sup.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: Vade Oranları */}
      {activeSection === 'vaderates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-rose-600" />
              Aylık Senet Vade Oranı Belirle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kâr Takip modülünde senetli satışlarda taksit sayısıyla çarpılarak maliyete eklenecek aylık faiz/vade farkı oranını (%) belirleyin.
            </p>
            <form onSubmit={handleSaveVadeRate} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dönem (Ay / Yıl) *
                </label>
                <input
                  type="month"
                  required
                  value={vadeMonth}
                  onChange={e => setVadeMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aylık Vade Farkı Oranı (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="30"
                    required
                    value={vadeRateVal}
                    onChange={e => setVadeRateVal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100 font-mono-num font-bold"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  💡 Örn: 12 ay senette aylık %3.5 vade farkı maliyete toplam %42 ekler.
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Not / Açıklama
                </label>
                <input
                  type="text"
                  value={vadeNotes}
                  onChange={e => setVadeNotes(e.target.value)}
                  placeholder="Standart bayi senet vade oranı"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Vade Oranı Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Kayıtlı Dönemsel Vade Oranları ({vadeRates.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Dönem</th>
                    <th className="py-2.5 px-3">Aylık Oran</th>
                    <th className="py-2.5 px-3">12 Aylık Toplam Fark</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vadeRates.map(v => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {v.monthKey}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-bold text-rose-600 dark:text-rose-400">
                        %{v.rateMonthly.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-slate-600 dark:text-slate-300">
                        %{(v.rateMonthly * 12).toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {v.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Fiyat Listeleri (Toptan & Perakende) */}
      {activeSection === 'pricelists' && (
        <div className="space-y-4">
          {/* Sub-bar for Toptan vs Perakende Fiyat Listesi */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPriceListFilter('Toptan');
                  setPriceListType('Toptan');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  priceListFilter === 'Toptan'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Toptan Fiyat Listesi</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/30 text-white font-mono">
                  {priceLists.filter(p => p.type === 'Toptan' || (!p.type && p.title.toLowerCase().includes('toptan'))).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPriceListFilter('Perakende');
                  setPriceListType('Perakende');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  priceListFilter === 'Perakende'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Perakende Fiyat Listesi</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/30 text-white font-mono">
                  {priceLists.filter(p => p.type === 'Perakende' || (!p.type && !p.title.toLowerCase().includes('toptan'))).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPriceListFilter('ALL')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                  priceListFilter === 'ALL'
                    ? 'bg-slate-700 text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Tüm Listeler ({priceLists.length})</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 pr-2">
              Seçili Kısım: <strong className="text-slate-900 dark:text-white">{priceListFilter === 'Toptan' ? 'Toptan Fiyat Listeleri' : priceListFilter === 'Perakende' ? 'Perakende Fiyat Listeleri' : 'Tümü'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Yeni {priceListType} Fiyat Listesi Ekle
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toptan bayi veya perakende tüketici tavsiye fiyat listesi kaydı oluşturun.
              </p>
              <form onSubmit={handleAddPriceList} className="space-y-3 pt-2">
                {/* Liste Türü Seçimi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Liste Türü *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriceListType('Toptan')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center ${
                        priceListType === 'Toptan'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Toptan Fiyat Listesi
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceListType('Perakende')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center ${
                        priceListType === 'Perakende'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Perakende Fiyat Listesi
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dönem (Ay / Yıl) *
                  </label>
                  <input
                    type="month"
                    required
                    value={priceListMonth}
                    onChange={e => setPriceListMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Liste Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={priceListTitle}
                    onChange={e => setPriceListTitle(e.target.value)}
                    placeholder={priceListType === 'Toptan' ? 'Örn: Ekim 2026 Toptan Bayi Fiyat Listesi' : 'Örn: Ekim 2026 Beyaz Eşya Perakende Listesi'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Kapsamı
                  </label>
                  <select
                    value={priceListCategory}
                    onChange={e => setPriceListCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Tüm Kategoriler">Tüm Kategoriler</option>
                    {productCategories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    İçerilen Kalem Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={priceListItemsCount}
                    onChange={e => setPriceListItemsCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Not / Açıklama
                  </label>
                  <input
                    type="text"
                    value={priceListNotes}
                    onChange={e => setPriceListNotes(e.target.value)}
                    placeholder={priceListType === 'Toptan' ? 'İskonto ve vade şartları' : 'Perakende tavsiye satış fiyatları'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                >
                  {priceListType} Fiyat Listesini Kaydet
                </button>
              </form>
            </div>

            {/* List Display */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {priceListFilter === 'Toptan' ? 'Toptan Fiyat Listeleri' : priceListFilter === 'Perakende' ? 'Perakende Fiyat Listeleri' : 'Tüm Fiyat Listeleri'} ({
                    priceLists.filter(pl => {
                      if (priceListFilter === 'Toptan') return pl.type === 'Toptan' || (!pl.type && pl.title.toLowerCase().includes('toptan'));
                      if (priceListFilter === 'Perakende') return pl.type === 'Perakende' || (!pl.type && !pl.title.toLowerCase().includes('toptan'));
                      return true;
                    }).length
                  })
                </h3>
              </div>

              {priceLists.filter(pl => {
                if (priceListFilter === 'Toptan') return pl.type === 'Toptan' || (!pl.type && pl.title.toLowerCase().includes('toptan'));
                if (priceListFilter === 'Perakende') return pl.type === 'Perakende' || (!pl.type && !pl.title.toLowerCase().includes('toptan'));
                return true;
              }).length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                  Bu kategoride henüz kayıtlı fiyat listesi bulunmuyor. Sol formdan yeni bir liste ekleyebilirsiniz.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {priceLists
                    .filter(pl => {
                      if (priceListFilter === 'Toptan') return pl.type === 'Toptan' || (!pl.type && pl.title.toLowerCase().includes('toptan'));
                      if (priceListFilter === 'Perakende') return pl.type === 'Perakende' || (!pl.type && !pl.title.toLowerCase().includes('toptan'));
                      return true;
                    })
                    .map(pl => {
                      const isToptan = pl.type === 'Toptan' || (!pl.type && pl.title.toLowerCase().includes('toptan'));
                      return (
                        <div
                          key={pl.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isToptan
                                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                                }`}>
                                  {isToptan ? 'Toptan' : 'Perakende'}
                                </span>
                                <span className="text-[10px] font-mono font-semibold text-slate-500">
                                  {pl.monthKey}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5">
                                {pl.title}
                              </h4>
                              <p className="text-xs text-slate-400">
                                {pl.categoryName} • {pl.itemsCount} ürün kalemi
                              </p>
                              {pl.notes && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                  {pl.notes}
                                </p>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => deletePriceList(pl.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tedarikçi Ekle */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                Yeni Ortak Tedarikçi Ekle
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tedarikçi Firma Ünvanı / Adı *
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Örn: Bosch Ev Aletleri A.Ş."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    placeholder="0216 444 0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={supplierCity}
                    onChange={e => setSupplierCity(e.target.value)}
                    placeholder="İstanbul"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={e => setSupplierEmail(e.target.value)}
                  placeholder="siparis@firma.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notlar
                </label>
                <textarea
                  rows={2}
                  value={supplierNotes}
                  onChange={e => setSupplierNotes(e.target.value)}
                  placeholder="Açık hesap 60 gün vade vb."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition active:scale-95 shadow-sm"
                >
                  Tedarikçiyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
