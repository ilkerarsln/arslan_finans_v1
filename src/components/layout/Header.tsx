import React, { useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Menu,
  Plus,
  Bell,
  RefreshCw,
  LogOut,
  Smartphone,
  Shield,
  UserCheck,
  Eye,
  Sun,
  Moon,
  Coins,
  Search,
} from 'lucide-react';
import { ActiveTab } from '../../types/finance';
import { useLiveCurrency } from '../../services/currencyService';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const TAB_TITLES: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Genel Finansal Özet & Kasa',
    subtitle: 'Nakit akışı, dönemsel kâr-zarar tablosu ve şirket mali durumu',
  },
  profit: {
    title: 'Kâr Takip (Satışlar & Kârlılık)',
    subtitle: 'Peşin, kredi kartı ve senetli satış takibi, vade farkı maliyetleri ve personel performansı',
  },
  stock: {
    title: 'Mal Alış & Stok Yönetimi',
    subtitle: 'Tedarikçi borçlandırması, ürün stok girişleri ve toplu Excel alım entegrasyonu',
  },
  transactions: {
    title: 'Gelir ve Gider Hareketleri (Kasa)',
    subtitle: 'Kasa ve banka kayıtları, masraf takibi ve denetim izi',
  },
  accounts: {
    title: 'Banka Hesapları & Kasalar',
    subtitle: 'Kasa, banka ve POS hesapları, dönemsel hareket ekstreleri ve transferler',
  },
  currents: {
    title: 'Cari Hesap Yönetimi',
    subtitle: 'Ortak müşteri ve tedarikçi borç/alacak takibi ve ekstreler',
  },
  definitions: {
    title: 'Tanımlamalar & Fiyat Listeleri',
    subtitle: 'Beyaz eşya & mobilya kategorileri, alt kategoriler, markalar, vade oranları ve fiyat listeleri',
  },
  upcoming: {
    title: 'Vade & Ödeme Takvimi',
    subtitle: 'Gelecek ödemeler, vadesi gelen çekler, senetler ve tedarikçi borçları',
  },
  reports: {
    title: 'Mali Raporlar & Kategori Dağılımı',
    subtitle: 'Kategorilere göre stok payı ve kâr analizi, aylık masraf detayları',
  },
  audit: {
    title: 'İşlem Denetim Raporu & Onaylar',
    subtitle: 'Kullanıcı işlem kayıtları, denetim izi ve silme onay talepleri',
  },
  users: {
    title: 'Personel ve Rol Yönetimi',
    subtitle: 'Yönetici ve Standart personel yetkilendirme, erişim izinleri',
  },
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    activeTab,
    openTransactionModal,
    upcomingDues,
    setActiveTab,
    user,
    isAdmin,
    isRoleSimulated,
    toggleRoleSimulation,
    isCloudSyncing,
    loginWithGoogle,
    logout,
    openCommandPalette,
    openCurrencyConverter,
    isDarkMode,
    toggleDarkMode,
  } = useFinance();

  const { usd, eur } = useLiveCurrency();

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

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs backdrop-blur-md">
      {/* Left: Mobile hamburger & Dynamic Title */}
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
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider hidden sm:inline">
              Arslan Mobilya ERP
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
            <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {TAB_TITLES[activeTab].title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden lg:block">
            {TAB_TITLES[activeTab].subtitle}
          </p>
        </div>
      </div>

      {/* Center: Quick Search */}
      <div className="hidden md:flex items-center">
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 transition shadow-xs group"
          title="Hızlı Komut Paleti (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <span className="text-slate-600 dark:text-slate-300">Hızlı işlem veya arama yap...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Currency Rates, Theme Switcher, Cloud Sync & Primary Action */}
      <div className="flex items-center gap-2 md:gap-2.5">
        {/* Live Currency Rates */}
        <button
          onClick={openCurrencyConverter}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 shadow-2xs transition"
          title={`Canlı Döviz: USD ₺${usd.toFixed(2)} | EUR ₺${eur.toFixed(2)}`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <div className="flex items-center gap-1">
            <span className="text-slate-400">USD:</span>
            <span className="font-bold text-slate-900 dark:text-white">₺{usd.toFixed(2)}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">EUR:</span>
            <span className="font-bold text-slate-900 dark:text-white">₺{eur.toFixed(2)}</span>
          </div>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={isDarkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          aria-label="Tema Değiştir"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Pending Alerts */}
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

        {/* User / Sync Badge */}
        {user ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-2 py-1 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hidden sm:inline" />
              {isCloudSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />}
            </div>

            {isRoleSimulated ? (
              <button
                onClick={toggleRoleSimulation}
                className="flex items-center gap-1 text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded-full transition shadow-xs"
                title="Standart kullanıcı simülasyonunu sonlandır"
              >
                <Eye className="w-3 h-3" /> Test
              </button>
            ) : isAdmin ? (
              <button
                onClick={() => setActiveTab('users')}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full hover:bg-amber-200 transition"
                title="Sistem Yöneticisi"
              >
                <Shield className="w-3 h-3 text-amber-500" /> Admin
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-700 px-2 py-0.5 rounded-full"
                title="Personel"
              >
                <UserCheck className="w-3 h-3 text-blue-500" /> Standart
              </span>
            )}

            <button
              onClick={logout}
              title="Oturumu Kapat"
              className="text-emerald-700 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 p-0.5 rounded transition ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs active:scale-95"
          >
            <span>Giriş Yap</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          onClick={() => openTransactionModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İşlem</span>
        </button>
      </div>
    </header>
  );
};
