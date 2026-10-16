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

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşıöç]/gi, '')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
}

export function parseExcelDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  const dmYMatch = str.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/);
  if (dmYMatch) {
    const d = dmYMatch[1].padStart(2, '0');
    const m = dmYMatch[2].padStart(2, '0');
    const y = dmYMatch[3];
    return `${y}-${m}-${d}`;
  }
  const ymdMatch = str.match(/^(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

export function parseExcelAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  let str = String(val).trim().replace(/[₺\s]/g, '');
  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

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
    result.errors.push('Excel dosyasında sayfa bulunamadı.');
    return result;
  }

  const sheetName =
    workbook.SheetNames.find(s =>
      /islem|hareket|finans|kasa|banka|transaction/i.test(s)
    ) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    result.errors.push('Çalışma sayfası okunamadı.');
    return result;
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) {
    result.errors.push('Excel tablosunda veri satırı bulunamadı.');
    return result;
  }

  const currentCaris = [...existingCaris];
  const currentAccounts = [...existingAccounts];
  const newTransactions: Transaction[] = [];
  const addedCaris: Cari[] = [];

  const defaultAccount =
    currentAccounts.find(a => a.type === 'Ticari Hesap') || currentAccounts[0];

  rawRows.forEach((row, idx) => {
    const rowMap: { [k: string]: any } = {};
    for (const rawKey of Object.keys(row)) {
      rowMap[normalizeKey(rawKey)] = row[rawKey];
    }

    const dateVal =
      rowMap['tarih'] ??
      rowMap['islemtarihi'] ??
      rowMap['giristarihi'] ??
      rowMap['date'] ??
      rowMap['vade'];
    const date = parseExcelDate(dateVal);

    const amountVal =
      rowMap['tutar'] ??
      rowMap['tutartl'] ??
      rowMap['amount'] ??
      rowMap['bedel'] ??
      rowMap['toplam'] ??
      rowMap['bakiye'];
    const amount = parseExcelAmount(amountVal);
    if (amount <= 0) return;

    const typeVal = String(
      rowMap['tur'] ??
        rowMap['tip'] ??
        rowMap['islemturu'] ??
        rowMap['type'] ??
        ''
    ).trim().toLowerCase();

    let type: 'Gelir' | 'Gider' | 'Transfer' | 'Mal Alımı' = 'Gider';
    if (
      typeVal.includes('gelir') ||
      typeVal.includes('tahsilat') ||
      typeVal.includes('giris') ||
      typeVal.includes('income')
    ) {
      type = 'Gelir';
    } else if (
      typeVal.includes('mal al') ||
      typeVal.includes('malalim') ||
      typeVal.includes('tedarikci borc') ||
      typeVal.includes('borclan') ||
      typeVal.includes('purchase')
    ) {
      type = 'Mal Alımı';
    } else if (
      typeVal.includes('transfer') ||
      typeVal.includes('virman')
    ) {
      type = 'Transfer';
    } else {
      type = 'Gider';
    }

    const category = String(
      rowMap['kategori'] ??
        rowMap['category'] ??
        rowMap['harcamakalemi'] ??
        rowMap['kalem'] ??
        (type === 'Gelir' ? 'Diğer Gelirler' : 'Diğer Giderler')
    ).trim() || (type === 'Gelir' ? 'Diğer Gelirler' : 'Diğer Giderler');

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

    const desc = String(
      rowMap['aciklama'] ??
        rowMap['description'] ??
        rowMap['detay'] ??
        rowMap['not'] ??
        rowMap['bilgi'] ??
        ''
    ).trim() || `${category} İşlemi`;

    const documentNo = String(
      rowMap['belgeno'] ??
        rowMap['faturano'] ??
        rowMap['evrakno'] ??
        rowMap['docno'] ??
        ''
    ).trim() || undefined;

    const accNameRaw = String(
      rowMap['hesap'] ??
        rowMap['hesapkasa'] ??
        rowMap['banka'] ??
        rowMap['kasa'] ??
        rowMap['account'] ??
        ''
    ).trim();

    let targetAcc = currentAccounts.find(
      a =>
        a.name.toLowerCase() === accNameRaw.toLowerCase() ||
        (a.bankName && a.bankName.toLowerCase() === accNameRaw.toLowerCase())
    );

    if (!targetAcc) {
      targetAcc = defaultAccount;
    }

    let matchedCariId: string | undefined = undefined;
    if (cariNameRaw) {
      let existingCari = currentCaris.find(
        c => c.name.toLowerCase() === cariNameRaw.toLowerCase()
      );
      if (!existingCari) {
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

      if (existingCari.type === 'Müşteri') {
        if (type === 'Gelir') {
          existingCari.balance -= amount;
        }
      } else if (existingCari.type === 'Tedarikçi') {
        if (type === 'Gider') {
          existingCari.balance += amount;
        } else if (type === 'Mal Alımı') {
          existingCari.balance -= amount;
        }
      }
    }

    if (targetAcc && type !== 'Mal Alımı') {
      if (type === 'Gelir') {
        targetAcc.balance += amount;
      } else if (type === 'Gider') {
        targetAcc.balance -= amount;
      }
    }

    const dueDateVal =
      rowMap['vadetarihi'] ??
      rowMap['vade'] ??
      rowMap['duedate'] ??
      rowMap['odemetarihi'];
    const dueDate = dueDateVal ? parseExcelDate(dueDateVal) : undefined;

    const newTx: Transaction = {
      id: `tx-excel-${Date.now()}-${idx}`,
      date,
      dueDate,
      type,
      category,
      amount,
      accountId: targetAcc ? targetAcc.id : 'acc-kasa',
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
