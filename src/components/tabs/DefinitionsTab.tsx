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
  TrendingUp,
  X,
  Upload,
  Eye,
} from 'lucide-react';
import { PriceListDetailModal } from '../modals/PriceListDetailModal';
import { PriceListEntry, PriceListItem, PriceListType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import * as XLSX from 'xlsx';

export const DefinitionsTab: React.FC = () => {
  const {
    productCategories,
    productSubCategories,
    productBrands,
    vadeRates,
    priceLists,
    caris,
    addProductCategory,
    deleteProductCategory,
    addProductSubCategory,
    deleteProductSubCategory,
    addProductBrand,
    deleteProductBrand,
    setVadeRate,
    addPriceList,
    deletePriceList,
    addCari,
    isAdmin,
    setActiveTab,
    openDataImporter,
  } = useFinance();

  const [activeSection, setActiveSection] = useState<
    'categories' | 'subcategories' | 'brands' | 'suppliers' | 'vaderates' | 'pricelists'
  >('pricelists');

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0ea5e9');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [selectedParentCatId, setSelectedParentCatId] = useState(
    productCategories[0]?.id || 'pcat-1'
  );
  const [filterParentCat, setFilterParentCat] = useState<string>('ALL');
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedBrandCategories, setSelectedBrandCategories] = useState<string[]>(['Beyaz Eşya']);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [vadeMonth, setVadeMonth] = useState(currentMonthKey);
  const [vadeRateVal, setVadeRateVal] = useState<number>(3.5);
  const [vadeNotes, setVadeNotes] = useState('');

  // Fiyat Listesi Ekleme Form State
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

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addProductCategory({
      name: newCatName.trim(),
      type: newCatName.trim(),
      color: newCatColor,
    });
    setNewCatName('');
  };

  const handleAddSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCatName.trim()) return;
    const parent = productCategories.find(c => c.id === selectedParentCatId);
    if (!parent) return;
    addProductSubCategory({
      categoryId: parent.id,
      categoryName: parent.name,
      name: newSubCatName.trim(),
    });
    setNewSubCatName('');
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    addProductBrand({
      name: newBrandName.trim(),
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
              category: r['Kategori'] ? String(r['Kategori']).trim() : 'Beyaz Eşya',
              brand: r['Marka'] ? String(r['Marka']).trim() : 'Genel',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 p-5 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Tanımlamalar & Fiyat Listeleri</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Sistemde iki ayrı fiyat listesi yapısı yer alır: <strong>Toptan Fiyat Listesi</strong> (stokKodu, urunAdi, toptanFiyat) ve <strong>Perakende Fiyat Listesi</strong> (stokKodu, urunAdi, perakendeFiyat). Mal Alımı ekranında kaynak liste baz alınarak genel iskonto düşülür ve en yakın 10 TL katına yuvarlanarak etiket fiyatı üretilir.
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
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'categories'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>Ana Kategoriler ({productCategories.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('subcategories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition ${
            activeSection === 'subcategories'
              ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4 text-sky-500" />
          <span>Alt Kategoriler ({productSubCategories.length})</span>
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

      {/* SECTION: FİYAT LİSTELERİ (TOPTAN VE PERAKENDE AYRIMI) */}
      {activeSection === 'pricelists' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol Kolon: Yeni Fiyat Listesi Ekle Formu */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Yeni Fiyat Listesi Oluştur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Listenin türünü (Toptan veya Perakende) ve varsa bağlı olduğu tedarikçi firmayı belirleyiniz.
            </p>

            <form onSubmit={handleAddPriceList} className="space-y-3 pt-2">
              {/* Liste Türü Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fiyat Listesi Türü *
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
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {priceListType === 'Toptan'
                    ? 'Toptan alım maliyeti: stokKodu, urunAdi, toptanFiyat'
                    : 'Etiket satış fiyatı: stokKodu, urunAdi, perakendeFiyat'}
                </span>
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
                  placeholder="ör: Ekim 2026 Bosch Toptan Fiyat Listesi"
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
                  {productCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Açıklama / Not
                </label>
                <input
                  type="text"
                  value={priceListNotes}
                  onChange={e => setPriceListNotes(e.target.value)}
                  placeholder="ör: Sezonluk bayi tavsiye alım listesi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                Fiyat Listesi Ekle
              </button>
            </form>
          </div>

          {/* Sağ Kolon: Tanımlı Fiyat Listeleri */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Kayıtlı Fiyat Listeleri ({filteredPriceLists.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Toptan veya Perakende listeleri filtreleyebilir, detaylarını inceleyip düzenleyebilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Tür Filtresi */}
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
                  title="Excel'den doğrudan yeni fiyat listesi yükle"
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
                          {pl.notes && (
                            <>
                              <span>·</span>
                              <span className="text-slate-400 italic">{pl.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPriceListForDetail(pl)}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
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

      {/* SECTION: ANA KATEGORİLER */}
      {activeSection === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Yeni Ana Kategori Ekle
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Adı
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="ör: Beyaz Eşya, Mobilya, TV..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
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
                Kategori Kaydet
              </button>
            </form>
          </div>
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Tanımlı Ana Kategoriler ({productCategories.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productCategories.map(cat => {
                const subCount = productSubCategories.filter(s => s.categoryId === cat.id || s.categoryName === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#0ea5e9' }}
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {cat.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {subCount} alt kategori tanımlı
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deleteProductCategory(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Kategoriyi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION: ALT KATEGORİLER */}
      {activeSection === 'subcategories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              Yeni Alt Kategori Ekle
            </h3>
            <form onSubmit={handleAddSubCategory} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bağlı Olduğu Ana Kategori
                </label>
                <select
                  value={selectedParentCatId}
                  onChange={e => setSelectedParentCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
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
                  Alt Kategori Adı
                </label>
                <input
                  type="text"
                  required
                  value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                  placeholder="ör: Buzdolabı, Çamaşır Makinesi..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100"
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
                Tanımlı Alt Kategoriler ({productSubCategories.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filtrele:</span>
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
                    <th className="py-2.5 px-3 font-semibold">Ana Kategori</th>
                    <th className="py-2.5 px-3 font-semibold">Alt Kategori Çeşidi</th>
                    <th className="py-2.5 px-3 font-semibold text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productSubCategories
                    .filter(s => filterParentCat === 'ALL' || s.categoryName === filterParentCat)
                    .map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded text-[11px]">
                            {sub.categoryName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {sub.name}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isAdmin && (
                            <button
                              onClick={() => deleteProductSubCategory(sub.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Sil"
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
          </div>
        </div>
      )}

      {/* SECTION: MARKALAR */}
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
                  onChange={e => setNewBrandName(e.target.value)}
                  placeholder="ör: Bosch, Bambi, Altus, Hoover..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  İlişkili Ürün Kategorileri
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  {productCategories.map(cat => {
                    const isChecked = selectedBrandCategories.includes(cat.name);
                    return (
                      <label key={cat.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedBrandCategories(prev => [...prev, cat.name]);
                            } else {
                              setSelectedBrandCategories(prev => prev.filter(c => c !== cat.name));
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
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
              Tanımlı Markalar Listesi ({productBrands.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {productBrands.map(b => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-500" />
                      {b.name}
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(b.categoryNames || []).map(catName => (
                        <span key={catName} className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium">
                          {catName}
                        </span>
                      ))}
                    </div>
                  </div>
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

      {/* SECTION: ORTAK TEDARİKÇİLER */}
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
                Cari Kartlara Git ➔
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
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-rose-600 dark:text-rose-400">
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

      {/* SECTION: VADE FARKI ORANLARI */}
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
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100 font-mono-num font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Açıklama / Not
                </label>
                <input
                  type="text"
                  value={vadeNotes}
                  onChange={e => setVadeNotes(e.target.value)}
                  placeholder="ör: 2026 Ekim dönemi standart senet vadesi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                />
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
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-rose-600 dark:text-rose-400 text-sm">%{vr.rateMonthly}</td>
                      <td className="py-3 px-3 text-right font-mono-num font-medium text-slate-700 dark:text-slate-300">%{(12 * vr.rateMonthly).toFixed(1)}</td>
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
                  Tedarikçi Firma Adı
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="ör: Bosch Ev Aletleri A.Ş."
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">E-posta</label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={e => setSupplierEmail(e.target.value)}
                  placeholder="siparis@firma.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Not / Tedarik Ürün Grupları</label>
                <textarea
                  rows={2}
                  value={supplierNotes}
                  onChange={e => setSupplierNotes(e.target.value)}
                  placeholder="Beyaz eşya, ankastre ve küçük ev aletleri tedariği"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 resize-none"
                />
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
