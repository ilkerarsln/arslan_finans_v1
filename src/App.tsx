import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toast } from './components/ui/Toast';
import { CommandPalette } from './components/ui/CommandPalette';
import { CurrencyConverterModal } from './components/ui/CurrencyConverterModal';
import { LoginScreen } from './components/auth/LoginScreen';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { AccountModal } from './components/modals/AccountModal';
import { TransferModal } from './components/modals/TransferModal';
import { CariModal } from './components/modals/CariModal';
import { CariDetailModal } from './components/modals/CariDetailModal';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { ProfitTab } from './components/tabs/ProfitTab';
import { StockTab } from './components/tabs/StockTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { CurrentsTab } from './components/tabs/CurrentsTab';
import { UpcomingDuesTab } from './components/tabs/UpcomingDuesTab';
import { DefinitionsTab } from './components/tabs/DefinitionsTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { AuditTab } from './components/tabs/AuditTab';
import { UsersTab } from './components/tabs/UsersTab';

// New Importer and Smart Sales modules
import { DataImporter } from './components/importer/DataImporter';
import { SmartSalesMatching } from './components/sales/SmartSalesMatching';

import { Account, Cari } from './types/finance';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    user,
    userProfile,
    isAuthLoading,
    activeTab,
    isDataImporterOpen,
    dataImporterTemplate,
    closeDataImporter,
    isSmartSalesOpen,
    closeSmartSales,
  } = useFinance();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal States for Accounts and Caris
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<string | undefined>(undefined);

  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [selectedCariDetail, setSelectedCariDetail] = useState<Cari | null>(null);

  // Authentication Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Arslan Mobilya ERP sistemi yükleniyor...
        </p>
      </div>
    );
  }

  // Not Logged In -> Show LoginScreen
  if (!user && !userProfile) {
    return <LoginScreen />;
  }

  // Handlers for Account Modal
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleOpenTransfer = (sourceAccountId?: string) => {
    setTransferSourceId(sourceAccountId);
    setIsTransferModalOpen(true);
  };

  // Handlers for Cari Modal
  const handleOpenAddCari = () => {
    setEditingCari(null);
    setIsCariModalOpen(true);
  };

  const handleEditCari = (cari: Cari) => {
    setEditingCari(cari);
    setIsCariModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-150">
      {/* Responsive Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-64">
        {/* Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Tab Viewport */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'profit' && <ProfitTab />}
          {activeTab === 'stock' && <StockTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'accounts' && (
            <AccountsTab
              onOpenAddAccount={handleOpenAddAccount}
              onEditAccount={handleEditAccount}
              onOpenTransfer={handleOpenTransfer}
            />
          )}
          {activeTab === 'currents' && (
            <CurrentsTab
              onOpenAddCari={handleOpenAddCari}
              onEditCari={handleEditCari}
              onSelectCariDetail={(cari) => setSelectedCariDetail(cari)}
            />
          )}
          {activeTab === 'upcoming' && <UpcomingDuesTab />}
          {activeTab === 'definitions' && <DefinitionsTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'audit' && <AuditTab />}
          {activeTab === 'users' && <UsersTab />}
        </main>
      </div>

      {/* Global Modals */}
      <Toast />
      <CommandPalette />
      <CurrencyConverterModal />
      <TransactionModal />
      <InstallmentModal />

      {/* Account Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
      />
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultSourceAccountId={transferSourceId}
      />

      {/* Cari Modals */}
      <CariModal
        isOpen={isCariModalOpen}
        onClose={() => setIsCariModalOpen(false)}
        editingCari={editingCari}
      />
      <CariDetailModal
        cari={selectedCariDetail}
        onClose={() => setSelectedCariDetail(null)}
        onEdit={(cari) => {
          setSelectedCariDetail(null);
          handleEditCari(cari);
        }}
      />

      {/* Data Importer Modal (Mal Alımı, Fiyat Listesi, Cari, Stok) */}
      {isDataImporterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <DataImporter
            defaultTemplate={dataImporterTemplate}
            onClose={closeDataImporter}
          />
        </div>
      )}

      {/* Akıllı Satış ve Eksik Ürün Eşleştirme Modülü */}
      {isSmartSalesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <SmartSalesMatching
            onClose={closeSmartSales}
          />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
