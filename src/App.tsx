import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardTab } from './components/tabs/DashboardTab';
import { ProfitTab } from './components/tabs/ProfitTab';
import { StockTab } from './components/tabs/StockTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { CurrentsTab } from './components/tabs/CurrentsTab';
import { DefinitionsTab } from './components/tabs/DefinitionsTab';
import { UpcomingDuesTab } from './components/tabs/UpcomingDuesTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { AuditTab } from './components/tabs/AuditTab';
import { UsersTab } from './components/tabs/UsersTab';
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { CommandPalette } from './components/ui/CommandPalette';
import { CurrencyConverterModal } from './components/ui/CurrencyConverterModal';
import { DataImporter } from './components/importer/DataImporter';
import { Toast } from './components/ui/Toast';
import { LoginScreen } from './components/auth/LoginScreen';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    user,
    isAuthLoading,
    isDataImporterOpen,
    dataImporterTemplate,
    closeDataImporter,
  } = useFinance();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If Firebase Auth is initializing
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wide">
          Arslan Mobilya ERP Başlatılıyor...
        </span>
      </div>
    );
  }

  // If user is not authenticated
  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  // Render tab content based on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'profit':
        return <ProfitTab />;
      case 'stock':
        return <StockTab />;
      case 'transactions':
        return <TransactionsTab />;
      case 'accounts':
        return <AccountsTab />;
      case 'currents':
        return <CurrentsTab />;
      case 'definitions':
        return <DefinitionsTab />;
      case 'upcoming':
        return <UpcomingDuesTab />;
      case 'reports':
        return <ReportsTab />;
      case 'audit':
        return <AuditTab />;
      case 'users':
        return <UsersTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main App Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Global Modals & Wizards */}
      <TransactionModal />
      <InstallmentModal />
      <CommandPalette />
      <CurrencyConverterModal />

      {/* Yalın Mal Alımı & Veri Aktarım Sihirbazı */}
      {isDataImporterOpen && (
        <DataImporter
          onClose={closeDataImporter}
          defaultTemplate={dataImporterTemplate}
        />
      )}

      {/* Global Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
