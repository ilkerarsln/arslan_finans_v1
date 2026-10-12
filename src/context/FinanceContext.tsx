import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  User,
} from '../firebase';
import {
  subscribeToUserData,
  syncAccountToCloud,
  deleteAccountFromCloud,
  syncTransactionToCloud,
  deleteTransactionFromCloud,
  syncCariToCloud,
  deleteCariFromCloud,
  syncUpcomingDueToCloud,
  deleteUpcomingDueFromCloud,
  syncCategoryToCloud,
  uploadAllInitialDataToCloud,
} from '../services/firestoreFinance';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CARIS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_UPCOMING_DUES,
} from '../data/initialData';
import {
  Account,
  ActiveTab,
  Cari,
  CategoryItem,
  InstallmentPlanRequest,
  Transaction,
  UpcomingDue,
} from '../types/finance';
import { calculateInstallmentDate } from '../utils/formatters';
import { parseExcelData } from '../utils/excelImport';

const STORAGE_KEYS = {
  ACCOUNTS: 'arslan_finans_accounts_v2',
  TRANSACTIONS: 'arslan_finans_transactions_v2',
  CARIS: 'arslan_finans_caris_v2',
  UPCOMING_DUES: 'arslan_finans_upcoming_dues_v2',
  CATEGORIES: 'arslan_finans_categories_v2',
};

interface FinanceContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  transactions: Transaction[];
  accounts: Account[];
  caris: Cari[];
  upcomingDues: UpcomingDue[];
  categories: CategoryItem[];

  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;

  // Account actions
  addAccount: (acc: Omit<Account, 'id'>) => Account;
  updateAccount: (acc: Account) => void;
  deleteAccount: (id: string) => void;
  executeTransfer: (fromAccountId: string, toAccountId: string, amount: number, desc?: string, date?: string) => void;

  // Cari actions
  addCari: (cari: Omit<Cari, 'id'>) => Cari;
  updateCari: (cari: Cari) => void;
  deleteCari: (id: string) => void;

  // Upcoming Dues & Installments
  addUpcomingDue: (due: Omit<UpcomingDue, 'id'>) => UpcomingDue;
  toggleUpcomingDue: (id: string) => void;
  deleteUpcomingDue: (id: string) => void;
  createInstallmentPlan: (plan: InstallmentPlanRequest) => void;
  deleteInstallmentGroup: (groupId: string) => void;

  // Category actions
  addCategory: (name: string, type: 'Gelir' | 'Gider', color?: string) => void;

  // Modal controls
  isTransactionModalOpen: boolean;
  prefillTransaction: Partial<Transaction> | null;
  openTransactionModal: (prefill?: Partial<Transaction>) => void;
  closeTransactionModal: () => void;

  isInstallmentModalOpen: boolean;
  installmentModalPrefill: Partial<InstallmentPlanRequest> | null;
  openInstallmentModal: (prefill?: Partial<InstallmentPlanRequest>) => void;
  closeInstallmentModal: () => void;

  // Data management
  resetToDefaultData: () => void;
  exportDataAsJson: () => string;
  importDataFromJson: (jsonStr: string) => boolean;
  importDataFromExcel: (file: File) => Promise<{ transactionsCount: number; carisCount: number }>;

  // Toast notifications
  toastMessage: { text: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;

  // Cloud Sync & Multi-device state
  user: User | null;
  isAuthLoading: boolean;
  isCloudConnected: boolean;
  isCloudSyncing: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncLocalToCloud: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Firebase Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const isInitialCloudSyncDone = useRef<boolean>(false);

  // Financial state with local storage fallback
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [caris, setCaris] = useState<Cari[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARIS);
      return saved ? JSON.parse(saved) : INITIAL_CARIS;
    } catch {
      return INITIAL_CARIS;
    }
  });

  const [upcomingDues, setUpcomingDues] = useState<UpcomingDue[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPCOMING_DUES);
      return saved ? JSON.parse(saved) : INITIAL_UPCOMING_DUES;
    } catch {
      return INITIAL_UPCOMING_DUES;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Modal controls
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [prefillTransaction, setPrefillTransaction] = useState<Partial<Transaction> | null>(null);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [installmentModalPrefill, setInstallmentModalPrefill] = useState<Partial<InstallmentPlanRequest> | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.CARIS, JSON.stringify(caris));
      localStorage.setItem(STORAGE_KEYS.UPCOMING_DUES, JSON.stringify(upcomingDues));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }, [transactions, accounts, caris, upcomingDues, categories]);

  // Auth listener & Firestore live sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setIsCloudSyncing(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore listeners when user is logged in
  useEffect(() => {
    if (!user) {
      isInitialCloudSyncDone.current = false;
      return;
    }

    const unsubscribeFirestore = subscribeToUserData(user.uid, {
      onAccounts: cloudAccounts => {
        if (cloudAccounts.length > 0) {
          setAccounts(cloudAccounts);
        } else if (!isInitialCloudSyncDone.current && accounts.length > 0) {
          // If cloud has 0 accounts, seed current accounts into cloud
          accounts.forEach(acc => syncAccountToCloud(user.uid, acc));
        }
        setIsCloudSyncing(false);
      },
      onTransactions: cloudTxs => {
        if (cloudTxs.length > 0) {
          setTransactions(cloudTxs);
        } else if (!isInitialCloudSyncDone.current && transactions.length > 0) {
          transactions.forEach(tx => syncTransactionToCloud(user.uid, tx));
        }
      },
      onCaris: cloudCaris => {
        if (cloudCaris.length > 0) {
          setCaris(cloudCaris);
        } else if (!isInitialCloudSyncDone.current && caris.length > 0) {
          caris.forEach(c => syncCariToCloud(user.uid, c));
        }
      },
      onUpcomingDues: cloudDues => {
        if (cloudDues.length > 0) {
          setUpcomingDues(cloudDues);
        } else if (!isInitialCloudSyncDone.current && upcomingDues.length > 0) {
          upcomingDues.forEach(d => syncUpcomingDueToCloud(user.uid, d));
        }
      },
      onCategories: cloudCats => {
        if (cloudCats.length > 0) {
          setCategories(cloudCats);
        } else if (!isInitialCloudSyncDone.current && categories.length > 0) {
          categories.forEach(cat => syncCategoryToCloud(user.uid, cat));
        }
        isInitialCloudSyncDone.current = true;
      },
    });

    return () => {
      unsubscribeFirestore();
    };
  }, [user]);

  // Google Login
  const loginWithGoogle = async () => {
    try {
      setIsCloudSyncing(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        showToast(`Bulut senkronizasyonu aktif! Hoş geldiniz, ${res.user.displayName || res.user.email}`, 'success');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      showToast(`Giriş yapılamadı: ${error?.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      showToast('Oturum kapatıldı. Veriler bu cihazda tutulmaya devam ediyor.', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Manual one-click sync all local data to cloud
  const syncLocalToCloud = async () => {
    if (!user) {
      showToast('Buluta aktarım için önce Google ile giriş yapmalısınız.', 'error');
      return;
    }
    try {
      setIsCloudSyncing(true);
      await uploadAllInitialDataToCloud(user.uid, {
        accounts,
        transactions,
        caris,
        upcomingDues,
        categories,
      });
      showToast('Tüm veriler bulut veritabanına başarıyla senkronize edildi!', 'success');
    } catch (error) {
      console.error('Manual sync error:', error);
      showToast('Bulut eşitleme sırasında hata oluştu.', 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const openTransactionModal = (prefill?: Partial<Transaction>) => {
    setPrefillTransaction(prefill || null);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setPrefillTransaction(null);
  };

  const openInstallmentModal = (prefill?: Partial<InstallmentPlanRequest>) => {
    setInstallmentModalPrefill(prefill || null);
    setIsInstallmentModalOpen(true);
  };

  const closeInstallmentModal = () => {
    setIsInstallmentModalOpen(false);
    setInstallmentModalPrefill(null);
  };

  // Helper to adjust account balance
  const adjustAccountBalance = (accId: string, delta: number) => {
    setAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === accId) {
          const newAcc = { ...acc, balance: +(acc.balance + delta).toFixed(2) };
          if (user) syncAccountToCloud(user.uid, newAcc);
          return newAcc;
        }
        return acc;
      });
      return updated;
    });
  };

  // Helper to adjust Cari balance
  const adjustCariBalance = (cariId: string, delta: number) => {
    setCaris(prev => {
      const updated = prev.map(c => {
        if (c.id === cariId) {
          const newCari = { ...c, balance: +(c.balance + delta).toFixed(2) };
          if (user) syncCariToCloud(user.uid, newCari);
          return newCari;
        }
        return c;
      });
      return updated;
    });
  };

  // Transaction operations
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    if (newTx.type === 'Gelir') {
      adjustAccountBalance(newTx.accountId, newTx.amount);
      if (newTx.cariId) {
        adjustCariBalance(newTx.cariId, -newTx.amount);
      }
    } else if (newTx.type === 'Gider') {
      adjustAccountBalance(newTx.accountId, -newTx.amount);
      if (newTx.cariId) {
        adjustCariBalance(newTx.cariId, newTx.amount);
      }
    } else if (newTx.type === 'Transfer' && newTx.targetAccountId) {
      adjustAccountBalance(newTx.accountId, -newTx.amount);
      adjustAccountBalance(newTx.targetAccountId, newTx.amount);
    }

    setTransactions(prev => [newTx, ...prev]);
    if (user) syncTransactionToCloud(user.uid, newTx);

    showToast(`Yeni işlem kaydedildi: ₺${newTx.amount.toLocaleString('tr-TR')}`, 'success');
    return newTx;
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    if (!oldTx) return;

    // Rollback old effects
    if (oldTx.type === 'Gelir') {
      adjustAccountBalance(oldTx.accountId, -oldTx.amount);
      if (oldTx.cariId) adjustCariBalance(oldTx.cariId, oldTx.amount);
    } else if (oldTx.type === 'Gider') {
      adjustAccountBalance(oldTx.accountId, oldTx.amount);
      if (oldTx.cariId) adjustCariBalance(oldTx.cariId, -oldTx.amount);
    } else if (oldTx.type === 'Transfer' && oldTx.targetAccountId) {
      adjustAccountBalance(oldTx.accountId, oldTx.amount);
      adjustAccountBalance(oldTx.targetAccountId, -oldTx.amount);
    }

    // Apply new effects
    if (updatedTx.type === 'Gelir') {
      adjustAccountBalance(updatedTx.accountId, updatedTx.amount);
      if (updatedTx.cariId) adjustCariBalance(updatedTx.cariId, -updatedTx.amount);
    } else if (updatedTx.type === 'Gider') {
      adjustAccountBalance(updatedTx.accountId, -updatedTx.amount);
      if (updatedTx.cariId) adjustCariBalance(updatedTx.cariId, updatedTx.amount);
    } else if (updatedTx.type === 'Transfer' && updatedTx.targetAccountId) {
      adjustAccountBalance(updatedTx.accountId, -updatedTx.amount);
      adjustAccountBalance(updatedTx.targetAccountId, updatedTx.amount);
    }

    setTransactions(prev => prev.map(t => (t.id === updatedTx.id ? updatedTx : t)));
    if (user) syncTransactionToCloud(user.uid, updatedTx);

    showToast('İşlem güncellendi', 'info');
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (tx.type === 'Gelir') {
      adjustAccountBalance(tx.accountId, -tx.amount);
      if (tx.cariId) adjustCariBalance(tx.cariId, tx.amount);
    } else if (tx.type === 'Gider') {
      adjustAccountBalance(tx.accountId, tx.amount);
      if (tx.cariId) adjustCariBalance(tx.cariId, -tx.amount);
    } else if (tx.type === 'Transfer' && tx.targetAccountId) {
      adjustAccountBalance(tx.accountId, tx.amount);
      adjustAccountBalance(tx.targetAccountId, -tx.amount);
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    if (user) deleteTransactionFromCloud(user.uid, id);

    showToast('İşlem silindi ve bakiye geri alındı', 'info');
  };

  const executeTransfer = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    desc = 'Hesaplar Arası Virman',
    date = new Date().toISOString().split('T')[0]
  ) => {
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc || amount <= 0) return;

    addTransaction({
      date,
      type: 'Transfer',
      category: 'Virman',
      desc: desc || `${fromAcc.name} ➔ ${toAcc.name} Transfer`,
      amount,
      accountId: fromAccountId,
      targetAccountId: toAccountId,
      status: 'Tamamlandı',
    });
  };

  // Account operations
  const addAccount = (acc: Omit<Account, 'id'>): Account => {
    const newAcc: Account = {
      ...acc,
      id: `acc-${Date.now()}`,
    };
    setAccounts(prev => [...prev, newAcc]);
    if (user) syncAccountToCloud(user.uid, newAcc);
    showToast(`${newAcc.name} hesabı eklendi`, 'success');
    return newAcc;
  };

  const updateAccount = (acc: Account) => {
    setAccounts(prev => prev.map(a => (a.id === acc.id ? acc : a)));
    if (user) syncAccountToCloud(user.uid, acc);
    showToast(`${acc.name} güncellendi`, 'info');
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (user) deleteAccountFromCloud(user.uid, id);
    showToast('Hesap silindi', 'info');
  };

  // Cari operations
  const addCari = (cari: Omit<Cari, 'id'>): Cari => {
    const newCari: Cari = {
      ...cari,
      id: `cari-${Date.now()}`,
    };
    setCaris(prev => [...prev, newCari]);
    if (user) syncCariToCloud(user.uid, newCari);
    showToast(`${newCari.name} cari kartı oluşturuldu`, 'success');
    return newCari;
  };

  const updateCari = (cari: Cari) => {
    setCaris(prev => prev.map(c => (c.id === cari.id ? cari : c)));
    if (user) syncCariToCloud(user.uid, cari);
    showToast('Cari bilgisi güncellendi', 'info');
  };

  const deleteCari = (id: string) => {
    setCaris(prev => prev.filter(c => c.id !== id));
    if (user) deleteCariFromCloud(user.uid, id);
    showToast('Cari kartı silindi', 'info');
  };

  // Upcoming Dues & Installments
  const addUpcomingDue = (due: Omit<UpcomingDue, 'id'>): UpcomingDue => {
    const newDue: UpcomingDue = {
      ...due,
      id: `due-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setUpcomingDues(prev => [...prev, newDue]);
    if (user) syncUpcomingDueToCloud(user.uid, newDue);
    showToast('Ödeme/Tahsilat takvime eklendi', 'success');
    return newDue;
  };

  const toggleUpcomingDue = (id: string) => {
    const target = upcomingDues.find(d => d.id === id);
    if (!target) return;

    const newCompleted = !target.isCompleted;
    const updated = { ...target, isCompleted: newCompleted };

    setUpcomingDues(prev => prev.map(d => (d.id === id ? updated : d)));
    if (user) syncUpcomingDueToCloud(user.uid, updated);

    // If marked completed, automatically ask to add to transactions
    if (newCompleted) {
      showToast(`'${target.title}' tamamlandı olarak işaretlendi`, 'success');
    }
  };

  const deleteUpcomingDue = (id: string) => {
    setUpcomingDues(prev => prev.filter(d => d.id !== id));
    if (user) deleteUpcomingDueFromCloud(user.uid, id);
    showToast('Vade kaydı silindi', 'info');
  };

  const createInstallmentPlan = (plan: InstallmentPlanRequest) => {
    const count = Math.max(1, plan.installmentsCount);
    const baseAmount = Math.floor((plan.totalAmount / count) * 100) / 100;
    const remainder = Math.round((plan.totalAmount - baseAmount * count) * 100) / 100;
    const groupId = `inst-group-${Date.now()}`;
    const firmName = plan.cariName || plan.title || 'Taksit';

    const newDues: UpcomingDue[] = [];

    for (let i = 1; i <= count; i++) {
      const dueDate = calculateInstallmentDate(plan.firstDueDate, i - 1);
      const amount = i === count ? +(baseAmount + remainder).toFixed(2) : baseAmount;
      const title = `${firmName} - ${i}/${count} Taksit`;

      const dueItem: UpcomingDue = {
        id: `due-${Date.now()}-${i}`,
        title,
        type: plan.type,
        amount,
        dueDate,
        cariId: plan.cariId,
        cariName: plan.cariName,
        category: plan.category || (plan.type === 'Gelir' ? 'Satış Geliri' : 'Tedarikçi Ödemesi'),
        isCompleted: false,
        recurrence: 'Tek Seferlik',
        accountId: plan.accountId,
        installmentIndex: i,
        totalInstallments: count,
        installmentGroupId: groupId,
      };

      newDues.push(dueItem);
      if (user) syncUpcomingDueToCloud(user.uid, dueItem);
    }

    setUpcomingDues(prev => [...prev, ...newDues]);
    showToast(`${count} taksitli vade planı başarıyla oluşturuldu`, 'success');
  };

  const deleteInstallmentGroup = (groupId: string) => {
    const toDelete = upcomingDues.filter(d => d.installmentGroupId === groupId);
    setUpcomingDues(prev => prev.filter(d => d.installmentGroupId !== groupId));
    if (user) {
      toDelete.forEach(d => deleteUpcomingDueFromCloud(user.uid, d.id));
    }
    showToast('Taksit grubu takvimden kaldırıldı', 'info');
  };

  // Categories
  const addCategory = (name: string, type: 'Gelir' | 'Gider', color = '#059669') => {
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name,
      type,
      color,
    };
    setCategories(prev => [...prev, newCat]);
    if (user) syncCategoryToCloud(user.uid, newCat);
    showToast(`'${name}' kategorisi eklendi`, 'success');
  };

  // Reset to default
  const resetToDefaultData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCaris(INITIAL_CARIS);
    setTransactions(INITIAL_TRANSACTIONS);
    setUpcomingDues(INITIAL_UPCOMING_DUES);
    setCategories(INITIAL_CATEGORIES);

    if (user) {
      uploadAllInitialDataToCloud(user.uid, {
        accounts: INITIAL_ACCOUNTS,
        transactions: INITIAL_TRANSACTIONS,
        caris: INITIAL_CARIS,
        upcomingDues: INITIAL_UPCOMING_DUES,
        categories: INITIAL_CATEGORIES,
      });
    }

    showToast('Varsayılan demo veriler yüklendi', 'info');
  };

  // Backup / Restore JSON
  const exportDataAsJson = (): string => {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      transactions,
      accounts,
      caris,
      upcomingDues,
      categories,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataFromJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.transactions && !data.accounts) {
        showToast('Geçersiz yedek dosyası formatı!', 'error');
        return false;
      }

      if (Array.isArray(data.accounts)) setAccounts(data.accounts);
      if (Array.isArray(data.caris)) setCaris(data.caris);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (Array.isArray(data.upcomingDues)) setUpcomingDues(data.upcomingDues);
      if (Array.isArray(data.categories)) setCategories(data.categories);

      if (user) {
        uploadAllInitialDataToCloud(user.uid, {
          accounts: data.accounts || accounts,
          transactions: data.transactions || transactions,
          caris: data.caris || caris,
          upcomingDues: data.upcomingDues || upcomingDues,
          categories: data.categories || categories,
        });
      }

      showToast('Yedek başarıyla yüklendi ve senkronize edildi!', 'success');
      return true;
    } catch (e) {
      console.error('Import error:', e);
      showToast('Yedek dosyası işlenirken hata oluştu!', 'error');
      return false;
    }
  };

  // Excel Import
  const importDataFromExcel = async (
    file: File
  ): Promise<{ transactionsCount: number; carisCount: number }> => {
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelData(buffer, accounts, caris);

      if (result.errors.length > 0 && result.newTransactions.length === 0) {
        showToast(`Excel aktarım hatası: ${result.errors[0]}`, 'error');
        return { transactionsCount: 0, carisCount: 0 };
      }

      if (result.newTransactions.length === 0) {
        showToast('Excel dosyasında içe aktarılacak geçerli satır bulunamadı.', 'error');
        return { transactionsCount: 0, carisCount: 0 };
      }

      // Add new caris if any
      if (result.newCaris.length > 0) {
        setCaris(prev => [...prev, ...result.newCaris]);
        if (user) {
          result.newCaris.forEach(c => syncCariToCloud(user.uid, c));
        }
      }

      // Add transactions
      setTransactions(prev => [...result.newTransactions, ...prev]);
      if (user) {
        result.newTransactions.forEach((tx: Transaction) => syncTransactionToCloud(user.uid, tx));
      }

      // Update account balances
      setAccounts(result.updatedAccounts);
      if (user) {
        result.updatedAccounts.forEach(acc => syncAccountToCloud(user.uid, acc));
      }

      showToast(
        `Excel'den ${result.newTransactions.length} işlem ve ${result.newCaris.length} yeni cari eklendi!`,
        'success'
      );

      return {
        transactionsCount: result.newTransactions.length,
        carisCount: result.newCaris.length,
      };
    } catch (err: any) {
      console.error('Excel import error:', err);
      showToast(`Excel okuma hatası: ${err?.message || 'Bilinmeyen hata'}`, 'error');
      return { transactionsCount: 0, carisCount: 0 };
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        transactions,
        accounts,
        caris,
        upcomingDues,
        categories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        executeTransfer,
        addCari,
        updateCari,
        deleteCari,
        addUpcomingDue,
        toggleUpcomingDue,
        deleteUpcomingDue,
        createInstallmentPlan,
        deleteInstallmentGroup,
        addCategory,
        isTransactionModalOpen,
        prefillTransaction,
        openTransactionModal,
        closeTransactionModal,
        isInstallmentModalOpen,
        installmentModalPrefill,
        openInstallmentModal,
        closeInstallmentModal,
        resetToDefaultData,
        exportDataAsJson,
        importDataFromJson,
        importDataFromExcel,
        toastMessage,
        showToast,
        user,
        isAuthLoading,
        isCloudConnected: !!user,
        isCloudSyncing,
        loginWithGoogle,
        logout,
        syncLocalToCloud,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};