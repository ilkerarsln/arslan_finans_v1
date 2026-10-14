import React, { useState } from 'react';
import { useKarTakip } from '../../context/KarTakipContext';
import {
  Building2,
  MapPin,
  Calendar,
  Plus,
  Search,
  FileSpreadsheet,
  X,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import { KarTakipSupplier } from '../../types/karTakip';

interface SuppliersViewProps {
  onOpenWholesaleUpload: () => void;
  onOpenPurchaseModal: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenWholesaleUpload,
}) => {
  const { suppliers, wholesalePrices, purchases, addSupplier, currentUser } = useKarTakip();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('Koltuk Takımları');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newTerms, setNewTerms] = useState('30 Gün Vadeli');

  const isAdmin = currentUser?.role === 'ADMIN';

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  });

  const activeSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

  const supplierWholesale = wholesalePrices.filter(
    w =>
      (w.supplier && activeSupplier && w.supplier.toLowerCase().includes(activeSupplier.name.toLowerCase())) ||
      w.supplierId === activeSupplier?.id
  );

  const supplierPurchases = purchases.filter(
    p =>
      (activeSupplier && p.supplierName.toLowerCase().includes(activeSupplier.name.toLowerCase())) ||
      p.supplierId === activeSupplier?.id
  );

  const totalPurchasedVolume = supplierPurchases.reduce((sum, p) => sum + p.totalCost, 0);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    const newSup: KarTakipSupplier = {
      id: `sup_${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      category: newCategory,
      contactPerson: newContact.trim() || 'Yetkili',
      phone: newPhone.trim() || '-',
      email: newEmail.trim() || '-',
      city: newCity.trim() || 'Türkiye',
      paymentTerms: newTerms.trim(),
      activeProductsCount: 0
    };

    addSupplier(newSup);
    setSelectedSupplierId(newSup.id);
    setShowAddSupplierModal(false);

    setNewName('');
    setNewCode('');
    setNewContact('');
    setNewPhone('');
    setNewEmail('');
    setNewCity('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950/70 border border-slate-700/80 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Building2 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Tedarikçi & Geçmiş Fiyat Listeleri Yönetimi
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Üretici ve toptancı tedarikçi firma profilleri, geçmiş aylık toptan fiyat arşivleri ve toplam mal alım mutabakatları.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Tedarikçi Ekle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tedarikçi adı, şehir veya kategori..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredSuppliers.map(sup => {
              const isSelected = sup.id === selectedSupplierId;
              return (
                <div
                  key={sup.id}
                  onClick={() => setSelectedSupplierId(sup.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50/50 dark:bg-slate-900 border-teal-500 shadow-xs ring-2 ring-teal-500/20'
                      : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {sup.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{sup.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{sup.city}</span>
                      </p>
                    </div>
                    {sup.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                        {sup.category}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>{sup.paymentTerms || '30 Gün'}</span>
                    </span>
                    <span className="text-teal-600 dark:text-teal-400 font-semibold">Detaylar →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeSupplier && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center font-bold text-sm">
                    {activeSupplier.code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeSupplier.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="text-teal-600 dark:text-teal-300 font-medium">{activeSupplier.category || 'Tedarikçi'}</span>
                      <span>•</span>
                      <span>{activeSupplier.city}</span>
                      <span>•</span>
                      <span>Yetkili: {activeSupplier.contactPerson}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onOpenWholesaleUpload}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Fiyat Listesi Yükle</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Telefon:</span>
                  <span className="text-slate-800 dark:text-white font-medium">{activeSupplier.phone}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">E-posta:</span>
                  <span className="text-slate-800 dark:text-white font-medium truncate block">{activeSupplier.email}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Ödeme Vadesi:</span>
                  <span className="text-teal-600 dark:text-teal-300 font-semibold">{activeSupplier.paymentTerms}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Toplam Mal Alımı:</span>
                  <span className="text-purple-600 dark:text-purple-300 font-bold font-mono-num">{formatCurrency(totalPurchasedVolume)}</span>
                </div>
              </div>

              {activeSupplier.notes && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic">
                  Not: {activeSupplier.notes}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-500" />
                    <span>Dönemsel Toptan Fiyat Listesi Arşivi</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bu tedarikçiye ait aylık bazda kaydedilmiş toptan alış fiyatları
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {supplierWholesale.length} Kayıt
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Dönem</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Ürün Adı</th>
                      <th className="py-3 px-4 text-right">Toptan Liste Fiyatı</th>
                      <th className="py-3 px-4">Notlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {supplierWholesale.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          Bu tedarikçiye ait kayıtlı toptan fiyat listesi bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      supplierWholesale.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-teal-700 dark:text-teal-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              <Calendar className="w-3 h-3 text-teal-500" />
                              {item.periodMonth}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-300 font-semibold">
                            {item.productCode}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-teal-600 dark:text-teal-400 font-mono-num">
                            {formatCurrency(item.wholesalePrice)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-500" />
                    <span>Mal Alım (Satın Alma) İrsaliyeleri</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bu tedarikçiden fiilen teslim alınan ürün partileri ve faturalar
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-slate-700">
                  {supplierPurchases.length} Parti Alım
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Alım Tarihi</th>
                      <th className="py-3 px-4">İrsaliye / Fatura</th>
                      <th className="py-3 px-4">Ürün</th>
                      <th className="py-3 px-4 text-right">Adet</th>
                      <th className="py-3 px-4 text-right">Birim Alış (₺)</th>
                      <th className="py-3 px-4 text-right">Toplam Fatura (₺)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {supplierPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          Bu tedarikçiden henüz mal alımı kaydedilmedi.
                        </td>
                      </tr>
                    ) : (
                      supplierPurchases.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{p.purchaseDate}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{p.invoiceNo || '-'}</td>
                          <td className="py-2.5 px-4 text-slate-900 dark:text-white font-medium">{p.productName}</td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{p.quantity}</td>
                          <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300 font-mono-num">{formatCurrency(p.unitCost)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-purple-600 dark:text-purple-300 font-mono-num">{formatCurrency(p.totalCost)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span>Yeni Tedarikçi Firma Ekle</span>
              </h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Firma Kodu *</label>
                  <input
                    type="text"
                    placeholder="TED-ABC"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kategori *</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
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
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Firma / Üretici Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Anadolu Mobilya Sanayi A.Ş."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Yetkili Kişi</label>
                  <input
                    type="text"
                    placeholder="Ahmet Bey"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Şehir / Konum</label>
                  <input
                    type="text"
                    placeholder="İnegöl / Bursa"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="0224 714 00 00"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">E-posta</label>
                  <input
                    type="email"
                    placeholder="siparis@firma.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Ödeme Vadesi</label>
                <input
                  type="text"
                  placeholder="30 Gün Vadeli Çek veya DBS"
                  value={newTerms}
                  onChange={e => setNewTerms(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                  Tedarikçiyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
