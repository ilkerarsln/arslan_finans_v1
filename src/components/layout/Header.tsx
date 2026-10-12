import React, { useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Menu, Plus, Bell, Cloud, RefreshCw, LogOut, Smartphone } from 'lucide-react';
import { ActiveTab } from '../../types/finance';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Genel Finansal Özet',
    subtitle: 'Nakit akışı ve anlık şirket mali durumu',
  },
  transactions: {
    title: 'Gelir ve Gider Hareketleri',
    subtitle: 'Kasa ve banka kayıtları, arama ve filtreleme',
  },
  accounts: {
    title: 'Banka Hesapları & Kartlar',
    subtitle: 'Vadesiz ticari hesaplar, limitler ve virman transferleri',
  },
  currents: {
    title: 'Cari Hesap Yönetimi',
    subtitle: 'Müşteri ve tedarikçi borç/alacak takibi ve ekstreler',
  },
  upcoming: {
    title: 'Vade & Ödeme Takvimi',
    subtitle: 'Gelecek ödemeler, vadesi gelen çekler ve tahsilatlar',
  },
  reports: {
    title: 'Mali Raporlar & Yedek',
    subtitle: 'Gelir tablosu, kar-zarar ve veri yedekleme',
  },
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    activeTab,
    openTransactionModal,
    upcomingDues,
    setActiveTab,
    user,
    isCloudSyncing,
    loginWithGoogle,
    logout,
  } = useFinance();

  // Listen to keyboard shortcut "N" to quickly open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openTransactionModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openTransactionModal]);

  const pendingDuesCount = upcomingDues.filter(d => !d.isCompleted).length;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* Left: Mobile hamburger & Dynamic Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {TAB_TITLES[activeTab].title}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {TAB_TITLES[activeTab].subtitle}
          </p>
        </div>
      </div>

      {/* Right: Cloud Sync, Currency Rates & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Cloud Sync Status / Button */}
        {user ? (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hidden sm:inline" />
              <span className="font-semibold hidden sm:inline">Ofis & Telefon Eşit</span>
              {isCloudSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />}
            </div>

            <div className="h-3 w-px bg-emerald-200 dark:bg-emerald-800 hidden sm:block" />

            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 max-w-[120px] truncate hidden md:inline">
              {user.displayName || user.email}
            </span>

            <button
              onClick={logout}
              title="Oturumu Kapat"
              className="text-emerald-700 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 p-0.5 rounded transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs hover:shadow active:scale-95"
            title="Google hesabınızla giriş yaparak verilerinizi ofis PC ve telefonunuz arasında anlık senkronize edin"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold whitespace-nowrap">Google ile Giriş Yap</span>
          </button>
        )}

        {/* Currency Rates Ticker */}
        <div className="hidden xl:flex items-center gap-2.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] font-mono-num font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">USD:</span>
            <span>₺34,25</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">EUR:</span>
            <span>₺37,42</span>
          </div>
        </div>

        {/* Notifications / Pending Alert button */}
        <button
          onClick={() => setActiveTab('upcoming')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={`${pendingDuesCount} bekleyen ödeme veya tahsilat`}
        >
          <Bell className="w-4 h-4" />
          {pendingDuesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* Primary Action Button: Yeni İşlem Ekle */}
        <button
          onClick={() => openTransactionModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İşlem Ekle</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-700/60 rounded font-mono text-emerald-200">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
};

