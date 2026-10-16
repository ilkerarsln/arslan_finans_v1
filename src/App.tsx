import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginScreen } from './components/auth/LoginScreen';
import { DashboardTab } from './components/tabs/DashboardTab';
import { ProfitTab } from './components/tabs/ProfitTab';
import { StockTab } from './components/tabs/StockTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { CurrentsTab } from './components/tabs/CurrentsTab';
import { DefinitionsTab } from './components/tabs/DefinitionsTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { UpcomingTab } from './components/tabs/UpcomingTab';
import { AuditTab } from './components/tabs/AuditTab';
import { UsersTab } from './components/tabs/UsersTab';

import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { ProductEditModal } from './components/modals/ProductEditModal';
import { DataImporter } from './components/importer/DataImporter';
import { CommandPalette } from './components/ui/CommandPalette';
import { CurrencyConverterModal } from './components/ui/CurrencyConverterModal';
import { Toast } from './components/ui/Toast';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    user,
    isProductEditModalOpen,
    closeProductEditModal,
    editingProduct,
    isDataImporterOpen,
    dataImporterTemplate,
    closeDataImporter,
    isAuthLoading,
  } = useFinance();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not logged in, show LoginScreen
  if (!user && !isAuthLoading) {
    return <LoginScreen />;
  }

  const renderActiveTab = () => {
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
      case 'reports':
        return <ReportsTab />;
      case 'upcoming':
        return <UpcomingTab />;
      case 'audit':
        return <AuditTab />;
      case 'users':
        return <UsersTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <TransactionModal />
      <InstallmentModal />
      <ProductEditModal
        isOpen={isProductEditModalOpen}
        onClose={closeProductEditModal}
        product={editingProduct}
      />
      {isDataImporterOpen && (
        <DataImporter
          onClose={closeDataImporter}
          defaultTemplate={dataImporterTemplate}
        />
      )}
      <CommandPalette />
      <CurrencyConverterModal />
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
