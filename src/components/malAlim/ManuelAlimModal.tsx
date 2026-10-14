import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { X, Plus, Trash2, ShoppingBag, Building2, Calendar, FileText, CheckCircle, CreditCard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplierId?: string;
}

export const ManuelAlimModal: React.FC<Props> = ({ isOpen, onClose, preselectedSupplierId }) => {
  const { suppliers, products, accounts, createPurchaseOrder } = useApp();

  const [supplierId, setSupplierId] = useState<string>(preselectedSupplierId || (suppliers[0]?.id || ''));
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`FTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'vadeli' | 'odendi' | 'kismi'>('vadeli');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Items
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productName: '',
      sku: '',
      category: 'Koltuk Takımları',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);

  if (!isOpen) return null;

  const categories = [
    'Koltuk Takımları',
    'Yatak Odası',
    'Yemek Odası',
    'Genç Odası',
    'Sehpa & TV Ünitesi',
    'Sünger & Yatak',
    'Kumaş & Deri',
    'Aksesuar & Tamamlayıcı',
    'Diğer',
  ];

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
        item.totalPrice = (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price);
      }

      next[index] = item;
      return next;
    });
  };

  const handleSelectExistingProduct = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    if (!selected) return;

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: selected.id,
        productName: selected.name,
        sku: selected.sku,
        category: selected.category,
        unitPrice: selected.costPrice,
        totalPrice: next[index].quantity * selected.costPrice,
      };
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productName: '',
        sku: '',
        category: 'Koltuk Takımları',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      alert('Lütfen bir tedarikçi seçiniz.');
      return;
    }

    const hasInvalid = items.some((i) => !i.productName.trim() || i.quantity <= 0 || i.unitPrice <= 0);
    if (hasInvalid) {
      alert('Lütfen tüm kalemlerde ürün adı, geçerli miktar ve birim fiyat giriniz.');
      return;
    }

    createPurchaseOrder({
      supplierId,
      invoiceNumber,
      date,
      items,
      paymentStatus,
      paidAmount: paymentStatus === 'odendi' ? grandTotal : paymentStatus === 'kismi' ? paidAmount : 0,
      accountId: paymentStatus !== 'vadeli' ? accountId : undefined,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      source: 'manuel',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Yeni Manuel Mal Alımı Kaydı</h3>
              <p className="text-xs text-slate-400">
                Alım kaydedildiğinde tutar otomatik olarak tedarikçinin cari borcuna ve ürünün stok/maliyetine işlenir.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Supplier & Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {/* Supplier Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tedarikçi (Ortak Havuz) *</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">Tedarikçi Seçiniz...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - Mevcut Borç: {formatCurrency(s.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice No */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Fatura / İrsaliye No *</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Örn: FTR-2026-9045"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fatura / Alım Tarihi *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Alınan Ürünler & Stok Kalemleri
              </h4>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Başka Ürün Ekle</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-3"
                >
                  {/* Select Existing Product Helper */}
                  <div className="w-full md:w-48 shrink-0">
                    <label className="block text-[10px] text-slate-400 mb-1">Kayıtlı Üründen Seç</label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleSelectExistingProduct(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="">Manuel / Yeni Ürün...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Name */}
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-slate-400 mb-1">Ürün Adı *</label>
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      placeholder="Örn: Milano Chester Koltuk"
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  {/* SKU */}
                  <div className="w-full md:w-28">
                    <label className="block text-[10px] text-slate-400 mb-1">SKU / Kod</label>
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                      placeholder="KLT-099"
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2 py-1.5 text-xs text-white uppercase"
                    />
                  </div>

                  {/* Category */}
                  <div className="w-full md:w-36">
                    <label className="block text-[10px] text-slate-400 mb-1">Kategori</label>
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-full md:w-20">
                    <label className="block text-[10px] text-slate-400 mb-1">Miktar (Adet) *</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2 py-1.5 text-xs text-white text-right"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="w-full md:w-28">
                    <label className="block text-[10px] text-slate-400 mb-1">Birim Fiyat (₺) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg px-2 py-1.5 text-xs text-white text-right"
                    />
                  </div>

                  {/* Total */}
                  <div className="w-full md:w-28 text-right self-end md:self-center">
                    <span className="block text-[10px] text-slate-400 mb-1">Tutar</span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>

                  {/* Delete */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition self-end md:self-center"
                      title="Kalemi Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Cari Integration Terms */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Finansal Ödeme Şartı & Cari Borçlandırma</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Ödeme Tipi</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('vadeli')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      paymentStatus === 'vadeli'
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-semibold'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Vadeli (Cari Borç)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('odendi')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      paymentStatus === 'odendi'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Peşin Ödendi
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('kismi')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      paymentStatus === 'kismi'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    Kısmi Ödeme
                  </button>
                </div>
              </div>

              {paymentStatus !== 'vadeli' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">Ödeme Yapılan Hesap</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentStatus === 'kismi' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">Peşin Ödenen Tutar (₺)</label>
                  <input
                    type="number"
                    max={grandTotal}
                    min="0"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Vade / Ödeme Tarihi (Opsiyonel)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">Açıklama / Not</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn: 1. Parti sevkiyat, fabrika teslim."
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Integration Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Otomatik Çift Yönlü Entegrasyon Özeti</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Bu alım kaydedildiğinde, <strong className="text-amber-400">{selectedSupplier?.name || 'Tedarikçi'}</strong> cari borç bakiyesi{' '}
                <strong className="text-rose-400">
                  {formatCurrency(paymentStatus === 'odendi' ? 0 : paymentStatus === 'kismi' ? grandTotal - paidAmount : grandTotal)}
                </strong>{' '}
                artacak ve seçilen {items.length} ürünün stok adedi ile ağırlıklı maliyeti anında yenilenecektir.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Toplam Fatura Tutarı</span>
              <span className="text-xl font-bold text-amber-400">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={grandTotal <= 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Mal Alımını Kaydet & Cari Borca İşle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
