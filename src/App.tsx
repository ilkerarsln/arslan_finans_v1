/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Toast } from './components/ui/Toast';
import { LoginScreen } from './components/auth/LoginScreen';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { AccountModal } from './components/modals/AccountModal';
import { TransferModal } from './components/modals/TransferModal';
import { CariModal } from './components/modals/CariModal';
import { CariDetailModal } from './components/modals/CariDetailModal';
import { CiroImportModal } from './components/modals/CiroImportModal';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { CurrentsTab } from './components/tabs/CurrentsTab';
import { UpcomingDuesTab } from './components/tabs/UpcomingDuesTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { CiroMatrixTab } from './components/tabs/CiroMatrixTab';
import { ProfitTab } from './components/tabs/ProfitTab';
import { StockTab } from './components/tabs/StockTab';
import { DefinitionsTab } from './components/tabs/DefinitionsTab';
import { AuditTab } from './components/tabs/AuditTab';
import { UsersTab } from './components/tabs/UsersTab';

import { Account, Cari } from './types/finance';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAuthLoading, activeTab } = useFinance();

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal states for Account, Transfer, Cari & Cari Detail
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);

  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);

  const [selectedCariForDetail, setSelectedCariForDetail] = useState<Cari | null>(null);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Arslan Finans yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Container */}
      <Toast />

      {/* Top Header */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl mx-auto w-full">
          {activeTab === 'ciro-matrix' && <CiroMatrixTab />}
          {activeTab === 'dashboard' && (
            <DashboardTab
              onOpenTransfer={() => {
                setTransferSourceAccountId(undefined);
                setIsTransferModalOpen(true);
              }}
              onOpenAddAccount={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
              onOpenAddCari={() => {
                setEditingCari(null);
                setIsCariModalOpen(true);
              }}
            />
          )}
          {activeTab === 'profit' && <ProfitTab />}
          {activeTab === 'stock' && <StockTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'accounts' && (
            <AccountsTab
              onOpenAddAccount={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
              onEditAccount={(acc) => {
                setEditingAccount(acc);
                setIsAccountModalOpen(true);
              }}
              onOpenTransfer={(sourceId) => {
                setTransferSourceAccountId(sourceId);
                setIsTransferModalOpen(true);
              }}
            />
          )}
          {activeTab === 'currents' && (
            <CurrentsTab
              onOpenAddCari={() => {
                setEditingCari(null);
                setIsCariModalOpen(true);
              }}
              onEditCari={(cari) => {
                setEditingCari(cari);
                setIsCariModalOpen(true);
              }}
              onSelectCariDetail={(cari) => setSelectedCariForDetail(cari)}
            />
          )}
          {activeTab === 'upcoming' && <UpcomingDuesTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'definitions' && <DefinitionsTab />}
          {activeTab === 'audit' && <AuditTab />}
          {activeTab === 'users' && <UsersTab />}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal />
      <InstallmentModal />
      <CiroImportModal />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferSourceAccountId(undefined);
        }}
        defaultSourceAccountId={transferSourceAccountId}
      />

      <CariModal
        isOpen={isCariModalOpen}
        onClose={() => {
          setIsCariModalOpen(false);
          setEditingCari(null);
        }}
        editingCari={editingCari}
      />

      <CariDetailModal
        cari={selectedCariForDetail}
        onClose={() => setSelectedCariForDetail(null)}
        onEdit={(cari) => {
          setSelectedCariForDetail(null);
          setEditingCari(cari);
          setIsCariModalOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
