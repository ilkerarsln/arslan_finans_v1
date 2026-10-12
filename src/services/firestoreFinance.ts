import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Account,
  Cari,
  CategoryItem,
  Transaction,
  UpcomingDue,
} from '../types/finance';

export function subscribeToUserData(
  userId: string,
  callbacks: {
    onAccounts: (accounts: Account[]) => void;
    onTransactions: (transactions: Transaction[]) => void;
    onCaris: (caris: Cari[]) => void;
    onUpcomingDues: (dues: UpcomingDue[]) => void;
    onCategories: (categories: CategoryItem[]) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  // Accounts
  const accsPath = `users/${userId}/accounts`;
  try {
    const unsubAcc = onSnapshot(
      collection(db, 'users', userId, 'accounts'),
      snapshot => {
        const items = snapshot.docs.map(d => d.data() as Account);
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

  // Transactions
  const txPath = `users/${userId}/transactions`;
  try {
    const unsubTx = onSnapshot(
      collection(db, 'users', userId, 'transactions'),
      snapshot => {
        const items = snapshot.docs.map(d => d.data() as Transaction);
        // Sort newest first
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  // Caris
  const carisPath = `users/${userId}/caris`;
  try {
    const unsubCari = onSnapshot(
      collection(db, 'users', userId, 'caris'),
      snapshot => {
        const items = snapshot.docs.map(d => d.data() as Cari);
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

  // Upcoming Dues
  const duesPath = `users/${userId}/upcomingDues`;
  try {
    const unsubDue = onSnapshot(
      collection(db, 'users', userId, 'upcomingDues'),
      snapshot => {
        const items = snapshot.docs.map(d => d.data() as UpcomingDue);
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

  // Categories
  const catPath = `users/${userId}/categories`;
  try {
    const unsubCat = onSnapshot(
      collection(db, 'users', userId, 'categories'),
      snapshot => {
        const items = snapshot.docs.map(d => d.data() as CategoryItem);
        callbacks.onCategories(items);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, catPath);
      }
    );
    unsubs.push(unsubCat);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, catPath);
  }

  return () => {
    unsubs.forEach(u => u());
  };
}

export async function syncAccountToCloud(userId: string, account: Account) {
  const path = `users/${userId}/accounts/${account.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'accounts', account.id), {
      ...account,
      userId,
    });
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

export async function syncTransactionToCloud(userId: string, tx: Transaction) {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), {
      ...tx,
      userId,
    });
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

export async function syncCariToCloud(userId: string, cari: Cari) {
  const path = `users/${userId}/caris/${cari.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'caris', cari.id), {
      ...cari,
      userId,
    });
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
    await setDoc(doc(db, 'users', userId, 'upcomingDues', due.id), {
      ...due,
      userId,
    });
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
    await setDoc(doc(db, 'users', userId, 'categories', category.id), {
      ...category,
      userId,
    });
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
  }
) {
  const batch = writeBatch(db);
  const path = `users/${userId}`;

  try {
    data.accounts.forEach(acc => {
      batch.set(doc(db, 'users', userId, 'accounts', acc.id), {
        ...acc,
        userId,
      });
    });

    data.transactions.forEach(tx => {
      batch.set(doc(db, 'users', userId, 'transactions', tx.id), {
        ...tx,
        userId,
      });
    });

    data.caris.forEach(c => {
      batch.set(doc(db, 'users', userId, 'caris', c.id), {
        ...c,
        userId,
      });
    });

    data.upcomingDues.forEach(d => {
      batch.set(doc(db, 'users', userId, 'upcomingDues', d.id), {
        ...d,
        userId,
      });
    });

    data.categories.forEach(cat => {
      batch.set(doc(db, 'users', userId, 'categories', cat.id), {
        ...cat,
        userId,
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearAllCloudData(userId: string) {
  const subcollections = ['transactions', 'caris', 'upcomingDues', 'accounts', 'categories'];
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
