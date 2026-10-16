import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginScreen } from './components/auth/LoginScreen';
import { ReportsTab } from './components/tabs/ReportsTab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { ProductEditModal } from './components/modals/ProductEditModal';
import { CurrencyConverterModal } from './components/ui/CurrencyConverterModal';
import { CommandPalette } from './components/ui/CommandPalette';
import { Toast } from './components/ui/Toast';
import { DataImporter } from './components/importer/DataImporter';
import {
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  ArrowLeftRight,
  Building2,
  Users,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatCurrency, formatDate } from './utils/formatters';

const AppContent: React.FC = () => {
  const {
    user,
    isAuthLoading,
    activeTab,
    setActiveTab,
    isDataImporterOpen,
    closeDataImporter,
    dataImporterTemplate,
    isProductEditModalOpen,
    editingProduct,
    closeProductEditModal,
    transactions,
    accounts,
    caris,
    stockItems,
    sales,
    upcomingDues,
    openTransactionModal,
    openDataImporter,
  } = useFinance();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <div className="text-sm font-semibold tracking-wide">
          Arslan Mobilya ERP yükleniyor...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-950">
        {/* Header Bar */}
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        {/* Dynamic Viewport Container (Fluid, Auto-height, No Inner Scrollbar) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'reports' && <ReportsTab />}

          {activeTab === 'dashboard' && <DashboardTab />}

          {activeTab === 'profit' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Kâr Takip &amp; Satışlar
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Satış kayıtları, peşin, vadeli ve senetli kârlılık takibi.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Ciro Matrisine Git
                  </button>
                  <button
                    onClick={() => openTransactionModal({ type: 'Gelir' })}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Satış / Gelir Ekle
                  </button>
                </div>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Kayıtlı Toplam Satış Adedi</div>
                  <div className="text-2xl font-bold text-white mt-1 font-mono">{sales.length}</div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Toplam Satış Tutarı</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                    {formatCurrency(sales.reduce((sum, s) => sum + (s.totalSaleAmount || s.totalAmount || 0), 0))}
                  </div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Tahmini Toplam Kâr</div>
                  <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
                    {formatCurrency(sales.reduce((sum, s) => sum + (s.netProfit || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 font-semibold text-sm text-slate-200">
                  Son Satış Kayıtları
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Tarih</th>
                        <th className="py-3 px-4">Müşteri / Cari</th>
                        <th className="py-3 px-4">Ürün / Açıklama</th>
                        <th className="py-3 px-4 text-right">Satış Tutarı</th>
                        <th className="py-3 px-4 text-right">Maliyet</th>
                        <th className="py-3 px-4 text-right">Net Kâr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {sales.slice(0, 15).map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-300">{formatDate(sale.date)}</td>
                          <td className="py-3 px-4 text-white font-sans">{sale.customerName || '-'}</td>
                          <td className="py-3 px-4 text-slate-300 font-sans">{sale.productName || sale.category || '-'}</td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatCurrency(sale.totalSaleAmount || sale.totalAmount || 0)}</td>
                          <td className="py-3 px-4 text-right text-rose-400">{formatCurrency(sale.totalCost || 0)}</td>
                          <td className="py-3 px-4 text-right text-indigo-300 font-bold">{formatCurrency(sale.netProfit || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-sky-400" />
                    Mal Alım &amp; Stok Yönetimi
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    3 seviyeli kategori hiyerarşisi, stok kartları ve Excel alım entegrasyonu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDataImporter('stok')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel'den Mal Alımı İçe Aktar
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Ciro Matrisi
                  </button>
                </div>
              </div>

              {/* Stock Items Table */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 font-semibold text-sm text-slate-200 flex justify-between items-center">
                  <span>Stok Envanteri ({stockItems.length} Kalem)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Stok Kodu</th>
                        <th className="py-3 px-4">Ürün Adı</th>
                        <th className="py-3 px-4">Ana Kategori</th>
                        <th className="py-3 px-4">Marka</th>
                        <th className="py-3 px-4 text-center">Miktar</th>
                        <th className="py-3 px-4 text-right">Alış Fiyatı</th>
                        <th className="py-3 px-4 text-right">Satış Fiyatı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {stockItems.slice(0, 20).map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-indigo-400 font-bold">{item.code}</td>
                          <td className="py-3 px-4 text-white font-sans">{item.name}</td>
                          <td className="py-3 px-4 text-slate-300 font-sans">{item.anaKategori || item.category || '-'}</td>
                          <td className="py-3 px-4 text-slate-300 font-sans">{item.brand || '-'}</td>
                          <td className="py-3 px-4 text-center text-slate-100 font-bold">{item.quantity} {item.unit || 'Adet'}</td>
                          <td className="py-3 px-4 text-right text-rose-300">{formatCurrency(item.purchasePrice || 0)}</td>
                          <td className="py-3 px-4 text-right text-emerald-300 font-bold">{formatCurrency(item.salePrice || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                    Kasa &amp; Banka Hareketleri
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gelir, gider ve transfer işlemleri kayıtları.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openTransactionModal({ type: 'Gelir' })}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Gelir Ekle
                  </button>
                  <button
                    onClick={() => openTransactionModal({ type: 'Gider' })}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Gider Ekle
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 font-semibold text-sm text-slate-200">
                  Son İşlemler ({transactions.length} Kayıt)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Tarih</th>
                        <th className="py-3 px-4">Tür</th>
                        <th className="py-3 px-4">Açıklama</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-right">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {transactions.slice(0, 20).map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-300">{formatDate(tx.date)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                                tx.type === 'Gelir'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : tx.type === 'Gider'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-sans">{tx.desc || tx.description || '-'}</td>
                          <td className="py-3 px-4 text-slate-300 font-sans">{tx.category || '-'}</td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              tx.type === 'Gelir' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'Gelir' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    Banka Hesapları &amp; Kasalar
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Kasa, banka ve şirket hesap bakiyeleri.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{acc.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {acc.type}
                      </span>
                    </div>
                    {acc.bankName && <div className="text-xs text-slate-400">{acc.bankName}</div>}
                    <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight pt-2">
                      {formatCurrency(acc.balance, acc.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'currents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Cari Hesaplar
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Müşteri ve tedarikçi bakiyeleri ve hareket geçmişi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {caris.map(c => (
                  <div key={c.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{c.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {c.type}
                      </span>
                    </div>
                    {c.phone && <div className="text-xs text-slate-400 font-mono">{c.phone}</div>}
                    <div className="text-lg font-bold font-mono tracking-tight pt-2">
                      Bakiye:{' '}
                      <span className={c.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCurrency(c.balance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-400" />
                    Vade &amp; Ödeme Takvimi
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gelecek alacaklar, çek ve senet vadeleri.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 font-semibold text-sm text-slate-200">
                  Bekleyen Vadeli Ödemeler ({upcomingDues.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Vade Tarihi</th>
                        <th className="py-3 px-4">Başlık / Cari</th>
                        <th className="py-3 px-4">Tür</th>
                        <th className="py-3 px-4 text-right">Tutar</th>
                        <th className="py-3 px-4 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {upcomingDues.map(due => (
                        <tr key={due.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-300">{formatDate(due.dueDate)}</td>
                          <td className="py-3 px-4 text-white font-sans">{due.title}</td>
                          <td className="py-3 px-4 text-slate-400 font-sans">{due.type}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-100">{formatCurrency(due.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                                due.isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {due.isCompleted ? 'Ödendi' : 'Beklemede'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'definitions' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  Sistem Tanımlamaları &amp; Hiyerarşi
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  3 Seviyeli kategori hiyerarşisi (Ana Kategori &gt; Alt Kategori &gt; Ürün Grubu), markalar ve fiyat listeleri.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  Denetim &amp; Onay Merkezi
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  İşlem silme talepleri ve güvenlik denetim izi.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Personel &amp; Roller (RBAC)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kullanıcı rolleri, yetkilendirmeler ve personel hesapları.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <TransactionModal />
      <InstallmentModal />
      <CurrencyConverterModal />
      <CommandPalette />
      <Toast />

      {/* Data Importer Modal */}
      {isDataImporterOpen && (
        <DataImporter
          onClose={closeDataImporter}
          defaultTemplate={dataImporterTemplate}
        />
      )}

      {/* Product Edit Modal */}
      {isProductEditModalOpen && editingProduct && (
        <ProductEditModal
          isOpen={isProductEditModalOpen}
          onClose={closeProductEditModal}
          product={editingProduct}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
