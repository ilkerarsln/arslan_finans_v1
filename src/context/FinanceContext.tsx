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
  DEFAULT_STAFF_ACCOUNTS,
  loginStaffWithUsername,
  subscribeToStaffAccounts,
  saveStaffAccount,
  updateStaffAccountInFirestore,
  deleteStaffAccount,
  saveDeletionRequestToCloud,
  deleteDeletionRequestFromCloud,
  saveAuditLogToCloud,
} from '../services/firestoreFinance';
import { exportToExcel } from '../utils/excelExport';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CARIS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_UPCOMING_DUES,
  INITIAL_PRODUCT_CATEGORIES,
  INITIAL_SUB_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_VADE_RATES,
  INITIAL_PRICE_LISTS,
  INITIAL_STOCK_ITEMS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
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
  StaffAccount,
  DeletionRequest,
  AuditLogEntry,
  ProductCategory,
  ProductSubCategory,
  ProductBrand,
  VadeRateEntry,
  PriceListEntry,
  StockItem,
  SaleRecord,
  StockPurchaseRecord,
} from '../types/finance';
import { calculateInstallmentDate, formatDate, formatCurrency } from '../utils/formatters';
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
  // Staff & Hybrid Authentication
  staffAccounts: StaffAccount[];
  loginWithUsername: (username: string, password: string) => Promise<boolean>;
  createStaffAccount: (staff: StaffAccount) => Promise<void>;
  updateStaffAccount: (staff: StaffAccount) => Promise<void>;
  removeStaffAccount: (username: string) => Promise<void>;
  // Silme & İptal Onay Mekanizması & Denetim (Audit)
  deletionRequests: DeletionRequest[];
  auditLogs: AuditLogEntry[];
  requestDeleteTransaction: (id: string, reason?: string) => Promise<void>;
  requestDeleteCari: (id: string, reason?: string) => Promise<void>;
  approveDeletionRequest: (requestId: string) => Promise<void>;
  rejectDeletionRequest: (requestId: string, reason?: string) => Promise<void>;
  logAudit: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'performedBy' | 'performedByName' | 'userRole'>) => Promise<void>;
  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string, reason?: string) => void;
  // Account actions
  addAccount: (acc: Omit<Account, 'id'>) => Account;
  updateAccount: (acc: Account) => void;
  deleteAccount: (id: string) => void;
  executeTransfer: (fromAccountId: string, toAccountId: string, amount: number, desc?: string, date?: string) => void;
  // Cari actions
  addCari: (cari: Omit<Cari, 'id'>) => Cari;
  updateCari: (cari: Cari) => void;
  deleteCari: (id: string, reason?: string) => void;
  // Upcoming Dues & Installments
  addUpcomingDue: (due: Omit<UpcomingDue, 'id'>) => UpcomingDue;
  toggleUpcomingDue: (id: string) => void;
  deleteUpcomingDue: (id: string) => void;
  createInstallmentPlan: (plan: InstallmentPlanRequest) => void;
  deleteInstallmentGroup: (groupId: string) => void;
  getWhatsAppReminderUrl: (dueId: string) => string;
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
  // Command Palette & Quick Search
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  // Currency Converter Quick Calculator Modal
  isCurrencyConverterOpen: boolean;
  openCurrencyConverter: () => void;
  closeCurrencyConverter: () => void;
  // Theme (Dark / Light)
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  // Data management
  exportDataToExcel: () => void;
  exportDataAsJson: () => string;
  importDataFromJson: (jsonStr: string) => boolean;
  importDataFromExcel: (file: File) => Promise<{ transactionsCount: number; carisCount: number }>;
  clearAllToZero: () => Promise<void>;
  // Toast notifications
  toastMessage: { text: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  // ERP Mal Alımı & Stok Yönetimi
  stockItems: StockItem[];
  purchases: StockPurchaseRecord[];
  addStockPurchase: (purchase: Omit<StockPurchaseRecord, 'id' | 'createdAt'>) => StockPurchaseRecord;
  updateStockPurchase: (purchase: StockPurchaseRecord) => void;
  deleteStockPurchase: (id: string) => void;
  addStockItem: (item: Omit<StockItem, 'id'>) => StockItem;
  updateStockItem: (item: StockItem) => void;
  deleteStockItem: (id: string) => void;
  adjustStockQuantity: (id: string, delta: number) => void;
  importStockItemsBulk: (items: Array<Omit<StockItem, 'id'>>) => void;
  importPurchasesBulk: (purchases: Array<Omit<StockPurchaseRecord, 'id' | 'createdAt'>>) => void;
  // ERP Kâr Takip & Satış Yönetimi
  sales: SaleRecord[];
  addSaleRecord: (sale: Omit<SaleRecord, 'id' | 'createdAt'>) => SaleRecord;
  updateSaleRecord: (sale: SaleRecord) => void;
  deleteSaleRecord: (id: string) => void;
  importSalesBulk: (sales: Array<Omit<SaleRecord, 'id' | 'createdAt'>>) => void;
  // Quick prefill for sale from stock
  saleModalPrefillProduct: StockItem | null;
  setSaleModalPrefillProduct: (item: StockItem | null) => void;
  // ERP Tanımlamalar
  productCategories: ProductCategory[];
  productSubCategories: ProductSubCategory[];
  productBrands: ProductBrand[];
  vadeRates: VadeRateEntry[];
  priceLists: PriceListEntry[];
  addProductCategory: (cat: Omit<ProductCategory, 'id'>) => void;
  deleteProductCategory: (id: string) => void;
  addProductSubCategory: (sub: Omit<ProductSubCategory, 'id'>) => void;
  deleteProductSubCategory: (id: string) => void;
  addProductBrand: (brand: Omit<ProductBrand, 'id'>) => void;
  deleteProductBrand: (id: string) => void;
  setVadeRate: (monthKey: string, rate: number, notes?: string) => void;
  getVadeRateForMonth: (monthKey: string) => number;
  addPriceList: (priceList: Omit<PriceListEntry, 'id'>) => void;
  updatePriceList: (priceList: PriceListEntry) => void;
  deletePriceList: (id: string) => void;
  // Kasa / Banka Detay Seçimi
  selectedAccountForDetail: Account | null;
  setSelectedAccountForDetail: (acc: Account | null) => void;
  // Cloud Sync state
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

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('arslan_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('arslan_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('arslan_theme', 'light');
      }
    } catch {}
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const openCommandPalette = () => setIsCommandPaletteOpen(true);
  const closeCommandPalette = () => setIsCommandPaletteOpen(false);

  // Currency Converter Modal state
  const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false);
  const openCurrencyConverter = () => setIsCurrencyConverterOpen(true);
  const closeCurrencyConverter = () => setIsCurrencyConverterOpen(false);

  // Quick sale prefill from stock
  const [saleModalPrefillProduct, setSaleModalPrefillProduct] = useState<StockItem | null>(null);

  // Firebase Auth & Internal Staff Auth state
  const [user, setUser] = useState<User | any>(() => {
    try {
      const saved = localStorage.getItem('arslan_active_staff_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const isInitialCloudSyncDone = useRef<boolean>(false);

  // User Profile & RBAC state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('arslan_active_staff_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(DEFAULT_STAFF_ACCOUNTS);
  const [isRoleSimulated, setIsRoleSimulated] = useState<boolean>(false);

  const COMPANY_OWNER_ID = '1krfu1eTFcPHsQ3RW3EWplQLOIi2';
  const isStaffUser = Boolean(
    user?.email?.toLowerCase().endsWith('@arslanfinans.internal') ||
    userProfile?.isStaff ||
    userProfile?.username ||
    user?.isStaff
  );

  const dataStoreUid = user ? (isStaffUser ? COMPANY_OWNER_ID : user.uid) : '';

  const isPrimaryAdmin =
    user?.email?.toLowerCase() === 'ilkerarslan78@gmail.com' ||
    user?.email?.toLowerCase() === 'arslanmobilya78@gmail.com' ||
    userProfile?.username === 'admin' ||
    userProfile?.username === 'ilkerarslan78' ||
    userProfile?.username === 'ilkerarslan78@gmail' ||
    userProfile?.username === 'ilkerarslan78@gmail.com' ||
    userProfile?.username === 'arslanmobilya78@gmail.com' ||
    userProfile?.role === 'Admin' ||
    (user?.email?.toLowerCase().startsWith('admin@') && user?.email?.toLowerCase().endsWith('@arslanfinans.internal'));

  const realRole: UserRole = (isPrimaryAdmin || userProfile?.role === 'Admin') ? 'Admin' : (userProfile?.role || 'Standart');
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

  // Financial state with fallback
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [caris, setCaris] = useState<Cari[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_caris');
      return saved ? JSON.parse(saved) : INITIAL_CARIS;
    } catch {
      return INITIAL_CARIS;
    }
  });

  const [upcomingDues, setUpcomingDues] = useState<UpcomingDue[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_upcoming_dues');
      return saved ? JSON.parse(saved) : INITIAL_UPCOMING_DUES;
    } catch {
      return INITIAL_UPCOMING_DUES;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_stock_items');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_sales_records');
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [purchases, setPurchases] = useState<StockPurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_purchases_records');
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    } catch {
      return INITIAL_PURCHASES;
    }
  });

  const [productCategories, setProductCategories] = useState<ProductCategory[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_product_categories');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCT_CATEGORIES;
    } catch {
      return INITIAL_PRODUCT_CATEGORIES;
    }
  });

  const [productSubCategories, setProductSubCategories] = useState<ProductSubCategory[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_sub_categories');
      return saved ? JSON.parse(saved) : INITIAL_SUB_CATEGORIES;
    } catch {
      return INITIAL_SUB_CATEGORIES;
    }
  });

  const [productBrands, setProductBrands] = useState<ProductBrand[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_brands');
      return saved ? JSON.parse(saved) : INITIAL_BRANDS;
    } catch {
      return INITIAL_BRANDS;
    }
  });

  const [vadeRates, setVadeRates] = useState<VadeRateEntry[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_vade_rates');
      return saved ? JSON.parse(saved) : INITIAL_VADE_RATES;
    } catch {
      return INITIAL_VADE_RATES;
    }
  });

  const [priceLists, setPriceLists] = useState<PriceListEntry[]>(() => {
    try {
      const saved = localStorage.getItem('arslan_price_lists');
      return saved ? JSON.parse(saved) : INITIAL_PRICE_LISTS;
    } catch {
      return INITIAL_PRICE_LISTS;
    }
  });

  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('arslan_transactions', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_accounts', JSON.stringify(accounts));
    } catch {}
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_caris', JSON.stringify(caris));
    } catch {}
  }, [caris]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_upcoming_dues', JSON.stringify(upcomingDues));
    } catch {}
  }, [upcomingDues]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_stock_items', JSON.stringify(stockItems));
    } catch {}
  }, [stockItems]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_sales_records', JSON.stringify(sales));
    } catch {}
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_purchases_records', JSON.stringify(purchases));
    } catch {}
  }, [purchases]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_product_categories', JSON.stringify(productCategories));
    } catch {}
  }, [productCategories]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_sub_categories', JSON.stringify(productSubCategories));
    } catch {}
  }, [productSubCategories]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_brands', JSON.stringify(productBrands));
    } catch {}
  }, [productBrands]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_vade_rates', JSON.stringify(vadeRates));
    } catch {}
  }, [vadeRates]);

  useEffect(() => {
    try {
      localStorage.setItem('arslan_price_lists', JSON.stringify(priceLists));
    } catch {}
  }, [priceLists]);

  const setActiveTab = (tab: ActiveTab) => {
    if (tab === 'users' && !isAdmin) {
      showToast('Kullanıcı Yönetimi sayfasına yalnızca Yöneticiler (Admin) erişebilir.', 'error');
      return;
    }
    if (tab === 'audit' && !isAdmin) {
      showToast('İşlem Denetim Raporu sayfasına yalnızca Yöneticiler (Admin) erişebilir.', 'error');
      return;
    }
    setActiveTabState(tab);
  };

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [prefillTransaction, setPrefillTransaction] = useState<Partial<Transaction> | null>(null);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [installmentModalPrefill, setInstallmentModalPrefill] = useState<Partial<InstallmentPlanRequest> | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem('arslan_active_staff_session');
        localStorage.removeItem('arslan_active_staff_profile');
      } else {
        try {
          const savedSession = localStorage.getItem('arslan_active_staff_session');
          if (savedSession) {
            setUser(JSON.parse(savedSession));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsub = subscribeToStaffAccounts(list => {
      setStaffAccounts(list);
    });
    return () => unsub();
  }, []);

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

  useEffect(() => {
    if (!user || !dataStoreUid) {
      isInitialCloudSyncDone.current = false;
      return;
    }
    const userId = user.uid;
    const targetFinanceId = dataStoreUid;

    // Per Firebase skill guidelines: Only attach onSnapshot listeners if auth is ready and user is authenticated in Firebase Auth
    if (!auth.currentUser) {
      setIsCloudSyncing(false);
      isInitialCloudSyncDone.current = true;
      return;
    }

    setIsCloudSyncing(true);

    const unsubProfile = subscribeToUserProfile(userId, async cloudProfile => {
      if (cloudProfile) {
        if (isPrimaryAdmin && cloudProfile.role !== 'Admin') {
          cloudProfile.role = 'Admin';
          await saveUserProfile(cloudProfile);
        }
        setUserProfile(cloudProfile);
      } else {
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

    fetchUserDataFromFirestore(targetFinanceId).then(cloudData => {
      if (cloudData.accounts.length > 0) {
        setAccounts(cloudData.accounts);
      } else {
        INITIAL_ACCOUNTS.forEach(acc => syncAccountToCloud(targetFinanceId, acc));
        setAccounts(INITIAL_ACCOUNTS);
      }
      if (cloudData.categories.length > 0) {
        setCategories(cloudData.categories);
      } else {
        INITIAL_CATEGORIES.forEach(cat => syncCategoryToCloud(targetFinanceId, cat));
        setCategories(INITIAL_CATEGORIES);
      }
      if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
      if (cloudData.caris.length > 0) setCaris(cloudData.caris);
      if (cloudData.upcomingDues.length > 0) setUpcomingDues(cloudData.upcomingDues);
      if (cloudData.deletionRequests.length > 0) setDeletionRequests(cloudData.deletionRequests);
      if (cloudData.auditLogs.length > 0) setAuditLogs(cloudData.auditLogs);
      setIsCloudSyncing(false);
      isInitialCloudSyncDone.current = true;
    }).catch(err => {
      console.error('Initial getDocs error:', err);
      setIsCloudSyncing(false);
    });

    const unsubscribeFirestore = subscribeToUserData(targetFinanceId, {
      onAccounts: cloudAccounts => {
        if (cloudAccounts.length > 0) setAccounts(cloudAccounts);
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
        if (cloudCats.length > 0) setCategories(cloudCats);
      },
      onDeletionRequests: cloudReqs => {
        setDeletionRequests(cloudReqs);
      },
      onAuditLogs: cloudLogs => {
        setAuditLogs(cloudLogs);
      },
    });

    return () => {
      unsubProfile();
      unsubscribeFirestore();
    };
  }, [user, isPrimaryAdmin, dataStoreUid]);

  const loginWithGoogle = async () => {
    try {
      setIsCloudSyncing(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        localStorage.removeItem('arslan_active_staff_session');
        localStorage.removeItem('arslan_active_staff_profile');
        showToast(`Bulut senkronizasyonu aktif! Hoş geldiniz, ${res.user.displayName || res.user.email}`, 'success');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      showToast(`Giriş yapılamadı: ${error?.message || 'Bilinmeyen hata'}`, 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('arslan_active_staff_session');
      localStorage.removeItem('arslan_active_staff_profile');
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setAllUsers([]);
      setIsRoleSimulated(false);
      showToast('Oturum kapatıldı.', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserRole = async (targetUserId: string, newRole: UserRole) => {
    if (!isAdmin) {
      showToast('Kullanıcı rolü yalnızca Yöneticiler değiştirebilir.', 'error');
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

  const loginWithUsername = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsCloudSyncing(true);
      const { staff, role, profile, authUid } = await loginStaffWithUsername(username, password);

      const staffUser: any = {
        uid: authUid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: null,
        isStaff: true,
        username: staff.username,
        role: role,
      };

      setUser(staffUser);
      setUserProfile(profile);

      try {
        localStorage.setItem('arslan_active_staff_session', JSON.stringify(staffUser));
        localStorage.setItem('arslan_active_staff_profile', JSON.stringify(profile));
      } catch {}

      showToast(`Giriş başarılı! Hoş geldiniz, ${staff.displayName} (${role})`, 'success');
      return true;
    } catch (error: any) {
      console.error('Staff login error:', error);
      const msg = error?.message || 'Giriş yapılamadı';
      showToast(msg, 'error');
      throw error;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const createStaffAccount = async (account: StaffAccount) => {
    if (!isAdmin) {
      showToast('Personel hesabı ekleme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    try {
      await saveStaffAccount(account);
      await logAudit({
        action: 'Ekleme',
        entityType: 'Personel',
        entityId: account.username,
        description: `Yeni personel hesabı eklendi: ${account.displayName} (${account.username}, Rol: ${account.role})`,
      });
      showToast(`${account.displayName} (${account.username}) personeli başarıyla kaydedildi.`, 'success');
    } catch (e: any) {
      showToast(`Personel kaydedilemedi: ${e?.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

  const updateStaffAccount = async (account: StaffAccount) => {
    if (!isAdmin) {
      showToast('Personel hesabı düzenleme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    try {
      await updateStaffAccountInFirestore(account.username, account);
      setStaffAccounts(prev => prev.map(s => s.username === account.username ? account : s));
      await logAudit({
        action: 'Güncelleme',
        entityType: 'Personel',
        entityId: account.username,
        description: `${account.displayName} (${account.username}) personel bilgileri ve rolü güncellendi.`,
      });
      showToast(`${account.displayName} bilgileri güncellendi.`, 'success');
    } catch (e: any) {
      showToast(`Personel güncellenemedi: ${e?.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

  const removeStaffAccount = async (username: string) => {
    if (!isAdmin) {
      showToast('Personel hesabı silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    try {
      await deleteStaffAccount(username);
      await logAudit({
        action: 'Kalıcı Silme',
        entityType: 'Personel',
        entityId: username,
        description: `'${username}' personel hesabı sistemden kaldırıldı.`,
      });
      showToast(`${username} personel hesabı silindi.`, 'success');
    } catch (e: any) {
      showToast(`Personel silinemedi: ${e?.message || 'Bilinmeyen hata'}`, 'error');
    }
  };

  const logAudit = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'performedBy' | 'performedByName' | 'userRole'>) => {
    const actorUser = userProfile?.username || user?.email || 'Anonim';
    const actorName = userProfile?.displayName || user?.displayName || userProfile?.username || user?.email || 'Personel';
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      performedBy: actorUser,
      performedByName: actorName,
      userRole,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    if (user && dataStoreUid) {
      saveAuditLogToCloud(dataStoreUid, newLog);
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

  const syncLocalToCloud = async () => {
    if (!user) {
      showToast('Buluta aktarmak için önce Google ile giriş yapmalısınız.', 'error');
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

  const adjustAccountBalance = (accId: string, delta: number) => {
    setAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === accId) {
          const newAcc = { ...acc, balance: +(acc.balance + delta).toFixed(2) };
          if (user && dataStoreUid) syncAccountToCloud(dataStoreUid, newAcc);
          return newAcc;
        }
        return acc;
      });
      return updated;
    });
  };

  const adjustCariBalance = (cariId: string, delta: number) => {
    setCaris(prev => {
      const updated = prev.map(c => {
        if (c.id === cariId) {
          const newCari = { ...c, balance: +(c.balance + delta).toFixed(2) };
          if (user && dataStoreUid) syncCariToCloud(dataStoreUid, newCari);
          return newCari;
        }
        return c;
      });
      return updated;
    });
  };

  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
    const actorUser = userProfile?.username || user?.email || 'Anonim';
    const actorName = userProfile?.displayName || user?.displayName || userProfile?.username || user?.email || 'Personel';
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || actorUser,
      createdByName: data.createdByName || actorName,
    };

    if (newTx.type === 'Gelir') {
      adjustAccountBalance(newTx.accountId, newTx.amount);
      if (newTx.cariId) {
        adjustCariBalance(newTx.cariId, -newTx.amount);
      }
      if (newTx.isPosOffset && newTx.supplierCariId) {
        adjustCariBalance(newTx.supplierCariId, newTx.amount);
      }
    } else if (newTx.type === 'Gider') {
      adjustAccountBalance(newTx.accountId, -newTx.amount);
      if (newTx.cariId) {
        adjustCariBalance(newTx.cariId, newTx.amount);
      }
    } else if (newTx.type === 'Mal Alımı') {
      if (newTx.cariId) {
        adjustCariBalance(newTx.cariId, -newTx.amount);
      }
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
        if (user && dataStoreUid) syncUpcomingDueToCloud(dataStoreUid, newDue);
      }
    } else if (newTx.type === 'Transfer' && newTx.targetAccountId) {
      adjustAccountBalance(newTx.accountId, -newTx.amount);
      adjustAccountBalance(newTx.targetAccountId, newTx.amount);
    }

    setTransactions(prev => [newTx, ...prev]);

    if (user && dataStoreUid) {
      addTransactionToCloud(dataStoreUid, newTx)
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

    logAudit({
      action: 'Ekleme',
      entityType: newTx.type as any,
      entityId: newTx.id,
      amount: newTx.amount,
      description: `${newTx.type} işlemi eklendi: ₺${newTx.amount.toLocaleString('tr-TR')} (${newTx.desc || newTx.category})${newTx.isPosOffset ? ` [POS Mahsup: ${newTx.supplierCariName}]` : ''}`,
    });

    showToast(
      newTx.isPosOffset
        ? `POS tahsilatı ve tedarikçi mahsubu kaydedildi: ₺${newTx.amount.toLocaleString('tr-TR')}`
        : newTx.type === 'Mal Alımı'
        ? `Mal alımı ve tedarikçi borcu kaydedildi: ₺${newTx.amount.toLocaleString('tr-TR')}`
        : `Yeni işlem kaydedildi: ₺${newTx.amount.toLocaleString('tr-TR')}`,
      'success'
    );
    return newTx;
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find(t => t.id === updatedTx.id);
    if (!oldTx) return;

    if (oldTx.type === 'Gelir') {
      adjustAccountBalance(oldTx.accountId, -oldTx.amount);
      if (oldTx.cariId) adjustCariBalance(oldTx.cariId, oldTx.amount);
      if (oldTx.isPosOffset && oldTx.supplierCariId) {
        adjustCariBalance(oldTx.supplierCariId, -oldTx.amount);
      }
    } else if (oldTx.type === 'Gider') {
      adjustAccountBalance(oldTx.accountId, oldTx.amount);
      if (oldTx.cariId) adjustCariBalance(oldTx.cariId, -oldTx.amount);
    } else if (oldTx.type === 'Mal Alımı') {
      if (oldTx.cariId) adjustCariBalance(oldTx.cariId, oldTx.amount);
    } else if (oldTx.type === 'Transfer' && oldTx.targetAccountId) {
      adjustAccountBalance(oldTx.accountId, oldTx.amount);
      adjustAccountBalance(oldTx.targetAccountId, -oldTx.amount);
    }

    if (updatedTx.type === 'Gelir') {
      adjustAccountBalance(updatedTx.accountId, updatedTx.amount);
      if (updatedTx.cariId) adjustCariBalance(updatedTx.cariId, -updatedTx.amount);
      if (updatedTx.isPosOffset && updatedTx.supplierCariId) {
        adjustCariBalance(updatedTx.supplierCariId, updatedTx.amount);
      }
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
    if (user && dataStoreUid) syncTransactionToCloud(dataStoreUid, updatedTx);

    logAudit({
      action: 'Güncelleme',
      entityType: updatedTx.type as any,
      entityId: updatedTx.id,
      amount: updatedTx.amount,
      description: `${updatedTx.type} işlemi güncellendi: ₺${updatedTx.amount.toLocaleString('tr-TR')}`,
    });
    showToast('İşlem güncellendi', 'info');
  };

  const deleteTransaction = (id: string, reason?: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (!isAdmin) {
      requestDeleteTransaction(id, reason || 'Personel işlem iptal talebi');
      return;
    }

    if (tx.type === 'Gelir') {
      adjustAccountBalance(tx.accountId, -tx.amount);
      if (tx.cariId) adjustCariBalance(tx.cariId, tx.amount);
      if (tx.isPosOffset && tx.supplierCariId) {
        adjustCariBalance(tx.supplierCariId, -tx.amount);
      }
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
    if (user && dataStoreUid) deleteTransactionFromCloud(dataStoreUid, id);

    const pendingReq = deletionRequests.find(r => r.targetId === id);
    if (pendingReq) {
      setDeletionRequests(prev => prev.filter(r => r.id !== pendingReq.id));
      if (user && dataStoreUid) deleteDeletionRequestFromCloud(dataStoreUid, pendingReq.id);
    }

    logAudit({
      action: 'Kalıcı Silme',
      entityType: tx.type as any,
      entityId: tx.id,
      amount: tx.amount,
      description: `${tx.type} işlemi yönetici tarafından kalıcı olarak silindi: ₺${tx.amount.toLocaleString('tr-TR')} (${tx.desc || tx.category})`,
    });
    showToast('İşlem kalıcı olarak silindi ve bakiyeler geri alındı', 'info');
  };

  const requestDeleteTransaction = async (id: string, reason?: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (isAdmin) {
      deleteTransaction(id);
      return;
    }

    const actorUser = userProfile?.username || user?.email || 'Personel';
    const actorName = userProfile?.displayName || user?.displayName || userProfile?.username || user?.email || 'Personel';
    const reqId = `del-tx-${Date.now()}`;
    const req: DeletionRequest = {
      id: reqId,
      targetType: 'transaction',
      targetId: tx.id,
      targetTitle: `${tx.type} - ${tx.desc || tx.category} (₺${tx.amount.toLocaleString('tr-TR')})`,
      amount: tx.amount,
      requestedBy: actorUser,
      requestedByName: actorName,
      requestedAt: new Date().toISOString(),
      reason: reason?.trim() || 'Personel tarafından silme/iptal talebi oluşturuldu.',
      status: 'pending',
    };
    setDeletionRequests(prev => [req, ...prev]);
    if (user && dataStoreUid) {
      saveDeletionRequestToCloud(dataStoreUid, req);
    }

    const flaggedTx: Transaction = {
      ...tx,
      pendingDeletion: true,
      deletionRequestedBy: actorUser,
      deletionRequestedByName: actorName,
      deletionRequestedAt: req.requestedAt,
      deletionReason: req.reason,
    };
    setTransactions(prev => prev.map(t => (t.id === tx.id ? flaggedTx : t)));
    if (user && dataStoreUid) {
      syncTransactionToCloud(dataStoreUid, flaggedTx);
    }

    logAudit({
      action: 'Silme Talebi',
      entityType: tx.type as any,
      entityId: tx.id,
      amount: tx.amount,
      description: `${tx.type} işlemi için silme talebi oluşturuldu (${req.reason}). Yönetici onayı bekleniyor.`,
    });
    showToast('Silme talebiniz oluşturuldu ve Yönetici (Admin) onayına iletildi.', 'info');
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
      desc: desc || `${fromAcc.name} → ${toAcc.name} Transfer`,
      amount,
      accountId: fromAccountId,
      targetAccountId: toAccountId,
      status: 'Tamamlandı',
    });
  };

  const addAccount = (acc: Omit<Account, 'id'>): Account => {
    const newAcc: Account = {
      ...acc,
      id: `acc-${Date.now()}`,
    };
    setAccounts(prev => [...prev, newAcc]);
    if (user && dataStoreUid) syncAccountToCloud(dataStoreUid, newAcc);
    showToast(`${newAcc.name} hesabı eklendi`, 'success');
    return newAcc;
  };

  const updateAccount = (acc: Account) => {
    setAccounts(prev => prev.map(a => (a.id === acc.id ? acc : a)));
    if (user && dataStoreUid) syncAccountToCloud(dataStoreUid, acc);
    showToast(`${acc.name} güncellendi`, 'info');
  };

  const deleteAccount = (id: string) => {
    if (!permissions.canDeleteAccounts) {
      showToast('Hesap silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (user && dataStoreUid) deleteAccountFromCloud(dataStoreUid, id);
    showToast('Hesap silindi', 'info');
  };

  const addCari = (cari: Omit<Cari, 'id'>): Cari => {
    const newCari: Cari = {
      ...cari,
      id: `cari-${Date.now()}`,
    };
    setCaris(prev => [...prev, newCari]);
    if (user && dataStoreUid) syncCariToCloud(dataStoreUid, newCari);
    showToast(`${newCari.name} cari kartı oluşturuldu`, 'success');
    return newCari;
  };

  const updateCari = (cari: Cari) => {
    setCaris(prev => prev.map(c => (c.id === cari.id ? cari : c)));
    if (user && dataStoreUid) syncCariToCloud(dataStoreUid, cari);
    showToast('Cari bilgisi güncellendi', 'info');
  };

  const deleteCari = (id: string, reason?: string) => {
    const cari = caris.find(c => c.id === id);
    if (!cari) return;
    if (!isAdmin) {
      requestDeleteCari(id, reason || 'Personel cari kart silme talebi');
      return;
    }
    setCaris(prev => prev.filter(c => c.id !== id));
    if (user && dataStoreUid) deleteCariFromCloud(dataStoreUid, id);
    const pendingReq = deletionRequests.find(r => r.targetId === id);
    if (pendingReq) {
      setDeletionRequests(prev => prev.filter(r => r.id !== pendingReq.id));
      if (user && dataStoreUid) deleteDeletionRequestFromCloud(dataStoreUid, pendingReq.id);
    }
    logAudit({
      action: 'Kalıcı Silme',
      entityType: 'Cari',
      entityId: cari.id,
      amount: cari.balance,
      description: `'${cari.name}' (${cari.type}) cari kartı yönetici tarafından silindi.`,
    });
    showToast(`'${cari.name}' cari kartı silindi`, 'info');
  };

  const requestDeleteCari = async (id: string, reason?: string) => {
    const cari = caris.find(c => c.id === id);
    if (!cari) return;
    if (isAdmin) {
      deleteCari(id);
      return;
    }
    const actorUser = userProfile?.username || user?.email || 'Personel';
    const actorName = userProfile?.displayName || user?.displayName || userProfile?.username || user?.email || 'Personel';
    const reqId = `del-cari-${Date.now()}`;
    const req: DeletionRequest = {
      id: reqId,
      targetType: 'cari',
      targetId: cari.id,
      targetTitle: `Cari Kart: ${cari.name} (${cari.type})`,
      amount: cari.balance,
      requestedBy: actorUser,
      requestedByName: actorName,
      requestedAt: new Date().toISOString(),
      reason: reason?.trim() || 'Personel tarafından cari silme talebi oluşturuldu.',
      status: 'pending',
    };
    setDeletionRequests(prev => [req, ...prev]);
    if (user && dataStoreUid) {
      saveDeletionRequestToCloud(dataStoreUid, req);
    }
    logAudit({
      action: 'Silme Talebi',
      entityType: 'Cari',
      entityId: cari.id,
      amount: cari.balance,
      description: `'${cari.name}' cari hesabı için silme talebi oluşturuldu (${req.reason}). Yönetici onayı bekleniyor.`,
    });
    showToast('Cari kart silme talebiniz Yönetici (Admin) onayına iletildi.', 'info');
  };

  const approveDeletionRequest = async (requestId: string) => {
    if (!isAdmin) {
      showToast('Silme taleplerini yalnızca Yöneticiler (Admin) onaylayabilir.', 'error');
      return;
    }
    const req = deletionRequests.find(r => r.id === requestId);
    if (!req) return;

    if (req.targetType === 'transaction') {
      const tx = transactions.find(t => t.id === req.targetId);
      if (tx) {
        if (tx.type === 'Gelir') {
          adjustAccountBalance(tx.accountId, -tx.amount);
          if (tx.cariId) adjustCariBalance(tx.cariId, tx.amount);
          if (tx.isPosOffset && tx.supplierCariId) {
            adjustCariBalance(tx.supplierCariId, -tx.amount);
          }
        } else if (tx.type === 'Gider') {
          adjustAccountBalance(tx.accountId, tx.amount);
          if (tx.cariId) adjustCariBalance(tx.cariId, -tx.amount);
        } else if (tx.type === 'Mal Alımı') {
          if (tx.cariId) adjustCariBalance(tx.cariId, tx.amount);
        } else if (tx.type === 'Transfer' && tx.targetAccountId) {
          adjustAccountBalance(tx.accountId, tx.amount);
          adjustAccountBalance(tx.targetAccountId, -tx.amount);
        }
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
        if (user && dataStoreUid) deleteTransactionFromCloud(dataStoreUid, tx.id);
      }
    } else if (req.targetType === 'cari') {
      setCaris(prev => prev.filter(c => c.id !== req.targetId));
      if (user && dataStoreUid) deleteCariFromCloud(dataStoreUid, req.targetId);
    }

    setDeletionRequests(prev => prev.filter(r => r.id !== requestId));
    if (user && dataStoreUid) {
      deleteDeletionRequestFromCloud(dataStoreUid, requestId);
    }
    logAudit({
      action: 'Silme Onayı',
      entityType: req.targetType === 'transaction' ? 'Gelir' : 'Cari',
      entityId: req.targetId,
      amount: req.amount,
      description: `Silme talebi onaylandı ve kalıcı olarak silindi: ${req.targetTitle} (Talep eden: ${req.requestedByName})`,
    });
    showToast('Silme talebi onaylandı ve işlem sistemden kaldırıldı.', 'success');
  };

  const rejectDeletionRequest = async (requestId: string, reason?: string) => {
    if (!isAdmin) {
      showToast('Silme taleplerini yalnızca Yöneticiler (Admin) reddedebilir.', 'error');
      return;
    }
    const req = deletionRequests.find(r => r.id === requestId);
    if (!req) return;

    if (req.targetType === 'transaction') {
      const tx = transactions.find(t => t.id === req.targetId);
      if (tx) {
        const unflagged: Transaction = {
          ...tx,
          pendingDeletion: false,
          deletionRequestedBy: undefined,
          deletionRequestedByName: undefined,
          deletionRequestedAt: undefined,
          deletionReason: undefined,
        };
        setTransactions(prev => prev.map(t => (t.id === tx.id ? unflagged : t)));
        if (user && dataStoreUid) syncTransactionToCloud(dataStoreUid, unflagged);
      }
    }

    setDeletionRequests(prev => prev.filter(r => r.id !== requestId));
    if (user && dataStoreUid) {
      deleteDeletionRequestFromCloud(dataStoreUid, requestId);
    }
    logAudit({
      action: 'Silme Reddi',
      entityType: req.targetType === 'transaction' ? 'Gelir' : 'Cari',
      entityId: req.targetId,
      amount: req.amount,
      description: `Silme talebi yönetici tarafından reddedildi: ${req.targetTitle}${reason ? ` (Gerekçe: ${reason})` : ''}`,
    });
    showToast('Silme talebi reddedildi ve işlem aktif tutuldu.', 'info');
  };

  const addUpcomingDue = (due: Omit<UpcomingDue, 'id'>): UpcomingDue => {
    const newDue: UpcomingDue = {
      ...due,
      id: `due-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    setUpcomingDues(prev => [...prev, newDue]);
    if (user && dataStoreUid) syncUpcomingDueToCloud(dataStoreUid, newDue);
    showToast('Ödeme/Tahsilat takvime eklendi', 'success');
    return newDue;
  };

  const toggleUpcomingDue = (id: string) => {
    const target = upcomingDues.find(d => d.id === id);
    if (!target) return;
    const newCompleted = !target.isCompleted;
    const updated = { ...target, isCompleted: newCompleted };
    setUpcomingDues(prev => prev.map(d => (d.id === id ? updated : d)));
    if (user && dataStoreUid) syncUpcomingDueToCloud(dataStoreUid, updated);
    if (newCompleted) {
      showToast(`'${target.title}' tamamlandı olarak işaretlendi`, 'success');
    }
  };

  const deleteUpcomingDue = (id: string) => {
    setUpcomingDues(prev => prev.filter(d => d.id !== id));
    if (user && dataStoreUid) deleteUpcomingDueFromCloud(dataStoreUid, id);
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
      if (user && dataStoreUid) syncUpcomingDueToCloud(dataStoreUid, dueItem);
    }
    setUpcomingDues(prev => [...prev, ...newDues]);
    showToast(`${count} taksitli vade planı başarıyla oluşturuldu`, 'success');
  };

  const deleteInstallmentGroup = (groupId: string) => {
    const toDelete = upcomingDues.filter(d => d.installmentGroupId === groupId);
    setUpcomingDues(prev => prev.filter(d => d.installmentGroupId !== groupId));
    if (user && dataStoreUid) {
      toDelete.forEach(d => deleteUpcomingDueFromCloud(dataStoreUid, d.id));
    }
    showToast('Taksit grubu takvimden kaldırıldı', 'info');
  };

  const getWhatsAppReminderUrl = (dueId: string): string => {
    const due = upcomingDues.find(d => d.id === dueId);
    if (!due) return '';
    const cari = caris.find(c => c.id === due.cariId || (due.cariName && c.name.toLowerCase() === due.cariName.toLowerCase()));
    const phone = cari?.phone ? cari.phone.replace(/[^0-9]/g, '') : '';
    const targetPhone = phone.startsWith('0') ? `90${phone.slice(1)}` : phone.startsWith('90') ? phone : `90${phone}`;
    const message = `Sayın ${due.cariName || 'Müşterimiz'}, Arslan Mobilya finans kaydınızda ${formatDate(due.dueDate)} vadeli ${formatCurrency(due.amount)} tutarındaki ${due.title} ödemeniz bulunmaktadır. Detaylı bilgi için teşekkür ederiz.`;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  };

  const addCategory = (name: string, type: 'Gelir' | 'Gider', color = '#059669') => {
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name,
      type,
      color,
    };
    setCategories(prev => [...prev, newCat]);
    if (user && dataStoreUid) syncCategoryToCloud(dataStoreUid, newCat);
    showToast(`'${name}' kategorisi eklendi`, 'success');
  };

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

    if (user && dataStoreUid) {
      setIsCloudSyncing(true);
      try {
        await clearAllCloudData(dataStoreUid);
        await uploadAllInitialDataToCloud(dataStoreUid, {
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

  const exportDataAsJson = (): string => {
    const backup = {
      version: '2.4',
      exportedAt: new Date().toISOString(),
      transactions,
      accounts,
      caris,
      upcomingDues,
      categories,
      stockItems,
      sales,
      purchases,
      productCategories,
      productSubCategories,
      productBrands,
      vadeRates,
      priceLists,
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
      if (Array.isArray(data.stockItems)) setStockItems(data.stockItems);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (Array.isArray(data.productCategories)) setProductCategories(data.productCategories);
      if (Array.isArray(data.productSubCategories)) setProductSubCategories(data.productSubCategories);
      if (Array.isArray(data.productBrands)) setProductBrands(data.productBrands);
      if (Array.isArray(data.vadeRates)) setVadeRates(data.vadeRates);
      if (Array.isArray(data.priceLists)) setPriceLists(data.priceLists);

      if (user && dataStoreUid) {
        uploadAllInitialDataToCloud(dataStoreUid, {
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

      if (result.newCaris.length > 0) {
        setCaris(prev => [...prev, ...result.newCaris]);
        if (user && dataStoreUid) {
          result.newCaris.forEach(c => syncCariToCloud(dataStoreUid, c));
        }
      }

      setTransactions(prev => [...result.newTransactions, ...prev]);
      if (user && dataStoreUid) {
        result.newTransactions.forEach((tx: Transaction) => syncTransactionToCloud(dataStoreUid, tx));
      }

      setAccounts(result.updatedAccounts);
      if (user && dataStoreUid) {
        result.updatedAccounts.forEach(acc => syncAccountToCloud(dataStoreUid, acc));
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

  // ERP Stock & Purchase
  const addStockPurchase = (purchaseData: Omit<StockPurchaseRecord, 'id' | 'createdAt'>): StockPurchaseRecord => {
    const actorUser = userProfile?.username || user?.email || 'Anonim';
    const actorName = userProfile?.displayName || user?.displayName || userProfile?.username || user?.email || 'Personel';
    const newPurchase: StockPurchaseRecord = {
      ...purchaseData,
      id: `pur-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      createdBy: actorUser,
      createdByName: actorName,
    };

    setStockItems(prev => {
      let updatedList = [...prev];
      for (const item of newPurchase.items) {
        const existingIdx = updatedList.findIndex(
          s => (item.productId && s.id === item.productId) || (s.name.trim().toLowerCase() === item.name.trim().toLowerCase())
        );
        if (existingIdx >= 0) {
          const old = updatedList[existingIdx];
          const newQty = old.quantity + item.quantity;
          const newTotalVal = +(newQty * item.unitPrice).toFixed(2);
          updatedList[existingIdx] = {
            ...old,
            quantity: newQty,
            purchasePrice: item.unitPrice,
            totalValue: newTotalVal,
            salePrice: item.salePrice || old.salePrice,
            lastPurchaseDate: newPurchase.date,
          };
        } else {
          const newStock: StockItem = {
            id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.name,
            category: item.category || 'Beyaz Eşya',
            subCategory: item.subCategory,
            brand: item.brand,
            supplierId: newPurchase.supplierId,
            supplierName: newPurchase.supplierName,
            quantity: item.quantity,
            unit: 'Adet',
            purchasePrice: item.unitPrice,
            totalValue: +(item.quantity * item.unitPrice).toFixed(2),
            salePrice: item.salePrice || +(item.unitPrice * 1.35).toFixed(2),
            lastPurchaseDate: newPurchase.date,
          };
          updatedList.push(newStock);
        }
      }
      return updatedList;
    });

    if (newPurchase.supplierId) {
      adjustCariBalance(newPurchase.supplierId, -newPurchase.totalAmount);
    }

    if (newPurchase.paymentType === 'Peşin Kasa/Banka' && newPurchase.accountId) {
      adjustAccountBalance(newPurchase.accountId, -newPurchase.totalAmount);
    }

    addTransaction({
      date: newPurchase.date,
      dueDate: newPurchase.dueDate,
      type: 'Mal Alımı',
      category: 'Mal / Stok Alımı',
      cariId: newPurchase.supplierId,
      cariName: newPurchase.supplierName,
      desc: `${newPurchase.supplierName} - Mal Alımı (${newPurchase.items.map(i => i.name).join(', ')})`,
      amount: newPurchase.totalAmount,
      accountId: newPurchase.accountId || accounts[0]?.id || 'acc-banka',
      status: 'Tamamlandı',
      documentNo: newPurchase.documentNo,
    });

    if (newPurchase.dueDate && newPurchase.paymentType !== 'Peşin Kasa/Banka') {
      addUpcomingDue({
        title: `Mal Alımı Ödemesi - ${newPurchase.supplierName}`,
        type: 'Gider',
        amount: newPurchase.totalAmount,
        dueDate: newPurchase.dueDate,
        cariId: newPurchase.supplierId,
        cariName: newPurchase.supplierName,
        category: 'Mal / Stok Alımı',
        isCompleted: false,
        recurrence: 'Tek Seferlik',
        accountId: newPurchase.accountId || accounts[0]?.id,
      });
    }

    setPurchases(prev => [newPurchase, ...prev]);
    logAudit({
      action: 'Ekleme',
      entityType: 'Stok',
      entityId: newPurchase.id,
      amount: newPurchase.totalAmount,
      description: `Mal Alımı kaydedildi: ${newPurchase.supplierName} (₺${newPurchase.totalAmount.toLocaleString('tr-TR')})`,
    });
    showToast('Mal alımı başarıyla kaydedildi, stok ve tedarikçi cari borcu güncellendi.', 'success');
    return newPurchase;
  };

  const updateStockPurchase = (updated: StockPurchaseRecord) => {
    setPurchases(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    showToast(`"${updated.documentNo}" nolu mal alımı güncellendi.`, 'success');
  };

  const deleteStockPurchase = (id: string) => {
    if (!isAdmin) {
      showToast('Alım kaydı silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;
    if (window.confirm(`"${pur.documentNo}" nolu mal alım kaydını silmek istediğinize emin misiniz?`)) {
      if (pur.supplierId) {
        adjustCariBalance(pur.supplierId, pur.totalAmount);
      }
      setPurchases(prev => prev.filter(p => p.id !== id));
      showToast('Mal alım kaydı silindi ve tedarikçi borcu düzeltildi.', 'info');
    }
  };

  const addStockItem = (itemData: Omit<StockItem, 'id'>): StockItem => {
    const newItem: StockItem = {
      ...itemData,
      id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      totalValue: +(itemData.quantity * itemData.purchasePrice).toFixed(2),
    };
    setStockItems(prev => [newItem, ...prev]);
    showToast(`${newItem.name} stoğa eklendi`, 'success');
    return newItem;
  };

  const updateStockItem = (updated: StockItem) => {
    setStockItems(prev =>
      prev.map(item =>
        item.id === updated.id
          ? { ...updated, totalValue: +(updated.quantity * updated.purchasePrice).toFixed(2) }
          : item
      )
    );
    showToast(`${updated.name} stok kartı güncellendi`, 'info');
  };

  const deleteStockItem = (id: string) => {
    if (!isAdmin) {
      showToast('Stok kartı silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    setStockItems(prev => prev.filter(item => item.id !== id));
    showToast('Stok kartı silindi', 'info');
  };

  const adjustStockQuantity = (id: string, delta: number) => {
    setStockItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            totalValue: +(newQty * item.purchasePrice).toFixed(2),
          };
        }
        return item;
      })
    );
    showToast(`Stok adedi güncellendi (${delta > 0 ? `+${delta}` : delta})`, 'info');
  };

  const importStockItemsBulk = (newItems: Array<Omit<StockItem, 'id'>>) => {
    const formatted: StockItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `stk-import-${Date.now()}-${idx}`,
      totalValue: +(item.quantity * item.purchasePrice).toFixed(2),
    }));
    setStockItems(prev => [...formatted, ...prev]);
    showToast(`${formatted.length} adet stok kartı başarıyla içe aktarıldı!`, 'success');
  };

  const importPurchasesBulk = (purchaseList: Array<Omit<StockPurchaseRecord, 'id' | 'createdAt'>>) => {
    purchaseList.forEach(p => addStockPurchase(p));
  };

  // ERP Profit & Sales
  const addSaleRecord = (saleData: Omit<SaleRecord, 'id' | 'createdAt'>): SaleRecord => {
    const actorUser = userProfile?.username || user?.email || 'Anonim';
    const newSale: SaleRecord = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      createdBy: actorUser,
    };

    if (newSale.productId) {
      setStockItems(prev =>
        prev.map(stk => {
          if (stk.id === newSale.productId) {
            const nextQty = Math.max(0, stk.quantity - newSale.quantity);
            return {
              ...stk,
              quantity: nextQty,
              totalValue: +(nextQty * stk.purchasePrice).toFixed(2),
            };
          }
          return stk;
        })
      );
    }

    if (newSale.saleType === 'Senetli Satış') {
      if (newSale.customerId) {
        adjustCariBalance(newSale.customerId, newSale.totalSaleAmount);
      }
      if (newSale.installmentsCount && newSale.installmentsCount > 1) {
        const monthlyInstallment = +(newSale.totalSaleAmount / newSale.installmentsCount).toFixed(2);
        for (let i = 1; i <= Math.min(newSale.installmentsCount, 12); i++) {
          const installmentDate = calculateInstallmentDate(newSale.date, i);
          addUpcomingDue({
            title: `Senet Taksiti ${i}/${newSale.installmentsCount} - ${newSale.customerName}`,
            type: 'Gelir',
            amount: monthlyInstallment,
            dueDate: installmentDate,
            cariId: newSale.customerId,
            cariName: newSale.customerName,
            category: 'Senet Tahsilatı',
            isCompleted: false,
            recurrence: 'Tek Seferlik',
            accountId: newSale.accountId || accounts[0]?.id,
          });
        }
      }
    } else if (newSale.accountId) {
      adjustAccountBalance(newSale.accountId, newSale.totalSaleAmount);
      addTransaction({
        date: newSale.date,
        type: 'Gelir',
        category: 'Mobilya & Beyaz Eşya Satışı',
        cariId: newSale.customerId,
        cariName: newSale.customerName,
        desc: `${newSale.productName} Satışı (${newSale.saleType})`,
        amount: newSale.totalSaleAmount,
        accountId: newSale.accountId,
        status: 'Tamamlandı',
        documentNo: newSale.documentNo,
      });
    }

    setSales(prev => [newSale, ...prev]);
    logAudit({
      action: 'Ekleme',
      entityType: 'Satış',
      entityId: newSale.id,
      amount: newSale.totalSaleAmount,
      description: `Satış kaydedildi: ${newSale.productName} -> ${newSale.customerName} (${newSale.saleType}, Personel: ${newSale.salesPerson}, Net Kâr: ₺${newSale.netProfit.toLocaleString('tr-TR')})`,
    });
    showToast(`Satış kaydedildi. Net Kâr: ₺${newSale.netProfit.toLocaleString('tr-TR')}`, 'success');
    return newSale;
  };

  const updateSaleRecord = (updated: SaleRecord) => {
    setSales(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    showToast('Satış kaydı güncellendi', 'info');
  };

  const deleteSaleRecord = (id: string) => {
    if (!isAdmin) {
      showToast('Satış kaydı silme yetkisi yalnızca Yöneticilere (Admin) aittir.', 'error');
      return;
    }
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    if (window.confirm(`"${sale.customerName}" adına yapılan ${sale.productName} satışını silmek istediğinize emin misiniz?`)) {
      if (sale.productId) {
        setStockItems(prev =>
          prev.map(stk =>
            stk.id === sale.productId
              ? {
                  ...stk,
                  quantity: stk.quantity + sale.quantity,
                  totalValue: +((stk.quantity + sale.quantity) * stk.purchasePrice).toFixed(2),
                }
              : stk
          )
        );
      }
      if (sale.saleType === 'Senetli Satış' && sale.customerId) {
        adjustCariBalance(sale.customerId, -sale.totalSaleAmount);
      } else if (sale.accountId) {
        adjustAccountBalance(sale.accountId, -sale.totalSaleAmount);
      }
      setSales(prev => prev.filter(s => s.id !== id));
      showToast('Satış kaydı silindi ve stok geri yüklendi.', 'info');
    }
  };

  const importSalesBulk = (newSalesList: Array<Omit<SaleRecord, 'id' | 'createdAt'>>) => {
    const formatted: SaleRecord[] = newSalesList.map((s, idx) => ({
      ...s,
      id: `sale-import-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    formatted.forEach(s => {
      if (s.productId) {
        adjustStockQuantity(s.productId, -s.quantity);
      }
      if (s.saleType === 'Senetli Satış' && s.customerId) {
        adjustCariBalance(s.customerId, s.totalSaleAmount);
      } else if (s.accountId) {
        adjustAccountBalance(s.accountId, s.totalSaleAmount);
      }
    });

    setSales(prev => [...formatted, ...prev]);
    showToast(`${formatted.length} adet satış kaydı başarıyla aktarıldı!`, 'success');
  };

  // Definitions
  const addProductCategory = (cat: Omit<ProductCategory, 'id'>) => {
    const newCat: ProductCategory = {
      ...cat,
      id: `pcat-${Date.now()}`,
    };
    setProductCategories(prev => [...prev, newCat]);
    showToast(`'${newCat.name}' kategorisi eklendi`, 'success');
  };

  const deleteProductCategory = (id: string) => {
    setProductCategories(prev => prev.filter(c => c.id !== id));
    showToast('Kategori silindi', 'info');
  };

  const addProductSubCategory = (sub: Omit<ProductSubCategory, 'id'>) => {
    const newSub: ProductSubCategory = {
      ...sub,
      id: `sub-${Date.now()}`,
    };
    setProductSubCategories(prev => [...prev, newSub]);
    showToast(`'${newSub.name}' alt kategorisi eklendi`, 'success');
  };

  const deleteProductSubCategory = (id: string) => {
    setProductSubCategories(prev => prev.filter(s => s.id !== id));
    showToast('Alt kategori silindi', 'info');
  };

  const addProductBrand = (brand: Omit<ProductBrand, 'id'>) => {
    const newBrand: ProductBrand = {
      ...brand,
      id: `brand-${Date.now()}`,
    };
    setProductBrands(prev => [...prev, newBrand]);
    showToast(`'${newBrand.name}' markası eklendi`, 'success');
  };

  const deleteProductBrand = (id: string) => {
    setProductBrands(prev => prev.filter(b => b.id !== id));
    showToast('Marka silindi', 'info');
  };

  const setVadeRate = (monthKey: string, rate: number, notes?: string) => {
    setVadeRates(prev => {
      const filtered = prev.filter(v => v.monthKey !== monthKey);
      return [
        {
          id: `vr-${monthKey}`,
          monthKey,
          rateMonthly: rate,
          notes: notes || `${monthKey} Vade Farkı Oranı`,
        },
        ...filtered,
      ];
    });
    showToast(`${monthKey} için aylık vade farkı %${rate} olarak kaydedildi.`, 'success');
  };

  const getVadeRateForMonth = (monthKey: string): number => {
    const found = vadeRates.find(v => v.monthKey === monthKey);
    return found ? found.rateMonthly : 3.5;
  };

  const addPriceList = (priceList: Omit<PriceListEntry, 'id'>) => {
    const newEntry: PriceListEntry = {
      ...priceList,
      id: `pl-${Date.now()}`,
    };
    setPriceLists(prev => [newEntry, ...prev]);
    showToast(`'${newEntry.title}' fiyat listesi eklendi`, 'success');
  };

  const updatePriceList = (updated: PriceListEntry) => {
    setPriceLists(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    showToast(`'${updated.title}' fiyat listesi güncellendi`, 'success');
  };

  const deletePriceList = (id: string) => {
    setPriceLists(prev => prev.filter(p => p.id !== id));
    showToast('Fiyat listesi kaldırıldı', 'info');
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
        staffAccounts,
        loginWithUsername,
        createStaffAccount,
        updateStaffAccount,
        removeStaffAccount,
        deletionRequests,
        auditLogs,
        requestDeleteTransaction,
        requestDeleteCari,
        approveDeletionRequest,
        rejectDeletionRequest,
        logAudit,
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
        getWhatsAppReminderUrl,
        addCategory,
        isTransactionModalOpen,
        prefillTransaction,
        openTransactionModal,
        closeTransactionModal,
        isInstallmentModalOpen,
        installmentModalPrefill,
        openInstallmentModal,
        closeInstallmentModal,
        isCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        isCurrencyConverterOpen,
        openCurrencyConverter,
        closeCurrencyConverter,
        isDarkMode,
        toggleDarkMode,
        exportDataToExcel,
        exportDataAsJson,
        importDataFromJson,
        importDataFromExcel,
        clearAllToZero,
        toastMessage,
        showToast,
        stockItems,
        purchases,
        addStockPurchase,
        updateStockPurchase,
        deleteStockPurchase,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        adjustStockQuantity,
        importStockItemsBulk,
        importPurchasesBulk,
        sales,
        addSaleRecord,
        updateSaleRecord,
        deleteSaleRecord,
        importSalesBulk,
        saleModalPrefillProduct,
        setSaleModalPrefillProduct,
        productCategories,
        productSubCategories,
        productBrands,
        vadeRates,
        priceLists,
        addProductCategory,
        deleteProductCategory,
        addProductSubCategory,
        deleteProductSubCategory,
        addProductBrand,
        deleteProductBrand,
        setVadeRate,
        getVadeRateForMonth,
        addPriceList,
        updatePriceList,
        deletePriceList,
        selectedAccountForDetail,
        setSelectedAccountForDetail,
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
