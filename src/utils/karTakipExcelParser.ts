import * as XLSX from 'xlsx';
import {
  ColumnMapping,
  SaleRecord,
  WholesaleColumnMapping,
  WholesalePriceItem,
  PurchaseColumnMapping,
  PurchaseRecord,
  ProductAliasMapping
} from '../types/karTakip';

export interface ParsedSheetData {
  fileName: string;
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  rows: Record<string, any>[];
}

export async function parseExcelOrCsvFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Dosya içeriği okunamadı.');

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) throw new Error('Excel dosyasında çalışma sayfası bulunamadı.');

        const firstSheetName = sheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: false });
        if (rawRows.length === 0) throw new Error('Seçilen çalışma sayfasında veri bulunamadı.');

        const headers = Object.keys(rawRows[0]);

        resolve({
          fileName: file.name,
          sheetNames,
          selectedSheet: firstSheetName,
          headers,
          rows: rawRows
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Dosya okuma sırasında hata oluştu.'));
    reader.readAsBinaryString(file);
  });
}

export function autoGuessSalesMapping(headers: string[]): ColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const h of headers) {
      const clean = h.trim().toLowerCase();
      for (const cand of candidates) {
        if (clean.includes(cand.toLowerCase())) {
          return h;
        }
      }
    }
    return '';
  };

  return {
    salesRep: findMatch(['satış temsilcisi', 'satış personeli', 'temsilci', 'personel', 'satıcı', 'sales rep', 'personnel', 'satıcı adı']),
    date: findMatch(['tarih', 'satış tarihi', 'işlem tarihi', 'date', 'gün']),
    productCode: findMatch(['ürün kodu', 'stok kodu', 'sku', 'barkod', 'kod', 'product code', 'item code']),
    productName: findMatch(['ürün adı', 'ürün', 'malzeme', 'ürün tanımı', 'product name', 'item name', 'açıklama']),
    category: findMatch(['kategori', 'ürün grubu', 'grup', 'tür', 'category']),
    quantity: findMatch(['adet', 'miktar', 'sayı', 'quantity', 'qty']),
    unitSalePrice: findMatch(['birim fiyat', 'satış fiyatı', 'birim satış', 'fiyat', 'unit price', 'satış birim']),
    discountPercent: findMatch(['iskonto', 'indirim', 'isk %', 'discount']),
    totalSalePrice: findMatch(['toplam tutar', 'toplam satış', 'ciro', 'tutar', 'satış tutarı', 'total', 'net tutar']),
    customerName: findMatch(['müşteri', 'firma', 'alıcı', 'cari', 'müşteri adı', 'customer']),
    invoiceNo: findMatch(['fatura', 'belge no', 'fiş no', 'invoice', 'sipariş no'])
  };
}

export function autoGuessWholesaleMapping(headers: string[]): WholesaleColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const h of headers) {
      const clean = h.trim().toLowerCase();
      for (const cand of candidates) {
        if (clean.includes(cand.toLowerCase())) {
          return h;
        }
      }
    }
    return '';
  };

  return {
    productCode: findMatch(['ürün kodu', 'stok kodu', 'sku', 'barkod', 'kod', 'product code', 'item code']),
    productName: findMatch(['ürün adı', 'ürün', 'malzeme', 'ürün tanımı', 'product name', 'item name']),
    category: findMatch(['kategori', 'grup', 'ürün grubu', 'category']),
    wholesalePrice: findMatch(['toptan fiyat', 'toptan alış', 'maliyet', 'toptan', 'alış fiyatı', 'birim maliyet', 'wholesale price', 'cost']),
    supplier: findMatch(['tedarikçi', 'üretici', 'fabrika', 'firma', 'supplier', 'vendor']),
    notes: findMatch(['not', 'açıklama', 'notlar', 'özellik', 'notes'])
  };
}

export function autoGuessPurchaseMapping(headers: string[]): PurchaseColumnMapping {
  const findMatch = (candidates: string[]): string => {
    for (const h of headers) {
      const clean = h.trim().toLowerCase();
      for (const cand of candidates) {
        if (clean.includes(cand.toLowerCase())) {
          return h;
        }
      }
    }
    return '';
  };

  return {
    purchaseDate: findMatch(['alım tarihi', 'tarih', 'irsaliye tarihi', 'fatura tarihi', 'date', 'giriş tarihi']),
    supplierName: findMatch(['tedarikçi', 'firma', 'üretici', 'satıcı', 'supplier', 'cari']),
    productCode: findMatch(['ürün kodu', 'stok kodu', 'sku', 'barkod', 'kod', 'product code']),
    productName: findMatch(['ürün adı', 'ürün', 'malzeme', 'ürün tanımı', 'product name']),
    category: findMatch(['kategori', 'grup', 'ürün grubu', 'category']),
    quantity: findMatch(['adet', 'miktar', 'alım adedi', 'gelen adet', 'quantity', 'qty']),
    unitCost: findMatch(['alış fiyatı', 'birim maliyet', 'birim fiyat', 'toptan maliyet', 'maliyet', 'unit cost']),
    invoiceNo: findMatch(['irsaliye', 'fatura', 'belge no', 'irsaliye no', 'invoice']),
    notes: findMatch(['not', 'açıklama', 'notlar', 'özellik', 'notes'])
  };
}

export function parseCleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  let str = String(val).trim();
  str = str.replace(/[₺$€\s]/g, '');
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function convertRowsToSales(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  aliasMappings: ProductAliasMapping[] = []
): SaleRecord[] {
  return rows.map((row, index) => {
    const qty = parseCleanNumber(mapping.quantity ? row[mapping.quantity] : 1) || 1;
    let unitPrice = parseCleanNumber(mapping.unitSalePrice ? row[mapping.unitSalePrice] : 0);
    let total = parseCleanNumber(mapping.totalSalePrice ? row[mapping.totalSalePrice] : 0);
    const discount = parseCleanNumber(mapping.discountPercent ? row[mapping.discountPercent] : 0) || 0;

    if (total === 0 && unitPrice > 0) {
      total = unitPrice * qty * (1 - discount / 100);
    } else if (unitPrice === 0 && total > 0 && qty > 0) {
      unitPrice = total / qty;
    }

    let dateVal = String(row[mapping.date] || '').trim();
    if (dateVal.includes('T')) {
      dateVal = dateVal.split('T')[0];
    }

    const rawCode = String(row[mapping.productCode] || `PRD-${index + 1}`).trim().toUpperCase();
    const rawName = String(row[mapping.productName] || 'Tanımsız Ürün').trim();

    const alias = aliasMappings.find(a => {
      const matchCode = a.sourceProductCode && a.sourceProductCode.trim().toUpperCase() === rawCode;
      const matchName = a.sourceProductName && a.sourceProductName.trim().toLowerCase() === rawName.toLowerCase();
      return matchCode || matchName;
    });

    return {
      id: `sale_imp_${Date.now()}_${index}`,
      salesRep: String(row[mapping.salesRep] || 'Genel Satış').trim(),
      date: dateVal || new Date().toISOString().split('T')[0],
      productCode: rawCode,
      productName: rawName,
      category: String(row[mapping.category] || (alias ? alias.targetCategory || 'Genel' : 'Genel')).trim(),
      quantity: qty,
      unitSalePrice: Math.round(unitPrice * 100) / 100,
      discountPercent: discount,
      totalSalePrice: Math.round(total * 100) / 100,
      customerName: mapping.customerName ? String(row[mapping.customerName] || '').trim() : '',
      invoiceNo: mapping.invoiceNo ? String(row[mapping.invoiceNo] || '').trim() : '',
      hasWholesalePrice: false,
      matchedViaAlias: Boolean(alias),
      matchedTargetCode: alias ? alias.targetProductCode : undefined,
      matchedTargetName: alias ? alias.targetProductName : undefined
    };
  });
}

export function convertRowsToWholesale(
  rows: Record<string, any>[],
  mapping: WholesaleColumnMapping,
  periodMonth: string
): WholesalePriceItem[] {
  return rows.map((row, index) => {
    const cost = parseCleanNumber(row[mapping.wholesalePrice]);
    return {
      id: `wp_imp_${periodMonth}_${index}_${Date.now()}`,
      productCode: String(row[mapping.productCode] || `SKU-${index + 1}`).trim().toUpperCase(),
      productName: String(row[mapping.productName] || 'Toptan Ürün').trim(),
      category: String(row[mapping.category] || 'Genel').trim(),
      wholesalePrice: Math.round(cost * 100) / 100,
      periodMonth,
      supplier: mapping.supplier ? String(row[mapping.supplier] || '').trim() : '',
      notes: mapping.notes ? String(row[mapping.notes] || '').trim() : '',
      updatedAt: new Date().toISOString().split('T')[0]
    };
  });
}

export function convertRowsToPurchases(
  rows: Record<string, any>[],
  mapping: PurchaseColumnMapping,
  periodMonth: string
): PurchaseRecord[] {
  return rows.map((row, index) => {
    const qty = parseCleanNumber(row[mapping.quantity]) || 1;
    const unitCost = parseCleanNumber(row[mapping.unitCost]);
    const totalCost = unitCost * qty;
    let purchaseDate = String(row[mapping.purchaseDate] || '').trim();
    if (purchaseDate.includes('T')) {
      purchaseDate = purchaseDate.split('T')[0];
    }
    if (!purchaseDate) {
      purchaseDate = `${periodMonth}-01`;
    }

    return {
      id: `pur_imp_${periodMonth}_${index}_${Date.now()}`,
      purchaseDate,
      periodMonth,
      supplierId: `sup_imp_${index}`,
      supplierName: String(row[mapping.supplierName] || 'Tedarikçi Firma').trim(),
      productCode: String(row[mapping.productCode] || `SKU-${index + 1}`).trim().toUpperCase(),
      productName: String(row[mapping.productName] || 'Malzeme').trim(),
      category: String(row[mapping.category] || 'Genel').trim(),
      quantity: qty,
      unitCost: Math.round(unitCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      invoiceNo: mapping.invoiceNo ? String(row[mapping.invoiceNo] || '').trim() : '',
      notes: mapping.notes ? String(row[mapping.notes] || '').trim() : ''
    };
  });
}

export function downloadPurchasesTemplate() {
  const sampleData = [
    {
      'Alım Tarihi': '2024-05-02',
      'Tedarikçi Firma': 'Asil Döşeme & Koltuk San. A.Ş.',
      'İrsaliye / Fatura No': 'IRS-2024-0501',
      'Ürün Kodu': 'KLT-101',
      'Ürün Adı': "Chesterfield 3'lü Deri Koltuk",
      'Kategori': 'Koltuk Takımları',
      'Alınan Adet': 8,
      'Birim Alış Maliyeti (TL)': 20500,
      'Açıklama / Notlar': 'Kumaş zam farkı uygulandı'
    },
    {
      'Alım Tarihi': '2024-05-03',
      'Tedarikçi Firma': 'Ergonomik Yatak & Baza Sistemleri Ltd.',
      'İrsaliye / Fatura No': 'IRS-2024-0518',
      'Ürün Kodu': 'YTK-202',
      'Ürün Adı': 'Venedik Baza & Başlık (160x200)',
      'Kategori': 'Yatak Odası',
      'Alınan Adet': 12,
      'Birim Alış Maliyeti (TL)': 9400,
      'Açıklama / Notlar': 'Antrasit nubuk kumaş'
    },
    {
      'Alım Tarihi': '2024-05-06',
      'Tedarikçi Firma': 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
      'İrsaliye / Fatura No': 'BKO-FAT-2024-114',
      'Ürün Kodu': 'BEY-901',
      'Ürün Adı': 'Inox NoFrost 580L Akıllı Buzdolabı',
      'Kategori': 'Ev Aletleri & Beyaz Eşya',
      'Alınan Adet': 6,
      'Birim Alış Maliyeti (TL)': 25200,
      'Açıklama / Notlar': 'A+++ seri'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mal Alım Listesi');
  XLSX.writeFile(wb, 'ornek_mal_alim_sablonu.xlsx');
}

export function downloadSalesTemplate() {
  const sampleData = [
    {
      'Satış Temsilcisi': 'Ahmet Yılmaz',
      'Satış Tarihi': '2024-05-15',
      'Ürün Kodu': 'KLT-101',
      'Ürün Adı': "Chesterfield 3'lü Deri Koltuk",
      'Kategori': 'Koltuk Takımları',
      'Adet': 2,
      'Birim Satış Fiyatı (TL)': 32000,
      'İskonto (%)': 5,
      'Toplam Satış Tutarı (TL)': 60800,
      'Müşteri Adı': 'Akasya Rezidans',
      'Fatura No': 'FAT-2024-1001'
    },
    {
      'Satış Temsilcisi': 'Zeynep Kaya',
      'Satış Tarihi': '2024-05-16',
      'Ürün Kodu': 'YTK-202',
      'Ürün Adı': 'Venedik Baza & Başlık (160x200)',
      'Kategori': 'Yatak Odası',
      'Adet': 1,
      'Birim Satış Fiyatı (TL)': 16000,
      'İskonto (%)': 0,
      'Toplam Satış Tutarı (TL)': 16000,
      'Müşteri Adı': 'Ömer Faruk Bey',
      'Fatura No': 'FAT-2024-1002'
    },
    {
      'Satış Temsilcisi': 'Mehmet Demir',
      'Satış Tarihi': '2024-05-18',
      'Ürün Kodu': 'MAS-303',
      'Ürün Adı': 'Masif Meşe Açılır Yemek Masası',
      'Kategori': 'Yemek Odası',
      'Adet': 1,
      'Birim Satış Fiyatı (TL)': 19500,
      'İskonto (%)': 10,
      'Toplam Satış Tutarı (TL)': 17550,
      'Müşteri Adı': 'Hilal Tekstil Ltd.',
      'Fatura No': 'FAT-2024-1003'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Satış Raporu');
  XLSX.writeFile(wb, 'ornek_satis_raporu_sablonu.xlsx');
}

export function downloadWholesaleTemplate() {
  const sampleData = [
    {
      'Ürün Kodu': 'KLT-101',
      'Ürün Adı': "Chesterfield 3'lü Deri Koltuk",
      'Kategori': 'Koltuk Takımları',
      'Toptan Alış Fiyatı (TL)': 20500,
      'Tedarikçi': 'Asil Döşeme A.Ş.',
      'Notlar / Açıklama': 'Hakiki deri kaplama, 1. sınıf gürgen'
    },
    {
      'Ürün Kodu': 'YTK-202',
      'Ürün Adı': 'Venedik Baza & Başlık (160x200)',
      'Kategori': 'Yatak Odası',
      'Toptan Alış Fiyatı (TL)': 9400,
      'Tedarikçi': 'Ergonomik Yatak Sanayi',
      'Notlar / Açıklama': 'Çift emniyetli pistonlu baza'
    },
    {
      'Ürün Kodu': 'MAS-303',
      'Ürün Adı': 'Masif Meşe Açılır Yemek Masası',
      'Kategori': 'Yemek Odası',
      'Toptan Alış Fiyatı (TL)': 12200,
      'Tedarikçi': 'Orman Ürünleri Ltd.',
      'Notlar / Açıklama': 'Doğal yağlı masif meşe kaplama'
    },
    {
      'Ürün Kodu': 'SND-404',
      'Ürün Adı': "Monako Kumaş Sandalye (4'lü Paket)",
      'Kategori': 'Yemek Odası',
      'Toptan Alış Fiyatı (TL)': 4800,
      'Tedarikçi': 'Orman Ürünleri Ltd.',
      'Notlar / Açıklama': 'Paket içi 4 sandalyedir'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Toptan Fiyat Listesi');
  XLSX.writeFile(wb, 'ornek_toptan_fiyat_listesi_sablonu.xlsx');
}

export function exportSalesToExcel(sales: SaleRecord[], filename = 'satis_kar_analiz_raporu.xlsx') {
  const exportRows = sales.map(s => ({
    'Fatura No': s.invoiceNo || '-',
    'Tarih': s.date,
    'Satış Temsilcisi': s.salesRep,
    'Müşteri': s.customerName || '-',
    'Ürün Kodu': s.productCode,
    'Ürün Adı': s.productName,
    'Kategori': s.category,
    'Adet': s.quantity,
    'Birim Satış Fiyatı (₺)': s.unitSalePrice,
    'Toplam Satış (₺)': s.totalSalePrice,
    'Toptan Birim Maliyet (₺)': s.matchedWholesalePrice ? s.matchedWholesalePrice : 'FİYAT BULUNAMADI',
    'Toplam Maliyet (₺)': s.matchedWholesalePrice ? s.matchedWholesalePrice * s.quantity : 'EKSİK',
    'Net Brüt Kâr (₺)': s.profit !== null && s.profit !== undefined ? s.profit : 'EKSİK',
    'Kâr Marjı (%)': s.profitMargin !== null && s.profitMargin !== undefined ? `%${s.profitMargin}` : 'EKSİK',
    'Durum': !s.hasWholesalePrice
      ? 'Toptan Fiyatı Eksik'
      : (s.profit || 0) < 0
      ? 'Zararına Satış'
      : (s.profitMargin || 0) < 15
      ? 'Düşük Marj'
      : 'Normal Kârlı'
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Satış ve Kâr Raporu');
  XLSX.writeFile(wb, filename);
}
