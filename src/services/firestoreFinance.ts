import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  Account,
  Cari,
  CategoryItem,
  CategoryHierarchyItem,
  Transaction,
  UpcomingDue,
  UserProfile,
  UserRole,
  StaffAccount,
  DeletionRequest,
  AuditLogEntry,
  StockItem,
  PriceListEntry,
  StockPurchaseRecord,
  SaleRecord,
} from '../types/finance';

export function sanitizeData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean;
}

export function subscribeToUserData(
  userId: string,
  callbacks: {
    onAccounts: (accounts: Account[]) => void;
    onTransactions: (transactions: Transaction[]) => void;
    onCaris: (caris: Cari[]) => void;
    onUpcomingDues: (dues: UpcomingDue[]) => void;
    onCategories: (categories: CategoryItem[]) => void;
    onStocks?: (stocks: StockItem[]) => void;
    onPriceLists?: (priceLists: PriceListEntry[]) => void;
    onPurchases?: (purchases: StockPurchaseRecord[]) => void;
    onSales?: (sales: SaleRecord[]) => void;
    onDeletionRequests?: (requests: DeletionRequest[]) => void;
    onAuditLogs?: (logs: AuditLogEntry[]) => void;
    onCategoryHierarchy?: (items: CategoryHierarchyItem[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  // 1. Accounts
  const accsPath = `users/${userId}/accounts`;
  try {
    const unsubAcc = onSnapshot(
      collection(db, 'users', userId, 'accounts'),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as Account);
        callbacks.onAccounts(items);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, accsPath);
      }
    );
    unsubs.push(unsubAcc);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, accsPath);
  }

  // 2. Transactions
  const txPath = `users/${userId}/transactions`;
  try {
    const unsubTx = onSnapshot(
      collection(db, 'users', userId, 'transactions'),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as Transaction);
        items.sort((a, b) => {
          const timeA = new Date(a.date).getTime();
          const timeB = new Date(b.date).getTime();
          if (timeA !== timeB) return timeB - timeA;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        callbacks.onTransactions(items);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, txPath);
      }
    );
    unsubs.push(unsubTx);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, txPath);
  }

  // 3. Caris
  const carisPath = `users/${userId}/caris`;
  try {
    const unsubCari = onSnapshot(
      collection(db, 'users', userId, 'caris'),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as Cari);
        callbacks.onCaris(items);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, carisPath);
      }
    );
    unsubs.push(unsubCari);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, carisPath);
  }

  // 4. Upcoming Dues
  const duesPath = `users/${userId}/upcomingDues`;
  try {
    const unsubDue = onSnapshot(
      collection(db, 'users', userId, 'upcomingDues'),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as UpcomingDue);
        callbacks.onUpcomingDues(items);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, duesPath);
      }
    );
    unsubs.push(unsubDue);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, duesPath);
  }

  // 5. Stocks
  if (callbacks.onStocks) {
    const stockPath = `users/${userId}/stocks`;
    try {
      const unsubStock = onSnapshot(
        collection(db, 'users', userId, 'stocks'),
        snapshot => {
          const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as StockItem);
          callbacks.onStocks!(items);
        },
        error => {
          handleFirestoreError(error, OperationType.GET, stockPath);
        }
      );
      unsubs.push(unsubStock);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, stockPath);
    }
  }

  // 6. Price Lists
  if (callbacks.onPriceLists) {
    const plPath = `users/${userId}/priceLists`;
    try {
      const unsubPL = onSnapshot(
        collection(db, 'users', userId, 'priceLists'),
        snapshot => {
          const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as PriceListEntry);
          callbacks.onPriceLists!(items);
        },
        error => {
          handleFirestoreError(error, OperationType.GET, plPath);
        }
      );
      unsubs.push(unsubPL);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, plPath);
    }
  }

  // 7. Category Hierarchy
  if (callbacks.onCategoryHierarchy) {
    const catHPath = `users/${userId}/categoryHierarchy`;
    try {
      const unsubCatH = onSnapshot(
        collection(db, 'users', userId, 'categoryHierarchy'),
        snapshot => {
          const items = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as CategoryHierarchyItem);
          if (items.length > 0) callbacks.onCategoryHierarchy!(items);
        },
        error => {
          handleFirestoreError(error, OperationType.GET, catHPath);
        }
      );
      unsubs.push(unsubCatH);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, catHPath);
    }
  }

  return () => {
    unsubs.forEach(u => u());
  };
}

export async function syncCategoryHierarchyToCloud(userId: string, item: CategoryHierarchyItem) {
  const path = `users/${userId}/categoryHierarchy/${item.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'categoryHierarchy', item.id), sanitizeData({ ...item, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryHierarchyFromCloud(userId: string, itemId: string) {
  const path = `users/${userId}/categoryHierarchy/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'categoryHierarchy', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addTransactionToCloud(
  userId: string,
  tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<Transaction> {
  const path = `users/${userId}/transactions`;
  try {
    const payload = sanitizeData({
      ...tx,
      userId,
      createdAt: tx.createdAt || new Date().toISOString(),
    });
    if (tx.id) {
      await setDoc(doc(db, 'users', userId, 'transactions', tx.id), payload);
      return {
        ...tx,
        id: tx.id,
        createdAt: payload.createdAt,
      } as Transaction;
    } else {
      const colRef = collection(db, 'users', userId, 'transactions');
      const docRef = await addDoc(colRef, payload);
      return {
        ...tx,
        id: docRef.id,
        createdAt: payload.createdAt,
      } as Transaction;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function syncTransactionToCloud(userId: string, tx: Transaction) {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'transactions', tx.id),
      sanitizeData({
        ...tx,
        userId,
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTransactionFromCloud(userId: string, txId: string) {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAccountToCloud(userId: string, account: Account) {
  const path = `users/${userId}/accounts/${account.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'accounts', account.id),
      sanitizeData({
        ...account,
        userId,
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAccountFromCloud(userId: string, accountId: string) {
  const path = `users/${userId}/accounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'accounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncCariToCloud(userId: string, cari: Cari) {
  const path = `users/${userId}/caris/${cari.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'caris', cari.id),
      sanitizeData({
        ...cari,
        userId,
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCariFromCloud(userId: string, cariId: string) {
  const path = `users/${userId}/caris/${cariId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'caris', cariId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncUpcomingDueToCloud(userId: string, due: UpcomingDue) {
  const path = `users/${userId}/upcomingDues/${due.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'upcomingDues', due.id),
      sanitizeData({
        ...due,
        userId,
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUpcomingDueFromCloud(userId: string, dueId: string) {
  const path = `users/${userId}/upcomingDues/${dueId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'upcomingDues', dueId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncCategoryToCloud(userId: string, category: CategoryItem) {
  const path = `users/${userId}/categories/${category.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'categories', category.id),
      sanitizeData({
        ...category,
        userId,
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncStockToCloud(userId: string, stock: StockItem) {
  const path = `users/${userId}/stocks/${stock.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'stocks', stock.id), sanitizeData({ ...stock, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncPriceListToCloud(userId: string, priceList: PriceListEntry) {
  const path = `users/${userId}/priceLists/${priceList.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'priceLists', priceList.id), sanitizeData({ ...priceList, userId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function uploadAllInitialDataToCloud(
  userId: string,
  data: {
    accounts: Account[];
    transactions: Transaction[];
    caris: Cari[];
    upcomingDues: UpcomingDue[];
    categories: CategoryItem[];
    stocks?: StockItem[];
    priceLists?: PriceListEntry[];
    categoryHierarchy?: CategoryHierarchyItem[];
  }
) {
  const batch = writeBatch(db);
  const path = `users/${userId}`;
  try {
    data.accounts.forEach(acc => {
      batch.set(
        doc(db, 'users', userId, 'accounts', acc.id),
        sanitizeData({
          ...acc,
          userId,
        })
      );
    });
    data.transactions.forEach(tx => {
      batch.set(
        doc(db, 'users', userId, 'transactions', tx.id),
        sanitizeData({
          ...tx,
          userId,
        })
      );
    });
    data.caris.forEach(c => {
      batch.set(
        doc(db, 'users', userId, 'caris', c.id),
        sanitizeData({
          ...c,
          userId,
        })
      );
    });
    data.upcomingDues.forEach(d => {
      batch.set(
        doc(db, 'users', userId, 'upcomingDues', d.id),
        sanitizeData({
          ...d,
          userId,
        })
      );
    });
    data.categories.forEach(cat => {
      batch.set(
        doc(db, 'users', userId, 'categories', cat.id),
        sanitizeData({
          ...cat,
          userId,
        })
      );
    });
    if (data.stocks) {
      data.stocks.forEach(stk => {
        batch.set(doc(db, 'users', userId, 'stocks', stk.id), sanitizeData({ ...stk, userId }));
      });
    }
    if (data.priceLists) {
      data.priceLists.forEach(pl => {
        batch.set(doc(db, 'users', userId, 'priceLists', pl.id), sanitizeData({ ...pl, userId }));
      });
    }
    if (data.categoryHierarchy) {
      data.categoryHierarchy.forEach(ch => {
        batch.set(doc(db, 'users', userId, 'categoryHierarchy', ch.id), sanitizeData({ ...ch, userId }));
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearAllCloudData(userId: string) {
  const subcollections = ['transactions', 'caris', 'upcomingDues', 'accounts', 'categories', 'stocks', 'priceLists', 'purchases', 'sales', 'categoryHierarchy'];
  for (const sub of subcollections) {
    try {
      const snap = await getDocs(collection(db, 'users', userId, sub));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.error(`Error clearing ${sub} in cloud:`, e);
    }
  }
}

// User Profile & Role Management (RBAC)
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), sanitizeData(profile), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  const path = `users/${userId}`;
  try {
    return onSnapshot(
      doc(db, 'users', userId),
      snap => {
        if (snap.exists()) {
          callback(snap.data() as UserProfile);
        } else {
          callback(null);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

export function subscribeToAllUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    return onSnapshot(
      collection(db, 'users'),
      snap => {
        const users = snap.docs
          .map(d => ({ uid: d.id, ...(d.data() as any) }) as UserProfile)
          .filter(u => u && u.email);
        callback(users);
      },
      error => {
        console.warn('subscribeToAllUsers query notice:', error.message);
        callback([]);
      }
    );
  } catch (error: any) {
    console.warn('subscribeToAllUsers catch notice:', error?.message);
    callback([]);
    return () => {};
  }
}

export async function updateUserRoleInFirestore(
  targetUserId: string,
  newRole: UserRole,
  assignedByEmail: string
): Promise<void> {
  const path = `users/${targetUserId}`;
  try {
    await setDoc(
      doc(db, 'users', targetUserId),
      sanitizeData({
        role: newRole,
        assignedBy: assignedByEmail,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function preAssignUserByEmail(
  email: string,
  role: UserRole,
  assignedByEmail: string,
  displayName?: string
): Promise<UserProfile> {
  const safeId = email.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const path = `users/${safeId}`;
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: safeId,
    email: email.trim().toLowerCase(),
    displayName: displayName?.trim() || email.split('@')[0],
    role,
    createdAt: now,
    lastLoginAt: 'Henüz giriş yapmadı (Beklemede)',
    assignedBy: assignedByEmail,
    isPreAssigned: true,
  };
  try {
    await setDoc(doc(db, 'users', safeId), sanitizeData(profile), { merge: true });
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return profile;
  }
}

export async function checkPreAssignedUser(email: string): Promise<UserProfile | null> {
  const safeId = email.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const path = `users/${safeId}`;
  try {
    const snap = await getDoc(doc(db, 'users', safeId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Pre-assigned check warning:', error);
    return null;
  }
}

export async function deletePreAssignedUser(targetUserId: string): Promise<void> {
  const path = `users/${targetUserId}`;
  try {
    await deleteDoc(doc(db, 'users', targetUserId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'ilkerarslan78@gmail',
    username: 'ilkerarslan78@gmail',
    displayName: 'İlker Arslan (Yönetici)',
    role: 'Admin',
    password: '140514',
    email: 'ilkerarslan78@gmail.com',
    createdAt: new Date().toISOString(),
    createdBy: 'Sistem',
  },
  {
    id: 'admin',
    username: 'admin',
    displayName: 'İlker Arslan (Yönetici)',
    role: 'Admin',
    password: '140514',
    email: 'ilkerarslan78@gmail.com',
    createdAt: new Date().toISOString(),
    createdBy: 'Sistem',
  },
  {
    id: 'kasa',
    username: 'kasa',
    displayName: 'Kasa Personeli',
    role: 'Standart',
    password: '123456',
    email: 'kasa@arslanfinans.internal',
    createdAt: new Date().toISOString(),
    createdBy: 'Sistem',
  },
];

export async function getStaffAccountByUsername(username: string): Promise<StaffAccount | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;
  try {
    const snap = await getDoc(doc(db, 'staff_accounts', clean));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as any) } as StaffAccount;
    }
    const defaultStaff = DEFAULT_STAFF_ACCOUNTS.find(s => s.username === clean || s.email?.toLowerCase() === clean);
    if (defaultStaff) {
      await setDoc(doc(db, 'staff_accounts', clean), sanitizeData(defaultStaff), { merge: true });
      return defaultStaff;
    }
    return null;
  } catch (error) {
    console.warn('getStaffAccountByUsername check error:', error);
    const defaultStaff = DEFAULT_STAFF_ACCOUNTS.find(s => s.username === clean || s.email?.toLowerCase() === clean);
    return defaultStaff || null;
  }
}

export async function loginStaffWithUsername(
  rawUsername: string,
  rawPassword: string
): Promise<{ staff: StaffAccount; role: UserRole; profile: UserProfile; authUid: string }> {
  const username = rawUsername.trim().toLowerCase();
  const password = rawPassword.trim();
  if (!username) {
    throw new Error('Lütfen kullanıcı adını girin.');
  }
  if (!password) {
    throw new Error('Lütfen şifrenizi girin.');
  }

  let staff = await getStaffAccountByUsername(username);
  if (!staff) {
    const defaultStaff = DEFAULT_STAFF_ACCOUNTS.find(
      s => s.username.toLowerCase() === username || s.email?.toLowerCase() === username
    );
    if (defaultStaff) {
      staff = defaultStaff;
    }
  }

  const isAdminVariation =
    username === 'admin' ||
    username === 'ilkerarslan78' ||
    username === 'ilkerarslan78@gmail' ||
    username === 'ilkerarslan78@gmail.com' ||
    username === 'arslanmobilya78@gmail.com';

  if (!staff && isAdminVariation) {
    staff = DEFAULT_STAFF_ACCOUNTS[0];
  }

  if (!staff) {
    throw new Error('Kullanıcı bulunamadı. Lütfen kullanıcı adını kontrol edin.');
  }

  const isAdminUser =
    isAdminVariation ||
    staff.username === 'admin' ||
    staff.role === 'Admin' ||
    staff.email?.toLowerCase() === 'ilkerarslan78@gmail.com' ||
    staff.email?.toLowerCase() === 'arslanmobilya78@gmail.com';

  if (isAdminUser) {
    if (password !== '140514' && staff.password !== password) {
      throw new Error('Hatalı şifre girdiniz. Yönetici şifrenizi (140514) kontrol edin.');
    }
  } else {
    const validStaffPasswords = ['123456'];
    if (staff.password) validStaffPasswords.push(staff.password);
    if (!validStaffPasswords.includes(password)) {
      throw new Error('Hatalı şifre girdiniz. Lütfen kontrol edip tekrar deneyin.');
    }
  }

  const internalEmail = staff.email || `${username}@arslanfinans.internal`;
  let authUid = `staff_${staff.username.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  try {
    const cred = await signInWithEmailAndPassword(auth, internalEmail, password);
    if (cred.user) {
      authUid = cred.user.uid;
    }
  } catch (authErr) {
    // offline fallback
  }

  const profile: UserProfile = {
    uid: authUid,
    email: internalEmail,
    displayName: staff.displayName,
    role: isAdminUser ? 'Admin' : (staff.role || 'Standart'),
    createdAt: staff.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    assignedBy: staff.createdBy || 'Sistem',
    username: staff.username,
    isStaff: true,
  };

  try {
    await setDoc(doc(db, 'staff_accounts', staff.username), { lastLoginAt: new Date().toISOString() }, { merge: true });
  } catch {}

  return { staff, role: profile.role, profile, authUid };
}

export function subscribeToStaffAccounts(
  callback: (staffList: StaffAccount[]) => void
): () => void {
  const path = 'staff_accounts';
  try {
    return onSnapshot(
      collection(db, 'staff_accounts'),
      async snap => {
        if (snap.empty) {
          for (const item of DEFAULT_STAFF_ACCOUNTS) {
            await setDoc(doc(db, 'staff_accounts', item.username), sanitizeData(item), { merge: true });
          }
          callback(DEFAULT_STAFF_ACCOUNTS);
          return;
        }
        const list = snap.docs.map(
          d => ({ id: d.id, ...(d.data() as any) }) as StaffAccount
        );
        callback(list);
      },
      error => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function saveStaffAccount(account: StaffAccount): Promise<void> {
  const clean = account.username.trim().toLowerCase();
  const path = `staff_accounts/${clean}`;
  const data: StaffAccount = {
    ...account,
    id: clean,
    username: clean,
    email: account.email || `${clean}@arslanfinans.internal`,
    createdAt: account.createdAt || new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'staff_accounts', clean), sanitizeData(data), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateStaffAccountInFirestore(
  username: string,
  updates: Partial<StaffAccount>
): Promise<StaffAccount> {
  const clean = username.trim().toLowerCase();
  const path = `staff_accounts/${clean}`;
  const existing = await getStaffAccountByUsername(clean);
  const updated: StaffAccount = {
    ...(existing || {
      id: clean,
      username: clean,
      displayName: clean,
      role: 'Standart',
      createdAt: new Date().toISOString(),
    }),
    ...updates,
    id: clean,
    username: clean,
  };
  try {
    await setDoc(doc(db, 'staff_accounts', clean), sanitizeData(updated), { merge: true });
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return updated;
  }
}

export async function deleteStaffAccount(username: string): Promise<void> {
  const clean = username.trim().toLowerCase();
  const path = `staff_accounts/${clean}`;
  try {
    await deleteDoc(doc(db, 'staff_accounts', clean));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDeletionRequestToCloud(
  userId: string,
  request: DeletionRequest
): Promise<void> {
  const path = `users/${userId}/deletionRequests/${request.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'deletionRequests', request.id), sanitizeData(request), {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDeletionRequestFromCloud(
  userId: string,
  requestId: string
): Promise<void> {
  const path = `users/${userId}/deletionRequests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'deletionRequests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAuditLogToCloud(
  userId: string,
  log: AuditLogEntry
): Promise<void> {
  const path = `users/${userId}/auditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'auditLogs', log.id), sanitizeData(log), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
