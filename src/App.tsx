import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { CurrentsTab } from './components/tabs/CurrentsTab';
import { UpcomingDuesTab } from './components/tabs/UpcomingDuesTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { AccountModal } from './components/modals/AccountModal';
import { CariModal } from './components/modals/CariModal';
import { CariDetailModal } from './components/modals/CariDetailModal';
import { TransferModal } from './components/modals/TransferModal';
import { Toast } from './components/ui/Toast';
import { Account, Cari } from './types/finance';

const MainAppContent: React.FC = () => {
  const { activeTab } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [selectedCariForDetail, setSelectedCariForDetail] = useState<Cari | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleOpenAddCari = () => {
    setEditingCari(null);
    setIsCariModalOpen(true);
  };

  const handleEditCari = (c: Cari) => {
    setEditingCari(c);
    setIsCariModalOpen(true);
  };

  const handleOpenTransfer = (sourceAccountId?: string) => {
    setTransferSourceAccountId(sourceAccountId);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {activeTab === 'dashboard' && (
              <DashboardTab
                onOpenTransfer={() => handleOpenTransfer()}
                onOpenAddAccount={handleOpenAddAccount}
                onOpenAddCari={handleOpenAddCari}
              />
            )}
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
                onSelectCariDetail={cari => setSelectedCariForDetail(cari)}
              />
            )}
            {activeTab === 'upcoming' && <UpcomingDuesTab />}
            {activeTab === 'reports' && <ReportsTab />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal />
      <InstallmentModal />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
      />

      <CariModal
        isOpen={isCariModalOpen}
        onClose={() => setIsCariModalOpen(false)}
        editingCari={editingCari}
      />

      <CariDetailModal
        cari={selectedCariForDetail}
        onClose={() => setSelectedCariForDetail(null)}
        onEdit={cari => {
          setSelectedCariForDetail(null);
          handleEditCari(cari);
        }}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultSourceAccountId={transferSourceAccountId}
      />

      {/* Toast Notification Container */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}
