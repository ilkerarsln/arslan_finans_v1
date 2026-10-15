import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/ui/Toast';
import { DashboardView } from './components/dashboard/DashboardView';
import { MalAlimStokView } from './components/malAlim/MalAlimStokView';
import { DetayliStokView } from './components/stok/DetayliStokView';
import { KarTakipView } from './components/karTakip/KarTakipView';
import { CariHesaplarView } from './components/cari/CariHesaplarView';
import { KasaBankaView } from './components/kasa/KasaBankaView';
import { MasrafTakipView } from './components/masraf/MasrafTakipView';
import { AylikTakipView } from './components/aylik/AylikTakipView';
import { UrunEslestirmeView } from './components/eslestirme/UrunEslestirmeView';
import { TanimlamalarView } from './components/tanimlamalar/TanimlamalarView';
import { RaporlarView } from './components/rapor/RaporlarView';
import { KullanicilarView } from './components/kullanicilar/KullanicilarView';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab, isMobileSidebarOpen, setIsMobileSidebarOpen } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'mal_alim_stok':
        return <MalAlimStokView />;
      case 'detayli_stok':
        return <DetayliStokView />;
      case 'kar_takip':
        return <KarTakipView />;
      case 'cari_hesaplar':
        return <CariHesaplarView />;
      case 'kasa_banka':
        return <KasaBankaView />;
      case 'masraflar':
        return <MasrafTakipView />;
      case 'aylik_takip':
        return <AylikTakipView />;
      case 'urun_eslestirme':
        return <UrunEslestirmeView />;
      case 'tanimlamalar':
        return <TanimlamalarView />;
      case 'raporlar':
        return <RaporlarView />;
      case 'kullanicilar':
        return <KullanicilarView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Mobile Drawer Backdrop Overlay (Requirement 2: Responsive Mobile) */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity cursor-pointer animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Vertical Sidebar (Responsive drawer on mobile, static on desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto pb-12 w-full min-w-0">
            {renderActiveView()}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
