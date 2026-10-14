import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ManuelAlimModal } from './ManuelAlimModal';
import { ExcelAlimModal } from './ExcelAlimModal';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { downloadPurchaseExcelTemplate } from '../../utils/excelHelper';
import {
  PackagePlus,
  FileSpreadsheet,
  Download,
  Search,
  Building2,
  PackageCheck,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Clock,
  Boxes,
} from 'lucide-react';

export const MalAlimStokView: React.FC = () => {
  const {
    products,
    purchaseOrders,
    suppliers,
    openPurchaseModalType,
    setOpenPurchaseModalType,
    setActiveTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'faturalar' | 'stok' | 'borclar'>('faturalar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSupplierId, setSelectedSupplierId] = useState('Tümü');

  // KPI Calculations
  const totalStockValue = products.reduce((sum, p) => sum + p.stockQty * p.costPrice, 0);
  const totalPurchasesAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
  const criticalStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;

  // Filtered Lists
  const filteredOrders = purchaseOrders.filter((po) => {
    const matchSearch =
      po.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchSupplier = selectedSupplierId === 'Tümü' || po.supplierId === selectedSupplierId;
    return matchSearch && matchSupplier;
  });

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'Tümü' || p.category === selectedCategory;
    const matchSupplier = selectedSupplierId === 'Tümü' || p.supplierId === selectedSupplierId;
    return matchSearch && matchCategory && matchSupplier;
  });

  const categories = ['Tümü', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="space-y-6">
      {/* Modals */}
      <ManuelAlimModal
        isOpen={openPurchaseModalType === 'manuel'}
        onClose={() => setOpenPurchaseModalType('none')}
      />
      <ExcelAlimModal
        isOpen={openPurchaseModalType === 'excel'}
        onClose={() => setOpenPurchaseModalType('none')}
      />

      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Finans & Tedarikçi Entegre Modül</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Mal Alım & Stok Yönetim Merkezi</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Yapılan her mal alımı; tedarikçinin cari borç hesabına otomatik borç olarak kaydedilir, stok miktarı artırılır ve ağırlıklı ortalama birim maliyet anında hesaplanır.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={downloadPurchaseExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition active:scale-95 cursor-pointer"
              title="Örnek Excel Şablonu İndir"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Excel Şablonu</span>
            </button>

            <button
              onClick={() => setOpenPurchaseModalType('excel')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel ile Toplu Yükle</span>
            </button>

            <button
              onClick={() => setOpenPurchaseModalType('manuel')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
            >
              <PackagePlus className="w-4 h-4 stroke-[2.3]" />
              <span>+ Manuel Mal Alımı Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-medium">Toplam Envanter Değeri</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white">{formatCurrency(totalStockValue)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ağırlıklı ortalama maliyet bazlı</p>
        </div>

        {/* Total Purchases Recorded */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-medium">Toplam Mal Alımı</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400">{formatCurrency(totalPurchasesAmount)}</div>
          <p className="text-[11px] text-slate-500 mt-1">{purchaseOrders.length} adet alım faturası</p>
        </div>

        {/* Supplier Debt */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-medium">Tedarikçilere Cari Borç</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-400">{formatCurrency(totalSupplierDebt)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ortak tedarikçi havuzundan</p>
        </div>

        {/* Critical Stock Alert */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 font-medium">Kritik Stok Uyarıları</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-400">{criticalStockCount} Ürün</div>
          <p className="text-[11px] text-slate-500 mt-1">Minimum seviyenin altındaki stoklar</p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
          {/* Subtabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('faturalar')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'faturalar'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Mal Alım Faturaları ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveSubTab('stok')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'stok'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Mevcut Stok & Maliyet Listesi ({products.length})
            </button>
            <button
              onClick={() => setActiveSubTab('borclar')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'borclar'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Tedarikçi Borç Durumu ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('detayli_stok')}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/30 transition cursor-pointer flex items-center gap-1.5"
              title="Detaylı Kategori, Alt Kategori ve Marka Yönetimi"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Detaylı Stok Ekranı &rarr;</span>
            </button>
          </div>

          {/* Quick Filter Inputs */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Fatura no, tedarikçi, ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {activeSubTab === 'stok' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950/70 border border-slate-750 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* =========================================================================
            VIEW 1: MAL ALIM FATURALARI
           ========================================================================= */}
        {activeSubTab === 'faturalar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Fatura / İrsaliye No</th>
                  <th className="py-3 px-4">Tedarikçi (Cari)</th>
                  <th className="py-3 px-4">Alınan Ürünler</th>
                  <th className="py-3 px-4">Kayıt Türü</th>
                  <th className="py-3 px-4">Ödeme Durumu</th>
                  <th className="py-3 px-4 text-right">Toplam Tutar</th>
                  <th className="py-3 px-4 text-right">Cari Borca Yansıyan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Kayıtlı mal alımı faturası bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const cariDebt = order.totalAmount - (order.paidAmount || 0);

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-slate-300 font-medium">
                          {formatDate(order.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-amber-400 font-semibold">
                            {order.invoiceNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-white font-medium">{order.supplierName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                          {order.items.map((i) => `${i.productName} (${i.quantity} ad.)`).join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              order.source === 'excel'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {order.source === 'excel' ? 'Excel Yüklemesi' : 'Manuel Giriş'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              order.paymentStatus === 'odendi'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : order.paymentStatus === 'kismi'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {order.paymentStatus === 'odendi'
                              ? 'Ödendi'
                              : order.paymentStatus === 'kismi'
                              ? 'Kısmi Ödeme'
                              : 'Vadeli Borç'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-white">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-400">
                          {formatCurrency(cariDebt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: MEVCUT STOK & MALİYET LİSTESİ
           ========================================================================= */}
        {activeSubTab === 'stok' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Ürün Adı</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Ortak Tedarikçi</th>
                  <th className="py-3 px-4 text-right">Stok Miktarı</th>
                  <th className="py-3 px-4 text-right">Ortalama Alış Maliyeti</th>
                  <th className="py-3 px-4 text-right">Satış Fiyatı</th>
                  <th className="py-3 px-4 text-right">Toplam Değer</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((prod) => {
                  const isLow = prod.stockQty <= prod.minStockAlert;
                  const totalVal = prod.stockQty * prod.costPrice;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-amber-400 font-semibold">
                        {prod.sku}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{prod.name}</td>
                      <td className="py-3 px-4 text-slate-400">{prod.category}</td>
                      <td className="py-3 px-4 text-slate-300">{prod.supplierName}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {formatNumber(prod.stockQty)} {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {formatCurrency(prod.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-400">
                        {formatCurrency(prod.salePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        {formatCurrency(totalVal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isLow ? 'Kritik Seviye' : 'Yeterli'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: TEDARİKÇİ CARİ BORÇ DURUMU
           ========================================================================= */}
        {activeSubTab === 'borclar' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tedarikçi Kodu</th>
                  <th className="py-3 px-4">Firma Ünvanı</th>
                  <th className="py-3 px-4">Kategori / Sektör</th>
                  <th className="py-3 px-4">İletişim & Şehir</th>
                  <th className="py-3 px-4 text-right">Toplam Alım (Ciro)</th>
                  <th className="py-3 px-4 text-right">Ödenen Tutar</th>
                  <th className="py-3 px-4 text-right">Güncel Cari Borç</th>
                  <th className="py-3 px-4 text-center">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold">{s.code}</td>
                    <td className="py-3 px-4 text-white font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-slate-400">{s.category}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{s.phone}</div>
                      <div className="text-[10px] text-slate-500">{s.city}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">
                      {formatCurrency(s.totalPurchased)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      {formatCurrency(s.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {formatCurrency(s.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setOpenPurchaseModalType('manuel')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>Mal Alımı Yap</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
