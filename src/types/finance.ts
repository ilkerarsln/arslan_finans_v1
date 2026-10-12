export type TransactionType = 'Gelir' | 'Gider' | 'Transfer';

export type TransactionStatus = 'Tamamlandı' | 'Beklemede' | 'İptal';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  cariId?: string;
  cariName?: string;
  desc: string;
  amount: number;
  accountId: string;
  targetAccountId?: string; // Virman için hedef hesap
  status: TransactionStatus;
  documentNo?: string;
  createdAt: string;
  installmentIndex?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
}

export type AccountType = 'Ticari Hesap' | 'Kasa (Nakit)' | 'Şirket Kredi Kartı' | 'Döviz Hesabı';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  balance: number;
  currency: 'TRY' | 'USD' | 'EUR';
  creditLimit?: number;
  cutOffDay?: number;
  color: string;
  icon: string;
}

export type CariType = 'Müşteri' | 'Tedarikçi' | 'Personel' | 'Diğer';

export interface Cari {
  id: string;
  name: string;
  type: CariType;
  phone?: string;
  email?: string;
  taxNumber?: string;
  taxOffice?: string;
  city?: string;
  balance: number; // pozitif: alacağımız var (Müşteri), negatif: borcumuz var (Tedarikçi)
  notes?: string;
}

export interface UpcomingDue {
  id: string;
  title: string;
  type: 'Gelir' | 'Gider';
  amount: number;
  dueDate: string;
  cariId?: string;
  cariName?: string;
  category: string;
  isCompleted: boolean;
  recurrence: 'Tek Seferlik' | 'Aylık' | 'Yıllık';
  accountId?: string;
  installmentIndex?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
}

export interface InstallmentPlanRequest {
  title?: string;
  cariId?: string;
  cariName?: string;
  type: 'Gelir' | 'Gider';
  totalAmount: number;
  installmentsCount: number;
  firstDueDate: string; // YYYY-MM-DD
  category?: string;
  accountId?: string;
  documentNo?: string;
  notes?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'Gelir' | 'Gider';
  color: string;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'accounts' | 'currents' | 'upcoming' | 'reports';
