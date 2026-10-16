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
  FileSpreadsheet,
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
    subtitle: 'Peşin, kredi kartı ve senetli satış takibi, vade farkı maliyetleri ve kârlılık',
  },
  stock: {
    title: 'Mal Alım & Stok Yönetimi',
    subtitle: '3 seviyeli kategori hiyerarşisi, yalın 2 sütunlu Excel alım entegrasyonu ve stok takibi',
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
    title: 'Cari Hesaplar',
    subtitle: 'Müşteri ve tedarikçi cari hesap bakiyeleri ve hareket ekstreleri',
  },
  definitions: {
    title: 'Tanımlamalar',
    subtitle: '3 Seviyeli kategori hiyerarşisi, markalar, fiyat listeleri ve vade oranları',
  },
  upcoming: {
    title: 'Vade & Ödeme Takvimi',
    subtitle: 'Gelecek ödemeler, vadesi gelen çekler, senetler ve tedarikçi borçları',
  },
  reports: {
    title: 'Ciro ve Finansal Analiz Matrisi',
    subtitle: '12 aylık marka/kategori ciro analizi, aktif ortalama, 2025 büyümesi ve brüt kârlar',
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
    openDataImporter,
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
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-850 px-4 md:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Dynamic Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 transition"
          aria-label="Menü"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveTab('reports')}
          className="cursor-pointer group"
          title="Raporlar ve Ciro Matrisine Dön"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider hidden sm:inline">
              Arslan Mobilya ERP
            </span>
            <span className="text-slate-700 hidden sm:inline">/</span>
            <h1 className="text-sm md:text-base font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">
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
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 transition shadow-xs group"
          title="Hızlı Komut Paleti (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          <span className="text-slate-300">Hızlı işlem veya arama yap...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-950 text-slate-400 rounded border border-slate-800 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Currency Rates, Theme Switcher, Cloud Sync & Primary Action */}
      <div className="flex items-center gap-2 md:gap-2.5">
        {/* Live Currency Rates */}
        <button
          onClick={openCurrencyConverter}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-xl text-[11px] font-mono font-medium text-slate-300 shadow-2xs transition"
          title={`Canlı Döviz: USD ₺${usd.toFixed(2)} | EUR ₺${eur.toFixed(2)}`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex items-center gap-1">
            <span className="text-slate-500">USD:</span>
            <span className="font-bold text-white">₺{usd.toFixed(2)}</span>
          </div>
          <span className="text-slate-750">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">EUR:</span>
            <span className="font-bold text-white">₺{eur.toFixed(2)}</span>
          </div>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent hover:border-slate-800 transition"
          title={isDarkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
          aria-label="Tema Değiştir"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Pending Alerts */}
        <button
          onClick={() => setActiveTab('upcoming')}
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent hover:border-slate-800 transition"
          title={`${pendingDuesCount} bekleyen ödeme veya tahsilat`}
        >
          <Bell className="w-4 h-4" />
          {pendingDuesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
          )}
        </button>

        {/* User / Sync Badge */}
        {user ? (
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 rounded-xl px-2 py-1 text-xs text-emerald-300 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
              {isCloudSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
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
                className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full hover:bg-amber-900 transition"
                title="Sistem Yöneticisi"
              >
                <Shield className="w-3 h-3 text-amber-400" /> Admin
              </button>
            ) : (
              <span
                className="flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded-full"
                title="Personel"
              >
                <UserCheck className="w-3 h-3 text-sky-400" /> Standart
              </span>
            )}
            <button
              onClick={logout}
              title="Oturumu Kapat"
              className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-xs active:scale-95"
          >
            <span>Giriş Yap</span>
          </button>
        )}

        {/* Primary Action Button: Data Importer */}
        <button
          onClick={() => openDataImporter('ciro')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 border border-indigo-500/30 cursor-pointer"
          title="Ciro Excel İçe Aktarma"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Ciro İçe Aktar</span>
        </button>

        {/* Yeni İşlem Ekle */}
        <button
          onClick={() => openTransactionModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 md:py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 border border-emerald-500/30"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni İşlem</span>
        </button>
      </div>
    </header>
  );
};
