import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ActiveTab } from '../../types/finance';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Building2,
  Users,
  CalendarDays,
  FileBarChart2,
  Wallet,
  X,
  ShieldCheck,
  ShieldAlert,
  Shield,
  UserCheck,
  TrendingUp,
  Boxes,
  SlidersHorizontal,
  Smartphone,
  Monitor,
  RefreshCw,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    transactions,
    upcomingDues,
    accounts,
    isAdmin,
    allUsers,
    deletionRequests,
    user,
    userProfile,
    stockItems,
    sales,
    categoryHierarchy,
    isCloudSyncing,
    openCommandPalette,
    openDataImporter,
  } = useFinance();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'reports',
      label: 'Ciro & Finansal Matris',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'dashboard',
      label: 'Genel Bakış',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'profit',
      label: 'Kâr Takip (Satışlar)',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'stock',
      label: 'Mal Alım & Stok',
      icon: <Boxes className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'transactions',
      label: 'Gelir / Gider (Kasa)',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      id: 'accounts',
      label: 'Bankalar & Kasalar',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'currents',
      label: 'Cari Hesaplar',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'definitions',
      label: 'Tanımlamalar',
      icon: <SlidersHorizontal className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'upcoming',
      label: 'Vade Takvimi',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: 'audit' as ActiveTab,
            label: 'Denetim & Onaylar',
            icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
          },
          {
            id: 'users' as ActiveTab,
            label: 'Personel & Roller',
            icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
          },
        ]
      : []),
  ];

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthNet = transactions
    .filter(t => t.date.startsWith(currentMonthKey) && t.status !== 'İptal')
    .reduce((sum, t) => {
      if (t.type === 'Gelir') return sum + t.amount;
      if (t.type === 'Gider') return sum - t.amount;
      return sum;
    }, 0);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          <div
            onClick={() => handleSelectTab('reports')}
            className="flex items-center gap-3 cursor-pointer group"
            title="Ciro ve Finansal Analiz Matrisine Git"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block group-hover:text-emerald-400 transition-colors">
                Arslan Mobilya
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                ERP & Finans Yönetimi
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search in Sidebar */}
        <div className="px-3 pt-3">
          <button
            onClick={openCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              <span>Hızlı Komut Paleti</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded font-mono">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Net Likit Mini-Card */}
        <div className="mx-3.5 my-2.5 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Likit Varlık
            </span>
            <span className="text-[9px] text-slate-500 font-medium">Bu Ay</span>
          </div>
          <div
            className={`text-sm font-bold font-mono-num mt-0.5 ${
              currentMonthNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {currentMonthNet > 0 ? '+' : ''}{formatCurrency(currentMonthNet)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between pt-1 border-t border-slate-800/60">
            <span>Kasa & Bankalar:</span>
            <span className="font-mono-num text-slate-300">{formatCurrency(totalBalance)}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <span
                  className={
                    isActive
                      ? 'text-emerald-400 shrink-0'
                      : 'text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0'
                  }
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Ciro Excel İçe Aktar Butonu */}
          <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3">
              Veri & Ciro Sihirbazı
            </span>
            <button
              onClick={() => {
                openDataImporter('ciro');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/20 transition group"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">Ciro Excel İçe Aktar</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col gap-2">
          {/* OFİS - MOBİL Entegrasyon */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-2.5 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-white text-[11px] tracking-wider">
                  OFİS - MOBİL
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                {isCloudSyncing && <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-400" />}
                <span>SENKRON</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <Monitor className="w-3 h-3 text-emerald-400" />
                <span>Ofis PC</span>
              </span>
              <span className="text-emerald-400 font-bold">⇌</span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>Cep Telefonu</span>
              </span>
            </div>
          </div>

          {/* Kullanıcı Profili */}
          {user && (
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="font-semibold text-slate-200 block text-[11px] truncate">
                  {userProfile?.displayName || user.displayName || userProfile?.username || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {userProfile?.username ? `@${userProfile.username}` : user.email}
                </span>
              </div>
              {isAdmin ? (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-amber-400" /> Admin
                </span>
              ) : (
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-full">
                  <UserCheck className="w-3 h-3 text-blue-400" /> Normal
                </span>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
