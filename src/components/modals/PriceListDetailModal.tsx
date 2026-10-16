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
  Save,
  Tag,
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
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemNotes, setNewItemNotes] = useState('');

  // Editing Item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  if (!isOpen || !priceList) return null;

  const isToptan = priceList.listType === 'Toptan';

  const filteredItems = items.filter(item => {
    if (selectedCatFilter !== 'ALL' && item.category !== selectedCatFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const mName = (item.urunAdi || item.name || '').toLowerCase().includes(q);
      const mCode = (item.stokKodu || item.code || '').toLowerCase().includes(q);
      const mBrand = (item.brand || '').toLowerCase().includes(q);
      if (!mName && !mCode && !mBrand) return false;
    }
    return true;
  });

  const getItemPrice = (item: PriceListItem): number => {
    if (isToptan) {
      return item.toptanFiyat ?? item.costPrice ?? 0;
    } else {
      return item.perakendeFiyat ?? item.salePrice ?? 0;
    }
  };

  const handleStartEdit = (item: PriceListItem) => {
    setEditingItemId(item.id);
    setEditPrice(getItemPrice(item));
  };

  const handleSaveInlineEdit = (id: string) => {
    setItems(prev =>
      prev.map(i => {
        if (i.id === id) {
          const numPrice = Number(editPrice) || 0;
          return {
            ...i,
            toptanFiyat: isToptan ? numPrice : i.toptanFiyat,
            perakendeFiyat: !isToptan ? numPrice : i.perakendeFiyat,
            costPrice: isToptan ? numPrice : i.costPrice,
            salePrice: !isToptan ? numPrice : i.salePrice,
          };
        }
        return i;
      })
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
    if (!newItemName.trim() || !newItemCode.trim()) return;
    const numPrice = Number(newItemPrice) || 0;
    const newItem: PriceListItem = {
      id: `pli-${Date.now()}`,
      stokKodu: newItemCode.trim(),
      code: newItemCode.trim(),
      urunAdi: newItemName.trim(),
      name: newItemName.trim(),
      category: newItemCategory,
      brand: newItemBrand || undefined,
      toptanFiyat: isToptan ? numPrice : undefined,
      perakendeFiyat: !isToptan ? numPrice : undefined,
      costPrice: isToptan ? numPrice : undefined,
      salePrice: !isToptan ? numPrice : undefined,
      notes: newItemNotes.trim() || undefined,
    };
    setItems(prev => [newItem, ...prev]);
    setIsAddingItem(false);
    setNewItemName('');
    setNewItemCode('');
    setNewItemPrice(0);
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
    showToast('Fiyat listesi ve tüm kalemler kaydedildi!', 'success');
    onClose();
  };

  const handleSyncToStock = () => {
    if (!isAdmin) {
      showToast('Bu işlem yalnızca Yönetici (Admin) yetkisiyle yapılabilir.', 'error');
      return;
    }
    let updatedCount = 0;
    items.forEach(pItem => {
      const code = pItem.stokKodu || pItem.code;
      const name = pItem.urunAdi || pItem.name;
      const match = stockItems.find(
        s => (code && s.code && s.code.toLowerCase() === code.toLowerCase()) ||
             (name && s.name.toLowerCase().trim() === name.toLowerCase().trim())
      );
      if (match) {
        const itemP = getItemPrice(pItem);
        if (isToptan) {
          updateStockItem({
            ...match,
            purchasePrice: itemP,
            totalValue: +(match.quantity * itemP).toFixed(2),
          });
        } else {
          updateStockItem({
            ...match,
            salePrice: itemP,
          });
        }
        updatedCount++;
      }
    });
    showToast(`${updatedCount} adet stok kartının ${isToptan ? 'alış maliyeti' : 'satış fiyatı'} güncellendi!`, 'success');
  };

  const handleExportExcel = () => {
    const dataToExport = items.map(item => ({
      'stokKodu': item.stokKodu || item.code || '',
      'urunAdi': item.urunAdi || item.name,
      'Kategori': item.category || '',
      'Marka': item.brand || '',
      [isToptan ? 'toptanFiyat' : 'perakendeFiyat']: getItemPrice(item),
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
          const rawCode = r['stokKodu'] || r['stok_kodu'] || r['Stok Kodu'] || r['kod'] || r['code'] || '';
          const rawName = r['urunAdi'] || r['urun_adi'] || r['Ürün Adı'] || r['Urun Adi'] || r['name'] || rawCode;
          const rawPrice = Number(
            r[isToptan ? 'toptanFiyat' : 'perakendeFiyat'] ||
            r['toptanFiyat'] ||
            r['perakendeFiyat'] ||
            r['fiyat'] ||
            r['Fiyat'] ||
            r['Toptan Fiyat'] ||
            r['Perakende Fiyat'] ||
            0
          );

          if (rawCode || rawName) {
            newItems.push({
              id: `pli-imp-${Date.now()}-${idx}`,
              stokKodu: String(rawCode || '').trim(),
              code: String(rawCode || '').trim(),
              urunAdi: String(rawName).trim(),
              name: String(rawName).trim(),
              category: r['Kategori'] ? String(r['Kategori']).trim() : 'Beyaz Eşya',
              brand: r['Marka'] ? String(r['Marka']).trim() : 'Genel',
              toptanFiyat: isToptan ? rawPrice : undefined,
              perakendeFiyat: !isToptan ? rawPrice : undefined,
              costPrice: isToptan ? rawPrice : undefined,
              salePrice: !isToptan ? rawPrice : undefined,
              notes: r['Notlar'] ? String(r['Notlar']).trim() : undefined,
            });
          }
        });
        if (newItems.length > 0) {
          setItems(prev => [...newItems, ...prev]);
          showToast(`${newItems.length} adet ürün fiyat listesine aktarıldı!`, 'success');
        } else {
          alert('Excel dosyasında "stokKodu" veya "urunAdi" sütunları tespit edilemedi.');
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
              <span className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isToptan
                  ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
              }`}>
                {priceList.listType} Fiyat Listesi
              </span>
              <span className="font-mono text-xs text-slate-400">
                {priceList.monthKey}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isToptan
                ? 'Tedarikçi toptan alım fiyatlarını içerir. Mal Alımı ekranında genel iskonto bu baz fiyat üzerinden düşülür.'
                : 'Tavsiye edilen perakende satış etiket fiyatlarını içerir.'}
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
              <span>Excel'den Yükle</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Listeyi Excel olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel İndir</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleSyncToStock}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                title="Bu fiyatları ana stok kartlarına aktar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Stoklara Eşitle</span>
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
                placeholder="Fiyat listesinde stok kodu veya ürün ara..."
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
            className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 shrink-0 animate-in fade-in"
          >
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Stok Kodu *</label>
              <input
                type="text"
                required
                value={newItemCode}
                onChange={e => setNewItemCode(e.target.value)}
                placeholder="BSH-KGN86"
                className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ürün Adı *</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Bosch KGN86 Kombi Buzdolabı"
                className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                {isToptan ? 'Toptan Fiyat (₺) *' : 'Perakende Fiyat (₺) *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={newItemPrice || ''}
                onChange={e => setNewItemPrice(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold outline-none"
              />
            </div>
            <div className="flex items-end">
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
                <th className="py-2.5 px-3 font-semibold">Stok Kodu</th>
                <th className="py-2.5 px-3 font-semibold">Ürün Adı & Modeli</th>
                <th className="py-2.5 px-3 font-semibold">Kategori / Marka</th>
                <th className="py-2.5 px-3 font-semibold text-right">
                  {isToptan ? 'Toptan Fiyat (Maliyet)' : 'Perakende Satış Fiyatı'}
                </th>
                <th className="py-2.5 px-3 font-semibold text-right w-24">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Fiyat listesinde kayıt bulunamadı. "Yeni Kalem Ekle" veya "Excel'den Yükle" ile ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isEditing = editingItemId === item.id;
                  const itemPrice = getItemPrice(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition group"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.stokKodu || item.code || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.urunAdi || item.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {item.category}
                            </span>
                          )}
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
                            value={editPrice}
                            onChange={e => setEditPrice(Number(e.target.value) || 0)}
                            className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded text-right font-mono font-bold text-xs"
                          />
                        ) : (
                          <span className={`font-mono-num font-bold text-sm ${
                            isToptan ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {formatCurrency(itemPrice)}
                          </span>
                        )}
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
            Toplam <strong>{items.length} ürün kalemi</strong> kayıtlı
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
