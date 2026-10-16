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
import { UpcomingDuesTab } from './components/tabs/UpcomingDuesTab';
import { DefinitionsTab } from './components/tabs/DefinitionsTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { AuditTab } from './components/tabs/AuditTab';
import { UsersTab } from './components/tabs/UsersTab';
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { AccountModal } from './components/modals/AccountModal';
import { TransferModal } from './components/modals/TransferModal';
import { CariModal } from './components/modals/CariModal';
import { CariDetailModal } from './components/modals/CariDetailModal';
import { CommandPalette } from './components/ui/CommandPalette';
import { CurrencyConverterModal } from './components/ui/CurrencyConverterModal';
import { Toast } from './components/ui/Toast';
import { Account, Cari } from './types/finance';
import { TrendingUp, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAuthLoading, activeTab } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal states managed at top level
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [defaultTransferSourceId, setDefaultTransferSourceId] = useState<string | undefined>(undefined);

  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);

  const [selectedCariDetail, setSelectedCariDetail] = useState<Cari | null>(null);

  // Account modal triggers
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  // Transfer modal trigger
  const handleOpenTransfer = (sourceAccountId?: string) => {
    setDefaultTransferSourceId(sourceAccountId);
    setIsTransferModalOpen(true);
  };

  // Cari modal triggers
  const handleOpenAddCari = () => {
    setEditingCari(null);
    setIsCariModalOpen(true);
  };

  const handleEditCari = (cari: Cari) => {
    setEditingCari(cari);
    setIsCariModalOpen(true);
  };

  const handleSelectCariDetail = (cari: Cari) => {
    setSelectedCariDetail(cari);
  };

  // Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 animate-pulse">
            <TrendingUp className="w-8 h-8" />
          </div>
          <Loader2 className="w-20 h-20 text-emerald-500/30 animate-spin absolute -inset-2" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Arslan Finans</h2>
        <p className="text-xs text-slate-400 mt-1">Bulut veri bağlantısı kuruluyor...</p>
      </div>
    );
  }

  // Not Authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        {/* Tab Router Container */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-slate-950/60 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {activeTab === 'dashboard' && (
              <DashboardTab
                onOpenTransfer={() => handleOpenTransfer()}
                onOpenAddAccount={handleOpenAddAccount}
                onOpenAddCari={handleOpenAddCari}
              />
            )}

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
                onSelectCariDetail={handleSelectCariDetail}
              />
            )}

            {activeTab === 'definitions' && <DefinitionsTab />}

            {activeTab === 'reports' && <ReportsTab />}

            {activeTab === 'upcoming' && <UpcomingDuesTab />}

            {activeTab === 'audit' && <AuditTab />}

            {activeTab === 'users' && <UsersTab />}
          </div>
        </main>
      </div>

      {/* Top-Level Global Modals */}
      <TransactionModal />
      <InstallmentModal />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultSourceAccountId={defaultTransferSourceId}
      />

      <CariModal
        isOpen={isCariModalOpen}
        onClose={() => setIsCariModalOpen(false)}
        editingCari={editingCari}
      />

      <CariDetailModal
        cari={selectedCariDetail}
        onClose={() => setSelectedCariDetail(null)}
        onEdit={cari => {
          setSelectedCariDetail(null);
          handleEditCari(cari);
        }}
      />

      {/* Productivity Command Palette & Live Currency Converter */}
      <CommandPalette />
      <CurrencyConverterModal />

      {/* Global Notifications */}
      <Toast />
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
