import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { GitCompare, Plus, Trash2, Search, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export const UrunEslestirmeView: React.FC = () => {
  const { matchRules, addMatchRule, deleteMatchRule, suppliers, products } = useApp();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [saleProductName, setSaleProductName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');

  const filteredRules = matchRules.filter(
    (r) =>
      r.saleProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleProductName.trim()) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    addMatchRule({
      saleProductName: saleProductName.trim(),
      supplierId: prod.supplierId,
      supplierName: prod.supplierName,
      productId: prod.id,
      productSku: prod.sku,
      productName: prod.name,
      estimatedCost: prod.costPrice,
    });

    setIsAddOpen(false);
    setSaleProductName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1.5">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Otomatik Maliyet Eşleme Motoru</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ürün Eşleştirme Mekanizması</h2>
          <p className="text-xs text-slate-400">
            Satış fişlerindeki veya sipariş listelerindeki farklı yazılmış ürün adlarını, ortak tedarikçi kataloğundaki asıl ürün SKU'larına otomatik bağlar.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.3]" />
          <span>+ Yeni Eşleştirme Kuralı</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong>Nasıl Çalışır?</strong> Örneğin bir perakende müşterisine satış fişinde &quot;Milano Chester&quot; yazıldığında, sistem bu kural sayesinde arka planda <em>İnegöl Ahşap</em> firmasına ait <code>KLT-001</code> kodlu ürünün birim maliyetini çeker ve kârınızı anında hesaplar.
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Aktif Eşleştirme Kuralları ({matchRules.length})
          </h3>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Kural veya ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Satışta Geçen İsim (Giriş Metni)</th>
                <th className="py-3 px-4 text-center">Eşleşme</th>
                <th className="py-3 px-4">Eşleşen Katalog Ürünü (Stok)</th>
                <th className="py-3 px-4">Ortak Tedarikçi</th>
                <th className="py-3 px-4">SKU / Kod</th>
                <th className="py-3 px-4 text-right">Mevcut Birim Maliyet</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-semibold text-amber-300">
                    &quot;{rule.saleProductName}&quot;
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500">
                    <ArrowRight className="w-4 h-4 mx-auto" />
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{rule.productName}</td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rule.supplierName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-amber-400 font-semibold">{rule.productSku}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-200">
                    {formatCurrency(rule.estimatedCost)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteMatchRule(rule.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      title="Kuralı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white">Yeni Ürün Eşleştirme Kuralı</h3>
            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Satışta Girilen Ürün Adı / Varyant *</label>
                <input
                  type="text"
                  value={saleProductName}
                  onChange={(e) => setSaleProductName(e.target.value)}
                  placeholder="Örn: Pera Nubuk Koltuk"
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Eşleştirilecek Stok Ürünü & Tedarikçi *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - {p.supplierName} - Maliyet: {formatCurrency(p.costPrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Kuralı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
