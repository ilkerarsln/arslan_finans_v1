import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatPercent } from '../../utils/formatters';
import {
  SlidersHorizontal,
  Tags,
  Building2,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';

export const TanimlamalarView: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    brands,
    addBrand,
    deleteBrand,
    suppliers,
    addSupplier,
    interestRates,
    updateMonthlyRate,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'vade_farki' | 'kategoriler' | 'markalar' | 'tedarikciler'>('vade_farki');

  // Vade Farkı Form
  const [selectedMonthCode, setSelectedMonthCode] = useState('2026-10');
  const [inputRate, setInputRate] = useState<number>(2.8);

  // Kategori Form
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatsInput, setNewSubCatsInput] = useState('');

  // Editing Category
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editSubCatsInput, setEditSubCatsInput] = useState('');

  // Marka Form
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('Türkiye');

  // Tedarikçi Hızlı Ekle
  const [quickSupName, setQuickSupName] = useState('');
  const [quickSupPerson, setQuickSupPerson] = useState('');
  const [quickSupPhone, setQuickSupPhone] = useState('');
  const [quickSupCat, setQuickSupCat] = useState('Ahşap & İskelet');

  const handleSaveInterestRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRate <= 0) return;
    updateMonthlyRate(selectedMonthCode, inputRate);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const subs = newSubCatsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    addCategory(newCatName.trim(), subs);
    setNewCatName('');
    setNewSubCatsInput('');
  };

  const handleStartEditCat = (cat: any) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditSubCatsInput(cat.subCategories.join(', '));
  };

  const handleSaveEditCat = () => {
    if (!editingCatId || !editCatName.trim()) return;
    const subs = editSubCatsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    updateCategory(editingCatId, editCatName.trim(), subs);
    setEditingCatId(null);
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    addBrand(newBrandName.trim(), newBrandCountry);
    setNewBrandName('');
  };

  const handleAddQuickSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSupName.trim()) return;
    addSupplier({
      code: `TED-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: quickSupName.trim(),
      contactPerson: quickSupPerson.trim() || 'Firma Yetkilisi',
      phone: quickSupPhone.trim() || '-',
      email: '',
      city: 'Türkiye',
      category: quickSupCat,
      type: 'tedarikci',
    });
    setQuickSupName('');
    setQuickSupPerson('');
    setQuickSupPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Merkezi Parametre & Kural Yönetimi</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sistem Tanımlamaları</h2>
          <p className="text-xs text-slate-400">
            Ürün kategorileri, alt kategoriler, markalar, tedarikçiler ve senetli satış aylık vade farkı oranları.
          </p>
        </div>
      </div>

      {/* Subtab Navigation Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveSubTab('vade_farki')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'vade_farki'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Aylık Vade Farkı Oranları</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kategoriler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'kategoriler'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kategoriler & Alt Kategoriler ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('markalar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'markalar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Markalar ({brands.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tedarikciler')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'tedarikciler'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tedarikçiler ({suppliers.length})</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: AYLIK VADE FARKI ORANLARI
           ========================================================================= */}
        {activeSubTab === 'vade_farki' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              <strong>Kâr Takip Entegrasyonu:</strong> Senetli satış yapıldığında, satışın yapıldığı ay için burada belirlenen aylık vade farkı oranı baz alınır ve seçilen taksit sayısı kadar ürün maliyetine vade farkı maliyeti olarak eklenir.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to update/add month rate */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Dönem Vade Farkı Belirle</span>
                </h4>

                <form onSubmit={handleSaveInterestRate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Dönem Seçimi</label>
                    <input
                      type="month"
                      value={selectedMonthCode}
                      onChange={(e) => setSelectedMonthCode(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Aylık Vade Farkı Oranı (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={inputRate}
                      onChange={(e) => setInputRate(Number(e.target.value))}
                      required
                      placeholder="Örn: 2.8"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white text-base font-bold text-amber-400"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Örn: %2.8 oranı, 12 ay senette toplam %33.6 maliyet farkı oluşturur.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Vade Farkı Oranını Kaydet
                  </button>
                </form>
              </div>

              {/* Table of Monthly Interest Rates */}
              <div className="lg:col-span-2 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Dönem / Ay</th>
                      <th className="py-3 px-4">Kod</th>
                      <th className="py-3 px-4 text-right">Aylık Oran (%)</th>
                      <th className="py-3 px-4 text-right">12 Ay Yıllık Bileşik/Toplam (%)</th>
                      <th className="py-3 px-4 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {interestRates.map((ir) => (
                      <tr key={ir.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-white">{ir.monthName}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{ir.monthCode}</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-400 text-sm">
                          %{ir.rate.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          %{(ir.rate * 12).toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {ir.monthCode === '2026-10' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Güncel Ay
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Kayıtlı</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: KATEGORİLER & ALT KATEGORİLER
           ========================================================================= */}
        {activeSubTab === 'kategoriler' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add Category Form */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Yeni Ürün Kategorisi Tanımla</span>
                </h4>

                <form onSubmit={handleAddCategory} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Ana Kategori Adı *</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Örn: Bahçe & Balkon Mobilyası"
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Alt Kategoriler (Virgülle ayırınız)</label>
                    <textarea
                      rows={3}
                      value={newSubCatsInput}
                      onChange={(e) => setNewSubCatsInput(e.target.value)}
                      placeholder="Örn: Rattan Koltuk, Balkon Masası, Salıncak"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Kategoriyi Ekle
                  </button>
                </form>
              </div>

              {/* Categories & Subcategories List */}
              <div className="lg:col-span-2 space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    {editingCatId === cat.id ? (
                      <div className="space-y-3 text-xs">
                        <input
                          type="text"
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                        />
                        <textarea
                          rows={2}
                          value={editSubCatsInput}
                          onChange={(e) => setEditSubCatsInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditCat}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-white text-sm">{cat.name}</h5>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {cat.subCategories.length} Alt Kategori
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {cat.subCategories.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px]"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditCat(cat)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: MARKALAR
           ========================================================================= */}
        {activeSubTab === 'markalar' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Yeni Marka Ekle</span>
                </h4>

                <form onSubmit={handleAddBrand} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Marka Adı *</label>
                    <input
                      type="text"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Örn: Kelebek Mobilya"
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Menşei Ülke</label>
                    <input
                      type="text"
                      value={newBrandCountry}
                      onChange={(e) => setNewBrandCountry(e.target.value)}
                      placeholder="Türkiye"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Markayı Kaydet
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brands.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-white text-sm">{b.name}</h5>
                      <span className="text-[11px] text-slate-400">{b.country || 'Türkiye'}</span>
                    </div>
                    <button
                      onClick={() => deleteBrand(b.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: TEDARİKÇİLER (HIZLI YÖNETİM)
           ========================================================================= */}
        {activeSubTab === 'tedarikciler' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Hızlı Tedarikçi Ekle</span>
                </h4>

                <form onSubmit={handleAddQuickSupplier} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Tedarikçi Ünvanı *</label>
                    <input
                      type="text"
                      value={quickSupName}
                      onChange={(e) => setQuickSupName(e.target.value)}
                      placeholder="Örn: Kayseri Yay Sanayi"
                      required
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Yetkili Kişi</label>
                    <input
                      type="text"
                      value={quickSupPerson}
                      onChange={(e) => setQuickSupPerson(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={quickSupPhone}
                      onChange={(e) => setQuickSupPhone(e.target.value)}
                      placeholder="0 (352) 000 00 00"
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Sektör</label>
                    <select
                      value={quickSupCat}
                      onChange={(e) => setQuickSupCat(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Ahşap & İskelet">Ahşap & İskelet</option>
                      <option value="Sünger & Yatak">Sünger & Yatak</option>
                      <option value="Kumaş & Deri">Kumaş & Deri</option>
                      <option value="Panel & MDF & Kaplama">Panel & MDF & Kaplama</option>
                      <option value="Metal & Aksesuar">Metal & Aksesuar</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Tedarikçiyi Kaydet
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{s.name}</span>
                        <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {s.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.contactPerson} | {s.phone} | {s.category}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                      Borç: ₺{s.currentBalance.toLocaleString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
