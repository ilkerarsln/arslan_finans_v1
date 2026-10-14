import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent, formatNumber, formatDate } from '../../utils/formatters';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Building2,
  Layers,
  Download,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Tag,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { Supplier } from '../../types';

export const RaporlarView: React.FC = () => {
  const { products, suppliers, sales, expenses, purchaseOrders, subCategories, categories } = useApp();

  // Selected modals for monthly drilldown
  const [selectedSupplierModal, setSelectedSupplierModal] = useState<Supplier | null>(null);
  const [selectedExpenseCatModal, setSelectedExpenseCatModal] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Beyaz Eşya');

  const totalStockVal = products.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);
  const totalSalesVal = sales.reduce((sum, s) => sum + s.totalSalePrice, 0);
  const totalCostVal = sales.reduce((sum, s) => sum + s.totalCost, 0);
  const totalProfit = totalSalesVal - totalCostVal;
  const overallMargin = totalSalesVal > 0 ? (totalProfit / totalSalesVal) * 100 : 0;
  const totalExpensesVal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Month names for 12 months
  const monthsData = [
    { code: '01', name: 'Ocak 2026' },
    { code: '02', name: 'Şubat 2026' },
    { code: '03', name: 'Mart 2026' },
    { code: '04', name: 'Nisan 2026' },
    { code: '05', name: 'Mayıs 2026' },
    { code: '06', name: 'Haziran 2026' },
    { code: '07', name: 'Temmuz 2026' },
    { code: '08', name: 'Ağustos 2026' },
    { code: '09', name: 'Eylül 2026' },
    { code: '10', name: 'Ekim 2026 (Güncel)' },
    { code: '11', name: 'Kasım 2026' },
    { code: '12', name: 'Aralık 2026' },
  ];

  // Category Breakdown Stats
  const categoryNames = Array.from(new Set([...products.map((p) => p.category), 'Beyaz Eşya']));
  const categoryStats = categoryNames.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const stockVal = prods.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);
    const catSales = sales.filter((s) => s.category === cat);
    const catRevenue = catSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
    const catCost = catSales.reduce((sum, s) => sum + s.totalCost, 0);
    const catProfit = catRevenue - catCost;
    const catMargin = catRevenue > 0 ? (catProfit / catRevenue) * 100 : 0;

    // Subcategory stats for this category
    const catDef = categories.find((c) => c.name === cat);
    const subCatNames = catDef ? catDef.subCategories : [];

    const subCategoryStats = subCatNames.map((subName) => {
      const subProds = prods.filter((p) => p.subCategory === subName);
      const subStock = subProds.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);
      const subSales = catSales.filter(
        (s) => s.productName.toLowerCase().includes(subName.toLowerCase()) || subProds.some((p) => p.sku === s.matchedSku)
      );
      const subRev = subSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
      const subCst = subSales.reduce((sum, s) => sum + s.totalCost, 0);
      const subPrf = subRev - subCst;

      return {
        name: subName,
        productCount: subProds.length,
        stockValue: subStock,
        revenue: subRev,
        profit: subPrf,
        margin: subRev > 0 ? (subPrf / subRev) * 100 : 0,
      };
    });

    return {
      category: cat,
      productCount: prods.length,
      stockValue: stockVal,
      stockSharePercent: totalStockVal > 0 ? (stockVal / totalStockVal) * 100 : 0,
      revenue: catRevenue,
      profit: catProfit,
      margin: catMargin,
      subCategories: subCategoryStats,
    };
  });

  // Expense Categories Stats
  const expenseCategories = Array.from(new Set(expenses.map((e) => e.category)));
  const expenseStats = expenseCategories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat);
    const totalAmount = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percent = totalExpensesVal > 0 ? (totalAmount / totalExpensesVal) * 100 : 0;
    return {
      category: cat,
      count: catExpenses.length,
      totalAmount,
      percent,
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  // Calculate monthly details for a supplier
  const getSupplierMonthlyBreakdown = (sup: Supplier) => {
    return monthsData.map((m) => {
      // Purchases
      const monthOrders = purchaseOrders.filter(
        (po) => po.supplierId === sup.id && po.date.startsWith(`2026-${m.code}`)
      );
      const purchases = monthOrders.reduce((sum, po) => sum + po.totalAmount, 0);

      // Payments
      const payments = monthOrders.reduce((sum, po) => sum + (po.paidAmount || 0), 0);

      // Sales linked to this supplier
      const monthSales = sales.filter(
        (s) => s.matchedSupplierId === sup.id && s.date.startsWith(`2026-${m.code}`)
      );
      const salesRev = monthSales.reduce((sum, s) => sum + s.totalSalePrice, 0);
      const salesProfit = monthSales.reduce((sum, s) => sum + s.grossProfit, 0);

      return {
        month: m.name,
        monthCode: m.code,
        purchases,
        payments,
        salesRev,
        salesProfit,
        orderCount: monthOrders.length,
      };
    });
  };

  // Calculate monthly details for an expense category
  const getExpenseMonthlyBreakdown = (cat: string) => {
    return monthsData.map((m) => {
      const monthExps = expenses.filter(
        (e) => e.category === cat && e.date.startsWith(`2026-${m.code}`)
      );
      const total = monthExps.reduce((sum, e) => sum + e.amount, 0);
      return {
        month: m.name,
        monthCode: m.code,
        total,
        count: monthExps.length,
        items: monthExps,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Detaylı Yönetici Karar Destek Raporları</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Raporlar & Analizler</h2>
          <p className="text-xs text-slate-400">
            Mobilya ve Beyaz Eşya kategori kırılımları, aylık tedarikçi alım/kârlılık detayları ve masraf trendleri.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Toplam Depo Envanter Değeri</span>
          <div className="text-xl font-bold text-white mt-1 font-mono">{formatCurrency(totalStockVal)}</div>
          <p className="text-[11px] text-slate-500 mt-1">{products.length} çeşit stok kalemi</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Toplam Satış Cirosu</span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(totalSalesVal)}</div>
          <p className="text-[11px] text-slate-500 mt-1">{sales.length} adet tamamlanan satış</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Elde Edilen Toplam Brüt Kâr</span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{formatCurrency(totalProfit)}</div>
          <p className="text-[11px] text-amber-500/80 mt-1">Ortalama %{overallMargin.toFixed(1)} marj</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">İşletme Giderleri Toplamı</span>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{formatCurrency(totalExpensesVal)}</div>
          <p className="text-[11px] text-slate-500 mt-1">{expenses.length} adet masraf kaydı</p>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: KATEGORİ KIRILIMI / STOK & KÂR DAĞILIMI (MOBİLYA & BEYAZ EŞYA)
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Kategori Kırılımı / Stok & Kâr Dağılımı Tablosu</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Stok Değeri, Satış Cirosu ve Elde Edilen Brüt Kâr sütunları ile Mobilya ve Beyaz Eşya alt detayları.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            Alt kırılımları görmek için satır yanındaki oka tıklayınız
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Kategori İsmi</th>
                <th className="py-3 px-3 text-center">Çeşit</th>
                <th className="py-3 px-4 text-right">Mevcut Stok Değeri</th>
                <th className="py-3 px-3 text-center">Stok Payı (%)</th>
                <th className="py-3 px-4 text-right">Satış Cirosu</th>
                <th className="py-3 px-4 text-right">Elde Edilen Brüt Kâr</th>
                <th className="py-3 px-3 text-center">Kâr Marjı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {categoryStats.map((item) => {
                const isExpanded = expandedCategory === item.category;
                const isBeyazEsya = item.category === 'Beyaz Eşya';

                return (
                  <React.Fragment key={item.category}>
                    <tr
                      onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                      className={`hover:bg-slate-800/50 transition cursor-pointer ${
                        isExpanded ? 'bg-slate-800/30' : ''
                      } ${isBeyazEsya ? 'border-l-4 border-l-blue-500' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                        {item.subCategories.length > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )
                        ) : (
                          <span className="w-4" />
                        )}
                        <span>{item.category}</span>
                        {isBeyazEsya && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Beyaz Eşya Ana Kategorisi
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-300 font-medium">
                        {item.productCount} Ürün
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                        {formatCurrency(item.stockValue)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, item.stockSharePercent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-300">
                            {formatPercent(item.stockSharePercent)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.profit)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px]">
                          {formatPercent(item.margin)}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable SubCategory Rows (Buzdolabı, Çamaşır Makinesi, Bulaşık Makinesi, Ankastre vb.) */}
                    {isExpanded && item.subCategories.length > 0 && (
                      <tr className="bg-slate-950/40">
                        <td colSpan={7} className="p-3 pl-8">
                          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 space-y-2">
                            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Boxes className="w-3.5 h-3.5" />
                              <span>{item.category} Alt Kategori Kırılımı</span>
                            </div>
                            <table className="w-full text-left text-xs">
                              <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                                <tr>
                                  <th className="py-2 px-3">Alt Kategori</th>
                                  <th className="py-2 px-3 text-center">Çeşit</th>
                                  <th className="py-2 px-3 text-right">Stok Değeri</th>
                                  <th className="py-2 px-3 text-right">Satış Cirosu</th>
                                  <th className="py-2 px-3 text-right">Elde Edilen Brüt Kâr</th>
                                  <th className="py-2 px-3 text-center">Marj</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40">
                                {item.subCategories.map((sub, sIdx) => (
                                  <tr key={sIdx} className="hover:bg-slate-800/30">
                                    <td className="py-2 px-3 text-slate-200 font-medium">
                                      &bull; {sub.name}
                                    </td>
                                    <td className="py-2 px-3 text-center text-slate-400">{sub.productCount} Çeşit</td>
                                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                                      {formatCurrency(sub.stockValue)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-white">
                                      {formatCurrency(sub.revenue)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                      {formatCurrency(sub.profit)}
                                    </td>
                                    <td className="py-2 px-3 text-center text-[10px] text-slate-300 font-semibold">
                                      %{sub.margin.toFixed(1)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: ORTAK TEDARİKÇİ RAPORU (Tıklanabilir Aylık Detay Modal)
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Ortak Tedarikçi Performans & Borç Analizi</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tedarikçi kartının veya satırının üzerine tıklayarak Ocak-Aralık aylık mal alımı, ödeme ve kârlılık detaylarını inceleyebilirsiniz.
            </p>
          </div>
          <span className="text-[11px] text-amber-400 font-semibold">
            {suppliers.length} Kayıtlı Tedarikçi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              onClick={() => setSelectedSupplierModal(sup)}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-amber-500/60 hover:bg-slate-900/80 transition cursor-pointer group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs group-hover:text-amber-400 transition">
                  {sup.name}
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {sup.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{sup.category} &bull; {sup.city}</p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Toplam Alım</span>
                  <span className="font-medium text-slate-200 font-mono">{formatCurrency(sup.totalPurchased)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Güncel Borç</span>
                  <span className="font-bold text-rose-400 font-mono">{formatCurrency(sup.currentBalance)}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-amber-400/90 font-medium group-hover:text-amber-300">
                <span>Aylık Detay Raporunu Aç</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: GİDER & MASRAF ANALİZİ (Tıklanabilir Aylık Detay Modal)
         ========================================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>Gider & Masraf Kategori Dağılımı ve Aylık Trendler</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              İşletme giderlerinin kategori payları. Satırlara tıklayarak ilgili masrafın 12 aylık harcama tablosunu açabilirsiniz.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Toplam: {formatCurrency(totalExpensesVal)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {expenseStats.map((item) => (
            <div
              key={item.category}
              onClick={() => setSelectedExpenseCatModal(item.category)}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-rose-500/50 hover:bg-slate-900/80 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs group-hover:text-rose-300 transition">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {item.count} Kayıt
                </span>
              </div>
              <div className="text-lg font-bold text-rose-400 font-mono">
                {formatCurrency(item.totalAmount)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span>Gider Payı: %{item.percent.toFixed(1)}</span>
                <span className="text-amber-400/90 font-medium group-hover:underline">Aylık Trend &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: TEDARİKÇİ AYLIK DETAY RAPORU (Requirement 5)
         ========================================================================= */}
      {selectedSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-6 space-y-4 animate-in zoom-in-95 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedSupplierModal.name}</h3>
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                    {selectedSupplierModal.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedSupplierModal.category} &bull; Yetkili: {selectedSupplierModal.contactPerson} &bull; Tel: {selectedSupplierModal.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedSupplierModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Toplam Mal Alımı:</span>
                <span className="font-bold text-slate-200 font-mono text-sm">
                  {formatCurrency(selectedSupplierModal.totalPurchased)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Yapılan Ödeme:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {formatCurrency(selectedSupplierModal.totalPaid)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Güncel Cari Borç:</span>
                <span className="font-bold text-rose-400 font-mono text-sm">
                  {formatCurrency(selectedSupplierModal.currentBalance)}
                </span>
              </div>
            </div>

            {/* Monthly Table for this Supplier */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ay / Dönem</th>
                    <th className="py-2.5 px-3 text-right">Mal Alımı Tutarı</th>
                    <th className="py-2.5 px-3 text-right">Ödenen Tutar</th>
                    <th className="py-2.5 px-3 text-right">İlgili Satış Cirosu</th>
                    <th className="py-2.5 px-3 text-right">Sağlanan Brüt Kâr</th>
                    <th className="py-2.5 px-3 text-center">Alım Adedi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {getSupplierMonthlyBreakdown(selectedSupplierModal).map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 ${row.purchases > 0 || row.salesRev > 0 ? 'bg-slate-900/60' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-300">{row.month}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        {row.purchases > 0 ? formatCurrency(row.purchases) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {row.payments > 0 ? formatCurrency(row.payments) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-300">
                        {row.salesRev > 0 ? formatCurrency(row.salesRev) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {row.salesProfit > 0 ? formatCurrency(row.salesProfit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {row.orderCount > 0 ? `${row.orderCount} Fatura` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSupplierModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: GİDER / MASRAF AYLIK DETAY RAPORU (Requirement 5)
         ========================================================================= */}
      {selectedExpenseCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 animate-in zoom-in-95 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-rose-400" />
                  <span>{selectedExpenseCatModal} - Aylık Harcama Dökümü</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  2026 takvim yılı boyunca yapılan tüm aylık ödeme ve harcama kayıtları.
                </p>
              </div>

              <button
                onClick={() => setSelectedExpenseCatModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Ay</th>
                    <th className="py-2.5 px-3 text-right">Toplam Harcama</th>
                    <th className="py-2.5 px-3 text-center">İşlem Adedi</th>
                    <th className="py-2.5 px-3">Açıklama / Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {getExpenseMonthlyBreakdown(selectedExpenseCatModal).map((row, idx) => (
                    <tr key={idx} className={`hover:bg-slate-800/40 ${row.total > 0 ? 'bg-slate-900/60' : ''}`}>
                      <td className="py-2.5 px-3 font-medium text-slate-300">{row.month}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        {row.total > 0 ? formatCurrency(row.total) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">
                        {row.count > 0 ? `${row.count} Fiş/Makbuz` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">
                        {row.items.map((i) => i.description).join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedExpenseCatModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
