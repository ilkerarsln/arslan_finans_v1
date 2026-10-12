import { Account, Cari, CategoryItem, Transaction, UpcomingDue } from '../types/finance';

// Varsayılan hesaplar sıfır bakiye ile başlatılır (İstenildiği gibi demo verisi yok, temiz başlangıç)
export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-kasa',
    name: 'Kasa (Nakit)',
    type: 'Kasa (Nakit)',
    balance: 0,
    currency: 'TRY',
    color: '#d97706',
    icon: 'Vault',
  },
  {
    id: 'acc-banka',
    name: 'Banka Hesabı',
    type: 'Ticari Hesap',
    bankName: 'Ana Banka Hesabı',
    accountNumber: '',
    iban: '',
    balance: 0,
    currency: 'TRY',
    color: '#2563eb',
    icon: 'Landmark',
  },
  {
    id: 'acc-kart',
    name: 'Kredi Kartı',
    type: 'Şirket Kredi Kartı',
    bankName: 'Ticari Kart',
    accountNumber: '',
    balance: 0,
    creditLimit: 0,
    currency: 'TRY',
    color: '#7c3aed',
    icon: 'CreditCard',
  },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  // Gelir Kategorileri
  { id: 'cat-inc-1', name: 'Satış Gelirleri', type: 'Gelir', color: '#10b981' },
  { id: 'cat-inc-2', name: 'Hizmet / Danışmanlık', type: 'Gelir', color: '#06b6d4' },
  { id: 'cat-inc-3', name: 'Cari Hesap Tahsilatı', type: 'Gelir', color: '#8b5cf6' },
  { id: 'cat-inc-4', name: 'Diğer Gelirler', type: 'Gelir', color: '#64748b' },

  // Gider Kategorileri
  { id: 'cat-exp-1', name: 'Kira', type: 'Gider', color: '#f59e0b' },
  { id: 'cat-exp-2', name: 'Mal / Stok Alımı', type: 'Gider', color: '#3b82f6' },
  { id: 'cat-exp-3', name: 'Personel & Maaş', type: 'Gider', color: '#8b5cf6' },
  { id: 'cat-exp-4', name: 'Fatura & Hizmetler', type: 'Gider', color: '#06b6d4' },
  { id: 'cat-exp-5', name: 'Vergi & SGK', type: 'Gider', color: '#ef4444' },
  { id: 'cat-exp-6', name: 'Kredi Kartı', type: 'Gider', color: '#f43f5e' },
  { id: 'cat-exp-7', name: 'Genel Giderler', type: 'Gider', color: '#64748b' },
];

// Temiz başlangıç: Demo cari hesap, işlem ve vade kaydı yok (0 adet)
export const INITIAL_CARIS: Cari[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_UPCOMING_DUES: UpcomingDue[] = [];
