import React, { useState, useMemo, useRef } from 'react';
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
  Upload,
  Eye,
  Search,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Boxes,
  Save,
} from 'lucide-react';
import { PriceListDetailModal } from '../modals/PriceListDetailModal';
import { PriceListEntry, PriceListItem, PriceListType, CategoryHierarchyItem } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  getUniqueAnaKategoriler,
  getUniqueAltKategoriler,
  getUniqueUrunGruplari,
  POPULAR_BRANDS,
} from '../../data/initialCategories';
import * as XLSX from 'xlsx';

export const DefinitionsTab: React.FC = () => {
  const {
    categoryHierarchy,
    addCategoryHierarchyItem,
    updateCategoryHierarchyItem,
    deleteCategoryHierarchyItem,
    resetCategoryHierarchy,
    stockItems,
    productBrands,
    vadeRates,
    priceLists,
    caris,
    addProductBrand,
    deleteProductBrand,
    setVadeRate,
    addPriceList,
    deletePriceList,
    addCari,
    isAdmin,
    setActiveTab,
    openDataImporter,
    showToast,
  } = useFinance();

  const [activeSection, setActiveSection] = useState<
    'hierarchy' | 'pricelists' | 'brands' | 'suppliers' | 'vaderates'
  >('hierarchy');

  // Hierarchy Management State
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [hierarchyAnaFilter, setHierarchyAnaFilter] = useState('ALL');
  const [hierarchyAltFilter, setHierarchyAltFilter] = useState('ALL');
  const [expandedAna, setExpandedAna] = useState<Record<string, boolean>>({
    'MOBİLYA': true,
    'BEYAZ EŞYA': true,
  });
  const [expandedAlt, setExpandedAlt] = useState<Record<string, boolean>>({});

  // Add Hierarchy Item Form State
  const [isAddingHierarchy, setIsAddingHierarchy] = useState(false);
  const [newAnaKategori, setNewAnaKategori] = useState('MOBİLYA');
  const [newAltKategori, setNewAltKategori] = useState('');
  const [newUrunGrubu, setNewUrunGrubu] = useState('');

  // Editing Hierarchy Item State
  const [editingHierarchyId, setEditingHierarchyId] = useState<string | null>(null);
  const [editAnaKategori, setEditAnaKategori] = useState('');
  const [editAltKategori, setEditAltKategori] = useState('');
  const [editUrunGrubu, setEditUrunGrubu] = useState('');

  // Brand Form State
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedBrandCategories, setSelectedBrandCategories] = useState<string[]>(['BEYAZ EŞYA']);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [vadeMonth, setVadeMonth] = useState(currentMonthKey);
  const [vadeRateVal, setVadeRateVal] = useState<number>(3.5);
  const [vadeNotes, setVadeNotes] = useState('');

  // Fiyat Listesi Form State
  const [priceListMonth, setPriceListMonth] = useState(currentMonthKey);
  const [priceListTitle, setPriceListTitle] = useState('');
  const [priceListType, setPriceListType] = useState<PriceListType>('Toptan');
  const [priceListSupplierId, setPriceListSupplierId] = useState('');
  const [priceListCategory, setPriceListCategory] = useState('Tüm Kategoriler');
  const [priceListNotes, setPriceListNotes] = useState('');
  const [priceListFilterType, setPriceListFilterType] = useState<'ALL' | 'Toptan' | 'Perakende'>('ALL');
  const [selectedPriceListForDetail, setSelectedPriceListForDetail] = useState<PriceListEntry | null>(null);
  const excelPriceListInputRef = useRef<HTMLInputElement>(null);

  // Tedarikçi Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  const suppliers = useMemo(() => {
    return caris.filter(c => c.type === 'Tedarikçi');
  }, [caris]);

  const uniqueAnaList = useMemo(() => {
    return getUniqueAnaKategoriler(categoryHierarchy);
  }, [categoryHierarchy]);

  const uniqueAltList = useMemo(() => {
    return getUniqueAltKategoriler(
      categoryHierarchy,
      hierarchyAnaFilter !== 'ALL' ? hierarchyAnaFilter : undefined
    );
  }, [categoryHierarchy, hierarchyAnaFilter]);

  // Filtered Hierarchy Data for Table
  const filteredHierarchy = useMemo(() => {
    return categoryHierarchy.filter(item => {
      if (hierarchyAnaFilter !== 'ALL' && item.anaKategori.toUpperCase() !== hierarchyAnaFilter.toUpperCase()) {
        return false;
      }
      if (hierarchyAltFilter !== 'ALL' && item.altKategori.toUpperCase() !== hierarchyAltFilter.toUpperCase()) {
        return false;
      }
      if (hierarchySearch.trim()) {
        const q = hierarchySearch.toLowerCase();
        const mA = item.anaKategori.toLowerCase().includes(q);
        const mAlt = item.altKategori.toLowerCase().includes(q);
        const mG = item.urunGrubu.toLowerCase().includes(q);
        if (!mA && !mAlt && !mG) return false;
      }
      return true;
    });
  }, [categoryHierarchy, hierarchyAnaFilter, hierarchyAltFilter, hierarchySearch]);

  // Tree Structured Grouping
  const hierarchyTree = useMemo(() => {
    const tree: Record<string, Record<string, CategoryHierarchyItem[]>> = {};
    categoryHierarchy.forEach(item => {
      const ana = item.anaKategori?.trim().toUpperCase() || 'DİĞER';
      const alt = item.altKategori?.trim().toUpperCase() || 'GENEL';
      if (!tree[ana]) tree[ana] = {};
      if (!tree[ana][alt]) tree[ana][alt] = [];
      tree[ana][alt].push(item);
    });
    return tree;
  }, [categoryHierarchy]);

  const toggleAnaExpand = (ana: string) => {
    setExpandedAna(prev => ({ ...prev, [ana]: !prev[ana] }));
  };

  const toggleAltExpand = (key: string) => {
    setExpandedAlt(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddHierarchyItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnaKategori.trim() || !newAltKategori.trim() || !newUrunGrubu.trim()) {
      showToast('Ana Kategori, Alt Kategori ve Ürün Grubu zorunludur.', 'error');
      return;
    }
    addCategoryHierarchyItem({
      anaKategori: newAnaKategori.trim().toUpperCase(),
      altKategori: newAltKategori.trim().toUpperCase(),
      urunGrubu: newUrunGrubu.trim().toUpperCase(),
    });
    setNewUrunGrubu('');
    setIsAddingHierarchy(false);
  };

  const handleStartEditHierarchy = (item: CategoryHierarchyItem) => {
    setEditingHierarchyId(item.id);
    setEditAnaKategori(item.anaKategori);
    setEditAltKategori(item.altKategori);
    setEditUrunGrubu(item.urunGrubu);
  };

  const handleSaveEditHierarchy = (id: string) => {
    if (!editAnaKategori.trim() || !editAltKategori.trim() || !editUrunGrubu.trim()) {
      showToast('Tüm seviyeler dolu olmalıdır.', 'error');
      return;
    }
    updateCategoryHierarchyItem({
      id,
      anaKategori: editAnaKategori.trim().toUpperCase(),
      altKategori: editAltKategori.trim().toUpperCase(),
      urunGrubu: editUrunGrubu.trim().toUpperCase(),
    });
    setEditingHierarchyId(null);
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    addProductBrand({
      name: newBrandName.trim().toUpperCase(),
      categoryNames: selectedBrandCategories,
    });
    setNewBrandName('');
  };

  const handleSaveVadeRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vadeMonth) return;
    setVadeRate(vadeMonth, Number(vadeRateVal) || 0, vadeNotes.trim() || undefined);
    setVadeNotes('');
  };

  const handleAddPriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceListTitle.trim()) return;
    const sup = suppliers.find(s => s.id === priceListSupplierId);
    addPriceList({
      monthKey: priceListMonth,
      title: priceListTitle.trim(),
      listType: priceListType,
      supplierId: priceListSupplierId || undefined,
      supplierName: sup ? sup.name : undefined,
      categoryName: priceListCategory,
      itemsCount: 0,
      items: [],
      notes: priceListNotes.trim() || undefined,
    });
    setPriceListTitle('');
    setPriceListNotes('');
  };

  const handleUploadNewPriceListExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];
        if (!rows || rows.length === 0) {
          alert('Excel dosyasında okunabilecek kayıt bulunamadı.');
          return;
        }
        const items: PriceListItem[] = [];
        rows.forEach((r, idx) => {
          const rawCode = r['stokKodu'] || r['stok_kodu'] || r['Stok Kodu'] || r['kod'] || r['code'];
          const rawName = r['urunAdi'] || r['urun_adi'] || r['Ürün Adı'] || r['Urun Adi'] || r['name'] || rawCode;
          const rawPrice = Number(
            r['toptanFiyat'] ||
            r['perakendeFiyat'] ||
            r['fiyat'] ||
            r['Fiyat'] ||
            r['Alış Fiyatı'] ||
            r['Satış Fiyatı'] ||
            0
          );
          if (rawCode || rawName) {
            items.push({
              id: `pli-imp-${Date.now()}-${idx}`,
              stokKodu: String(rawCode || '').trim(),
              code: String(rawCode || '').trim(),
              urunAdi: String(rawName).trim(),
              name: String(rawName).trim(),
              anaKategori: r['Ana Kategori'] || 'MOBİLYA',
              altKategori: r['Alt Kategori'] || 'BAMBİ',
              urunGrubu: r['Ürün Grubu'] || 'BAMBİ YATAK',
              brand: r['Marka'] ? String(r['Marka']).trim() : 'GENEL',
              toptanFiyat: rawPrice,
              perakendeFiyat: rawPrice,
              costPrice: rawPrice,
              salePrice: rawPrice,
              notes: r['Notlar'] ? String(r['Notlar']).trim() : undefined,
            });
          }
        });
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const newEntry: PriceListEntry = {
          id: `pl-${Date.now()}`,
          monthKey: currentMonthKey,
          title: fileNameWithoutExt || `${currentMonthKey} Excel Fiyat Listesi`,
          listType: priceListType,
          supplierId: priceListSupplierId || undefined,
          supplierName: suppliers.find(s => s.id === priceListSupplierId)?.name,
          categoryName: 'Tüm Kategoriler',
          itemsCount: items.length,
          items,
          notes: `Excel'den içe aktarım (${items.length} kalem)`,
        };
        addPriceList(newEntry);
        setSelectedPriceListForDetail(newEntry);
      } catch (err: any) {
        alert('Excel okuma hatası: ' + err.message);
      } finally {
        if (excelPriceListInputRef.current) excelPriceListInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    addCari({
      name: supplierName.trim(),
      type: 'Tedarikçi',
      phone: supplierPhone.trim() || undefined,
      email: supplierEmail.trim() || undefined,
      city: supplierCity.trim() || undefined,
      notes: supplierNotes.trim() || undefined,
      balance: 0,
    });
    setIsSupplierModalOpen(false);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierCity('');
    setSupplierNotes('');
  };

  const filteredPriceLists = useMemo(() => {
    return priceLists.filter(p => {
      if (priceListFilterType !== 'ALL' && p.listType !== priceListFilterType) return false;
      return true;
    });
  }, [priceLists, priceListFilterType]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 p-5 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Tanımlamalar & 3 Seviyeli Kategori Yönetimi</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Sistem ekrandan yönetilebilen tam 3 seviyeli zorunlu hiyerarşik yapıya (<code className="text-emerald-300 font-semibold font-mono">Ana Kategori</code> → <code className="text-emerald-300 font-semibold font-mono">Alt Kategori</code> → <code className="text-emerald-300 font-semibold font-mono">Ürün Grubu</code>) sahiptir. Fiyat listeleri, stok kartları ve satışlar bu hiyerarşiyle entegredir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDataImporter('stok')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Yalın Mal Alımı Yap</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
        <button
          onClick={() => setActiveSection('hierarchy')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'hierarchy'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4 text-emerald-500" />
          <span>3 Seviyeli Kategori Hiyerarşisi ({categoryHierarchy.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('pricelists')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'pricelists'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          <span>Fiyat Listeleri ({priceLists.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('brands')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'brands'
              ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 text-purple-500" />
          <span>Markalar ({productBrands.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('suppliers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'suppliers'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building className="w-4 h-4 text-amber-500" />
          <span>Ortak Tedarikçiler ({suppliers.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('vaderates')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'vaderates'
              ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4 text-rose-500" />
          <span>Aylık Vade Oranları ({vadeRates.length})</span>
        </button>
      </div>

      {/* SECTION 1: 3 SEVİYELİ KATEGORİ HİYERARŞİSİ (AĞAÇ & TABLO) */}
      {activeSection === 'hierarchy' && (
        <div className="space-y-4">
          {/* Top Control Bar for Hierarchy */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Kayıtlı Grup Sayısı: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{categoryHierarchy.length}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs text-slate-500">
                {uniqueAnaList.length} Ana Kategori · {getUniqueAltKategoriler(categoryHierarchy).length} Alt Kategori
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddingHierarchy(!isAddingHierarchy)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingHierarchy ? 'Formu Kapat' : 'Yeni Grup / Kategori Ekle'}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (window.confirm('Tüm hiyerarşiyi başlangıçtaki 13 tam gruba sıfırlamak istiyor musunuz?')) {
                      resetCategoryHierarchy();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition"
                  title="Varsayılan 13 Hiyerarşi Grubuna Sıfırla"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Varsayılana Sıfırla</span>
                </button>
              )}
            </div>
          </div>

          {/* Add Hierarchy Form Collapsible */}
          {isAddingHierarchy && (
            <form
              onSubmit={handleAddHierarchyItem}
              className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Yeni 3 Seviyeli Hiyerarşi Grubu Oluştur</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingHierarchy(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Ana Kategori *
                  </label>
                  <select
                    value={newAnaKategori}
                    onChange={e => setNewAnaKategori(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MOBİLYA">MOBİLYA</option>
                    <option value="BEYAZ EŞYA">BEYAZ EŞYA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Alt Kategori *
                  </label>
                  <input
                    type="text"
                    required
                    list="new-alt-options"
                    value={newAltKategori}
                    onChange={e => setNewAltKategori(e.target.value.toUpperCase())}
                    placeholder="Örn: BAMBİ, ALTUS, MEDİSA..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="new-alt-options">
                    {getUniqueAltKategoriler(categoryHierarchy, newAnaKategori).map(alt => (
                      <option key={alt} value={alt} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Ürün Grubu *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUrunGrubu}
                    onChange={e => setNewUrunGrubu(e.target.value.toUpperCase())}
                    placeholder="Örn: BAMBİ YATAK, ALTUS FIRINLAR..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingHierarchy(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-xs"
                >
                  Hiyerarşiye Kaydet
                </button>
              </div>
            </form>
          )}

          {/* 2-Column Layout: Left: Tree Accordion, Right: Data Grid Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SOL: KADEMELİ AĞAÇ (TREE VIEW) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Hiyerarşik Ağaç Görünümü
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Tıklayarak filtreleyin
                </span>
              </div>

              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {Object.entries(hierarchyTree).map(([anaName, altGroup]) => {
                  const isAnaExpanded = expandedAna[anaName] ?? true;
                  const totalItemsInAna = Object.values(altGroup).reduce((s, g) => s + g.length, 0);

                  return (
                    <div
                      key={anaName}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-850/50"
                    >
                      {/* Ana Kategori Başlığı */}
                      <button
                        type="button"
                        onClick={() => toggleAnaExpand(anaName)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2">
                          {isAnaExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {anaName}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {totalItemsInAna} grup
                        </span>
                      </button>

                      {/* Alt Kategoriler Listesi */}
                      {isAnaExpanded && (
                        <div className="pl-6 pr-3 py-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                          {Object.entries(altGroup).map(([altName, groupItems]) => {
                            const altKey = `${anaName}__${altName}`;
                            const isAltExpanded = expandedAlt[altKey] ?? false;

                            return (
                              <div
                                key={altKey}
                                className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1 space-y-1"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleAltExpand(altKey)}
                                  className="w-full flex items-center justify-between text-left group"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {isAltExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-sky-500" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500" />
                                    )}
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                                      {altName}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {groupItems.length}
                                  </span>
                                </button>

                                {/* Ürün Grupları */}
                                {isAltExpanded && (
                                  <div className="pl-5 pt-1 space-y-1">
                                    {groupItems.map(g => (
                                      <div
                                        key={g.id}
                                        onClick={() => {
                                          setHierarchySearch(g.urunGrubu);
                                        }}
                                        className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-500 cursor-pointer py-0.5 group/item"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          · {g.urunGrubu}
                                        </span>
                                        {isAdmin && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteCategoryHierarchyItem(g.id);
                                            }}
                                            className="opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-500 transition"
                                            title="Sil"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SAĞ: ARAMA FİLTRELİ HİYERARŞİ TABLOSU & CRUD */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={hierarchySearch}
                    onChange={e => setHierarchySearch(e.target.value)}
                    placeholder="Ana, alt kategori veya ürün grubu ara..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
                  />
                  {hierarchySearch && (
                    <button
                      onClick={() => setHierarchySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={hierarchyAnaFilter}
                    onChange={e => {
                      setHierarchyAnaFilter(e.target.value);
                      setHierarchyAltFilter('ALL');
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="ALL">Tüm Ana</option>
                    {uniqueAnaList.map(a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>

                  <select
                    value={hierarchyAltFilter}
                    onChange={e => setHierarchyAltFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="ALL">Tüm Alt</option>
                    {uniqueAltList.map(alt => (
                      <option key={alt} value={alt}>
                        {alt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[560px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xs font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Ana Kategori</th>
                      <th className="py-2.5 px-3">Alt Kategori</th>
                      <th className="py-2.5 px-3">Ürün Grubu</th>
                      <th className="py-2.5 px-3 text-center">Stok Kaydı</th>
                      <th className="py-2.5 px-3 text-right w-24">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHierarchy.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Arama ve filtrelere uygun hiyerarşi kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredHierarchy.map(item => {
                        const isEditing = editingHierarchyId === item.id;
                        const matchingStockCount = stockItems.filter(
                          s => s.urunGrubu && s.urunGrubu.toUpperCase() === item.urunGrubu.toUpperCase()
                        ).length;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition group"
                          >
                            {/* Ana Kategori */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isEditing ? (
                                <select
                                  value={editAnaKategori}
                                  onChange={e => setEditAnaKategori(e.target.value)}
                                  className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-xs font-semibold"
                                >
                                  <option value="MOBİLYA">MOBİLYA</option>
                                  <option value="BEYAZ EŞYA">BEYAZ EŞYA</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  item.anaKategori === 'MOBİLYA'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                }`}>
                                  {item.anaKategori}
                                </span>
                              )}
                            </td>

                            {/* Alt Kategori */}
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editAltKategori}
                                  onChange={e => setEditAltKategori(e.target.value.toUpperCase())}
                                  className="px-2 py-1 bg-white dark:bg-slate-800 border rounded text-xs font-semibold w-28"
                                />
                              ) : (
                                <span>{item.altKategori}</span>
                              )}
                            </td>

                            {/* Ürün Grubu */}
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editUrunGrubu}
                                  onChange={e => setEditUrunGrubu(e.target.value.toUpperCase())}
                                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-500 rounded text-xs font-medium w-full"
                                />
                              ) : (
                                <span>{item.urunGrubu}</span>
                              )}
                            </td>

                            {/* Stoktaki Kayıt Adedi */}
                            <td className="py-2.5 px-3 text-center font-mono">
                              {matchingStockCount > 0 ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">
                                  {matchingStockCount} ürün
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>

                            {/* İşlemler */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isEditing ? (
                                  <button
                                    onClick={() => handleSaveEditHierarchy(item.id)}
                                    className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
                                    title="Kaydet"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStartEditHierarchy(item)}
                                    className="p-1 text-slate-400 hover:text-emerald-600 rounded transition"
                                    title="Düzenle"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => deleteCategoryHierarchyItem(item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                    title="Hiyerarşiden Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FİYAT LİSTELERİ */}
      {activeSection === 'pricelists' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Yeni Fiyat Listesi Oluştur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Listenin türü (Toptan veya Perakende) ve varsa bağlı olduğu tedarikçi firmayı belirleyiniz.
            </p>
            <form onSubmit={handleAddPriceList} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fiyat Listesi Türü
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPriceListType('Toptan')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${
                      priceListType === 'Toptan'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Toptan Fiyat Listesi
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceListType('Perakende')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${
                      priceListType === 'Perakende'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Perakende Fiyat Listesi
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Uygulama Dönemi (YYYY-MM) *
                </label>
                <input
                  type="month"
                  required
                  value={priceListMonth}
                  onChange={e => setPriceListMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
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
                  placeholder="Ör: Ekim 2026 Bosch Toptan Fiyat Listesi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tedarikçi / Firma (Opsiyonel)
                </label>
                <select
                  value={priceListSupplierId}
                  onChange={e => setPriceListSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="">Firma Bağımsız / Genel</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
                  <option value="MOBİLYA">MOBİLYA</option>
                  <option value="BEYAZ EŞYA">BEYAZ EŞYA</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Fiyat Listesi Ekle
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Kayıtlı Fiyat Listeleri ({filteredPriceLists.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setPriceListFilterType('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      priceListFilterType === 'ALL'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setPriceListFilterType('Toptan')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      priceListFilterType === 'Toptan'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Toptan
                  </button>
                  <button
                    onClick={() => setPriceListFilterType('Perakende')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      priceListFilterType === 'Perakende'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Perakende
                  </button>
                </div>
                <input
                  type="file"
                  ref={excelPriceListInputRef}
                  onChange={handleUploadNewPriceListExcel}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelPriceListInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Excel'den Liste Ekle</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredPriceLists.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Bu filtrede fiyat listesi bulunamadı.
                </div>
              ) : (
                filteredPriceLists.map(pl => {
                  const isToptan = pl.listType === 'Toptan';
                  return (
                    <div
                      key={pl.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              isToptan
                                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            }`}
                          >
                            {pl.listType} Fiyat Listesi
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {pl.monthKey}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {pl.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                          {pl.supplierName && (
                            <>
                              <span>Firma: <strong className="text-slate-700 dark:text-slate-300">{pl.supplierName}</strong></span>
                              <span>·</span>
                            </>
                          )}
                          <span>Kategori: <strong>{pl.categoryName || 'Tüm Kategoriler'}</strong></span>
                          <span>·</span>
                          <span>{pl.items?.length || pl.itemsCount} ürün kalemi</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPriceListForDetail(pl)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Kalemleri İncele</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deletePriceList(pl.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Listeyi Kaldır"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MARKALAR */}
      {activeSection === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              Yeni Marka Ekle
            </h3>
            <form onSubmit={handleAddBrand} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marka Adı
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value.toUpperCase())}
                  placeholder="Ör: BOSCH, BAMBI, ALTUS..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Markayı Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Tanımlı Markalar ({productBrands.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {productBrands.map(b => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between"
                >
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-500" />
                    {b.name}
                  </h4>
                  {isAdmin && (
                    <button
                      onClick={() => deleteProductBrand(b.id)}
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

      {/* SECTION 4: TEDARİKÇİLER */}
      {activeSection === 'suppliers' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                Ortak Tedarikçi Carileri ({suppliers.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Finans, Mal Alımı ve Fiyat Listeleri bu ortak tedarikçi tablosunu kullanır.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSupplierModalOpen(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Tedarikçi Ekle</span>
              </button>
              <button
                onClick={() => setActiveTab('currents')}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cari Kartlara Git →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tedarikçi Firma</th>
                  <th className="py-2.5 px-3 font-semibold">Şehir</th>
                  <th className="py-2.5 px-3 font-semibold">Telefon</th>
                  <th className="py-2.5 px-3 font-semibold">E-posta</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Güncel Cari Borcumuz</th>
                  <th className="py-2.5 px-3 font-semibold">Notlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{sup.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{sup.city || '-'}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{sup.phone || '-'}</td>
                    <td className="py-3 px-3 text-slate-500">{sup.email || '-'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(Math.abs(sup.balance))} (Borç)
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">{sup.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: VADE ORANLARI */}
      {activeSection === 'vaderates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Percent className="w-4 h-4 text-rose-600" />
              Aylık Vade Farkı Oranı Belirle
            </h3>
            <form onSubmit={handleSaveVadeRate} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Uygulanacak Ay (YYYY-MM)
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
                  Aylık Vade Farkı Oranı (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    required
                    value={vadeRateVal}
                    onChange={e => setVadeRateVal(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100 font-mono font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Oranı Sisteme Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Kayıtlı Aylık Vade Farkı Oranları ({vadeRates.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Dönem (Ay)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Aylık Oran (%)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">12 Ay Senet Yükü</th>
                    <th className="py-2.5 px-3 font-semibold">Notlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vadeRates.map(vr => (
                    <tr key={vr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold font-mono text-slate-900 dark:text-white">{vr.monthKey}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">%{vr.rateMonthly}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">%{(12 * vr.rateMonthly).toFixed(1)}</td>
                      <td className="py-3 px-3 text-slate-500">{vr.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                Yeni Tedarikçi Firma Ekle
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tedarikçi Firma Adı *
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Ör: Bosch Ev Aletleri A.Ş."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    placeholder="0212..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={supplierCity}
                    onChange={e => setSupplierCity(e.target.value)}
                    placeholder="İstanbul"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                >
                  Tedarikçiyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price List Detail Modal */}
      <PriceListDetailModal
        isOpen={Boolean(selectedPriceListForDetail)}
        onClose={() => setSelectedPriceListForDetail(null)}
        priceList={selectedPriceListForDetail}
      />
    </div>
  );
};
