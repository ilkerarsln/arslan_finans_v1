import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { KarTakipProvider } from './context/KarTakipContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Toast } from './components/ui/Toast';
import { LoginScreen } from './components/auth/LoginScreen';

// Tab Views
import { DashboardTab } from './components/tabs/DashboardTab';
import { TransactionsTab } from './components/tabs/TransactionsTab';
import { KarTakipTab } from './components/tabs/KarTakipTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { CurrentsTab } from './components/tabs/CurrentsTab';
import { UpcomingTab } from './components/tabs/UpcomingTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { UsersTab } from './components/tabs/UsersTab';
import { AuditTab } from './components/tabs/AuditTab';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { InstallmentModal } from './components/modals/InstallmentModal';
import { TransferModal } from './components/modals/TransferModal';
import { AccountModal } from './components/modals/AccountModal';
import { CariModal } from './components/modals/CariModal';
import { CariDetailModal } from './components/modals/CariDetailModal';
import { Account, Cari } from './types/finance';
import { TrendingUp } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAuthLoading, activeTab } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // App-level Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editingCari, setEditingCari] = useState<Cari | null>(null);
  const [selectedCariForDetail, setSelectedCariForDetail] = useState<Cari | null>(null);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4 animate-pulse">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div className="text-white font-bold text-lg mb-1">Arslan Finans & KarTakip</div>
        <p className="text-slate-400 text-xs">Finansal veriler yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              onOpenTransfer={() => setIsTransferModalOpen(true)}
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

          {activeTab === 'transactions' && <TransactionsTab />}

          {activeTab === 'kartakip' && <KarTakipTab />}

          {activeTab === 'accounts' && (
            <AccountsTab
              onOpenAddAccount={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
              onOpenTransfer={() => setIsTransferModalOpen(true)}
              onEditAccount={acc => {
                setEditingAccount(acc);
                setIsAccountModalOpen(true);
              }}
            />
          )}

          {activeTab === 'currents' && (
            <CurrentsTab
              onOpenAddCari={() => {
                setEditingCari(null);
                setIsCariModalOpen(true);
              }}
              onSelectCari={c => setSelectedCariForDetail(c)}
              onEditCari={c => {
                setEditingCari(c);
                setIsCariModalOpen(true);
              }}
            />
          )}

          {activeTab === 'upcoming' && <UpcomingTab />}

          {activeTab === 'reports' && <ReportsTab />}

          {activeTab === 'users' && <UsersTab />}

          {activeTab === 'audit' && <AuditTab />}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal />
      <InstallmentModal />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
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
        onEdit={c => {
          setSelectedCariForDetail(null);
          setEditingCari(c);
          setIsCariModalOpen(true);
        }}
      />

      {/* Global Toast */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <KarTakipProvider>
        <MainApp />
      </KarTakipProvider>
    </FinanceProvider>
  );
}
