import * as XLSX from 'xlsx';
import { Account, Cari, Transaction } from '../types/finance';

export interface ExcelImportResult {
  transactionsCount: number;
  carisCount: number;
  newTransactions: Transaction[];
  newCaris: Cari[];
  updatedAccounts: Account[];
  errors: string[];
}

/**
 * Normalizes an object's keys by lowercasing and trimming spaces and punctuation.
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/gi, '');
}

/**
 * Converts an Excel serial date or date string to YYYY-MM-DD.
 */
export function parseExcelDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];

  // If it's a number (Excel date serial e.g. 45570)
  if (typeof val === 'number') {
    // 25569 = Days between 1900-01-01 and 1970-01-01
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  // Format DD.MM.YYYY or DD/MM/YYYY
  const dmYMatch = str.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/);
  if (dmYMatch) {
    const d = dmYMatch[1].padStart(2, '0');
    const m = dmYMatch[2].padStart(2, '0');
    const y = dmYMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Format YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback to JS Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parses numerical amount from strings like '₺1.250,50' or '-450.00'
 */
export function parseExcelAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;

  let str = String(val).trim().replace(/[₺$€\s]/g, '');
  // Detect Turkish format with period as thousand separator and comma as decimal (e.g. 1.250,50)
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Only comma (e.g. 1250,50)
    str = str.replace(',', '.');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

/**
 * Parses an Excel file (.xlsx / .xls) buffer into transactions and caris.
 */
export function parseExcelData(
  fileBuffer: ArrayBuffer,
  existingAccounts: Account[],
  existingCaris: Cari[]
): ExcelImportResult {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const result: ExcelImportResult = {
    transactionsCount: 0,
    carisCount: 0,
    newTransactions: [],
    newCaris: [],
    updatedAccounts: [...existingAccounts],
    errors: [],
  };

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    result.errors.push('Excel dosyasında çalışma sayfası bulunamadı.');
    return result;
  }

  // First sheet or sheet with name like 'İşlemler' / 'Hareketler'
  const sheetName =
    workbook.SheetNames.find(s =>
      /işlem|hareket|finans|kasa|banka|transaction/i.test(s)
    ) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    result.errors.push('Çalışma sayfası okunamadı.');
    return result;
  }

  // Convert to JSON objects with raw rows
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    result.errors.push('Excel tablosunda veri satırı bulunamadı.');
    return result;
  }

  // Temporary working lists
  const currentCaris = [...existingCaris];
  const currentAccounts = [...existingAccounts];
  const newTransactions: Transaction[] = [];
  const addedCaris: Cari[] = [];

  // Default account to fall back to
  const defaultAccount =
    currentAccounts.find(a => a.type === 'Ticari Hesap') || currentAccounts[0];

  rawRows.forEach((row, idx) => {
    // Map columns dynamically by checking normalized keys
    const rowMap: { [k: string]: any } = {};
    for (const rawKey of Object.keys(row)) {
      rowMap[normalizeKey(rawKey)] = row[rawKey];
    }

    // Tarih
    const dateVal =
      rowMap['tarih'] ??
      rowMap['islemtarihi'] ??
      rowMap['giristarihi'] ??
      rowMap['date'] ??
      rowMap['vade'];
    const date = parseExcelDate(dateVal);

    // Tutar
    const amountVal =
      rowMap['tutar'] ??
      rowMap['tutartl'] ??
      rowMap['amount'] ??
      rowMap['bedel'] ??
      rowMap['toplam'] ??
      rowMap['bakiye'];
    const amount = parseExcelAmount(amountVal);
    if (amount <= 0) {
      // Skip empty or header-like rows
      return;
    }

    // Tür (Gelir, Gider, Transfer)
    const typeVal = String(
      rowMap['tur'] ??
        rowMap['tip'] ??
        rowMap['islemturu'] ??
        rowMap['type'] ??
        ''
    ).trim().toLowerCase();

    let type: 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alışı' = 'Gider';
    if (
      typeVal.includes('gelir') ||
      typeVal.includes('tahsilat') ||
      typeVal.includes('giris') ||
      typeVal.includes('income')
    ) {
      type = 'Gelir';
    } else if (
      typeVal.includes('mal alımı') ||
      typeVal.includes('malalim') ||
      typeVal.includes('tedarikçi borc') ||
      typeVal.includes('borçlan') ||
      typeVal.includes('purchase')
    ) {
      type = 'Mal Alışı';
    } else if (
      typeVal.includes('transfer') ||
      typeVal.includes('virman')
    ) {
      type = 'Transfer';
    } else {
      type = 'Gider';
    }

    // Kategori
    const category = String(
      rowMap['kategori'] ??
        rowMap['category'] ??
        rowMap['harcamakalemi'] ??
        rowMap['kalem'] ??
        (type === 'Gelir' ? 'Diğer Gelirler' : 'Diğer Giderler')
    ).trim() || (type === 'Gelir' ? 'Diğer Gelirler' : 'Diğer Giderler');

    // Cari / Firma
    const cariNameRaw = String(
      rowMap['carifirma'] ??
        rowMap['cari'] ??
        rowMap['firma'] ??
        rowMap['musteri'] ??
        rowMap['tedarikci'] ??
        rowMap['cariadi'] ??
        rowMap['unvan'] ??
        rowMap['musteritedarikci'] ??
        rowMap['contact'] ??
        ''
    ).trim();

    // Açıklama
    const desc = String(
      rowMap['aciklama'] ??
        rowMap['description'] ??
        rowMap['detay'] ??
        rowMap['not'] ??
        rowMap['bilgi'] ??
        ''
    ).trim() || `${category} İşlemi`;

    // Belge No
    const documentNo = String(
      rowMap['belgeno'] ??
        rowMap['faturano'] ??
        rowMap['evrakno'] ??
        rowMap['docno'] ??
        ''
    ).trim() || undefined;

    // Hesap
    const accNameRaw = String(
      rowMap['hesap'] ??
        rowMap['hesapkasa'] ??
        rowMap['banka'] ??
        rowMap['kasa'] ??
        rowMap['account'] ??
        ''
    ).trim();

    // Match or assign account
    let targetAcc = currentAccounts.find(
      a =>
        a.name.toLowerCase() === accNameRaw.toLowerCase() ||
        (a.bankName && a.bankName.toLowerCase() === accNameRaw.toLowerCase())
    );
    if (!targetAcc) {
      targetAcc = defaultAccount;
    }

    // Handle Cari matching / creation
    let matchedCariId: string | undefined = undefined;
    if (cariNameRaw) {
      let existingCari = currentCaris.find(
        c => c.name.toLowerCase() === cariNameRaw.toLowerCase()
      );
      if (!existingCari) {
        // Automatically create Cari
        const newCari: Cari = {
          id: `cari-excel-${Date.now()}-${idx}`,
          name: cariNameRaw,
          type: type === 'Gelir' ? 'Müşteri' : 'Tedarikçi',
          balance: 0,
          city: 'Belirtilmedi',
        };
        currentCaris.push(newCari);
        addedCaris.push(newCari);
        existingCari = newCari;
      }
      matchedCariId = existingCari.id;

      // Update Cari balance according to movement
      if (existingCari.type === 'Müşteri') {
        if (type === 'Gelir') {
          existingCari.balance -= amount; // Tahsilat aldıkça cari bakiye kapanır
        }
      } else if (existingCari.type === 'Tedarikçi') {
        if (type === 'Gider') {
          existingCari.balance += amount; // Ödeme yaptıkça borç kapanır
        } else if (type === 'Mal Alışı') {
          existingCari.balance -= amount; // Mal alışı yaptıkça borç artar
        }
      }
    }

    // Update account balance (Kasadan nakit sadece Gelir veya Gider'de değişir, Mal Alışı doğrudan borçtur)
    if (targetAcc && type !== 'Mal Alışı') {
      if (type === 'Gelir') {
        targetAcc.balance += amount;
      } else if (type === 'Gider') {
        targetAcc.balance -= amount;
      }
    }

    // DueDate from row
    const dueDateVal =
      rowMap['vadetarihi'] ??
      rowMap['vade'] ??
      rowMap['duedate'] ??
      rowMap['odemetarihi'];
    const dueDate = dueDateVal ? parseExcelDate(dueDateVal) : undefined;

    // Create Transaction
    const newTx: Transaction = {
      id: `tx-excel-${Date.now()}-${idx}`,
      date,
      dueDate,
      type,
      category,
      amount,
      accountId: targetAcc ? targetAcc.id : 'acc-1',
      cariId: matchedCariId,
      cariName: cariNameRaw || undefined,
      desc,
      status: 'Tamamlandı',
      documentNo,
      createdAt: new Date().toISOString(),
    };
    newTransactions.push(newTx);
  });

  result.newTransactions = newTransactions;
  result.newCaris = addedCaris;
  result.updatedAccounts = currentAccounts;
  result.transactionsCount = newTransactions.length;
  result.carisCount = addedCaris.length;
  return result;
}
