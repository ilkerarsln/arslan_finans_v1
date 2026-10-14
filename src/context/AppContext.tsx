import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Supplier,
  Customer,
  Product,
  PurchaseOrder,
  PurchaseItem,
  SaleItem,
  Expense,
  Account,
  AccountTransaction,
  CariMovement,
  ProductMatchRule,
  CategoryDefinition,
  SubCategoryDefinition,
  BrandDefinition,
  MonthlyInterestRate,
  PriceListItem,
  PaymentMethod,
} from '../types';
import {
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_ACCOUNTS,
  INITIAL_ACCOUNT_TRANSACTIONS,
  INITIAL_CARİ_MOVEMENTS,
  INITIAL_MATCH_RULES,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_BRANDS,
  INITIAL_INTEREST_RATES,
  INITIAL_PRICE_LIST,
  INITIAL_USERS,
} from '../data/initialData';
import { ParsedPurchaseRow } from '../utils/excelHelper';

export type TabType =
  | 'dashboard'
  | 'mal_alim_stok'
  | 'detayli_stok'
  | 'kar_takip'
  | 'cari_hesaplar'
  | 'kasa_banka'
  | 'masraflar'
  | 'aylik_takip'
  | 'urun_eslestirme'
  | 'tanimlamalar'
  | 'raporlar'
  | 'kullanicilar';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextType {
  // Auth & User Management
  currentUser: User | null;
  users: User[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openPurchaseModalType: 'none' | 'manuel' | 'excel';
  setOpenPurchaseModalType: (type: 'none' | 'manuel' | 'excel') => void;
  navigateToPurchase: (modalType?: 'manuel' | 'excel') => void;

  // Shared Suppliers (Ortak Tedarikçi Tablosu)
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'currentBalance' | 'totalPurchased' | 'totalPaid' | 'associatedProductsCount'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'currentBalance' | 'totalSales' | 'totalCollected'>) => Customer;

  // Inventory & Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Definitions (Tanımlamalar)
  categories: CategoryDefinition[];
  addCategory: (name: string, subCategories?: string[]) => void;
  updateCategory: (id: string, name: string, subCategories: string[]) => void;
  deleteCategory: (id: string) => void;

  subCategories: SubCategoryDefinition[];
  addSubCategory: (categoryName: string, name: string, description?: string) => void;
  deleteSubCategory: (id: string) => void;

  brands: BrandDefinition[];
  addBrand: (name: string, country?: string) => void;
  deleteBrand: (id: string) => void;

  interestRates: MonthlyInterestRate[];
  updateMonthlyRate: (monthCode: string, rate: number) => void;
  getMonthlyRateForDate: (dateStr: string) => number;

  priceLists: PriceListItem[];
  updatePriceListItem: (id: string, updates: Partial<PriceListItem>) => void;
  addPriceListItem: (item: Omit<PriceListItem, 'id' | 'lastUpdated'>) => void;

  // Purchases (Mal Alımları - Finans & Stok Entegre)
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (data: {
    supplierId: string;
    invoiceNumber: string;
    date: string;
    items: PurchaseItem[];
    paymentStatus: 'odendi' | 'vadeli' | 'kismi';
    paidAmount?: number;
    accountId?: string;
    dueDate?: string;
    notes?: string;
    source?: 'manuel' | 'excel';
  }) => PurchaseOrder;
  createBulkPurchasesFromExcel: (validRows: ParsedPurchaseRow[]) => { successCount: number; totalAmount: number };

  // Sales (Kâr Takip & Senetli Vade Farkı Hesaplama)
  sales: SaleItem[];
  addSale: (sale: {
    saleId: string;
    date: string;
    customerName: string;
    productName: string;
    matchedSku?: string;
    matchedSupplierId?: string;
    matchedSupplierName?: string;
    category: string;
    quantity: number;
    unitSalePrice: number;
    totalSalePrice: number;
    unitCost: number;
    paymentMethod: PaymentMethod;
    installmentCount?: number;
    salesperson: string;
    accountId?: string;
    status?: 'tamamlandi' | 'beklemede' | 'iptal';
  }) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Accounts & Account Transactions
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccountBalance: (id: string, delta: number) => void;
  accountTransactions: AccountTransaction[];
  addAccountTransaction: (tx: Omit<AccountTransaction, 'id'>) => void;

  // Cari Movements
  cariMovements: CariMovement[];
  addCariPayment: (data: {
    cariId: string;
    amount: number;
    accountId: string;
    date: string;
    description: string;
    documentNo?: string;
  }) => void;

  // Product Match Rules
  matchRules: ProductMatchRule[];
  addMatchRule: (rule: Omit<ProductMatchRule, 'id'>) => void;
  deleteMatchRule: (id: string) => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('arslan_users_list');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('arslan_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return {
      id: 'admin-1',
      email: 'ilkerarslan78@gmail.com',
      name: 'İlker Arslan (Yönetici)',
      role: 'admin',
      phone: '0 (532) 123 45 78',
    };
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [openPurchaseModalType, setOpenPurchaseModalType] = useState<'none' | 'manuel' | 'excel'>('none');

  // Shared Data States
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('arslan_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('arslan_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('arslan_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('arslan_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [sales, setSales] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem('arslan_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('arslan_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('arslan_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>(() => {
    const saved = localStorage.getItem('arslan_account_txs');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_TRANSACTIONS;
  });

  const [cariMovements, setCariMovements] = useState<CariMovement[]>(() => {
    const saved = localStorage.getItem('arslan_cari_movements');
    return saved ? JSON.parse(saved) : INITIAL_CARİ_MOVEMENTS;
  });

  const [matchRules, setMatchRules] = useState<ProductMatchRule[]>(() => {
    const saved = localStorage.getItem('arslan_match_rules');
    return saved ? JSON.parse(saved) : INITIAL_MATCH_RULES;
  });

  // Definitions States (Tanımlamalar)
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    const saved = localStorage.getItem('arslan_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [subCategories, setSubCategories] = useState<SubCategoryDefinition[]>(() => {
    const saved = localStorage.getItem('arslan_subcategories');
    return saved ? JSON.parse(saved) : INITIAL_SUBCATEGORIES;
  });

  const [brands, setBrands] = useState<BrandDefinition[]>(() => {
    const saved = localStorage.getItem('arslan_brands');
    return saved ? JSON.parse(saved) : INITIAL_BRANDS;
  });

  const [interestRates, setInterestRates] = useState<MonthlyInterestRate[]>(() => {
    const saved = localStorage.getItem('arslan_interest_rates');
    return saved ? JSON.parse(saved) : INITIAL_INTEREST_RATES;
  });

  const [priceLists, setPriceLists] = useState<PriceListItem[]>(() => {
    const saved = localStorage.getItem('arslan_price_lists');
    return saved ? JSON.parse(saved) : INITIAL_PRICE_LIST;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem('arslan_users_list', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('arslan_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('arslan_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('arslan_purchases', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('arslan_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('arslan_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('arslan_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('arslan_account_txs', JSON.stringify(accountTransactions));
  }, [accountTransactions]);

  useEffect(() => {
    localStorage.setItem('arslan_cari_movements', JSON.stringify(cariMovements));
  }, [cariMovements]);

  useEffect(() => {
    localStorage.setItem('arslan_match_rules', JSON.stringify(matchRules));
  }, [matchRules]);

  useEffect(() => {
    localStorage.setItem('arslan_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('arslan_subcategories', JSON.stringify(subCategories));
  }, [subCategories]);

  useEffect(() => {
    localStorage.setItem('arslan_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('arslan_interest_rates', JSON.stringify(interestRates));
  }, [interestRates]);

  useEffect(() => {
    localStorage.setItem('arslan_price_lists', JSON.stringify(priceLists));
  }, [priceLists]);

  // Toast Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth: Requirement 6: Fixed requirement for Admin
  const login = (emailInput: string, passwordInput: string): boolean => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    const isAdminEmail =
      cleanEmail === 'ilkerarslan78@gmail' ||
      cleanEmail === 'ilkerarslan78@gmail.com' ||
      cleanEmail === 'arslanmobilya78@gmail.com';

    if (isAdminEmail && cleanPass === '140514') {
      const user: User = {
        id: 'admin-1',
        email: cleanEmail,
        name: cleanEmail.includes('ilker') ? 'İlker Arslan (Yönetici)' : 'Arslan Mobilya (Yönetici)',
        role: 'admin',
        phone: '0 (532) 123 45 78',
      };
      setCurrentUser(user);
      localStorage.setItem('arslan_user', JSON.stringify(user));
      showToast('Yönetici girişi başarıyla sağlandı.', 'success', 'Hoş Geldiniz');
      return true;
    }

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
    );
    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem('arslan_user', JSON.stringify(matchedUser));
      showToast(`${matchedUser.name} girişi sağlandı.`, 'success', 'Giriş Başarılı');
      return true;
    }

    showToast('Hatalı e-posta adresi veya şifre girdiniz!', 'error', 'Giriş Başarısız');
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('arslan_user');
    showToast('Oturum kapatıldı.', 'info');
  };

  // User Management
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(`${newUser.name} kullanıcı listesine eklendi.`, 'success');
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    showToast('Kullanıcı yetkileri güncellendi.', 'success');
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast('Kullanıcı sistemden kaldırıldı.', 'info');
  };

  // Category & Subcategory definitions
  const addCategory = (name: string, subCats: string[] = []) => {
    const newCat: CategoryDefinition = {
      id: `cat-${Date.now()}`,
      name,
      subCategories: subCats,
    };
    setCategories((prev) => [...prev, newCat]);

    // Also add to subCategories list
    if (subCats.length > 0) {
      const newSubs: SubCategoryDefinition[] = subCats.map((s) => ({
        id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        categoryName: name,
        name: s,
      }));
      setSubCategories((prev) => [...prev, ...newSubs]);
    }

    showToast(`${name} kategorisi tanımlandı.`, 'success');
  };

  const updateCategory = (id: string, name: string, subCats: string[]) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, subCategories: subCats } : c))
    );
    showToast('Kategori güncellendi.', 'success');
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setSubCategories((prev) => prev.filter((s) => s.categoryName !== cat.name));
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('Kategori silindi.', 'info');
  };

  const addSubCategory = (categoryName: string, name: string, description?: string) => {
    const newSub: SubCategoryDefinition = {
      id: `sub-${Date.now()}`,
      categoryName,
      name,
      description,
    };
    setSubCategories((prev) => [...prev, newSub]);

    // Also append to main categories subCategories array
    setCategories((prev) =>
      prev.map((c) =>
        c.name === categoryName && !c.subCategories.includes(name)
          ? { ...c, subCategories: [...c.subCategories, name] }
          : c
      )
    );
    showToast(`${name} alt kategorisi eklendi.`, 'success');
  };

  const deleteSubCategory = (id: string) => {
    const sub = subCategories.find((s) => s.id === id);
    if (sub) {
      setCategories((prev) =>
        prev.map((c) =>
          c.name === sub.categoryName
            ? { ...c, subCategories: c.subCategories.filter((name) => name !== sub.name) }
            : c
        )
      );
    }
    setSubCategories((prev) => prev.filter((s) => s.id !== id));
    showToast('Alt kategori silindi.', 'info');
  };

  // Brands
  const addBrand = (name: string, country?: string) => {
    const newBrand: BrandDefinition = {
      id: `br-${Date.now()}`,
      name,
      country,
    };
    setBrands((prev) => [...prev, newBrand]);
    showToast(`${name} markası eklendi.`, 'success');
  };

  const deleteBrand = (id: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== id));
    showToast('Marka silindi.', 'info');
  };

  // Monthly Interest Rates
  const updateMonthlyRate = (monthCode: string, rate: number) => {
    setInterestRates((prev) => {
      const exists = prev.some((r) => r.monthCode === monthCode);
      if (exists) {
        return prev.map((r) => (r.monthCode === monthCode ? { ...r, rate } : r));
      } else {
        const monthNames: { [k: string]: string } = {
          '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan', '05': 'Mayıs',
          '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos', '09': 'Eylül', '10': 'Ekim',
          '11': 'Kasım', '12': 'Aralık',
        };
        const parts = monthCode.split('-');
        const name = `${monthNames[parts[1]] || parts[1]} ${parts[0]}`;
        return [...prev, { id: `ir-${Date.now()}`, monthCode, monthName: name, rate }];
      }
    });
    showToast(`${monthCode} dönemi için aylık vade farkı oranı %${rate} olarak kaydedildi.`, 'success');
  };

  const getMonthlyRateForDate = (dateStr: string): number => {
    const monthCode = dateStr.slice(0, 7);
    const match = interestRates.find((r) => r.monthCode === monthCode);
    if (match) return match.rate;
    const defaultRate = interestRates.find((r) => r.isDefault)?.rate;
    return defaultRate ?? 2.8;
  };

  // Price Lists
  const updatePriceListItem = (id: string, updates: Partial<PriceListItem>) => {
    setPriceLists((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, lastUpdated: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    showToast('Fiyat listesi güncellendi.', 'success');
  };

  const addPriceListItem = (item: Omit<PriceListItem, 'id' | 'lastUpdated'>) => {
    const newItem: PriceListItem = {
      ...item,
      id: `pl-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setPriceLists((prev) => [...prev, newItem]);
    showToast('Ürün fiyat listesine eklendi.', 'success');
  };

  // Direct Navigation to Mal Alımı
  const navigateToPurchase = (modalType: 'manuel' | 'excel' = 'manuel') => {
    setActiveTab('mal_alim_stok');
    setOpenPurchaseModalType(modalType);
  };

  // Suppliers
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'currentBalance' | 'totalPurchased' | 'totalPaid' | 'associatedProductsCount'>): Supplier => {
    const newId = `sup-${Date.now()}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: newId,
      type: 'tedarikci',
      currentBalance: 0,
      totalPurchased: 0,
      totalPaid: 0,
      associatedProductsCount: 0,
      avgProfitMargin: 40,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    showToast(`${newSupplier.name} ortak tedarikçi havuzuna eklendi.`, 'success');
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showToast('Tedarikçi bilgileri güncellendi.', 'success');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showToast('Tedarikçi sistemden silindi.', 'info');
  };

  const getSupplierById = (id: string) => suppliers.find((s) => s.id === id);

  // Customers
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'currentBalance' | 'totalSales' | 'totalCollected'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cus-${Date.now()}`,
      type: 'musteri',
      currentBalance: 0,
      totalSales: 0,
      totalCollected: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    showToast(`${newCustomer.name} müşteri cari listesine eklendi.`, 'success');
    return newCustomer;
  };

  // Products (Stok)
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Also auto-add to Price List for current month
    const curMonth = new Date().toISOString().slice(0, 7);
    const plItem: PriceListItem = {
      id: `pl-${Date.now()}`,
      productId: newProduct.id,
      productSku: newProduct.sku,
      productName: newProduct.name,
      category: newProduct.category,
      subCategory: newProduct.subCategory,
      brand: newProduct.brand,
      monthCode: curMonth,
      costPrice: newProduct.costPrice,
      cashSalePrice: newProduct.salePrice,
      cardSalePrice: Math.round(newProduct.salePrice * 1.05),
      installment12Price: Math.round(newProduct.salePrice * 1.336),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setPriceLists((prev) => [...prev, plItem]);

    showToast(`${newProduct.name} stok listesine eklendi.`, 'success');
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    showToast('Ürün stok bilgileri güncellendi.', 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Ürün stoktan kaldırıldı.', 'info');
  };

  // Mal Alımı ve Finans (Cari Borç) & Stok Entegrasyonu
  const createPurchaseOrder = (data: {
    supplierId: string;
    invoiceNumber: string;
    date: string;
    items: PurchaseItem[];
    paymentStatus: 'odendi' | 'vadeli' | 'kismi';
    paidAmount?: number;
    accountId?: string;
    dueDate?: string;
    notes?: string;
    source?: 'manuel' | 'excel';
  }): PurchaseOrder => {
    const supplier = suppliers.find((s) => s.id === data.supplierId);
    if (!supplier) {
      showToast('Hata: Seçilen tedarikçi bulunamadı!', 'error');
      throw new Error('Tedarikçi bulunamadı');
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const paid = data.paymentStatus === 'odendi' ? totalAmount : (data.paidAmount || 0);
    const remainingDebt = totalAmount - paid;

    const newOrderId = `po-${Date.now()}`;
    const newOrder: PurchaseOrder = {
      id: newOrderId,
      orderNumber: `ALM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber: data.invoiceNumber || `FTR-${Date.now().toString().slice(-6)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: data.date || new Date().toISOString().split('T')[0],
      items: data.items,
      totalAmount,
      paymentStatus: data.paymentStatus,
      paidAmount: paid,
      dueDate: data.dueDate,
      notes: data.notes,
      source: data.source || 'manuel',
      createdAt: new Date().toLocaleString('tr-TR'),
    };

    // 1. UPDATE SUPPLIER (Finans Cari Borç Artışı)
    const newSupplierBalance = supplier.currentBalance + remainingDebt;
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplier.id
          ? {
              ...s,
              currentBalance: newSupplierBalance,
              totalPurchased: s.totalPurchased + totalAmount,
              totalPaid: s.totalPaid + paid,
              associatedProductsCount: Math.max(s.associatedProductsCount, s.associatedProductsCount + data.items.length),
            }
          : s
      )
    );

    // 2. CREATE CARI MOVEMENT
    const itemsSummary = data.items
      .map((i) => `${i.productName} (${i.quantity} adet x ₺${i.unitPrice})`)
      .join(', ');

    const newMovement: CariMovement = {
      id: `mov-${Date.now()}`,
      cariId: supplier.id,
      cariName: supplier.name,
      cariType: 'tedarikci',
      date: data.date,
      type: 'mal_alimi',
      description: `Mal Alım Faturası - ${newOrder.invoiceNumber}: ${itemsSummary}`,
      documentNo: newOrder.invoiceNumber,
      borc: totalAmount,
      alacak: paid > 0 ? paid : 0,
      balanceAfter: newSupplierBalance,
      relatedPurchaseId: newOrderId,
    };
    setCariMovements((prev) => [newMovement, ...prev]);

    // 3. Deduct from account if paid > 0 and record AccountTransaction
    if (paid > 0 && data.accountId) {
      const acc = accounts.find((a) => a.id === data.accountId);
      const after = (acc?.balance || 0) - paid;
      setAccounts((prev) =>
        prev.map((a) => (a.id === data.accountId ? { ...a, balance: after } : a))
      );

      // Account movement
      const tx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: data.accountId,
        accountName: acc?.name || 'Hesap',
        date: data.date,
        type: 'cikis',
        amount: paid,
        description: `Tedarikçi Mal Alımı Peşin Ödemesi - ${supplier.name}`,
        category: 'Mal Alımı Ödemesi',
        referenceNo: newOrder.invoiceNumber,
        balanceAfter: after,
      };
      setAccountTransactions((prev) => [tx, ...prev]);
    }

    // 4. UPDATE INVENTORY & PRODUCTS
    setProducts((prev) => {
      let updatedProducts = [...prev];

      data.items.forEach((item) => {
        const existingIdx = updatedProducts.findIndex(
          (p) =>
            (item.productId && p.id === item.productId) ||
            p.sku.toLowerCase() === item.sku.toLowerCase() ||
            p.name.toLowerCase() === item.productName.toLowerCase()
        );

        if (existingIdx >= 0) {
          const currentProd = updatedProducts[existingIdx];
          const oldStock = currentProd.stockQty;
          const oldCost = currentProd.costPrice;
          const newQty = oldStock + item.quantity;
          const newCost =
            newQty > 0
              ? Math.round((oldStock * oldCost + item.quantity * item.unitPrice) / newQty)
              : item.unitPrice;

          updatedProducts[existingIdx] = {
            ...currentProd,
            stockQty: newQty,
            costPrice: newCost,
            lastPurchaseDate: data.date,
          };
        } else {
          const newProduct: Product = {
            id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sku: item.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
            name: item.productName,
            category: item.category || 'Genel Mobilya',
            supplierId: supplier.id,
            supplierName: supplier.name,
            stockQty: item.quantity,
            unit: 'Adet',
            costPrice: item.unitPrice,
            salePrice: Math.round(item.unitPrice * 1.55),
            minStockAlert: 2,
            lastPurchaseDate: data.date,
          };
          updatedProducts.push(newProduct);
        }
      });

      return updatedProducts;
    });

    setPurchaseOrders((prev) => [newOrder, ...prev]);

    showToast(
      `Mal alımı kaydedildi: Stoklar güncellendi ve ${supplier.name} cari hesabına ₺${totalAmount.toLocaleString('tr-TR')} borç işlendi.`,
      'success',
      'Finans & Stok Entegre Edildi'
    );

    return newOrder;
  };

  // Toplu Excel ile Mal Alımı
  const createBulkPurchasesFromExcel = (validRows: ParsedPurchaseRow[]): { successCount: number; totalAmount: number } => {
    if (!validRows || validRows.length === 0) {
      showToast('Yüklenecek geçerli satır bulunamadı.', 'warning');
      return { successCount: 0, totalAmount: 0 };
    }

    const groups: { [key: string]: ParsedPurchaseRow[] } = {};
    validRows.forEach((row) => {
      const key = `${row.matchedSupplier?.id || 'unknown'}__${row.invoiceNo}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    let successCount = 0;
    let grandTotal = 0;

    Object.values(groups).forEach((rows) => {
      const firstRow = rows[0];
      const supplier = firstRow.matchedSupplier;
      if (!supplier) return;

      const items: PurchaseItem[] = rows.map((r) => ({
        productName: r.productName,
        sku: r.sku,
        category: r.category,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        totalPrice: r.totalPrice,
      }));

      createPurchaseOrder({
        supplierId: supplier.id,
        invoiceNumber: firstRow.invoiceNo,
        date: firstRow.date,
        items,
        paymentStatus: 'vadeli',
        paidAmount: 0,
        source: 'excel',
        notes: 'Excel toplu mal alım listesinden içe aktarıldı.',
      });

      successCount += rows.length;
      grandTotal += items.reduce((s, i) => s + i.totalPrice, 0);
    });

    showToast(
      `Excel'den toplam ${successCount} adet ürün alımı başarıyla işlendi. Cari borçlar ve stoklar güncellendi.`,
      'success',
      'Toplu Excel Yükleme Tamamlandı'
    );

    return { successCount, totalAmount: grandTotal };
  };

  // Sales
  const addSale = (saleData: {
    saleId: string;
    date: string;
    customerName: string;
    productName: string;
    matchedSku?: string;
    matchedSupplierId?: string;
    matchedSupplierName?: string;
    category: string;
    quantity: number;
    unitSalePrice: number;
    totalSalePrice: number;
    unitCost: number;
    paymentMethod: PaymentMethod;
    installmentCount?: number;
    salesperson: string;
    accountId?: string;
    status?: 'tamamlandi' | 'beklemede' | 'iptal';
  }) => {
    const baseCost = saleData.unitCost * saleData.quantity;
    let interestCost = 0;
    let monthlyRate = 0;

    if (saleData.paymentMethod === 'senetli') {
      monthlyRate = getMonthlyRateForDate(saleData.date);
      const installments = saleData.installmentCount || 1;
      interestCost = Math.round(baseCost * (monthlyRate / 100) * installments);
    }

    const totalCost = baseCost + interestCost;
    const grossProfit = saleData.totalSalePrice - totalCost;
    const profitMarginPercent = saleData.totalSalePrice > 0 ? (grossProfit / saleData.totalSalePrice) * 100 : 0;

    const newSale: SaleItem = {
      ...saleData,
      id: `sale-${Date.now()}`,
      baseCost,
      interestCost,
      totalCost,
      grossProfit,
      profitMarginPercent,
      monthlyInterestRate: saleData.paymentMethod === 'senetli' ? monthlyRate : undefined,
      status: saleData.status || 'tamamlandi',
    };

    setSales((prev) => [newSale, ...prev]);

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        if (
          (saleData.matchedSku && p.sku === saleData.matchedSku) ||
          p.name.toLowerCase() === saleData.productName.toLowerCase()
        ) {
          return {
            ...p,
            stockQty: Math.max(0, p.stockQty - saleData.quantity),
          };
        }
        return p;
      })
    );

    // If cash or card, optionally reflect to account
    if (saleData.paymentMethod !== 'senetli' && saleData.accountId) {
      const acc = accounts.find((a) => a.id === saleData.accountId);
      const after = (acc?.balance || 0) + saleData.totalSalePrice;
      setAccounts((prev) =>
        prev.map((a) => (a.id === saleData.accountId ? { ...a, balance: after } : a))
      );

      const tx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: saleData.accountId,
        accountName: acc?.name || 'Hesap',
        date: saleData.date,
        type: 'giris',
        amount: saleData.totalSalePrice,
        description: `Satış Tahsilatı - ${saleData.customerName} (${saleData.productName})`,
        category: 'Satış Tahsilatı',
        referenceNo: saleData.saleId,
        balanceAfter: after,
      };
      setAccountTransactions((prev) => [tx, ...prev]);
    }

    const vadeMsg =
      saleData.paymentMethod === 'senetli'
        ? ` (${saleData.installmentCount} Ay Senet, ₺${interestCost.toLocaleString('tr-TR')} Vade Farkı Maliyeti Dahil)`
        : '';

    showToast(`Satış işlemi kaydedildi: Net Kâr: ₺${grossProfit.toLocaleString('tr-TR')}${vadeMsg}`, 'success');
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    if (expenseData.accountId) {
      const acc = accounts.find((a) => a.id === expenseData.accountId);
      const after = (acc?.balance || 0) - expenseData.amount;
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === expenseData.accountId ? { ...a, balance: after } : a
        )
      );

      const tx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: expenseData.accountId,
        accountName: acc?.name || 'Hesap',
        date: expenseData.date,
        type: 'cikis',
        amount: expenseData.amount,
        description: `${expenseData.category}: ${expenseData.description}`,
        category: expenseData.category,
        referenceNo: expenseData.receiptNumber,
        balanceAfter: after,
      };
      setAccountTransactions((prev) => [tx, ...prev]);
    }
    showToast('Gider masrafı kaydedildi.', 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Gider kaydı silindi.', 'info');
  };

  // Accounts
  const addAccount = (accountData: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAccount]);
    showToast('Yeni kasa/banka hesabı tanımlandı.', 'success');
  };

  const updateAccountBalance = (id: string, delta: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, balance: acc.balance + delta } : acc))
    );
  };

  const addAccountTransaction = (txData: Omit<AccountTransaction, 'id'>) => {
    const newTx: AccountTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
    };
    setAccountTransactions((prev) => [newTx, ...prev]);
  };

  // Cari Payment
  const addCariPayment = (data: {
    cariId: string;
    amount: number;
    accountId: string;
    date: string;
    description: string;
    documentNo?: string;
  }) => {
    const supplier = suppliers.find((s) => s.id === data.cariId);
    const customer = customers.find((c) => c.id === data.cariId);

    if (supplier) {
      const newBal = supplier.currentBalance - data.amount;
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplier.id
            ? { ...s, currentBalance: newBal, totalPaid: s.totalPaid + data.amount }
            : s
        )
      );

      const acc = accounts.find((a) => a.id === data.accountId);
      const after = (acc?.balance || 0) - data.amount;
      setAccounts((prev) =>
        prev.map((a) => (a.id === data.accountId ? { ...a, balance: after } : a))
      );

      const mov: CariMovement = {
        id: `mov-${Date.now()}`,
        cariId: supplier.id,
        cariName: supplier.name,
        cariType: 'tedarikci',
        date: data.date,
        type: 'odeme',
        description: data.description || 'Tedarikçi Cari Borç Ödemesi',
        documentNo: data.documentNo,
        borc: 0,
        alacak: data.amount,
        balanceAfter: newBal,
      };
      setCariMovements((prev) => [mov, ...prev]);

      const tx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: data.accountId,
        accountName: acc?.name || 'Hesap',
        date: data.date,
        type: 'cikis',
        amount: data.amount,
        description: `Tedarikçi Ödemesi - ${supplier.name}`,
        category: 'Tedarikçi Ödemesi',
        referenceNo: data.documentNo,
        balanceAfter: after,
      };
      setAccountTransactions((prev) => [tx, ...prev]);

      showToast(`${supplier.name} firmasına ₺${data.amount.toLocaleString('tr-TR')} ödeme işlendi.`, 'success');
    } else if (customer) {
      const newBal = customer.currentBalance - data.amount;
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? { ...c, currentBalance: newBal, totalCollected: c.totalCollected + data.amount }
            : c
        )
      );

      const acc = accounts.find((a) => a.id === data.accountId);
      const after = (acc?.balance || 0) + data.amount;
      setAccounts((prev) =>
        prev.map((a) => (a.id === data.accountId ? { ...a, balance: after } : a))
      );

      const mov: CariMovement = {
        id: `mov-${Date.now()}`,
        cariId: customer.id,
        cariName: customer.name,
        cariType: 'musteri',
        date: data.date,
        type: 'tahsilat',
        description: data.description || 'Müşteri Cari Tahsilatı',
        documentNo: data.documentNo,
        borc: 0,
        alacak: data.amount,
        balanceAfter: newBal,
      };
      setCariMovements((prev) => [mov, ...prev]);

      const tx: AccountTransaction = {
        id: `tx-${Date.now()}`,
        accountId: data.accountId,
        accountName: acc?.name || 'Hesap',
        date: data.date,
        type: 'giris',
        amount: data.amount,
        description: `Müşteri Tahsilatı - ${customer.name}`,
        category: 'Cari Tahsilat',
        referenceNo: data.documentNo,
        balanceAfter: after,
      };
      setAccountTransactions((prev) => [tx, ...prev]);

      showToast(`${customer.name} müşterisinden ₺${data.amount.toLocaleString('tr-TR')} tahsilat işlendi.`, 'success');
    }
  };

  // Match Rules
  const addMatchRule = (ruleData: Omit<ProductMatchRule, 'id'>) => {
    const newRule: ProductMatchRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
    };
    setMatchRules((prev) => [...prev, newRule]);
    showToast('Ürün eşleştirme kuralı kaydedildi.', 'success');
  };

  const deleteMatchRule = (id: string) => {
    setMatchRules((prev) => prev.filter((r) => r.id !== id));
    showToast('Eşleştirme kuralı silindi.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        activeTab,
        setActiveTab,
        openPurchaseModalType,
        setOpenPurchaseModalType,
        navigateToPurchase,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplierById,
        customers,
        addCustomer,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        subCategories,
        addSubCategory,
        deleteSubCategory,
        brands,
        addBrand,
        deleteBrand,
        interestRates,
        updateMonthlyRate,
        getMonthlyRateForDate,
        priceLists,
        updatePriceListItem,
        addPriceListItem,
        purchaseOrders,
        createPurchaseOrder,
        createBulkPurchasesFromExcel,
        sales,
        addSale,
        expenses,
        addExpense,
        deleteExpense,
        accounts,
        addAccount,
        updateAccountBalance,
        accountTransactions,
        addAccountTransaction,
        cariMovements,
        addCariPayment,
        matchRules,
        addMatchRule,
        deleteMatchRule,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
