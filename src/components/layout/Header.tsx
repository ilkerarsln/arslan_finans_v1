import React, { useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useKarTakip } from '../../context/KarTakipContext';
import { Menu, Plus, Bell, RefreshCw, LogOut, Smartphone, Shield, UserCheck, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import { ActiveTab } from '../../types/finance';
import { useLiveCurrency } from '../../services/currencyService';

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
  kartakip: {
    title: 'Kâr & Satış Takip Portalı',
    subtitle: 'Excel satış raporları, toptan maliyet, kâr marjı ve stok analizi',
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
  users: {
    title: 'Kullanıcı ve Rol Yönetimi',
    subtitle: 'Admin ve Normal Kullanıcı yetkilendirme, erişim izinleri',
  },
  audit: {
    title: 'İşlem Denetim Raporu & Onaylar',
    subtitle: 'Kullanıcı işlem kayıtları, denetim izi ve silme onay talepleri',
  },
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    activeTab,
    openTransactionModal,
    upcomingDues,
    setActiveTab,
    user,
    userProfile,
    isAdmin,
    isRoleSimulated,
    toggleRoleSimulation,
    isCloudSyncing,
    loginWithGoogle,
    logout,
  } = useFinance();

  const { alerts } = useKarTakip();
  const { usd, eur, lastUpdated, isRatesLoading, refreshRates } = useLiveCurrency() as any;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          aria-label="Menü"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div
          onClick={() => setActiveTab('dashboard')}
          className="cursor-pointer group"
          title="Ana Özet Panele Dön"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block sm:inline">
              Arslan Finans {activeTab !== 'dashboard' && '•'}
            </span>
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {TAB_TITLES[activeTab]?.title || 'Finansal Yönetim'}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {TAB_TITLES[activeTab]?.subtitle || ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
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

            {isRoleSimulated ? (
              <button
                onClick={toggleRoleSimulation}
                className="flex items-center gap-1 text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded-full transition shadow-xs animate-pulse"
                title="Standart kullanıcı simülasyonunu sonlandır"
              >
                <Eye className="w-3 h-3" /> Test Modu
              </button>
            ) : isAdmin ? (
              <button
                onClick={() => setActiveTab('users')}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full hover:bg-amber-200 transition"
                title="Yetki: Sistem Yöneticisi (Admin)"
              >
                <Shield className="w-3 h-3 text-amber-500" /> Admin
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 px-2 py-0.5 rounded-full"
                title="Yetki: Standart Kullanıcı"
              >
                <UserCheck className="w-3 h-3 text-blue-500" /> Normal
              </span>
            )}

            <div className="h-3 w-px bg-emerald-200 dark:bg-emerald-800 hidden md:block" />
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 max-w-[140px] truncate hidden md:inline">
              {userProfile?.displayName || user.displayName || (userProfile?.username ? `@${userProfile.username}` : user.email)}
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
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs active:scale-95"
          >
            <span className="font-semibold whitespace-nowrap">Google ile Giriş</span>
          </button>
        )}

        {/* Live Currency Rates */}
        <div
          className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] font-mono-num font-medium text-slate-700 dark:text-slate-300 shadow-xs"
          title={`Canlı Döviz Kuru (${lastUpdated || 'Anlık'})`}
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-bold">USD:</span>
            <span className="font-semibold text-slate-900 dark:text-white">₺{usd?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">EUR:</span>
            <span className="font-semibold text-slate-900 dark:text-white">₺{eur?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button
            onClick={() => refreshRates(true)}
            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 ml-0.5 p-0.5 rounded transition"
            title="Döviz Kurlarını Güncelle"
          >
            <RefreshCw className={`w-3 h-3 ${isRatesLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

        {/* KarTakip Shortcut with alert indicator */}
        <button
          onClick={() => setActiveTab('kartakip')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
            activeTab === 'kartakip'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
          }`}
          title="Kâr Takip & Satış Portalına Git"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kâr Takip</span>
          {criticalAlertsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

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
          <span>Yeni İşlem</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-700/60 rounded font-mono text-emerald-200">
            N
          </kbd>
        </button>
      </div>
    </header>
  );
};
