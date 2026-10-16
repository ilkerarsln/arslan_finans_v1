import * as XLSX from 'xlsx';
import { Supplier, PurchaseItem } from '../types';

export interface ParsedPurchaseRow {
  rowNumber: number;
  supplierCodeOrName: string;
  matchedSupplier?: Supplier;
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  invoiceNo: string;
  date: string;
  isValid: boolean;
  errors: string[];
}

export const downloadPurchaseExcelTemplate = () => {
  const templateData = [
    {
      'Tedarikçi Kodu veya Adı': 'İnegöl Ahşap San. Tic.',
      'Fatura / İrsaliye No': 'FTR-2026-081',
      'Tarih (GG.AA.YYYY)': '14.10.2026',
      'Ürün SKU': 'KLT-010',
      'Ürün Adı': 'Milano Nubuk Koltuk Takımı',
      'Kategori': 'Koltuk Takımları',
      'Miktar': 5,
      'Birim Alış Fiyatı (TL)': 32000,
      'Açıklama': '1. Parti Kış Sezonu Alımı',
    },
    {
      'Tedarikçi Kodu veya Adı': 'Kayseri Sünger & Kumaş Ltd.',
      'Fatura / İrsaliye No': 'FTR-2026-082',
      'Tarih (GG.AA.YYYY)': '14.10.2026',
      'Ürün SKU': 'YTK-025',
      'Ürün Adı': 'Ortopedik King Boy Yatak 180x200',
      'Kategori': 'Yatak Odası',
      'Miktar': 12,
      'Birim Alış Fiyatı (TL)': 8500,
      'Açıklama': 'Sertifikalı antibakteriyel yatak',
    },
    {
      'Tedarikçi Kodu veya Adı': 'Doğuş Ahşap & Panel A.Ş.',
      'Fatura / İrsaliye No': 'FTR-2026-083',
      'Tarih (GG.AA.YYYY)': '13.10.2026',
      'Ürün SKU': 'YMK-008',
      'Ürün Adı': 'Venedik Meşe Açılır Yemek Masası',
      'Kategori': 'Yemek Odası',
      'Miktar': 8,
      'Birim Alış Fiyatı (TL)': 14200,
      'Açıklama': 'Doğal ahşap kaplama',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  // Column widths
  ws['!cols'] = [
    { wch: 28 }, // Tedarikçi
    { wch: 20 }, // Fatura No
    { wch: 18 }, // Tarih
    { wch: 14 }, // SKU
    { wch: 34 }, // Ürün Adı
    { wch: 18 }, // Kategori
    { wch: 10 }, // Miktar
    { wch: 22 }, // Birim Fiyat
    { wch: 30 }, // Açıklama
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mal Alım Listesi');
  XLSX.writeFile(wb, 'Arslan_Mobilya_Mal_Alim_Sablonu.xlsx');
};

export const parsePurchaseExcel = async (
  file: File,
  suppliers: Supplier[]
): Promise<ParsedPurchaseRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsedRows: ParsedPurchaseRow[] = rawJson.map((row, index) => {
          const rowNumber = index + 2; // header is row 1
          const errors: string[] = [];

          // Normalize keys (handle case variations)
          const supplierVal = (
            row['Tedarikçi Kodu veya Adı'] ||
            row['Tedarikçi'] ||
            row['Tedarikçi Adı'] ||
            row['Supplier'] ||
            ''
          ).toString().trim();

          const invoiceNo = (
            row['Fatura / İrsaliye No'] ||
            row['Fatura No'] ||
            row['İrsaliye No'] ||
            row['Fatura'] ||
            `ALIM-${Date.now().toString().slice(-4)}`
          ).toString().trim();

          const dateVal = (
            row['Tarih (GG.AA.YYYY)'] ||
            row['Tarih'] ||
            row['Date'] ||
            new Date().toISOString().split('T')[0]
          ).toString().trim();

          const sku = (
            row['Ürün SKU'] ||
            row['SKU'] ||
            row['Barkod'] ||
            row['Kod'] ||
            `SKU-${Math.floor(100 + Math.random() * 900)}`
          ).toString().trim();

          const productName = (
            row['Ürün Adı'] ||
            row['Ürün'] ||
            row['Product Name'] ||
            ''
          ).toString().trim();

          const category = (
            row['Kategori'] ||
            row['Category'] ||
            'Genel Mobilya'
          ).toString().trim();

          const quantityRaw = row['Miktar'] ?? row['Adet'] ?? row['Quantity'] ?? 0;
          const quantity = Number(quantityRaw);

          const unitPriceRaw =
            row['Birim Alış Fiyatı (TL)'] ??
            row['Birim Fiyat'] ??
            row['Alış Fiyatı'] ??
            row['Unit Price'] ??
            0;
          const unitPrice = Number(unitPriceRaw);

          // Validation
          if (!supplierVal) {
            errors.push('Tedarikçi bilgisi boş bırakılamaz.');
          }

          if (!productName) {
            errors.push('Ürün adı girilmelidir.');
          }

          if (isNaN(quantity) || quantity <= 0) {
            errors.push('Miktar 0\'dan büyük bir sayı olmalıdır.');
          }

          if (isNaN(unitPrice) || unitPrice <= 0) {
            errors.push('Birim alış fiyatı 0\'dan büyük olmalıdır.');
          }

          // Supplier match
          const matchedSupplier = suppliers.find((s) => {
            const sName = s.name.toLowerCase();
            const sCode = s.code.toLowerCase();
            const search = supplierVal.toLowerCase();
            return sName.includes(search) || search.includes(sName) || sCode === search;
          });

          if (!matchedSupplier && supplierVal) {
            errors.push(`'${supplierVal}' adında bir tedarikçi sistemde bulunamadı.`);
          }

          const totalPrice = (isNaN(quantity) ? 0 : quantity) * (isNaN(unitPrice) ? 0 : unitPrice);

          return {
            rowNumber,
            supplierCodeOrName: supplierVal,
            matchedSupplier,
            sku,
            productName,
            category,
            quantity: isNaN(quantity) ? 0 : quantity,
            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
            totalPrice,
            invoiceNo,
            date: dateVal,
            isValid: errors.length === 0,
            errors,
          };
        });

        resolve(parsedRows);
      } catch (err: any) {
        reject(new Error('Excel dosyası ayrıştırılamadı: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsArrayBuffer(file);
  });
};
