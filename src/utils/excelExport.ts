import * as XLSX from 'xlsx';
import { Account, Cari, Transaction, UpcomingDue } from '../types/finance';

interface ExportFinanceDataOptions {
  transactions: Transaction[];
  accounts: Account[];
  caris: Cari[];
  upcomingDues: UpcomingDue[];
}

/**
 * Exports financial records (Transactions, Accounts, Caris, Upcoming Dues)
 * into a structured multi-sheet Excel file (.xlsx) and triggers immediate download.
 */
export function exportToExcel({
  transactions,
  accounts,
  caris,
  upcomingDues,
}: ExportFinanceDataOptions): void {
  const workbook = XLSX.utils.book_new();

  // 1. Transactions Sheet (İşlemler)
  const txRows = transactions.map(tx => {
    const account = accounts.find(a => a.id === tx.accountId);
    const targetAccount = tx.targetAccountId ? accounts.find(a => a.id === tx.targetAccountId) : null;
    return {
      'Tarih': tx.date,
      'İşlem Türü': tx.type,
      'Kategori': tx.category,
      'Cari / Firma': tx.cariName || '-',
      'Açıklama': tx.desc || '',
      'Tutar': tx.amount,
      'Hesap': account ? account.name : tx.accountId,
      'Hedef Hesap (Virman)': targetAccount ? targetAccount.name : (tx.targetAccountId || '-'),
      'Durum': tx.status,
      'Belge No': tx.documentNo || '',
      'Taksit No': tx.installmentNumber ? `${tx.installmentNumber}/${tx.installmentTotal}` : '-',
    };
  });
  const txSheet = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(workbook, txSheet, 'İşlemler');

  // 2. Accounts Sheet (Hesaplar & Kasalar)
  const accRows = accounts.map(acc => ({
    'Hesap Adı': acc.name,
    'Tür': acc.type,
    'Banka Adı': acc.bankName || '-',
    'Hesap No': acc.accountNumber || '-',
    'IBAN': acc.iban || '-',
    'Bakiye': acc.balance,
    'Para Birimi': acc.currency,
    'Kredi Limiti': acc.creditLimit || '-',
    'Hesap Kesim Günü': acc.cutOffDay || '-',
  }));
  const accSheet = XLSX.utils.json_to_sheet(accRows);
  XLSX.utils.book_append_sheet(workbook, accSheet, 'Hesaplar');

  // 3. Caris Sheet (Cari Hesaplar - Müşteri & Tedarikçiler)
  const cariRows = caris.map(c => ({
    'Cari Adı': c.name,
    'Tür': c.type,
    'Telefon': c.phone || '-',
    'E-Posta': c.email || '-',
    'Vergi No': c.taxNumber || '-',
    'Vergi Dairesi': c.taxOffice || '-',
    'Şehir': c.city || '-',
    'Bakiye (Alacak Pozitif, Borç Negatif)': c.balance,
    'Notlar': c.notes || '',
  }));
  const cariSheet = XLSX.utils.json_to_sheet(cariRows);
  XLSX.utils.book_append_sheet(workbook, cariSheet, 'Cari Hesaplar');

  // 4. Upcoming Dues Sheet (Vade & Bekleyen Ödemeler)
  const dueRows = upcomingDues.map(d => {
    const acc = accounts.find(a => a.id === d.accountId);
    return {
      'Başlık': d.title,
      'Tür': d.type,
      'Tutar': d.amount,
      'Vade Tarihi': d.dueDate,
      'Kategori': d.category,
      'Cari / Firma': d.cariName || '-',
      'Hesap': acc ? acc.name : (d.accountId || '-'),
      'Durum': d.isCompleted ? 'Ödendi' : 'Bekliyor',
      'Tekrar': d.recurrence || 'Tek Seferlik',
    };
  });
  const dueSheet = XLSX.utils.json_to_sheet(dueRows);
  XLSX.utils.book_append_sheet(workbook, dueSheet, 'Vade Takvimi');

  // Trigger file download
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Arslan_Finans_Raporu_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
