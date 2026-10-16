import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PriceListEntry, PriceListItem } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  Upload,
  RefreshCw,
  Tag,
  Save,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PriceListDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceList: PriceListEntry | null;
}

export const PriceListDetailModal: React.FC<PriceListDetailModalProps> = ({
  isOpen,
  onClose,
  priceList,
}) => {
  const {
    updatePriceList,
    stockItems,
    updateStockItem,
    productCategories,
    productBrands,
    showToast,
    isAdmin,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<PriceListItem[]>(() => {
    return priceList?.items || [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');

  // Add Item form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Beyaz Eşya');
  const [newItemBrand, setNewItemBrand] = useState('Bosch');
  const [newItemCostPrice, setNewItemCostPrice] = useState<number>(0);
  const [newItemSalePrice, setNewItemSalePrice] = useState<number>(0);
  const [newItemNotes, setNewItemNotes] = useState('');

  // Editing Item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);

  if (!isOpen || !priceList) return null;

  const filteredItems = items.filter(item => {
    if (selectedCatFilter !== 'ALL' && item.category !== selectedCatFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const mName = item.name.toLowerCase().includes(q);
      const mCode = (item.code || '').toLowerCase().includes(q);
      const mBrand = (item.brand || '').toLowerCase().includes(q);
      if (!mName && !mCode && !mBrand) return false;
    }
    return true;
  });

  const handleStartEdit = (item: PriceListItem) => {
    setEditingItemId(item.id);
    setEditCostPrice(item.costPrice);
    setEditSalePrice(item.salePrice);
  };

  const handleSaveInlineEdit = (id: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, costPrice: Number(editCostPrice) || 0, salePrice: Number(editSalePrice) || 0 } : i
      )
    );
    setEditingItemId(null);
    showToast('Fiyat güncellendi', 'info');
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Kalem listeden silindi', 'info');
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem: PriceListItem = {
      id: `pli-${Date.now()}`,
      code: newItemCode.trim() || undefined,
      name: newItemName.trim(),
      category: newItemCategory,
      brand: newItemBrand || undefined,
      costPrice: Number(newItemCostPrice) || 0,
      salePrice: Number(newItemSalePrice) || 0,
      notes: newItemNotes.trim() || undefined,
    };
    setItems(prev => [newItem, ...prev]);
    setIsAddingItem(false);
    setNewItemName('');
    setNewItemCode('');
    setNewItemCostPrice(0);
    setNewItemSalePrice(0);
    setNewItemNotes('');
    showToast(`"${newItem.name}" fiyat listesine eklendi`, 'success');
  };

  const handleSaveAll = () => {
    const updatedList: PriceListEntry = {
      ...priceList,
      items,
      itemsCount: items.length,
      updatedAt: new Date().toISOString(),
    };
    updatePriceList(updatedList);
    showToast('Fiyat listesi ve tüm kalemler başarıyla kaydedildi!', 'success');
    onClose();
  };

  const handleSyncToStock = () => {
    if (!isAdmin) {
      showToast('Bu işlem yalnızca Yönetici (Admin) yetkisiyle yapılabilir.', 'error');
      return;
    }
    let updatedCount = 0;
    items.forEach(pItem => {
      const match = stockItems.find(
        s => s.name.toLowerCase().trim() === pItem.name.toLowerCase().trim() ||
             (pItem.code && s.code && s.code.toLowerCase() === pItem.code.toLowerCase())
      );
      if (match) {
        updateStockItem({
          ...match,
          purchasePrice: pItem.costPrice,
          salePrice: pItem.salePrice,
          totalValue: +(match.quantity * pItem.costPrice).toFixed(2),
        });
        updatedCount++;
      }
    });
    showToast(`${updatedCount} adet stok kartının fiyatı bu liste ile eşitlendi!`, 'success');
  };

  const handleExportExcel = () => {
    const dataToExport = items.map(item => ({
      'Ürün Kodu': item.code || '',
      'Ürün Adı': item.name,
      'Kategori': item.category,
      'Alt Kategori': item.subCategory || '',
      'Marka': item.brand || '',
      'Alış Maliyeti (TL)': item.costPrice,
      'Satış Fiyatı (TL)': item.salePrice,
      'Kâr Marjı (%)': item.salePrice > 0 ? +(((item.salePrice - item.costPrice) / item.salePrice) * 100).toFixed(1) : 0,
      'Notlar': item.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fiyat Listesi');
    XLSX.writeFile(workbook, `${priceList.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${priceList.monthKey}.xlsx`);
    showToast('Excel dosyası başarıyla indirildi', 'success');
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const newItems: PriceListItem[] = [];
        rows.forEach((r, idx) => {
          const name = r['Ürün Adı'] || r['Urun Adi'] || r['Ürün'] || r['Name'] || r['Açıklama'];
          if (name) {
            newItems.push({
              id: `pli-imp-${Date.now()}-${idx}`,
              code: r['Ürün Kodu'] ? String(r['Ürün Kodu']).trim() : undefined,
              name: String(name).trim(),
              category: r['Kategori'] ? String(r['Kategori']).trim() : 'Beyaz Eşya',
              subCategory: r['Alt Kategori'] ? String(r['Alt Kategori']).trim() : undefined,
              brand: r['Marka'] ? String(r['Marka']).trim() : 'Genel',
              costPrice: Number(r['Alış Fiyatı (TL)'] || r['Alış Fiyatı'] || r['Maliyet'] || r['Cost'] || 0),
              salePrice: Number(r['Satış Fiyatı (TL)'] || r['Satış Fiyatı'] || r['Fiyat'] || r['Price'] || 0),
              notes: r['Notlar'] ? String(r['Notlar']).trim() : undefined,
            });
          }
        });

        if (newItems.length > 0) {
          setItems(prev => [...newItems, ...prev]);
          showToast(`${newItems.length} adet ürün fiyat listesine aktarıldı!`, 'success');
        } else {
          alert('Excel dosyasında "Ürün Adı" sütunu tespit edilemedi.');
        }
      } catch (err: any) {
        alert('Excel okuma hatası: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-5xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {priceList.title}
              </h3>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {priceList.monthKey}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bu fiyat listesindeki ürün kalemlerini arayüzden anlık olarak düzenleyebilir, Excel ile dışa/içe aktarabilir ve tek tıkla ana stok fiyatlarıyla eşitleyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleExcelImport}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Excel'den bu listeye ürün ekle"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Excel İçe Aktar</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Listeyi Excel olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel İndir (.xlsx)</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleSyncToStock}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                title="Bu fiyatları ana stok kartlarındaki fiyatlarla eşitle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Stok Fiyatlarına Uygula</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Fiyat listesinde ürün, kod veya marka ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>
            <select
              value={selectedCatFilter}
              onChange={e => setSelectedCatFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="ALL">Tüm Kategoriler ({items.length})</option>
              {productCategories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingItem ? 'Vazgeç' : 'Yeni Kalem Ekle'}</span>
          </button>
        </div>

        {/* Add Item Row Form */}
        {isAddingItem && (
          <form
            onSubmit={handleAddItem}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 shrink-0 animate-in fade-in"
          >
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ürün Adı *</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Örn: Bosch KGN86 Buzdolabı"
                className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kategori</label>
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
              >
                {productCategories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Marka</label>
              <select
                value={newItemBrand}
                onChange={e => setNewItemBrand(e.target.value)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
              >
                {productBrands.map(b => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Alış Maliyeti (₺) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newItemCostPrice || ''}
                onChange={e => {
                  const val = Number(e.target.value) || 0;
                  setNewItemCostPrice(val);
                  if (newItemSalePrice === 0) setNewItemSalePrice(Math.round(val * 1.35));
                }}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Satış Fiyatı (₺) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newItemSalePrice || ''}
                onChange={e => setNewItemSalePrice(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none"
              />
            </div>
            <div className="flex items-end gap-1">
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Listeye Ekle
              </button>
            </div>
          </form>
        )}

        {/* Table of items */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Ürün Adı & Model</th>
                <th className="py-2.5 px-3 font-semibold">Kategori / Marka</th>
                <th className="py-2.5 px-3 font-semibold text-right">Alış Maliyeti</th>
                <th className="py-2.5 px-3 font-semibold text-right">Perakende Satış</th>
                <th className="py-2.5 px-3 font-semibold text-right">Kâr Marjı</th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Kayıtlı ürün kalemi bulunamadı. "Yeni Kalem Ekle" veya "Excel İçe Aktar" ile ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isEditing = editingItemId === item.id;
                  const margin = item.salePrice > 0 ? ((item.salePrice - item.costPrice) / item.salePrice) * 100 : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition group"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        {item.code && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Kod: {item.code}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {item.category}
                          </span>
                          {item.brand && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 font-medium">
                              {item.brand}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editCostPrice}
                            onChange={e => setEditCostPrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded text-right font-mono font-bold text-xs"
                          />
                        ) : (
                          <span className="font-mono-num text-slate-600 dark:text-slate-300">
                            {formatCurrency(item.costPrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editSalePrice}
                            onChange={e => setEditSalePrice(Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-emerald-500 rounded text-right font-mono font-bold text-xs"
                          />
                        ) : (
                          <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.salePrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-mono-num font-semibold ${
                            margin >= 25
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : margin > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          %{margin.toFixed(1)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveInlineEdit(item.id)}
                              className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
                              title="Kaydet"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                              title="Fiyatı Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Listeden Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500">
            Toplam <strong>{items.length} ürün kalemi</strong> kayıtlı.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Kapat
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
