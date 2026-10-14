import React from 'react';
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
} from 'lucide-react';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, navigateToPurchase, currentUser, logout, suppliers, products } = useApp();

  const criticalStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;
  const suppliersWithDebt = suppliers.filter((s) => s.currentBalance > 0).length;

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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Armchair className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-tight leading-tight">ARSLAN MOBİLYA</h2>
            <p className="text-[11px] text-amber-400/90 font-medium">ERP & Finans Yönetimi</p>
          </div>
        </div>
      </div>

      {/* Primary Action Button: Direct Mal Alımı Yap */}
      <div className="p-3.5">
        <button
          onClick={() => navigateToPurchase('manuel')}
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
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
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

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
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
  );
};
