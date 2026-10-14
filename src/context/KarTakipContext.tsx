import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  KarTakipUser,
  KarTakipSupplier,
  PurchaseRecord,
  SaleRecord,
  WholesalePriceItem,
  MonthlyPeriodStatus,
  ProductStockInfo,
  PriceAlert,
  FilterState,
  KPISummary,
  CostingMethod,
  ProductAliasMapping,
  ExpenseRecord,
  ProductCategory,
  ProductSubCategory,
  SupplierProfitabilityItem
} from '../types/karTakip';
import {
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASES,
  INITIAL_WHOLESALE_PRICES,
  INITIAL_SALES,
  INITIAL_PERIOD_STATUSES,
  INITIAL_EXPENSES,
  INITIAL_CATEGORIES
} from '../data/karTakipMockData';
import {
  enrichSalesWithWholesalePrices,
  calculateInventoryStocks,
  generateSystemAlerts,
  calculateKPISummary,
  calculateMonthlyFinancialSummaries,
  calculateSupplierProfitability,
  MonthlyFinancialSummary
} from '../utils/karTakipCalculations';

interface KarTakipContextType {
  currentUser: KarTakipUser | null;
  users: KarTakipUser[];
  suppliers: KarTakipSupplier[];
  purchases: PurchaseRecord[];
  sales: SaleRecord[];
  wholesalePrices: WholesalePriceItem[];
  monthlyStatuses: MonthlyPeriodStatus[];
  productAliasMappings: ProductAliasMapping[];
  expenses: ExpenseRecord[];
  categories: ProductCategory[];
  supplierProfitability: SupplierProfitabilityItem[];
  enrichedSales: SaleRecord[];
  filteredSales: SaleRecord[];
  inventoryStocks: ProductStockInfo[];
  monthlyFinancials: MonthlyFinancialSummary[];
  alerts: PriceAlert[];
  dismissedAlertIds: string[];
  filters: FilterState;
  costingMethod: CostingMethod;
  kpis: KPISummary;
  uniqueCategories: string[];
  uniqueSalesReps: string[];
  uniquePeriods: string[];
  uniqueSuppliers: string[];
  login: (emailOrName: string, role?: 'ADMIN' | 'SALES_REP') => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  setFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setCostingMethod: (method: CostingMethod) => void;
  addSales: (newSales: SaleRecord[], replace?: boolean) => void;
  deleteSale: (id: string) => void;
  addWholesalePrices: (items: WholesalePriceItem[], overwritePeriod?: string) => void;
  deleteWholesaleItem: (id: string) => void;
  updateSingleWholesalePrice: (
    productCode: string,
    periodMonth: string,
    wholesalePrice: number,
    productName?: string,
    category?: string
  ) => void;
  addProductAliasMapping: (mapping: Omit<ProductAliasMapping, 'id' | 'createdAt'>) => void;
  deleteProductAliasMapping: (id: string) => void;
  addPurchases: (items: PurchaseRecord[]) => void;
  deletePurchase: (id: string) => void;
  addSupplier: (supplier: KarTakipSupplier) => void;
  updateSupplier: (supplier: KarTakipSupplier) => void;
  deleteSupplier: (id: string) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  updateExpense: (expense: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
  importExpenses: (expenses: ExpenseRecord[]) => void;
  addCategory: (category: Omit<ProductCategory, 'id'>) => void;
  updateCategory: (category: ProductCategory) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, subcategory: Omit<ProductSubCategory, 'id'>) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  togglePeriodLock: (periodMonth: string, notes?: string) => void;
  dismissAlert: (alertId: string) => void;
  resetToMockData: () => void;
}

const STORAGE_KEY_SALES = 'kartakip_sales_v2';
const STORAGE_KEY_WHOLESALE = 'kartakip_wholesale_v2';
const STORAGE_KEY_PURCHASES = 'kartakip_purchases_v2';
const STORAGE_KEY_SUPPLIERS = 'kartakip_suppliers_v2';
const STORAGE_KEY_PERIODS = 'kartakip_periods_v2';
const STORAGE_KEY_CURRENT_USER = 'kartakip_current_user_v2';
const STORAGE_KEY_DISMISSED_ALERTS = 'kartakip_dismissed_alerts_v2';
const STORAGE_KEY_COSTING_METHOD = 'kartakip_costing_method_v2';
const STORAGE_KEY_PRODUCT_ALIASES = 'kartakip_product_aliases_v2';
const STORAGE_KEY_EXPENSES = 'kartakip_expenses_v2';
const STORAGE_KEY_CATEGORIES = 'kartakip_categories_v2';

const initialFilters: FilterState = {
  searchQuery: '',
  selectedSalesRep: 'ALL',
  selectedCategory: 'ALL',
  selectedPeriod: 'ALL',
  selectedSupplier: 'ALL',
  statusFilter: 'ALL',
  costingMethod: 'CATALOG_PRICE'
};

const KarTakipContext = createContext<KarTakipContextType | undefined>(undefined);

export const KarTakipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<KarTakipUser[]>(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState<KarTakipUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS[0];
  });

  const [suppliers, setSuppliers] = useState<KarTakipSupplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SUPPLIERS;
  });

  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PURCHASES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PURCHASES;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SALES;
  });

  const [wholesalePrices, setWholesalePrices] = useState<WholesalePriceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WHOLESALE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WHOLESALE_PRICES;
  });

  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthlyPeriodStatus[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERIODS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PERIOD_STATUSES;
  });

  const [productAliasMappings, setProductAliasMappings] = useState<ProductAliasMapping[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCT_ALIASES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EXPENSES;
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CATEGORIES;
  });

  const [costingMethod, setCostingMethodState] = useState<CostingMethod>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COSTING_METHOD);
      if (saved === 'PURCHASE_AVG' || saved === 'CATALOG_PRICE') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'CATALOG_PRICE';
  });

  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISMISSED_ALERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [filters, setFiltersState] = useState<FilterState>({
    ...initialFilters,
    costingMethod
  });

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WHOLESALE, JSON.stringify(wholesalePrices));
  }, [wholesalePrices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(monthlyStatuses));
  }, [monthlyStatuses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COSTING_METHOD, costingMethod);
  }, [costingMethod]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCT_ALIASES, JSON.stringify(productAliasMappings));
  }, [productAliasMappings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DISMISSED_ALERTS, JSON.stringify(dismissedAlertIds));
  }, [dismissedAlertIds]);

  const inventoryStocks = useMemo(() => {
    return calculateInventoryStocks(purchases, sales, wholesalePrices);
  }, [purchases, sales, wholesalePrices]);

  const enrichedSales = useMemo(() => {
    return enrichSalesWithWholesalePrices(sales, wholesalePrices, purchases, costingMethod, productAliasMappings);
  }, [sales, wholesalePrices, purchases, costingMethod, productAliasMappings]);

  const allAlerts = useMemo(() => {
    return generateSystemAlerts(enrichedSales, wholesalePrices, inventoryStocks);
  }, [enrichedSales, wholesalePrices, inventoryStocks]);

  const activeAlerts = useMemo(() => {
    return allAlerts.filter(a => !dismissedAlertIds.includes(a.id));
  }, [allAlerts, dismissedAlertIds]);

  const monthlyFinancials = useMemo(() => {
    return calculateMonthlyFinancialSummaries(enrichedSales, purchases, monthlyStatuses, expenses);
  }, [enrichedSales, purchases, monthlyStatuses, expenses]);

  const filteredSales = useMemo(() => {
    let list = [...enrichedSales];

    if (currentUser && currentUser.role === 'SALES_REP' && currentUser.salesRepName) {
      list = list.filter(
        s => s.salesRep.trim().toLowerCase() === currentUser.salesRepName!.trim().toLowerCase()
      );
    } else if (filters.selectedSalesRep !== 'ALL') {
      list = list.filter(
        s => s.salesRep.trim().toLowerCase() === filters.selectedSalesRep.trim().toLowerCase()
      );
    }

    if (filters.selectedCategory !== 'ALL') {
      list = list.filter(
        s => s.category.trim().toLowerCase() === filters.selectedCategory.trim().toLowerCase()
      );
    }

    if (filters.selectedPeriod !== 'ALL') {
      list = list.filter(s => s.date.startsWith(filters.selectedPeriod));
    }

    if (filters.selectedSupplier !== 'ALL') {
      list = list.filter(
        s => s.matchedSupplier?.trim().toLowerCase() === filters.selectedSupplier.trim().toLowerCase()
      );
    }

    if (filters.statusFilter === 'PROFITABLE') {
      list = list.filter(s => s.hasWholesalePrice && (s.profit || 0) > 0);
    } else if (filters.statusFilter === 'UNPROFITABLE') {
      list = list.filter(s => s.hasWholesalePrice && (s.profit || 0) < 0);
    } else if (filters.statusFilter === 'MISSING_PRICE') {
      list = list.filter(s => !s.hasWholesalePrice);
    }

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(
        s =>
          s.productName.toLowerCase().includes(q) ||
          s.productCode.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.invoiceNo && s.invoiceNo.toLowerCase().includes(q)) ||
          s.salesRep.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [enrichedSales, currentUser, filters]);

  const kpis = useMemo(() => {
    const relevantExpenses = filters.selectedPeriod === 'ALL'
      ? expenses
      : expenses.filter(e => (e.periodMonth || e.date?.slice(0, 7)) === filters.selectedPeriod);
    return calculateKPISummary(filteredSales, inventoryStocks, relevantExpenses);
  }, [filteredSales, inventoryStocks, expenses, filters.selectedPeriod]);

  const supplierProfitability = useMemo(() => {
    return calculateSupplierProfitability(
      enrichedSales,
      wholesalePrices,
      purchases,
      suppliers,
      filters.selectedPeriod
    );
  }, [enrichedSales, wholesalePrices, purchases, suppliers, filters.selectedPeriod]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => set.add(c.name.trim()));
    sales.forEach(s => {
      if (s.category) set.add(s.category.trim());
    });
    purchases.forEach(p => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [categories, sales, purchases]);

  const uniqueSalesReps = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => {
      if (s.salesRep) set.add(s.salesRep.trim());
    });
    return Array.from(set).sort();
  }, [sales]);

  const uniquePeriods = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => {
      if (s.date) set.add(s.date.slice(0, 7));
    });
    wholesalePrices.forEach(w => {
      if (w.periodMonth) set.add(w.periodMonth);
    });
    purchases.forEach(p => {
      if (p.periodMonth) set.add(p.periodMonth);
    });
    return Array.from(set).sort().reverse();
  }, [sales, wholesalePrices, purchases]);

  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => set.add(s.name.trim()));
    purchases.forEach(p => {
      if (p.supplierName) set.add(p.supplierName.trim());
    });
    return Array.from(set).sort();
  }, [suppliers, purchases]);

  const login = (emailOrName: string, role?: 'ADMIN' | 'SALES_REP') => {
    const found = users.find(
      u =>
        u.email.toLowerCase() === emailOrName.toLowerCase() ||
        u.name.toLowerCase() === emailOrName.toLowerCase()
    );
    if (found) {
      setCurrentUser(found);
      return true;
    }
    const newUser: KarTakipUser = {
      id: `usr_${Date.now()}`,
      name: emailOrName.includes('@') ? emailOrName.split('@')[0] : emailOrName,
      email: emailOrName.includes('@') ? emailOrName : `${emailOrName}@arslanmobilya.com`,
      role: role || 'SALES_REP',
      salesRepName: role === 'ADMIN' ? undefined : emailOrName
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) setCurrentUser(u);
  };

  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFiltersState({
      ...initialFilters,
      costingMethod
    });
  };

  const setCostingMethod = (method: CostingMethod) => {
    setCostingMethodState(method);
    setFiltersState(prev => ({ ...prev, costingMethod: method }));
  };

  const addSales = (newSales: SaleRecord[], replace = false) => {
    if (replace) {
      setSales(newSales);
    } else {
      setSales(prev => [...newSales, ...prev]);
    }
  };

  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const addWholesalePrices = (items: WholesalePriceItem[], overwritePeriod?: string) => {
    if (overwritePeriod) {
      setWholesalePrices(prev => [
        ...prev.filter(w => w.periodMonth !== overwritePeriod),
        ...items
      ]);
    } else {
      setWholesalePrices(prev => [...prev, ...items]);
    }
  };

  const deleteWholesaleItem = (id: string) => {
    setWholesalePrices(prev => prev.filter(w => w.id !== id));
  };

  const updateSingleWholesalePrice = (
    productCode: string,
    periodMonth: string,
    wholesalePrice: number,
    productName?: string,
    category?: string
  ) => {
    const code = productCode.trim().toUpperCase();
    setWholesalePrices(prev => {
      const existingIndex = prev.findIndex(
        w => w.productCode.trim().toUpperCase() === code && w.periodMonth === periodMonth
      );
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          wholesalePrice,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        return copy;
      } else {
        const newItem: WholesalePriceItem = {
          id: `wp_manual_${Date.now()}`,
          productCode: code,
          productName: productName || code,
          category: category || 'Genel',
          wholesalePrice,
          periodMonth,
          notes: 'Kritik uyarı merkezinden manuel tanımlandı',
          updatedAt: new Date().toISOString().split('T')[0]
        };
        return [newItem, ...prev];
      }
    });
  };

  const addPurchases = (items: PurchaseRecord[]) => {
    setPurchases(prev => [...items, ...prev]);
  };

  const deletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  const addSupplier = (supplier: KarTakipSupplier) => {
    setSuppliers(prev => [supplier, ...prev]);
  };

  const updateSupplier = (supplier: KarTakipSupplier) => {
    setSuppliers(prev => prev.map(s => (s.id === supplier.id ? supplier : s)));
  };

  const addProductAliasMapping = (mapping: Omit<ProductAliasMapping, 'id' | 'createdAt'>) => {
    const newMapping: ProductAliasMapping = {
      ...mapping,
      id: `alias_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    setProductAliasMappings(prev => {
      const filtered = prev.filter(
        a => a.sourceProductCode.trim().toUpperCase() !== mapping.sourceProductCode.trim().toUpperCase()
      );
      return [newMapping, ...filtered];
    });
  };

  const deleteProductAliasMapping = (id: string) => {
    setProductAliasMappings(prev => prev.filter(a => a.id !== id));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addExpense = (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (expense: ExpenseRecord) => {
    setExpenses(prev => prev.map(e => (e.id === expense.id ? expense : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const importExpenses = (newExpenses: ExpenseRecord[]) => {
    setExpenses(prev => [...newExpenses, ...prev]);
  };

  const addCategory = (cat: Omit<ProductCategory, 'id'>) => {
    const newCat: ProductCategory = {
      ...cat,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (cat: ProductCategory) => {
    setCategories(prev => prev.map(c => (c.id === cat.id ? cat : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addSubcategory = (categoryId: string, subcat: Omit<ProductSubCategory, 'id'>) => {
    const newSub: ProductSubCategory = {
      ...subcat,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setCategories(prev =>
      prev.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            subcategories: [...c.subcategories, newSub]
          };
        }
        return c;
      })
    );
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(prev =>
      prev.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            subcategories: c.subcategories.filter(s => s.id !== subcategoryId)
          };
        }
        return c;
      })
    );
  };

  const togglePeriodLock = (periodMonth: string, notes?: string) => {
    setMonthlyStatuses(prev => {
      const idx = prev.findIndex(p => p.periodMonth === periodMonth);
      if (idx >= 0) {
        const current = prev[idx];
        const nextState = !current.isClosed;
        const copy = [...prev];
        copy[idx] = {
          ...current,
          isClosed: nextState,
          closedAt: nextState ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
          closedBy: nextState ? (currentUser?.name || 'Yönetici') : undefined,
          notes: notes || current.notes
        };
        return copy;
      } else {
        return [
          {
            periodMonth,
            isClosed: true,
            closedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            closedBy: currentUser?.name || 'Yönetici',
            notes: notes || 'Dönem kilitlendi'
          },
          ...prev
        ];
      }
    });
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => [...prev, alertId]);
  };

  const resetToMockData = () => {
    localStorage.removeItem(STORAGE_KEY_SALES);
    localStorage.removeItem(STORAGE_KEY_WHOLESALE);
    localStorage.removeItem(STORAGE_KEY_PURCHASES);
    localStorage.removeItem(STORAGE_KEY_SUPPLIERS);
    localStorage.removeItem(STORAGE_KEY_PERIODS);
    localStorage.removeItem(STORAGE_KEY_DISMISSED_ALERTS);
    localStorage.removeItem(STORAGE_KEY_COSTING_METHOD);
    localStorage.removeItem(STORAGE_KEY_PRODUCT_ALIASES);
    localStorage.removeItem(STORAGE_KEY_EXPENSES);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    setSales(INITIAL_SALES);
    setWholesalePrices(INITIAL_WHOLESALE_PRICES);
    setPurchases(INITIAL_PURCHASES);
    setSuppliers(INITIAL_SUPPLIERS);
    setMonthlyStatuses(INITIAL_PERIOD_STATUSES);
    setExpenses(INITIAL_EXPENSES);
    setCategories(INITIAL_CATEGORIES);
    setCostingMethodState('CATALOG_PRICE');
    setDismissedAlertIds([]);
    setProductAliasMappings([]);
    setCurrentUser(INITIAL_USERS[0]);
    setFiltersState(initialFilters);
  };

  return (
    <KarTakipContext.Provider
      value={{
        currentUser,
        users,
        suppliers,
        purchases,
        sales,
        wholesalePrices,
        monthlyStatuses,
        productAliasMappings,
        expenses,
        categories,
        supplierProfitability,
        enrichedSales,
        filteredSales,
        inventoryStocks,
        monthlyFinancials,
        alerts: activeAlerts,
        dismissedAlertIds,
        filters,
        costingMethod,
        kpis,
        uniqueCategories,
        uniqueSalesReps,
        uniquePeriods,
        uniqueSuppliers,
        login,
        logout,
        switchUser,
        setFilters,
        resetFilters,
        setCostingMethod,
        addSales,
        deleteSale,
        addWholesalePrices,
        deleteWholesaleItem,
        updateSingleWholesalePrice,
        addProductAliasMapping,
        deleteProductAliasMapping,
        addPurchases,
        deletePurchase,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addExpense,
        updateExpense,
        deleteExpense,
        importExpenses,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        togglePeriodLock,
        dismissAlert,
        resetToMockData
      }}
    >
      {children}
    </KarTakipContext.Provider>
  );
};

export const useKarTakip = () => {
  const context = useContext(KarTakipContext);
  if (!context) throw new Error('useKarTakip must be used within a KarTakipProvider');
  return context;
};
