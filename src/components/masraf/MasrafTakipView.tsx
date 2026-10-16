import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Expense } from '../../types';
import { Receipt, Plus, Trash2, Search, Filter, Tag, Calendar, Building2 } from 'lucide-react';

export const MasrafTakipView: React.FC = () => {
  const { expenses, addExpense, deleteExpense, accounts } = useApp();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('Tümü');

  const monthsList = [
    { code: 'Tümü', name: 'Tüm Aylar' },
    { code: '01', name: 'Ocak' },
    { code: '02', name: 'Şubat' },
    { code: '03', name: 'Mart' },
    { code: '04', name: 'Nisan' },
    { code: '05', name: 'Mayıs' },
    { code: '06', name: 'Haziran' },
    { code: '07', name: 'Temmuz' },
    { code: '08', name: 'Ağustos' },
    { code: '09', name: 'Eylül' },
    { code: '10', name: 'Ekim' },
    { code: '11', name: 'Kasım' },
    { code: '12', name: 'Aralık' },
  ];
  const yearsList = ['Tümü', '2026', '2025', '2024'];

  // Form states
  const [category, setCategory] = useState<Expense['category']>('Kira');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [paidTo, setPaidTo] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories: Expense['category'][] = [
    'Kira',
    'Personel Maaş',
    'Elektrik & Su',
    'Nakliye & Lojistik',
    'Pazarlama & Reklam',
    'Vergi & SGK',
    'Montaj & Bakım',
    'Diğer',
  ];

  // Date Filtered Expenses (Requirement 3)
  const dateFilteredExpenses = expenses.filter((e) => {
    const matchYear = selectedYear === 'Tümü' || e.date.startsWith(selectedYear);
    const matchMonth = selectedMonth === 'Tümü' || e.date.slice(5, 7) === selectedMonth;
    return matchYear && matchMonth;
  });

  const totalExpenses = dateFilteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Top expense category in this period
  const categoryTotals = categories.map((cat) => {
    const sum = dateFilteredExpenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return { category: cat, total: sum };
  }).sort((a, b) => b.total - a.total);

  const topExpenseCategory = categoryTotals[0]?.total > 0 ? categoryTotals[0] : null;

  const filteredExpenses = dateFilteredExpenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.receiptNumber && e.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'Tümü' || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const acc = accounts.find((a) => a.id === accountId);

    addExpense({
      date,
      category,
      description,
      amount,
      accountId,
      accountName: acc?.name || 'Kasa',
      paidTo: paidTo || undefined,
      receiptNumber: receiptNumber || undefined,
    });

    setIsAddOpen(false);
    setDescription('');
    setAmount(0);
    setPaidTo('');
    setReceiptNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gider & Masraf Takibi</h2>
          <p className="text-xs text-slate-400">
            Kira, personel maaşları, nakliye/lojistik ve mağaza işletme giderleri dökümü.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.3]" />
          <span>+ Yeni Masraf / Gider Kaydı</span>
        </button>
      </div>

      {/* KPI Cards Grid with Date Period Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Seçili Dönem Toplam Masrafı</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{formatCurrency(totalExpenses)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {selectedMonth !== 'Tümü' ? monthsList.find((m) => m.code === selectedMonth)?.name : 'Tüm Aylar'} {selectedYear !== 'Tümü' ? selectedYear : 'Tüm Yıllar'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">En Yüksek Masraf Kalemi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-400 truncate">
            {topExpenseCategory ? topExpenseCategory.category : '-'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {topExpenseCategory ? formatCurrency(topExpenseCategory.total) : '0 ₺'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Kayıtlı Gider Adedi</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{dateFilteredExpenses.length} Adet</div>
          <p className="text-[11px] text-slate-500 mt-1">Sistem genelinde {expenses.length} adet</p>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        {/* Date Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Year & Month Selection (Requirement 3) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-750">
              <Calendar className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs text-white px-1.5 py-1 focus:outline-none cursor-pointer"
                title="Yıl Seçimi"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y === 'Tümü' ? 'Tüm Yıllar' : y}
                  </option>
                ))}
              </select>

              <span className="text-slate-600">/</span>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-white px-1.5 py-1 focus:outline-none cursor-pointer"
                title="Ay Seçimi"
              >
                {monthsList.map((m) => (
                  <option key={m.code} value={m.code} className="bg-slate-900 text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Gider açıklaması veya alıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => setSelectedCategory('Tümü')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'Tümü'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Tüm Kategoriler
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === c
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-800/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Açıklama</th>
                <th className="py-3 px-4">Ödenen Kişi / Kurum</th>
                <th className="py-3 px-4">Ödeme Yapılan Hesap</th>
                <th className="py-3 px-4">Makbuz / Fatura No</th>
                <th className="py-3 px-4 text-right">Tutar (₺)</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-300 font-medium">{formatDate(exp.date)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-medium">{exp.description}</td>
                  <td className="py-3 px-4 text-slate-300">{exp.paidTo || '-'}</td>
                  <td className="py-3 px-4 text-slate-400">{exp.accountName}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {exp.receiptNumber || '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-400">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      title="Gideri Sil"
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

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white">Yeni Gider / Masraf Ekle</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Masraf Kategorisi *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Açıklama *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Showroom Ekim Ayı Kirası"
                  required
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Ödeme Yapılacak Kasa / Banka *</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Ödenen Kişi / Kurum</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Örn: Mülk Sahibi"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Makbuz / Fatura No</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Örn: MK-9912"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white"
                  />
                </div>
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
                  Gideri Kaydet & Kasadan Düş
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
