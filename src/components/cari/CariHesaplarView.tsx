import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, Customer, CariMovement } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Users2,
  Building2,
  UserCheck,
  Search,
  Plus,
  ShoppingBag,
  CreditCard,
  FileText,
  X,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const CariHesaplarView: React.FC = () => {
  const {
    suppliers,
    customers,
    cariMovements,
    addSupplier,
    addCustomer,
    addCariPayment,
    navigateToPurchase,
    accounts,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tedarikciler' | 'musteriler'>('tedarikciler');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCariForEkstre, setSelectedCariForEkstre] = useState<Supplier | Customer | null>(null);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCariForPayment, setSelectedCariForPayment] = useState<Supplier | Customer | null>(null);

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentAccount, setPaymentAccount] = useState<string>(accounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentDesc, setPaymentDesc] = useState<string>('');

  // New Supplier Form
  const [newSupName, setNewSupName] = useState('');
  const [newSupPerson, setNewSupPerson] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupCity, setNewSupCity] = useState('');
  const [newSupCat, setNewSupCat] = useState('Ahşap & İskelet');

  // Filtered lists
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
  const totalCustomerReceivable = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    addSupplier({
      code: `TED-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: newSupName,
      contactPerson: newSupPerson,
      phone: newSupPhone,
      email: newSupEmail,
      city: newSupCity,
      category: newSupCat,
      type: 'tedarikci',
    });

    setIsNewSupplierOpen(false);
    setNewSupName('');
    setNewSupPerson('');
    setNewSupPhone('');
    setNewSupEmail('');
    setNewSupCity('');
  };

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCariForPayment || paymentAmount <= 0) return;

    addCariPayment({
      cariId: selectedCariForPayment.id,
      amount: paymentAmount,
      accountId: paymentAccount,
      date: paymentDate,
      description: paymentDesc || `${selectedCariForPayment.name} Cari Ödemesi`,
    });

    setIsPaymentModalOpen(false);
    setPaymentAmount(0);
    setPaymentDesc('');
  };

  const getCariEkstreMovements = (cariId: string): CariMovement[] => {
    return cariMovements.filter((m) => m.cariId === cariId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-1.5">
            <Users2 className="w-3.5 h-3.5" />
            <span>Ortak Tedarikçi & Müşteri Veritabanı</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cari Hesaplar & Borç/Alacak Takibi</h2>
          <p className="text-xs text-slate-400">
            Kâr Takip ve Finans modülleri aynı ortak tedarikçi havuzundan (ID, bakiye, faturalar) beslenir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewSupplierOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Yeni Tedarikçi Tanımla</span>
          </button>

          {/* Action to navigate to purchase */}
          <button
            onClick={() => navigateToPurchase('manuel')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.3]" />
            <span>Mal Alımı Yap</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Kayıtlı Ortak Tedarikçi</span>
          <div className="text-xl font-bold text-white mt-2">{suppliers.length} Firma</div>
          <p className="text-[11px] text-slate-500 mt-1">Tek veritabanı altında</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Tedarikçilere Toplam Cari Borç</span>
          <div className="text-xl font-bold text-rose-400 mt-2">{formatCurrency(totalSupplierDebt)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Ödenecek açık hesap ve faturalar</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Kayıtlı Müşteri Sayısı</span>
          <div className="text-xl font-bold text-white mt-2">{customers.length} Müşteri</div>
          <p className="text-[11px] text-slate-500 mt-1">Perakende & proje müşterileri</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Müşterilerden Toplam Alacak</span>
          <div className="text-xl font-bold text-emerald-400 mt-2">{formatCurrency(totalCustomerReceivable)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tahsil edilecek cari bakiye</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tedarikciler')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'tedarikciler'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Ortak Tedarikçiler ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('musteriler')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'musteriler'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Müşteri Carileri ({customers.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Firma ünvanı, kod veya şehir ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        {activeTab === 'tedarikciler' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kod</th>
                  <th className="py-3 px-4">Tedarikçi Firma Ünvanı</th>
                  <th className="py-3 px-4">Yetkili & İletişim</th>
                  <th className="py-3 px-4">Sektör / Malzeme</th>
                  <th className="py-3 px-4 text-right">Toplam Alım (Ciro)</th>
                  <th className="py-3 px-4 text-right">Ödenen</th>
                  <th className="py-3 px-4 text-right">Cari Borcumuz</th>
                  <th className="py-3 px-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold">{sup.code}</td>
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{sup.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>{sup.city}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{sup.contactPerson}</div>
                      <div className="text-[10px] text-slate-500">{sup.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{sup.category}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-200">
                      {formatCurrency(sup.totalPurchased)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      {formatCurrency(sup.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
                      {formatCurrency(sup.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCariForEkstre(sup)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition cursor-pointer"
                          title="Cari Hesap Ekstresi Görüntüle"
                        >
                          Ekstre
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCariForPayment(sup);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
                          title="Tedarikçiye Ödeme Yap"
                        >
                          Öde
                        </button>
                        <button
                          onClick={() => navigateToPurchase('manuel')}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
                          title="Bu Tedarikçiden Mal Alımı Yap"
                        >
                          Alım Yap
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Customers Table */}
        {activeTab === 'musteriler' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kod</th>
                  <th className="py-3 px-4">Müşteri Ünvanı</th>
                  <th className="py-3 px-4">Yetkili & İletişim</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-right">Toplam Satış</th>
                  <th className="py-3 px-4 text-right">Tahsil Edilen</th>
                  <th className="py-3 px-4 text-right">Cari Alacağımız</th>
                  <th className="py-3 px-4 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map((cus) => (
                  <tr key={cus.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold">{cus.code}</td>
                    <td className="py-3 px-4 font-medium text-white">{cus.name}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{cus.contactPerson}</div>
                      <div className="text-[10px] text-slate-500">{cus.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{cus.category}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-200">
                      {formatCurrency(cus.totalSales)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                      {formatCurrency(cus.totalCollected)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {formatCurrency(cus.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCariForEkstre(cus)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition cursor-pointer"
                        >
                          Ekstre
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCariForPayment(cus);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition cursor-pointer"
                        >
                          Tahsilat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cari Ekstre Modalı */}
      {selectedCariForEkstre && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Cari Hesap Ekstresi: {selectedCariForEkstre.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Kod: {selectedCariForEkstre.code} | Güncel Bakiye: <strong className="text-amber-400">{formatCurrency(selectedCariForEkstre.currentBalance)}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedCariForEkstre(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Belge / Fatura No</th>
                    <th className="py-2.5 px-3">İşlem Açıklaması</th>
                    <th className="py-2.5 px-3 text-right">Borç Tutarı (₺)</th>
                    <th className="py-2.5 px-3 text-right">Alacak / Ödeme (₺)</th>
                    <th className="py-2.5 px-3 text-right">Bakiye Sonrası</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {getCariEkstreMovements(selectedCariForEkstre.id).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Bu cari hesaba ait hareket kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  ) : (
                    getCariEkstreMovements(selectedCariForEkstre.id).map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-300">{formatDate(m.date)}</td>
                        <td className="py-2.5 px-3 font-mono text-amber-400">{m.documentNo || '-'}</td>
                        <td className="py-2.5 px-3 text-white font-medium max-w-xs">{m.description}</td>
                        <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                          {m.borc > 0 ? formatCurrency(m.borc) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                          {m.alacak > 0 ? formatCurrency(m.alacak) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">
                          {formatCurrency(m.balanceAfter)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setSelectedCariForEkstre(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white">Ortak Havuz İçin Yeni Tedarikçi Tanımla</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Tedarikçi Firma Ünvanı *</label>
                <input
                  type="text"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="Örn: İnegöl Ahşap San. Tic."
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Yetkili Kişi</label>
                  <input
                    type="text"
                    value={newSupPerson}
                    onChange={(e) => setNewSupPerson(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="0 (224) 000 00 00"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Şehir</label>
                  <input
                    type="text"
                    value={newSupCity}
                    onChange={(e) => setNewSupCity(e.target.value)}
                    placeholder="Bursa / İnegöl"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Malzeme / Kategori</label>
                  <select
                    value={newSupCat}
                    onChange={(e) => setNewSupCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Ahşap & İskelet">Ahşap & İskelet</option>
                    <option value="Sünger & Yatak">Sünger & Yatak</option>
                    <option value="Kumaş & Deri">Kumaş & Deri</option>
                    <option value="Panel & MDF & Kaplama">Panel & MDF & Kaplama</option>
                    <option value="Metal & Aksesuar">Metal & Aksesuar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">E-Posta</label>
                <input
                  type="email"
                  value={newSupEmail}
                  onChange={(e) => setNewSupEmail(e.target.value)}
                  placeholder="siparis@tedarikci.com"
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Tedarikçiyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment / Collection Modal */}
      {isPaymentModalOpen && selectedCariForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>
                {selectedCariForPayment.type === 'tedarikci' ? 'Tedarikçiye Ödeme Yap' : 'Müşteriden Tahsilat Yap'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {selectedCariForPayment.name} - Güncel Bakiye: <strong className="text-amber-400">{formatCurrency(selectedCariForPayment.currentBalance)}</strong>
            </p>

            <form onSubmit={handleMakePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Ödeme / Tahsilat Tutarı (₺) *</label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">İşlem Yapılacak Hesap *</label>
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tarih</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Açıklama</label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  placeholder="Örn: Banka havalesi ile borç ödemesi"
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  İşlemi Onayla & Cariyi Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
