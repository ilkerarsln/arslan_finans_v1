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
  fetchUserDataFromFirestore,
  addTransactionToCloud,
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
  clearAllCloudData,
  fetchUserProfile,
  saveUserProfile,
  subscribeToUserProfile,
  subscribeToAllUsers,
  updateUserRoleInFirestore,
  preAssignUserByEmail,
  checkPreAssignedUser,
  deletePreAssignedUser,
} from '../services/firestoreFinance';
import { exportToExcel } from '../utils/excelExport';
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
  UserProfile,
  UserRole,
  UserPermissions,
} from '../types/finance';
import { calculateInstallmentDate } from '../utils/formatters';
import { parseExcelData } from '../utils/excelImport';

interface FinanceContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  transactions: Transaction[];
  accounts: Account[];
  caris: Cari[];
  upcomingDues: UpcomingDue[];
  categories: CategoryItem[];

  // Role & Authorization state (RBAC)
  userProfile: UserProfile | null;
  userRole: UserRole;
  isAdmin: boolean;
  allUsers: UserProfile[];
  updateUserRole: (targetUserId: string, newRole: UserRole) => Promise<void>;
  preAssignUserRole: (email: string, role: UserRole, displayName?: string) => Promise<void>;
  deleteUserInvitation: (targetUserId: string) => Promise<void>;
  isRoleSimulated: boolean;
  toggleRoleSimulation: () => void;
  permissions: UserPermissions;

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
  exportDataToExcel: () => void;
  exportDataAsJson: () => string;
  importDataFromJson: (jsonStr: string) => boolean;
  importDataFromExcel: (file: File) => Promise<{ transactionsCount: number; carisCount: number }>;
  clearAllToZero: () => Promise<void>;

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
  const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');

  // Firebase Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const isInitialCloudSyncDone = useRef<boolean>(false);

  // User Profile & RBAC state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isRoleSimulated, setIsRoleSimulated] = useState<boolean>(false);

  // Primary admin check: ilkerarslan78@gmail.com is always Admin
  const isPrimaryAdmin = user?.email?.toLowerCase() === 'ilkerarslan78@gmail.com';
  const realRole: UserRole = isPrimaryAdmin ? 'Admin' : (userProfile?.role || 'Standart');
  const userRole: UserRole = isRoleSimulated ? 'Standart' : realRole;
  const isAdmin = userRole === 'Admin';

  const permissions: UserPermissions = {
    canManageUsers: isAdmin,
    canDeleteAccounts: isAdmin,
    canClearDatabase: isAdmin,
    canExportImport: true,
    canDeleteTransactions: isAdmin,
    canDeleteCaris: isAdmin,
  };

  // Financial state - 100% cloud-backed by Firebase Firestore
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [caris, setCaris] = useState<Cari[]>([]);
  const [upcomingDues, setUpcomingDues] = useState<UpcomingDue[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  // Guard active tab navigation
  const setActiveTab = (tab: ActiveTab) => {
    if (tab === 'users' && !isAdmin) {
      showToast('Kullanıcı Yönetimi sayfasına yalnızca Yöneticiler (Admin) erişebilir.', 'error');
      return;
    }
    setActiveTabState(tab);
  };

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

  // Auth listener & live Firestore connection
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time subscription to all registered users list (Only for Admin)
  useEffect(() => {
    if (!user || realRole !== 'Admin') {
      setAllUsers([]);
      return;
    }
    const unsub = subscribeToAllUsers(usersList => {
      setAllUsers(usersList);
    });
    return () => unsub();
  }, [user, realRole]);

  // Fetch immediately with getDocs and listen in real-time with onSnapshot
  useEffect(() => {
    if (!user) {
      isInitialCloudSyncDone.current = false;
      setTransactions([]);
      setCaris([]);
      setUpcomingDues([]);
      setAccounts(INITIAL_ACCOUNTS);
      setCategories(INITIAL_CATEGORIES);
      return;
    }

    const userId = user.uid;
    setIsCloudSyncing(true);

    // 0. User Profile & Role (RBAC) subscription
    const unsubProfile = subscribeToUserProfile(userId, async cloudProfile => {
      if (cloudProfile) {
        if (isPrimaryAdmin && cloudProfile.role !== 'Admin') {
          cloudProfile.role = 'Admin';
          await saveUserProfile(cloudProfile);
        }
        setUserProfile(cloudProfile);
      } else {
        // Check if role was pre-assigned by an admin before user first logged in
        const preAssigned = await checkPreAssignedUser(user.email || '');
        const roleToAssign: UserRole = isPrimaryAdmin
          ? 'Admin'
          : (preAssigned?.role || 'Standart');
        const assignedBy = preAssigned?.assignedBy || (isPrimaryAdmin ? 'Sistem (Ana Yönetici)' : undefined);

        const newProfile: UserProfile = {
          uid: userId,
          email: user.email || '',
          displayName: user.displayName || preAssigned?.displayName || user.email?.split('@')[0] || 'Kullanıcı',
          photoURL: user.photoURL || undefined,
          role: roleToAssign,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          assignedBy,
          isPreAssigned: false,
        };
        await saveUserProfile(newProfile);
        setUserProfile(newProfile);
      }
    });

    // 1. Immediate one-shot fetch via getDocs on page load/refresh
    fetchUserDataFromFirestore(userId).then(cloudData => {
      // If user has accounts in Firestore, use them; otherwise seed initial accounts
      if (cloudData.accounts.length > 0) {
        setAccounts(cloudData.accounts);
      } else {
        INITIAL_ACCOUNTS.forEach(acc => syncAccountToCloud(userId, acc));
        setAccounts(INITIAL_ACCOUNTS);
      }

      if (cloudData.categories.length > 0) {
        setCategories(cloudData.categories);
      } else {
        INITIAL_CATEGORIES.forEach(cat => syncCategoryToCloud(userId, cat));
        setCategories(INITIAL_CATEGORIES);
      }

      setTransactions(cloudData.transactions);
      setCaris(cloudData.caris);
      setUpcomingDues(cloudData.upcomingDues);
      setIsCloudSyncing(false);
      isInitialCloudSyncDone.current = true;
    }).catch(err => {
      console.error('Initial getDocs error:', err);
      setIsCloudSyncing(false);
    });

    // 2. Real-time Firestore onSnapshot listeners for live continuous updates
    const unsubscribeFirestore = subscribeToUserData(userId, {
      onAccounts: cloudAccounts => {
        if (cloudAccounts.length > 0) {
          setAccounts(cloudAccounts);
        }
        setIsCloudSyncing(false);
      },
      onTransactions: cloudTxs => {
        setTransactions(cloudTxs);
      },
      onCaris: cloudCaris => {
        setCaris(cloudCaris);
      },
      onUpcomingDues: cloudDues => {
        setUpcomingDues(cloudDues);
      },
      onCategories: cloudCats => {
        if (cloudCats.length > 0) {
          setCategories(cloudCats);
        }
      },
    });

    return () => {
      unsubProfile();
      unsubscribeFirestore();
    };
  }, [user, isPrimaryAdmin]);

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
      setUserProfile(null);
      setAllUsers([]);
      setTransactions([]);
      setCaris([]);
      setUpcomingDues([]);
      setAccounts(INITIAL_ACCOUNTS);
      setCategories(INITIAL_CATEGORIES);
      setIsRoleSimulated(false);
      showToast('Oturum kapatıldı. Verileriniz Firebase bulut hesabınızda güvende.', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // RBAC Role Management Operations
  const updateUserRole = async (targetUserId: string, newRole: UserRole) => {
    if (!isAdmin) {
      showToast('Kullanıcı rolünü yalnızca Yöneticiler değiştirebilir.', 'error');
      return;
    }
    const adminEmail = user?.email || 'admin@arslan.com';
    try {
      await updateUserRoleInFirestore(targetUserId, newRole, adminEmail);
      setAllUsers(prev =>
        prev.map(u => (u.uid === targetUserId ? { ...u, role: newRole, assignedBy: adminEmail } : u))
      );
      if (user && user.uid === targetUserId) {
        setUserProfile(prev => (prev ? { ...prev, role: newRole, assignedBy: adminEmail } : null));
      }
      showToast(`Kullanıcı rolü '${newRole}' olarak başarıyla güncellendi`, 'success');
    } catch (e: any) {
      showToast(`Rol güncellenemedi: ${e?.message || 'Hata'}`, 'error');
    }
  };

  const preAssignUserRole = async (email: string, role: UserRole, displayName?: string) => {
    if (!isAdmin) {
      showToast('Yeni kullanıcı yetkilendirme yetkisi yalnızca Yöneticilere aittir.', 'error');
      return;
    }
    const adminEmail = user?.email || 'admin@arslan.com';
    try {
      const created = await preAssignUserByEmail(email, role, adminEmail, displayName);
      setAllUsers(prev => {
        const filtered = prev.filter(u => u.email.toLowerCase() !== email.toLowerCase());
        return [created, ...filtered];
      });
      showToast(`${email} için '${role}' rolü tanımlandı`, 'success');
    } catch (e: any) {
      showToast(`Yetkilendirme kaydedilemedi: ${e?.message || 'Hata'}`, 'error');
    }
  };

  const deleteUserInvitation = async (targetUserId: string) => {
    if (!isAdmin) {
      showToast('Yalnızca Yöneticiler kullanıcı kaydı/yetkisi silebilir.', 'error');
      return;
    }
    try {
      await deletePreAssignedUser(targetUserId);
      setAllUsers(prev => prev.filter(u => u.uid !== targetUserId));
      showToast('Kullanıcı kaydı/yetkisi kaldırıldı', 'info');
    } catch (e: any) {
      showToast(`Kayıt silinemedi: ${e?.message || 'Hata'}`, 'error');
    }
  };

  const toggleRoleSimulation = () => {
    if (realRole !== 'Admin') {
      showToast('Simülasyon modu yalnızca Yöneticiler tarafından kullanılabilir.', 'error');
      return;
    }
    setIsRoleSimulated(prev => {
      const next = !prev;
      if (next) {
        showToast('Standart Kullanıcı (Kısıtlı Yetki) simülasyonu başlatıldı.', 'info');
      } else {
        showToast('Yönetici (Admin) görünümüne geri dönüldü.', 'success');
      }
      return next;
    });
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
    } else if (newTx.type === 'Mal Alımı') {
      // Kasadan nakit düşmeden doğrudan ilgili tedarikçiye borç olarak kaydedilir
      if (newTx.cariId) {
        adjustCariBalance(newTx.cariId, -newTx.amount);
      }
      // Vade tarihi girildiyse otomatik olarak Vade Takvimine (UpcomingDue) de ekle
      if (newTx.dueDate) {
        const newDue: UpcomingDue = {
          id: `due-mal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: `Mal Alımı Borcu - ${newTx.cariName || newTx.desc || 'Tedarikçi'}`,
          type: 'Gider',
          amount: newTx.amount,
          dueDate: newTx.dueDate,
          cariId: newTx.cariId,
          cariName: newTx.cariName,
          category: newTx.category || 'Mal Alımı',
          isCompleted: false,
          recurrence: 'Tek Seferlik',
          accountId: newTx.accountId || accounts[0]?.id,
        };
        setUpcomingDues(prev => [newDue, ...prev]);
        if (user) syncUpcomingDueToCloud(user.uid, newDue);
      }
    } else if (newTx.type === 'Transfer' && newTx.targetAccountId) {
      adjustAccountBalance(newTx.accountId, -newTx.amount);
      adjustAccountBalance(newTx.targetAccountId, newTx.amount);
    }

    setTransactions(prev => [newTx, ...prev]);
    if (user) {
      addTransactionToCloud(user.uid, newTx)
        .then(savedTx => {
          if (savedTx.id !== newTx.id) {
            setTransactions(prev => prev.map(t => (t.id === newTx.id ? savedTx : t)));
          }
        })
        .catch(err => {
          console.error('Firestore transaction write error:', err);
          showToast('İşlem bulut veritabanına kaydedilirken hata oluştu', 'error');
        });
    }

    showToast(
      newTx.type === 'Mal Alımı'
        ? `Mal alımı ve tedarikçi borcu kaydedildi: ₺${newTx.amount.toLocaleString('tr-TR')}`
        : `Yeni işlem kaydedildi: ₺${newTx.amount.toLocaleString('tr-TR')}`,
      'success'
    );
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
    } else if (oldTx.type === 'Mal Alımı') {
      if (oldTx.cariId) adjustCariBalance(oldTx.cariId, oldTx.amount);
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
    } else if (updatedTx.type === 'Mal Alımı') {
      if (updatedTx.cariId) adjustCariBalance(updatedTx.cariId, -updatedTx.amount);
    } else if (updatedTx.type === 'Transfer' && updatedTx.targetAccountId) {
      adjustAccountBalance(updatedTx.accountId, -updatedTx.amount);
      adjustAccountBalance(updatedTx.targetAccountId, updatedTx.amount);
    }

    setTransactions(prev => prev.map(t => (t.id === updatedTx.id ? updatedTx : t)));
    if (user) syncTransactionToCloud(user.uid, updatedTx);

    showToast('İşlem güncellendi', 'info');
  };

  const deleteTransaction = (id: string) => {
    if (!permissions.canDeleteTransactions) {
      showToast('İşlem silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }

    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (tx.type === 'Gelir') {
      adjustAccountBalance(tx.accountId, -tx.amount);
      if (tx.cariId) adjustCariBalance(tx.cariId, tx.amount);
    } else if (tx.type === 'Gider') {
      adjustAccountBalance(tx.accountId, tx.amount);
      if (tx.cariId) adjustCariBalance(tx.cariId, -tx.amount);
    } else if (tx.type === 'Mal Alımı') {
      if (tx.cariId) adjustCariBalance(tx.cariId, tx.amount);
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
    if (!permissions.canDeleteAccounts) {
      showToast('Hesap silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
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
    if (!permissions.canDeleteCaris) {
      showToast('Cari kart silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
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

  // Export to multi-sheet Excel (.xlsx)
  const exportDataToExcel = () => {
    try {
      exportToExcel({
        transactions,
        accounts,
        caris,
        upcomingDues,
      });
      showToast('Excel dosyası başarıyla indirildi (.xlsx)', 'success');
    } catch (e) {
      console.error('Excel export error:', e);
      showToast('Excel dışa aktarılırken bir hata oluştu', 'error');
    }
  };

  // Clear all data to clean zero state (both local and cloud)
  const clearAllToZero = async () => {
    if (!permissions.canClearDatabase) {
      showToast('Tüm verileri sıfırlama yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }

    setAccounts(INITIAL_ACCOUNTS);
    setCaris([]);
    setTransactions([]);
    setUpcomingDues([]);
    setCategories(INITIAL_CATEGORIES);

    // Clear cloud
    if (user) {
      setIsCloudSyncing(true);
      try {
        await clearAllCloudData(user.uid);
        await uploadAllInitialDataToCloud(user.uid, {
          accounts: INITIAL_ACCOUNTS,
          transactions: [],
          caris: [],
          upcomingDues: [],
          categories: INITIAL_CATEGORIES,
        });
        showToast('Tüm veriler sıfırlandı ve temizlendi', 'info');
      } catch (err) {
        console.error('Clear cloud error:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    } else {
      showToast('Tüm veriler sıfırlandı ve temizlendi', 'info');
    }
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

        // Role & Authorization state (RBAC)
        userProfile,
        userRole,
        isAdmin,
        allUsers,
        updateUserRole,
        preAssignUserRole,
        deleteUserInvitation,
        isRoleSimulated,
        toggleRoleSimulation,
        permissions,

        // Operations
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
        exportDataToExcel,
        exportDataAsJson,
        importDataFromJson,
        importDataFromExcel,
        clearAllToZero,
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