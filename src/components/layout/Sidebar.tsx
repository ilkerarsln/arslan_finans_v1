import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useKarTakip } from '../../context/KarTakipContext';
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
  Shield,
  UserCheck,
  TrendingUp,
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
    user,
    userProfile,
  } = useFinance();

  const { alerts, sales } = useKarTakip();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string; highlight?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Özet Panel',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'transactions',
      label: 'Gelir / Gider',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: transactions.length,
    },
    {
      id: 'kartakip',
      label: 'Kâr & Satış Portalı',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      badge: alerts.length > 0 ? `${alerts.length} uyarı` : sales.length,
      highlight: true,
    },
    {
      id: 'accounts',
      label: 'Bankalar & Kartlar',
      icon: <Building2 className="w-4 h-4" />,
      badge: accounts.length,
    },
    {
      id: 'currents',
      label: 'Cari Hesaplar',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'upcoming',
      label: 'Vade Takvimi',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: upcomingDues.filter(d => !d.isCompleted).length || undefined,
    },
    {
      id: 'reports',
      label: 'Raporlar & Yedek',
      icon: <FileBarChart2 className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: 'users' as ActiveTab,
            label: 'Kullanıcılar & Roller',
            icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
            badge: allUsers.length > 0 ? allUsers.length : undefined,
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
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
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
                Arslan Finans
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                Nakit & Kâr Sistemi
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

        <div className="mx-4 my-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Likit Varlık
            </span>
            <span className="text-[9px] text-slate-500 font-medium">Bu Ay</span>
          </div>
          <div
            className={`text-base font-bold font-mono-num mt-0.5 ${
              currentMonthNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {currentMonthNet > 0 ? '+' : ''}{formatCurrency(currentMonthNet)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between pt-1.5 border-t border-slate-800/60">
            <span>Toplam Kasa/Banka:</span>
            <span className="font-mono-num text-slate-300">{formatCurrency(totalBalance)}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : item.highlight
                    ? 'text-emerald-300 hover:text-white hover:bg-slate-900 border border-emerald-500/20 bg-emerald-950/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-emerald-400 transition-colors'
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? 'bg-emerald-700/80 text-white'
                        : String(item.badge).includes('uyarı')
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col gap-2">
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
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-400">Arslan Finans</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              Bulut Aktif
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
