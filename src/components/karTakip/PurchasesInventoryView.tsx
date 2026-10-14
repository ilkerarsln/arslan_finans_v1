import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  X,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { PurchaseRecord } from '../../types/karTakip';
import { downloadPurchasesTemplate } from '../../utils/karTakipExcelParser';

interface PurchasesInventoryViewProps {
  onOpenPurchaseUpload: () => void;
}

export const PurchasesInventoryView: React.FC<PurchasesInventoryViewProps> = ({
  onOpenPurchaseUpload
}) => {
  const {
    inventoryStocks,
    purchases,
    suppliers,
    addPurchases,
    deletePurchase,
    currentUser,
    kpis,
    uniquePeriods
  } = useKarTakip();

  const [activeTab, setActiveTab] = useState<'inventory' | 'purchases'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);

  const [purDate, setPurDate] = useState(new Date().toISOString().split('T')[0]);
  const [purSupplierName, setPurSupplierName] = useState(suppliers[0]?.name || '');
  const [purSku, setPurSku] = useState('');
  const [purName, setPurName] = useState('');
  const [purCategory, setPurCategory] = useState('Koltuk Takımları');
  const [purQty, setPurQty] = useState('5');
  const [purCost, setPurCost] = useState('');
  const [purInvoice, setPurInvoice] = useState('');
  const [purNotes, setPurNotes] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredStocks = inventoryStocks.filter(stk => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      stk.productName.toLowerCase().includes(q) ||
      stk.productCode.toLowerCase().includes(q) ||
      stk.category.toLowerCase().includes(q)
    );
  });

  const filteredPurchases = purchases.filter(p => {
    if (filterPeriod !== 'ALL' && p.periodMonth !== filterPeriod) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.productName.toLowerCase().includes(q) ||
      p.productCode.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      (p.invoiceNo && p.invoiceNo.toLowerCase().includes(q))
    );
  });

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(purQty, 10);
    const costNum = parseFloat(purCost);
    if (!purSku || !purName || isNaN(qtyNum) || qtyNum <= 0 || isNaN(costNum) || costNum <= 0) {
      return;
    }

    const period = purDate.slice(0, 7);
    const newPur: PurchaseRecord = {
      id: `pur_manual_${Date.now()}`,
      purchaseDate: purDate,
      periodMonth: period,
      supplierId: `sup_${Date.now()}`,
      supplierName: purSupplierName || 'Tedarikçi Firma',
      productCode: purSku.toUpperCase().trim(),
      productName: purName.trim(),
      category: purCategory,
      quantity: qtyNum,
      unitCost: costNum,
      totalCost: Math.round(qtyNum * costNum * 100) / 100,
      invoiceNo: purInvoice.trim() || undefined,
      notes: purNotes.trim() || undefined
    };

    addPurchases([newPur]);
    setShowAddPurchaseModal(false);

    setPurSku('');
    setPurName('');
    setPurCost('');
    setPurInvoice('');
    setPurNotes('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  const criticalStockCount = inventoryStocks.filter(s => s.stockStatus !== 'IN_STOCK').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950/70 border border-slate-700/80 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Package className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Mal Alım (Satın Alma) & Stok Takip Yönetimi
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Tedarikçilerden alınan partilerin kaydedilmesi, gerçekleşen satışlar sonrası stokların otomatik düşülmesi ve ağırlıklı ortalama alım maliyetleri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadPurchasesTemplate}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Alım Şablonu (.xlsx)</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowAddPurchaseModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tekil Alım Ekle</span>
                </button>
                <button
                  onClick={onOpenPurchaseUpload}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Toplu Alım Yükle</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Mevcut Depo Stoğu</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-white mt-2">
            {kpis.totalStockUnits.toLocaleString('tr-TR')} <span className="text-xs font-normal text-slate-400">adet</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            (Alınan - Satılan net bakiye)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Toplam Envanter Değeri</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(kpis.totalStockValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Alış maliyetleriyle değerlenen stok
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Toplam Mal Alım Hacmi</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono-num text-slate-800 dark:text-slate-200 mt-2">
            {purchases.reduce((sum, p) => sum + p.quantity, 0)} <span className="text-xs font-normal text-slate-400">adet</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {purchases.length} farklı sevkiyat partisi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-300">
            <span>Kritik & Tükenen Stok</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold font-mono-num text-rose-600 dark:text-rose-400 mt-2">
            {criticalStockCount} <span className="text-xs font-normal text-rose-400/80">ürün</span>
          </div>
          <div className="text-[11px] text-rose-500 mt-1">
            Yeni tedarik siparişi verilmeli
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Ürün Stok & Envanter Dengesi ({inventoryStocks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'purchases'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Mal Alım (Satın Alma) İrsaliyeleri ({purchases.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ürün adı, SKU veya kategori ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Stok Formülü:</span>
              <code className="text-purple-600 dark:text-purple-300 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                Toplam Alınan - Toplam Satılan
              </code>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Ürün Adı</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Alınan Adet</th>
                  <th className="py-3 px-3 text-right">Satılan Adet</th>
                  <th className="py-3 px-3 text-right">Kalan Stok</th>
                  <th className="py-3 px-3 text-right">Ortalama Alış (WAC)</th>
                  <th className="py-3 px-3 text-right">Güncel Liste Fiyatı</th>
                  <th className="py-3 px-3 text-center">Stok Durumu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Stok kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map(stk => {
                    const isOutOfStock = stk.stockStatus === 'OUT_OF_STOCK';
                    const isLowStock = stk.stockStatus === 'LOW_STOCK';

                    return (
                      <tr
                        key={stk.productCode}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isOutOfStock ? 'bg-rose-50/40 dark:bg-rose-950/10' : isLowStock ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-200">
                          {stk.productCode}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-white max-w-[220px] truncate" title={stk.productName}>
                          {stk.productName}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{stk.category}</td>
                        <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-300 font-semibold font-mono-num">
                          {stk.totalPurchased}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-mono-num">
                          {stk.totalSold}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono-num">
                          <span
                            className={`text-sm ${
                              isOutOfStock
                                ? 'text-rose-600 dark:text-rose-400'
                                : isLowStock
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {stk.currentStock}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-purple-600 dark:text-purple-300 font-mono-num">
                          {formatCurrency(stk.avgPurchaseCost)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-mono-num">
                          {formatCurrency(stk.latestCatalogPrice)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>Tükendi ({stk.currentStock})</span>
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                              <span>Kritik ({stk.currentStock})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Stokta Var</span>
                            </span>
                          )}
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

      {activeTab === 'purchases' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Fatura no, tedarikçi veya ürün ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Dönem:</span>
              <select
                value={filterPeriod}
                onChange={e => setFilterPeriod(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700"
              >
                <option value="ALL">Tüm Dönemler</option>
                {uniquePeriods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Tarih</th>
                  <th className="py-3 px-3">Tedarikçi</th>
                  <th className="py-3 px-3">İrsaliye / Fatura</th>
                  <th className="py-3 px-3">SKU & Ürün</th>
                  <th className="py-3 px-3 text-right">Adet</th>
                  <th className="py-3 px-3 text-right">Alış Birim Maliyet (₺)</th>
                  <th className="py-3 px-3 text-right">Toplam Tutar (₺)</th>
                  <th className="py-3 px-3">Notlar</th>
                  {isAdmin && <th className="py-3 px-2 text-center w-8"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Mal alım kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">{p.purchaseDate}</td>
                      <td className="py-3 px-3 text-teal-600 dark:text-teal-300 font-semibold">{p.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.invoiceNo || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="text-slate-900 dark:text-white font-medium">{p.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.productCode} • {p.category}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-purple-600 dark:text-purple-300 font-mono-num">{p.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-mono-num">{formatCurrency(p.unitCost)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white font-mono-num">{formatCurrency(p.totalCost)}</td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]">{p.notes || '-'}</td>
                      {isAdmin && (
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => deletePurchase(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title="Bu alım kaydını sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                <span>Yeni Mal Alımı (Satın Alma) Girişi</span>
              </h3>
              <button
                onClick={() => setShowAddPurchaseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Alım Tarihi *</label>
                  <input
                    type="date"
                    value={purDate}
                    onChange={e => setPurDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">İrsaliye / Fatura No</label>
                  <input
                    type="text"
                    placeholder="IRS-2024-001"
                    value={purInvoice}
                    onChange={e => setPurInvoice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tedarikçi Firma *</label>
                <select
                  value={purSupplierName}
                  onChange={e => setPurSupplierName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  required
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ürün Kodu (SKU) *</label>
                  <input
                    type="text"
                    placeholder="Örn: KLT-101"
                    value={purSku}
                    onChange={e => setPurSku(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kategori</label>
                  <select
                    value={purCategory}
                    onChange={e => setPurCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Koltuk Takımları">Koltuk Takımları</option>
                    <option value="Yatak Odası">Yatak Odası</option>
                    <option value="Yemek Odası">Yemek Odası</option>
                    <option value="Ev Aletleri & Beyaz Eşya">Ev Aletleri & Beyaz Eşya</option>
                    <option value="Oturma Odası">Oturma Odası</option>
                    <option value="Aksesuar">Aksesuar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ürün / Malzeme Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Chesterfield 3'lü Koltuk"
                  value={purName}
                  onChange={e => setPurName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Alınan Adet *</label>
                  <input
                    type="number"
                    min="1"
                    value={purQty}
                    onChange={e => setPurQty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Birim Alış Maliyeti (TL) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20500"
                    value={purCost}
                    onChange={e => setPurCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-purple-600 dark:text-purple-300 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Notlar</label>
                <input
                  type="text"
                  placeholder="Sevkiyat notu, ambar teslimi vb."
                  value={purNotes}
                  onChange={e => setPurNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPurchaseModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Mal Alımını Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
