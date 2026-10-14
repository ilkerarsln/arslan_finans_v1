import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  Layers,
  Calendar,
  Search,
  Plus,
  Trash2,
  Building2,
  Upload,
  Download,
  X
} from 'lucide-react';
import { downloadWholesaleTemplate } from '../../utils/karTakipExcelParser';

interface WholesaleCatalogViewProps {
  onOpenUpload: () => void;
}

export const WholesaleCatalogView: React.FC<WholesaleCatalogViewProps> = ({ onOpenUpload }) => {
  const {
    wholesalePrices,
    deleteWholesaleItem,
    uniquePeriods,
    updateSingleWholesalePrice,
    currentUser
  } = useKarTakip();

  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Koltuk Takımları');
  const [newPrice, setNewPrice] = useState('');
  const [newPeriod, setNewPeriod] = useState(uniquePeriods[0] || '2024-05');
  const [newSupplier, setNewSupplier] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredItems = wholesalePrices.filter(item => {
    if (selectedPeriod !== 'ALL' && item.periodMonth !== selectedPeriod) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.productCode.toLowerCase().includes(q) ||
        (item.supplier && item.supplier.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice);
    if (!newSku || !newName || isNaN(priceNum) || priceNum <= 0) {
      setFormError('Lütfen SKU, Ürün Adı ve geçerli bir Toptan Maliyet girin.');
      return;
    }
    setFormError(null);

    updateSingleWholesalePrice(newSku, newPeriod, priceNum, newName, newCategory);
    setShowAddModal(false);
    setNewSku('');
    setNewName('');
    setNewPrice('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Aylık Toptan Maliyet & Fiyat Listeleri Kataloğu
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Her aya ait toptan alış fiyatlarını arşivleyin. Satış raporları ilgili dönemin maliyetleriyle otomatik eşleştirilir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadWholesaleTemplate}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Şablon İndir</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tekil Ürün Ekle</span>
                </button>
                <button
                  onClick={onOpenUpload}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Toplu Excel Yükle</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün adı, SKU veya tedarikçi ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Dönem:</span>
            <button
              onClick={() => setSelectedPeriod('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                selectedPeriod === 'ALL'
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Tüm Dönemler
            </button>
            {uniquePeriods.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                  selectedPeriod === p
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Dönem</th>
                <th className="py-3 px-4">SKU / Barkod</th>
                <th className="py-3 px-4">Ürün Adı</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Toptan Maliyet (TL)</th>
                <th className="py-3 px-4">Tedarikçi</th>
                <th className="py-3 px-4">Notlar</th>
                {isAdmin && <th className="py-3 px-3 text-center w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Seçili kriterlerde toptan maliyet kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3 h-3 text-teal-500" />
                        {item.periodMonth}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900 dark:text-slate-200 font-semibold">
                      {item.productCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-teal-600 dark:text-teal-400 font-mono-num">
                      {formatCurrency(item.wholesalePrice)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {item.supplier ? (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{item.supplier}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={item.notes}>
                      {item.notes || '-'}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => deleteWholesaleItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Bu toptan fiyat kaydını sil"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tekil Toptan Fiyat Tanımla</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Geçerli Ay / Dönem *</label>
                <input
                  type="month"
                  value={newPeriod}
                  onChange={e => setNewPeriod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ürün Kodu (SKU) *</label>
                <input
                  type="text"
                  placeholder="Örn: KLT-101"
                  value={newSku}
                  onChange={e => setNewSku(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Chesterfield Koltuk"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kategori</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Toptan Maliyet (TL) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="20500"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tedarikçi Firma</label>
                <input
                  type="text"
                  placeholder="Örn: Asil Döşeme A.Ş."
                  value={newSupplier}
                  onChange={e => setNewSupplier(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  Fiyatı Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
