import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  ShoppingBag,
  CreditCard,
  FileText,
  Boxes,
  Trash2,
  DollarSign,
  Percent,
  Calculator,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { SaleRecord, SaleType } from '../../types/finance';

export const ProfitTab: React.FC = () => {
  const {
    sales,
    stockItems,
    caris,
    accounts,
    productCategories,
    addSaleRecord,
    deleteSaleRecord,
    getVadeRateForMonth,
    setActiveTab,
    isAdmin,
    userProfile,
  } = useFinance();

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr); // 'ALL' or '01'-'12'
  const [selectedSaleType, setSelectedSaleType] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State for New Sale
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentNo, setDocumentNo] = useState(`FAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleType, setSaleType] = useState<SaleType>('Peşin');
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [salesPerson, setSalesPerson] = useState(
    userProfile?.displayName || userProfile?.username || 'İlker Arslan'
  );
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc-kasa');
  const [notes, setNotes] = useState('');

  // Auto-fill product cost & recommended sale price when product selected
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = stockItems.find(p => p.id === productId);
    if (prod) {
      setCostPrice(prod.purchasePrice);
      setSalePrice(prod.salePrice || Math.round(prod.purchasePrice * 1.35));
    }
  };

  // Dynamic Vade Farkı Rate for selected sale date
  const saleMonthKey = saleDate.substring(0, 7); // YYYY-MM
  const currentVadeRateMonthly = getVadeRateForMonth(saleMonthKey);

  // Live calculation of Vade Farkı and Profit in modal
  const modalTotalCost = +(quantity * costPrice).toFixed(2);
  const modalTotalSale = +(quantity * salePrice).toFixed(2);
  const modalVadeFarki =
    saleType === 'Senetli Satış'
      ? +(modalTotalCost * ((currentVadeRateMonthly * installmentsCount) / 100)).toFixed(2)
      : 0;
  const modalEffectiveCost = +(modalTotalCost + modalVadeFarki).toFixed(2);
  const modalNetProfit = +(modalTotalSale - modalEffectiveCost).toFixed(2);
  const modalProfitMargin = modalTotalSale > 0 ? +((modalNetProfit / modalTotalSale) * 100).toFixed(1) : 0;

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Year filter
      if (selectedYear !== 'ALL' && !s.date.startsWith(selectedYear)) return false;
      // Month filter
      if (selectedMonth !== 'ALL') {
        const saleMonth = s.date.substring(5, 7);
        if (saleMonth !== selectedMonth) return false;
      }
      // Sale Type
      if (selectedSaleType !== 'ALL' && s.saleType !== selectedSaleType) return false;
      // Category
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesCustomer = s.customerName.toLowerCase().includes(q);
        const matchesProduct = s.productName.toLowerCase().includes(q);
        const matchesPerson = s.salesPerson.toLowerCase().includes(q);
        const matchesDoc = (s.documentNo || '').toLowerCase().includes(q);
        const matchesBrand = (s.brand || '').toLowerCase().includes(q);
        if (!matchesCustomer && !matchesProduct && !matchesPerson && !matchesDoc && !matchesBrand) {
          return false;
        }
      }
      return true;
    });
  }, [sales, selectedYear, selectedMonth, selectedSaleType, selectedCategory, searchTerm]);

  // Aggregate KPI stats for filtered sales
  const totalCiro = filteredSales.reduce((sum, s) => sum + s.totalSaleAmount, 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
  const totalVadeFarki = filteredSales.reduce((sum, s) => sum + (s.vadeFarkiAmount || 0), 0);
  const totalNetProfit = filteredSales.reduce((sum, s) => sum + s.netProfit, 0);
  const averageMargin = totalCiro > 0 ? (totalNetProfit / totalCiro) * 100 : 0;

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = stockItems.find(p => p.id === selectedProductId);
    if (!prod && !selectedProductId) {
      alert('Lütfen satış yapılan ürünü seçin.');
      return;
    }

    const prodName = prod ? prod.name : 'Ürün Satışı';
    const prodCat = prod ? prod.category : 'Mobilya & Beyaz Eşya';
    const prodSub = prod ? prod.subCategory : undefined;
    const prodBrand = prod ? prod.brand : undefined;
    const prodSupplierId = prod ? prod.supplierId : undefined;
    const prodSupplierName = prod ? prod.supplierName : undefined;

    addSaleRecord({
      date: saleDate,
      documentNo: documentNo.trim() || undefined,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim() || 'Perakende Müşteri',
      productId: prod?.id,
      productName: prodName,
      category: prodCat,
      subCategory: prodSub,
      brand: prodBrand,
      supplierId: prodSupplierId,
      supplierName: prodSupplierName,
      quantity: Number(quantity) || 1,
      costPrice: Number(costPrice) || 0,
      totalCost: modalTotalCost,
      saleType,
      installmentsCount: saleType === 'Senetli Satış' ? Number(installmentsCount) : undefined,
      vadeRateMonthly: saleType === 'Senetli Satış' ? currentVadeRateMonthly : undefined,
      vadeFarkiAmount: modalVadeFarki,
      effectiveCost: modalEffectiveCost,
      salePrice: Number(salePrice) || 0,
      totalSaleAmount: modalTotalSale,
      netProfit: modalNetProfit,
      profitMargin: modalProfitMargin,
      salesPerson: salesPerson.trim() || 'Personel',
      accountId: selectedAccountId,
      notes: notes.trim() || undefined,
    });

    setIsSaleModalOpen(false);
    // Reset form
    setCustomerName('');
    setSelectedCustomerId('');
    setSelectedProductId('');
    setQuantity(1);
    setCostPrice(0);
    setSalePrice(0);
    setNotes('');
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      alert('Dışa aktarılacak satış kaydı bulunamadı.');
      return;
    }
    const headers = [
      'Tarih',
      'Belge No',
      'Müşteri Adı',
      'Ürün Adı',
      'Kategori',
      'Marka',
      'Adet',
      'Alış Maliyeti (TL)',
      'Satış Şekli',
      'Taksit / Vade',
      'Vade Farkı Maliyeti (TL)',
      'Toplam Satış Cirosu (TL)',
      'Net Kâr (TL)',
      'Kâr Marjı (%)',
      'Satış Personeli',
    ];
    const rows = filteredSales.map(s => [
      s.date,
      `"${s.documentNo || '-'}"`,
      `"${s.customerName}"`,
      `"${s.productName}"`,
      `"${s.category}"`,
      `"${s.brand || '-'}"`,
      s.quantity,
      s.totalCost,
      s.saleType,
      s.installmentsCount ? `${s.installmentsCount} Taksit` : '-',
      s.vadeFarkiAmount || 0,
      s.totalSaleAmount,
      s.netProfit,
      s.profitMargin.toFixed(1),
      `"${s.salesPerson}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arslan_mobilya_kar_takip_${selectedYear}_${selectedMonth}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-5 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Kâr Takip & Satış Yönetimi</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Peşin, kredi kartı ve senetli satışların ürün bazlı maliyet ve kârlılık takibi. Senetli satışlarda Tanımlamalar sekmesindeki aylık vade farkı oranı taksit sayısına göre otomatik hesaplanır.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Quick "Mal Alışı Yap" button linking directly to unified stock screen */}
          <button
            onClick={() => setActiveTab('stock')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95"
            title="Tedarikçi Mal Alım & Stok Ekranına Git"
          >
            <Boxes className="w-4 h-4 text-sky-400" />
            <span>Mal Alışı Yap</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Satış Kaydet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Toplam Ciro */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Toplam Satış Cirosu</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalCiro)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredSales.length} adet tamamlanan satış
          </span>
        </div>

        {/* Card 2: Ürün Alış Maliyeti */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Ürün Alış Maliyeti</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-700 dark:text-slate-300 mt-2">
            {formatCurrency(totalCost)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Satılan ürünlerin depo maliyeti
          </span>
        </div>

        {/* Card 3: Vade Farkı Maliyeti */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Vade Farkı Maliyeti</span>
            <Calculator className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-amber-600 dark:text-amber-400 mt-2">
            +{formatCurrency(totalVadeFarki)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Senetli satış vade maliyet yükü
          </span>
        </div>

        {/* Card 4: Net Kâr */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span>Elde Edilen Net Kâr</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalNetProfit)}
          </div>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 block font-medium">
            Ciro - (Maliyet + Vade Farkı)
          </span>
        </div>

        {/* Card 5: Kâr Marjı % */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Ortalama Kâr Marjı</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-purple-600 dark:text-purple-400 mt-2">
            %{averageMargin.toFixed(1)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Net Kâr / Satış Cirosu oranı
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-wrap gap-2.5 items-center">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Müşteri, ürün, marka, belge no veya personel ara..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Ay Filtresi */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Aylar</option>
              <option value="01">Ocak</option>
              <option value="02">Şubat</option>
              <option value="03">Mart</option>
              <option value="04">Nisan</option>
              <option value="05">Mayıs</option>
              <option value="06">Haziran</option>
              <option value="07">Temmuz</option>
              <option value="08">Ağustos</option>
              <option value="09">Eylül</option>
              <option value="10">Ekim</option>
              <option value="11">Kasım</option>
              <option value="12">Aralık</option>
            </select>
          </div>

          {/* Yıl Filtresi */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">Tüm Yıllar</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Satış Şekli Filtresi */}
          <select
            value={selectedSaleType}
            onChange={e => setSelectedSaleType(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tüm Satış Şekilleri</option>
            <option value="Peşin">Yalnızca Peşin</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Senetli Satış">Senetli Satış (Vadeli)</option>
          </select>

          {/* Kategori Filtresi */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tüm Kategoriler</option>
            {productCategories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Excel CSV İndir</span>
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Satış ve Kârlılık Tablosu ({filteredSales.length})
          </h3>
          <span className="text-xs text-slate-400">
            {selectedYear} {selectedMonth !== 'ALL' ? `/${selectedMonth}` : ''} dönemi
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Seçilen kriterlere uygun satış kaydı bulunamadı
            </p>
            <p className="text-xs text-slate-400">
              Filtreleri değiştirebilir veya yeni bir satış kaydı ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-3.5">Tarih</th>
                  <th className="py-3 px-3.5">Müşteri</th>
                  <th className="py-3 px-3.5">Ürün & Kategori</th>
                  <th className="py-3 px-3.5 text-center">Adet</th>
                  <th className="py-3 px-3.5">Satış Şekli & Vade</th>
                  <th className="py-3 px-3.5 text-right">Alış Maliyeti</th>
                  <th className="py-3 px-3.5 text-right">Vade Farkı</th>
                  <th className="py-3 px-3.5 text-right">Satış Cirosu</th>
                  <th className="py-3 px-3.5 text-right">Net Kâr</th>
                  <th className="py-3 px-3.5 text-center">Kâr %</th>
                  <th className="py-3 px-3.5">Satış Personeli</th>
                  <th className="py-3 px-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.map(sale => {
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        <div>{formatDate(sale.date)}</div>
                        {sale.documentNo && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {sale.documentNo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                        {sale.customerName}
                      </td>
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {sale.productName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-medium">
                            {sale.category}
                          </span>
                          {sale.brand && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {sale.brand}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold font-mono-num text-slate-800 dark:text-slate-200">
                        {sale.quantity}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.saleType === 'Peşin'
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : sale.saleType === 'Kredi Kartı'
                              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {sale.saleType}
                        </span>
                        {sale.saleType === 'Senetli Satış' && sale.installmentsCount && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 font-medium">
                            {sale.installmentsCount} Ay Vade (%{sale.vadeRateMonthly || 3.5}/ay)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono-num text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatCurrency(sale.totalCost)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono-num whitespace-nowrap">
                        {sale.vadeFarkiAmount ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            +{formatCurrency(sale.vadeFarkiAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono-num font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(sale.totalSaleAmount)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        +{formatCurrency(sale.netProfit)}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`font-mono-num font-bold px-1.5 py-0.5 rounded text-[11px] ${
                            sale.profitMargin >= 25
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : sale.profitMargin >= 15
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          %{sale.profitMargin.toFixed(1)}
                        </span>
                      </td>
                      {/* Satış Personeli Sütunu (Kullanıcı Talebi 4) */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{sale.salesPerson}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isAdmin && (
                          <button
                            onClick={() => deleteSaleRecord(sale.id)}
                            title="Satışı Sil (Yönetici)"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW SALE MODAL */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Yeni Satış ve Kârlılık Kaydı
                  </h3>
                  <p className="text-xs text-slate-400">
                    Satış şeklini seçin; senet vade farkı ve net kâr anlık hesaplanır.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tarih */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satış Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {/* Belge No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fatura / Fiş No
                  </label>
                  <input
                    type="text"
                    value={documentNo}
                    onChange={e => setDocumentNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Müşteri Seçimi / Adı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Müşteri Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Müşteri adı girin..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kayıtlı Cari Seç (İsteğe Bağlı)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedCustomerId(id);
                      const found = caris.find(c => c.id === id);
                      if (found) setCustomerName(found.name);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Cari Kart Seç...</option>
                    {caris
                      .filter(c => c.type === 'Müşteri')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.city ? `(${c.city})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Ürün Seçimi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Satılan Ürün (Stoktan Seçin) *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={e => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">Ürün seçin (Stoktaki mevcut ürünler)...</option>
                  {stockItems.map(stk => (
                    <option key={stk.id} value={stk.id}>
                      {stk.name} [{stk.brand || stk.category}] — Mevcut Stok: {stk.quantity} {stk.unit} — Alış: ₺{stk.purchasePrice.toLocaleString('tr-TR')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adet, Alış Fiyatı, Satış Fiyatı */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satış Adedi *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono-num font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Birim Maliyet (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-mono-num focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    Birim Satış (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salePrice}
                    onChange={e => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-600 rounded-xl text-xs outline-none font-mono-num font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SATIŞ ŞEKLİ (Peşin, Kredi Kartı, Senetli Satış) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Satış Şekli *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Peşin', 'Kredi Kartı', 'Senetli Satış'] as SaleType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSaleType(type)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                        saleType === type
                          ? type === 'Senetli Satış'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : type === 'Kredi Kartı'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {type === 'Peşin' && <DollarSign className="w-3.5 h-3.5" />}
                      {type === 'Kredi Kartı' && <CreditCard className="w-3.5 h-3.5" />}
                      {type === 'Senetli Satış' && <Calculator className="w-3.5 h-3.5" />}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>

                {/* Senetli Satış Seçildiyse: Taksit Sayısı ve Vade Farkı Oranı */}
                {saleType === 'Senetli Satış' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5" />
                        Senet Vadesi (Taksit Sayısı)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {saleMonthKey} Vade Oranı: %{currentVadeRateMonthly}/ay
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {[3, 6, 9, 12, 18].map(count => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setInstallmentsCount(count)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                            installmentsCount === count
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {count} Ay
                        </button>
                      ))}
                    </div>

                    {/* Vade Farkı Hesaplama Detayı */}
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>Aylık Vade Farkı:</span>
                        <span className="font-mono font-bold">%{currentVadeRateMonthly} x {installmentsCount} Ay = %{(currentVadeRateMonthly * installmentsCount).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold">
                        <span>Hesaplanan Vade Farkı Maliyeti:</span>
                        <span className="font-mono font-bold">+{formatCurrency(modalVadeFarki)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-amber-500/20">
                        <span>Efektif Toplam Maliyet:</span>
                        <span className="font-mono">{formatCurrency(modalEffectiveCost)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Satış Personeli & Tahsilat Hesabı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satış Personeli *
                  </label>
                  <input
                    type="text"
                    required
                    value={salesPerson}
                    onChange={e => setSalesPerson(e.target.value)}
                    placeholder="Personel Adı Soyadı..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tahsilat Hesabı / Kasa
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kârlılık Canlı Önizleme Kartı */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs font-medium">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Toplam Satış Cirosu:</span>
                  <span className="text-sm font-bold font-mono-num text-slate-900 dark:text-white">
                    {formatCurrency(modalTotalSale)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Net Kâr (%{modalProfitMargin}):</span>
                  <span className="text-base font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(modalNetProfit)}
                  </span>
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Özel Notlar / Sevkiyat Bilgisi
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Müşteri adresi, montaj teslim tarihi vb..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Satışı Tamamla & Stoğu Düş</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
