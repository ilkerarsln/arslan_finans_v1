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
  CreditCard,
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
  FileSpreadsheet,
  Upload,
  Search,
  Table,
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
    userRole,
    allUsers,
    deletionRequests,
    user,
    userProfile,
    stockItems,
    sales,
    isCloudSyncing,
    setIsCiroImportModalOpen,
  } = useFinance();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'ciro-matrix',
      label: 'Ciro & Finansal Matris',
      icon: <Table className="w-4 h-4 text-emerald-400" />,
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
      badge: sales.length > 0 ? sales.length : undefined,
    },
    {
      id: 'stock',
      label: 'Mal Alım & Stok',
      icon: <Boxes className="w-4 h-4 text-sky-400" />,
      badge: stockItems.length > 0 ? stockItems.length : undefined,
    },
    {
      id: 'transactions',
      label: 'Gelir / Gider (Kasa)',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: transactions.length,
    },
    {
      id: 'accounts',
      label: 'Bankalar & Kasalar',
      icon: <Building2 className="w-4 h-4" />,
      badge: accounts.length,
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
      badge: upcomingDues.filter(d => !d.isCompleted).length || undefined,
    },
    ...(isAdmin
      ? [
          {
            id: 'audit' as ActiveTab,
            label: 'Denetim & Onaylar',
            icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
            badge:
              deletionRequests.filter(r => r.status === 'pending').length > 0
                ? `${deletionRequests.filter(r => r.status === 'pending').length} Onay`
                : undefined,
          },
          {
            id: 'users' as ActiveTab,
            label: 'Personel & Roller',
            icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
            badge: allUsers.length > 0 ? allUsers.length : undefined,
          },
        ]
      : []),
  ];

  // Quick total balance & current month net calculation for sidebar
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
            onClick={() => handleSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
            title="Ana Özet Panele Dön"
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

        {/* Hızlı Komut Paleti */}
        <div className="mx-3.5 mt-2.5 mb-1.5">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Hızlı Komut Paleti</span>
            </div>
            <kbd className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Quick Balance Mini-Card: Net Likit Varlık */}
        <div className="mx-3.5 mb-2.5 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-emerald-400 transition-colors'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium shrink-0 ${
                      isActive
                        ? 'bg-emerald-700/80 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* VERİ & CİRO SİHİRBAZI */}
          <div className="pt-3 pb-1 border-t border-slate-900 mt-2">
            <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              VERİ & CİRO SİHİRBAZI
            </div>
            <button
              onClick={() => {
                setIsCiroImportModalOpen(true);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-900/40 transition group"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Ciro Excel İçe Aktar</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col gap-2">
          {/* OFİS - MOBİL Bulut Entegrasyon / Senkronizasyon Göstergesi (Kullanıcı profilinin hemen üstünde) */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-2.5 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
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
              <span className="text-emerald-400 font-bold">⇄</span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>Cep Telefonu</span>
              </span>
            </div>

            <div className="text-[9px] text-slate-400 mt-1.5 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Bulut Entegrasyonu:</span>
              <span className="text-emerald-300 font-medium font-mono">Aktif • 7/24</span>
            </div>
          </div>

          {/* Kullanıcı Profili Kutusu */}
          {user && (
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="font-semibold text-slate-200 block text-[11px] truncate">
                  {userProfile?.displayName || user.displayName || userProfile?.username || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {userProfile?.username ? `Personel: @${userProfile.username}` : user.email}
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

          <div className="flex items-center justify-between text-[10px] px-1 text-slate-500">
            <span>Kartakip Sürüm 2.4</span>
            <span className="font-mono text-emerald-400 font-semibold">Arslan ERP</span>
          </div>
        </div>
      </aside>
    </>
  );
};
