import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';
import { PaymentMethod } from '../../types';
import {
  TrendingUp,
  ShoppingBag,
  Building2,
  DollarSign,
  Percent,
  Search,
  Plus,
  Tag,
  User,
  CreditCard,
  Calendar,
  Layers,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';

export const KarTakipView: React.FC = () => {
  const { sales, suppliers, products, users, navigateToPurchase, addSale, getMonthlyRateForDate } = useApp();

  const [activeTab, setActiveTab] = useState<'satislar' | 'tedarikci_karlilik' | 'kategori_karlilik'>('satislar');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('Tümü');
  const [filterSalesperson, setFilterSalesperson] = useState<string>('Tümü');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('Tümü');
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);

  const monthsList = [
    { code: 'Tümü', name: 'Tüm Aylar' },
    { code: '01', name: 'Ocak' },
    { code: '02', name: 'Şubat' },
    { code: '03', name: 'Mart' },
    { code: '04', name: 'Nisan' },
    { code: '05', name: 'Mayıs' },
    { code: '06', name: 'Haziran' },
    { code: '07', name: 'Temmuz' },
    { code: '08', name: 'Ağustos' },
    { code: '09', name: 'Eylül' },
    { code: '10', name: 'Ekim' },
    { code: '11', name: 'Kasım' },
    { code: '12', name: 'Aralık' },
  ];
  const yearsList = ['Tümü', '2026', '2025', '2024'];

  // New Sale Form States
  const [newCustomer, setNewCustomer] = useState('');
  const [newSelectedProduct, setNewSelectedProduct] = useState(products[0]?.id || '');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newSalePrice, setNewSalePrice] = useState(products[0]?.salePrice || 0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('senetli');
  const [newInstallmentCount, setNewInstallmentCount] = useState<number>(12);
  const [newSaleDate, setNewSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newSalesperson, setNewSalesperson] = useState<string>(users[0]?.name || 'İlker Arslan');

  // Base Sales filtered by selected Date (Year & Month)
  const dateFilteredSales = sales.filter((s) => {
    const matchYear = selectedYear === 'Tümü' || s.date.startsWith(selectedYear);
    const matchMonth = selectedMonth === 'Tümü' || s.date.slice(5, 7) === selectedMonth;
    return matchYear && matchMonth;
  });

  // Profit Metrics based on selected period
  const totalRevenue = dateFilteredSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
  const totalCost = dateFilteredSales.reduce((sum, s) => sum + s.totalCost, 0);
  const totalGrossProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
  const totalInterestCost = dateFilteredSales.reduce((sum, s) => sum + (s.interestCost || 0), 0);

  // Filtered Sales with search, payment method and salesperson filters
  const filteredSales = dateFilteredSales.filter((s) => {
    const matchSearch =
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.salesperson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.matchedSupplierName && s.matchedSupplierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchPayment = filterPaymentMethod === 'Tümü' || s.paymentMethod === filterPaymentMethod;
    const matchPerson = filterSalesperson === 'Tümü' || s.salesperson === filterSalesperson;

    return matchSearch && matchPayment && matchPerson;
  });

  // Calculate live preview for new sale form
  const selectedProdObj = products.find((p) => p.id === newSelectedProduct);
  const liveBaseCost = (selectedProdObj ? selectedProdObj.costPrice : 0) * newQuantity;
  const liveMonthlyRate = getMonthlyRateForDate(newSaleDate);
  const liveInterestCost =
    newPaymentMethod === 'senetli'
      ? Math.round(liveBaseCost * (liveMonthlyRate / 100) * newInstallmentCount)
      : 0;
  const liveTotalCost = liveBaseCost + liveInterestCost;
  const liveTotalSale = newSalePrice * newQuantity;
  const liveProfit = liveTotalSale - liveTotalCost;
  const liveMargin = liveTotalSale > 0 ? (liveProfit / liveTotalSale) * 100 : 0;

  // Supplier Profitability linked with Date Filters (Requirement 1)
  const supplierProfitability = suppliers.map((sup) => {
    const supplierSales = dateFilteredSales.filter((s) => s.matchedSupplierId === sup.id);
    const supRevenue = supplierSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
    const supCost = supplierSales.reduce((sum, s) => sum + s.totalCost, 0);
    const supProfit = supRevenue - supCost;
    const supMargin = supRevenue > 0 ? (supProfit / supRevenue) * 100 : sup.avgProfitMargin || 0;
    const itemsCount = products.filter((p) => p.supplierId === sup.id).length;

    return {
      supplier: sup,
      revenue: supRevenue,
      cost: supCost,
      profit: supProfit,
      margin: supMargin,
      salesCount: supplierSales.length,
      productVariety: itemsCount,
      currentDebt: sup.currentBalance,
    };
  });

  const categories = Array.from(new Set(sales.map((s) => s.category)));
  const categoryProfitability = categories.map((cat) => {
    const catSales = dateFilteredSales.filter((s) => s.category === cat);
    const catRevenue = catSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
    const catCost = catSales.reduce((sum, s) => sum + s.totalCost, 0);
    const catProfit = catRevenue - catCost;
    const catMargin = catRevenue > 0 ? (catProfit / catRevenue) * 100 : 0;
    return {
      category: cat,
      revenue: catRevenue,
      cost: catCost,
      profit: catProfit,
      margin: catMargin,
      volume: catSales.reduce((sum, s) => sum + s.quantity, 0),
    };
  });

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdObj) return;

    addSale({
      saleId: `SAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: newSaleDate,
      customerName: newCustomer || 'Perakende Müşteri',
      productName: selectedProdObj.name,
      matchedSku: selectedProdObj.sku,
      matchedSupplierId: selectedProdObj.supplierId,
      matchedSupplierName: selectedProdObj.supplierName,
      category: selectedProdObj.category,
      quantity: newQuantity,
      unitSalePrice: newSalePrice,
      totalSalePrice: newSalePrice * newQuantity,
      unitCost: selectedProdObj.costPrice,
      paymentMethod: newPaymentMethod,
      installmentCount: newPaymentMethod === 'senetli' ? newInstallmentCount : undefined,
      salesperson: newSalesperson,
      status: 'tamamlandi',
    });

    setIsAddSaleOpen(false);
    setNewCustomer('');
  };

  const salespersonsList = Array.from(new Set(sales.map((s) => s.salesperson)));

  return (
    <div className="space-y-6">
      {/* Top Banner with Direct Mal Alımı Yap Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Senetli Vade Farkı & Satış Personeli Kâr Takibi</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Kâr Takip & Satış Analiz Modülü</h2>
          <p className="text-xs text-slate-400">
            Satışın şekline göre (Peşin, Kredi Kartı, Senetli Satış) vade farkı otomatik hesaplanıp ürün maliyetine eklenir ve net kâr buna göre hesaplanır.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddSaleOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Yeni Satış Kaydı Ekle</span>
          </button>

          <button
            onClick={() => navigateToPurchase('manuel')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.3]" />
            <span>Mal Alımı Yap</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Toplam Satış Cirosu</span>
          <div className="text-xl font-bold text-white mt-2">{formatCurrency(totalRevenue)}</div>
          <p className="text-[11px] text-slate-500 mt-1">{sales.length} adet tamamlanan satış</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Toplam Satış Maliyeti (COGS)</span>
          <div className="text-xl font-bold text-slate-300 mt-2">{formatCurrency(totalCost)}</div>
          <p className="text-[11px] text-amber-400 mt-1">
            ₺{totalInterestCost.toLocaleString('tr-TR')} Vade Farkı Maliyeti Dahil
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Net Brüt Kâr</span>
          <div className="text-xl font-bold text-emerald-400 mt-2">{formatCurrency(totalGrossProfit)}</div>
          <p className="text-[11px] text-emerald-500/80 mt-1">Vade farkı düşülmüş net kâr</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Ortalama Kâr Marjı</span>
          <div className="text-xl font-bold text-amber-400 mt-2">{formatPercent(overallMargin)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ciro üzerinden net oran</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('satislar')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'satislar'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Satış & Kâr Tablosu ({sales.length})
            </button>
            <button
              onClick={() => setActiveTab('tedarikci_karlilik')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'tedarikci_karlilik'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Tedarikçi Kârlılık ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('kategori_karlilik')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'kategori_karlilik'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Kategori Kırılımı ({categories.length})
            </button>
          </div>

          {/* Filter Inputs (Year, Month, Payment, Person, Search) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Year & Month Filters (Requirement 1) */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-750">
              <Calendar className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs text-white px-1.5 py-1 focus:outline-none cursor-pointer"
                title="Yıl Seçimi"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y === 'Tümü' ? 'Tüm Yıllar' : y}
                  </option>
                ))}
              </select>

              <span className="text-slate-600">/</span>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-white px-1.5 py-1 focus:outline-none cursor-pointer"
                title="Ay Seçimi"
              >
                {monthsList.map((m) => (
                  <option key={m.code} value={m.code} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'satislar' && (
              <>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="bg-slate-950/70 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-white cursor-pointer"
                >
                  <option value="Tümü">Tüm Satış Şekilleri</option>
                  <option value="pesin">Peşin Satış</option>
                  <option value="kredi_karti">Kredi Kartı</option>
                  <option value="senetli">Senetli Satış</option>
                </select>

                <select
                  value={filterSalesperson}
                  onChange={(e) => setFilterSalesperson(e.target.value)}
                  className="bg-slate-950/70 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-white cursor-pointer"
                >
                  <option value="Tümü">Tüm Personeller</option>
                  {salespersonsList.map((p, idx) => (
                    <option key={idx} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Ürün, müşteri, personel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-750 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: SATIŞ TABLOSU (Satış Şekli, Vade Farkı Maliyeti & Satış Personeli)
           ========================================================================= */}
        {activeTab === 'satislar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Tarih</th>
                  <th className="py-3 px-3">Satış No</th>
                  <th className="py-3 px-3">Satış Personeli</th>
                  <th className="py-3 px-3">Müşteri</th>
                  <th className="py-3 px-3">Satılan Ürün</th>
                  <th className="py-3 px-3">Satış Şekli</th>
                  <th className="py-3 px-3 text-right">Temel Maliyet</th>
                  <th className="py-3 px-3 text-right">Vade Farkı Maliyeti</th>
                  <th className="py-3 px-3 text-right">Toplam Maliyet</th>
                  <th className="py-3 px-3 text-right">Satış Tutarı</th>
                  <th className="py-3 px-3 text-right">Net Kâr</th>
                  <th className="py-3 px-3 text-center">Net Marj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">{formatDate(s.date)}</td>
                    <td className="py-3 px-3 font-mono text-amber-400 font-semibold">{s.saleId}</td>

                    {/* Requirement 4: Satış Personeli */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 font-semibold whitespace-nowrap">
                        <User className="w-3 h-3 text-amber-400" />
                        <span>{s.salesperson}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-white font-medium max-w-[130px] truncate">{s.customerName}</td>
                    <td className="py-3 px-3 text-slate-200">
                      <div className="font-medium">{s.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {s.quantity} Adet | {s.matchedSupplierName || 'Ortak'}
                      </div>
                    </td>

                    {/* Requirement 1: Satış Şekli */}
                    <td className="py-3 px-3">
                      {s.paymentMethod === 'senetli' ? (
                        <div className="inline-flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-[10px]">
                            <FileCheck2 className="w-3 h-3" />
                            <span>Senetli ({s.installmentCount} Ay)</span>
                          </span>
                          {s.monthlyInterestRate && (
                            <span className="text-[9px] text-slate-400">
                              Aylık %{s.monthlyInterestRate}
                            </span>
                          )}
                        </div>
                      ) : s.paymentMethod === 'kredi_karti' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold text-[10px]">
                          <CreditCard className="w-3 h-3" />
                          <span>Kredi Kartı</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px]">
                          <span>Peşin Satış</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-400 font-mono">
                      {formatCurrency(s.baseCost ?? s.unitCost * s.quantity)}
                    </td>

                    {/* Requirement 1: Vade Farkı Maliyeti */}
                    <td className="py-3 px-3 text-right font-mono">
                      {s.interestCost && s.interestCost > 0 ? (
                        <span className="text-rose-400 font-semibold">
                          +{formatCurrency(s.interestCost)}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Toplam Maliyet */}
                    <td className="py-3 px-3 text-right text-slate-300 font-bold font-mono">
                      {formatCurrency(s.totalCost)}
                    </td>

                    {/* Satış Tutarı */}
                    <td className="py-3 px-3 text-right font-semibold text-white font-mono">
                      {formatCurrency(s.totalSalePrice)}
                    </td>

                    {/* Net Kâr */}
                    <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono">
                      {formatCurrency(s.grossProfit)}
                    </td>

                    {/* Net Kâr Marjı */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                        {formatPercent(s.profitMarginPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: TEDARİKÇİ KÂRLILIĞI (Filtrelerle Uyumlu) */}
        {activeTab === 'tedarikci_karlilik' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400 font-medium">Filtrelenen Dönem:</span>
                <span className="font-bold text-amber-400">
                  {selectedMonth !== 'Tümü' ? monthsList.find((m) => m.code === selectedMonth)?.name : 'Tüm Aylar'} {selectedYear !== 'Tümü' ? selectedYear : 'Tüm Yıllar'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">İşlem Gören Satış:</span>
                <span className="font-bold text-white">{dateFilteredSales.length} Adet</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Dönem Net Kârı:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totalGrossProfit)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tedarikçi Kodu</th>
                  <th className="py-3 px-4">Firma Ünvanı (Ortak Havuz)</th>
                  <th className="py-3 px-4">Sektör</th>
                  <th className="py-3 px-4 text-right">Satış Cirosu</th>
                  <th className="py-3 px-4 text-right">Alış Maliyeti</th>
                  <th className="py-3 px-4 text-right">Net Kâr</th>
                  <th className="py-3 px-4 text-center">Kâr Marjı</th>
                  <th className="py-3 px-4 text-right">Finansal Cari Borcumuz</th>
                  <th className="py-3 px-4 text-center">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {supplierProfitability.map((item) => (
                  <tr key={item.supplier.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold">{item.supplier.code}</td>
                    <td className="py-3 px-4 text-white font-medium">{item.supplier.name}</td>
                    <td className="py-3 px-4 text-slate-400">{item.supplier.category}</td>
                    <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(item.revenue)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatCurrency(item.cost)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatCurrency(item.profit)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                        {formatPercent(item.margin)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {formatCurrency(item.currentDebt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => navigateToPurchase('manuel')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-semibold text-xs border border-amber-500/30 transition cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Mal Alımı Yap</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {activeTab === 'kategori_karlilik' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kategori Adı</th>
                  <th className="py-3 px-4 text-right">Satış Hacmi (Adet)</th>
                  <th className="py-3 px-4 text-right">Toplam Satış Cirosu</th>
                  <th className="py-3 px-4 text-right">Toplam Alış Maliyeti</th>
                  <th className="py-3 px-4 text-right">Brüt Kâr</th>
                  <th className="py-3 px-4 text-center">Kâr Marjı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categoryProfitability.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>{cat.category}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 font-semibold">{cat.volume} Adet</td>
                    <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(cat.revenue)}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatCurrency(cat.cost)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{formatCurrency(cat.profit)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                        {formatPercent(cat.margin)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Sale Modal (Enhanced with Payment Method, Vade Farkı, and Personel) */}
      {isAddSaleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 animate-in zoom-in-95 my-8">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>Yeni Satış & Vade Farklı Kâr Kaydı</span>
            </h3>

            <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Satış Tarihi *</label>
                  <input
                    type="date"
                    value={newSaleDate}
                    onChange={(e) => setNewSaleDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                {/* Requirement 4: Satış Personeli */}
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold text-amber-300">
                    Satış Personeli *
                  </label>
                  <select
                    value={newSalesperson}
                    onChange={(e) => setNewSalesperson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Müşteri Adı / Ünvanı *</label>
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="Örn: Sinan Yavuz / Yavuz Mimarlık"
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Satılan Ürün (Stoktan) *</label>
                <select
                  value={newSelectedProduct}
                  onChange={(e) => {
                    setNewSelectedProduct(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) setNewSalePrice(prod.salePrice);
                  }}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stockQty} {p.unit} - Maliyet: {formatCurrency(p.costPrice)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Requirement 1: Satış Şekli Seçimi */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <label className="block text-slate-200 font-bold">Satışın Şekli *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('pesin')}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer text-center ${
                      newPaymentMethod === 'pesin'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Peşin Satış
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('kredi_karti')}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer text-center ${
                      newPaymentMethod === 'kredi_karti'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Kredi Kartı
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPaymentMethod('senetli')}
                    className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer text-center ${
                      newPaymentMethod === 'senetli'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Senetli Satış
                  </button>
                </div>

                {/* If Senetli Satış is selected, select installment count */}
                {newPaymentMethod === 'senetli' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold">Taksit / Vade Sayısı (Ay):</label>
                      <span className="text-amber-400 font-bold">{newInstallmentCount} Ay Vade</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[3, 6, 9, 12, 18, 24].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setNewInstallmentCount(v)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                            newInstallmentCount === v
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {v} Taksit
                        </button>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      Tanımlamalardan çekilen aylık vade farkı oranı: <strong className="text-amber-400">%{liveMonthlyRate}</strong>. Toplam {newInstallmentCount} ay için uygulanan vade farkı maliyeti: <strong className="text-rose-400">{formatCurrency(liveInterestCost)}</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* Quantities & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Satış Adedi</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Birim Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white text-right"
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Temel Stok Alış Maliyeti:</span>
                  <span className="font-mono text-white">{formatCurrency(liveBaseCost)}</span>
                </div>
                {newPaymentMethod === 'senetli' && (
                  <div className="flex justify-between text-rose-400">
                    <span>Vade Farkı Maliyeti ({newInstallmentCount} Ay x %{liveMonthlyRate}):</span>
                    <span className="font-mono font-bold">+{formatCurrency(liveInterestCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                  <span>Toplam Maliyet:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(liveTotalCost)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Toplam Satış Cirosu:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(liveTotalSale)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm font-bold pt-1 border-t border-slate-800">
                  <span>Hesaplanan Net Kâr:</span>
                  <span className="font-mono">{formatCurrency(liveProfit)} ({formatPercent(liveMargin)})</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSaleOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Satışı Kaydet & Kârı Hesapla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
