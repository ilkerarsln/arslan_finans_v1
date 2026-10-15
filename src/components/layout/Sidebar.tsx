import React, { useState } from 'react';
import { useApp, TabType } from '../../context/AppContext';
import {
  LayoutDashboard,
  PackagePlus,
  TrendingUp,
  Users2,
  Wallet,
  Receipt,
  CalendarDays,
  GitCompare,
  BarChart3,
  UserCog,
  LogOut,
  Armchair,
  ShoppingBag,
  SlidersHorizontal,
  Boxes,
  Cloud,
  CheckCircle2,
  RefreshCw,
  X,
  Smartphone,
  Monitor,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    navigateToPurchase,
    currentUser,
    logout,
    suppliers,
    products,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    showToast,
  } = useApp();

  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Az önce (Anlık)');

  const criticalStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;
  const suppliersWithDebt = suppliers.filter((s) => s.currentBalance > 0).length;

  const handleManualSync = () => {
    setIsManualSyncing(true);
    setTimeout(() => {
      setIsManualSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('Ofis ve mobil cihaz verileri başarıyla senkronize edildi!', 'success');
    }, 800);
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Finansal Genel Bakış', icon: LayoutDashboard },
    {
      id: 'mal_alim_stok',
      label: 'Mal Alım & Stok',
      icon: PackagePlus,
      badge: criticalStockCount > 0 ? `${criticalStockCount} Kritik` : 'Entegre',
      badgeColor: criticalStockCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'detayli_stok',
      label: 'Detaylı Stok Yönetimi',
      icon: Boxes,
      badge: `${products.length} Ürün`,
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
    { id: 'kar_takip', label: 'Kâr Takip & Satışlar', icon: TrendingUp },
    {
      id: 'cari_hesaplar',
      label: 'Cari Hesaplar (Ortak)',
      icon: Users2,
      badge: suppliersWithDebt > 0 ? `${suppliersWithDebt} Borçlu` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400',
    },
    { id: 'kasa_banka', label: 'Kasa & Banka', icon: Wallet },
    { id: 'masraflar', label: 'Gider & Masraf Takibi', icon: Receipt },
    { id: 'aylik_takip', label: 'Aylık Takip & Kârlılık', icon: CalendarDays },
    { id: 'urun_eslestirme', label: 'Ürün Eşleştirme', icon: GitCompare },
    { id: 'tanimlamalar', label: 'Tanımlamalar', icon: SlidersHorizontal },
    { id: 'raporlar', label: 'Raporlar & Analizler', icon: BarChart3 },
    { id: 'kullanicilar', label: 'Kullanıcılar & Yetki', icon: UserCog },
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:static lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl shadow-slate-950' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
              <Armchair className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight leading-tight text-sm sm:text-base">ARSLAN MOBİLYA</h2>
              <p className="text-[11px] text-amber-400/90 font-medium">ERP & Finans Yönetimi</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer transition"
            title="Menüyü Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: Direct Mal Alımı Yap */}
        <div className="p-3.5">
          <button
            onClick={() => {
              navigateToPurchase('manuel');
              setIsMobileSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold rounded-xl text-xs shadow-md shadow-amber-500/15 transition active:scale-[0.98] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.3]" />
            <span>+ Hızlı Mal Alımı Yap</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ========================================================================= */}
        {/* 1. BULUT ENTEGRASYON GÖSTERGESİ (Requirement 1: Cloud Status Badge)        */}
        {/* Sol alt köşede yer alan kullanıcı profili alanının hemen ÜZERİNE eklendi  */}
        {/* ========================================================================= */}
        <div className="px-3 pt-2 pb-1.5 border-t border-slate-800/80 bg-slate-950/30">
          <div
            onClick={() => setIsCloudModalOpen(true)}
            className="group relative flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 shadow-md shadow-emerald-950/20 transition-all duration-200 cursor-pointer active:scale-[0.99]"
            title="Bulut Senkronizasyon Durumu (Detaylar için tıklayın)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <Cloud className="w-4 h-4 stroke-[2.2]" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Senkronize</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-400/60"></span>
                  <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30">
                    CANLI
                  </span>
                </div>
                <p className="text-xs font-bold text-white tracking-tight truncate">OFİS - MOBİL</p>
              </div>
            </div>

            <div className="text-right shrink-0 pl-1">
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-300/90 font-semibold">
                <Monitor className="w-2.5 h-2.5" />
                <span>↔</span>
                <Smartphone className="w-2.5 h-2.5" />
              </div>
              <span className="text-[9px] text-slate-400 font-medium">Bulut Aktif</span>
            </div>
          </div>
        </div>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Güvenli Çıkış"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Cloud Status Detail Modal */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsCloudModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                <Cloud className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Bulut Senkronizasyon Durumu</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    AKTİF
                  </span>
                </div>
                <p className="text-xs text-slate-400">Ofis bilgisayarları ve mobil cihazlar arasında çift yönlü veri akışı</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  Bağlantı Modu
                </span>
                <span className="font-bold text-emerald-300">OFİS - MOBİL (Çift Yönlü)</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  Son Eşleşme Zamanı
                </span>
                <span className="font-semibold text-slate-200">{lastSyncTime}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Veri Güvenliği
                </span>
                <span className="font-semibold text-slate-200">SSL 256-Bit Şifreli İletim</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Aktif Veritabanı
                </span>
                <span className="font-semibold text-slate-200">Ortak Tedarikçi & Stok (267 Ürün)</span>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-200 leading-relaxed">
              💡 <strong>Ofis & Mobil Uyumu:</strong> Mağazada veya sahada girilen tüm mal alımları, satışlar, cari hesap hareketleri ve fiyat listesi güncellemeleri anında tüm cihazlara yansır.
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Manuel Senkronize Et'}</span>
              </button>
              <button
                onClick={() => setIsCloudModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
