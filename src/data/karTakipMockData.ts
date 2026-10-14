import {
  KarTakipUser,
  KarTakipSupplier,
  PurchaseRecord,
  WholesalePriceItem,
  SaleRecord,
  MonthlyPeriodStatus,
  ExpenseRecord,
  ProductCategory
} from '../types/karTakip';

export const INITIAL_USERS: KarTakipUser[] = [
  {
    id: 'usr_admin',
    name: 'Sistem Yöneticisi',
    email: 'admin@arslanmobilya.com',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_ahmet',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@arslanmobilya.com',
    role: 'SALES_REP',
    salesRepName: 'Ahmet Yılmaz',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_zeynep',
    name: 'Zeynep Kaya',
    email: 'zeynep@arslanmobilya.com',
    role: 'SALES_REP',
    salesRepName: 'Zeynep Kaya',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_mehmet',
    name: 'Mehmet Demir',
    email: 'mehmet@arslanmobilya.com',
    role: 'SALES_REP',
    salesRepName: 'Mehmet Demir',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr_elif',
    name: 'Elif Şahin',
    email: 'elif@arslanmobilya.com',
    role: 'SALES_REP',
    salesRepName: 'Elif Şahin',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_SUPPLIERS: KarTakipSupplier[] = [
  {
    id: 'sup_01',
    code: 'TED-ASL',
    name: 'Asil Döşeme & Koltuk San. A.Ş.',
    category: 'Koltuk Takımları',
    contactPerson: 'Murat Asiloğlu',
    phone: '0224 714 88 00',
    email: 'siparis@asildoseme.com.tr',
    city: 'İnegöl / Bursa',
    paymentTerms: '45 Gün Vadeli Çek',
    notes: 'Hakiki nubuk kumaş ve fırınlanmış gürgen iskelet üreticisi',
    activeProductsCount: 12
  },
  {
    id: 'sup_02',
    code: 'TED-ERG',
    name: 'Ergonomik Yatak & Baza Sistemleri Ltd.',
    category: 'Yatak Odası',
    contactPerson: 'Serdar Yıldız',
    phone: '0352 321 44 20',
    email: 'tedarik@ergonomikyatak.com',
    city: 'Kayseri OSB',
    paymentTerms: '30 Gün Vadeli',
    notes: 'Çift emniyet amortisörlü çelik baza ve ortopedik yataklar',
    activeProductsCount: 8
  },
  {
    id: 'sup_03',
    code: 'TED-ORM',
    name: 'Orman Ahşap & Masif Mobilya Ltd.',
    category: 'Yemek Odası',
    contactPerson: 'Kemal Ormancı',
    phone: '0312 350 77 10',
    email: 'muhasebe@ormanoz.com.tr',
    city: 'Siteler / Ankara',
    paymentTerms: 'Peşin İskontolu (%5)',
    notes: 'Fırınlanmış masif meşe ve ceviz açılır masa üretimi',
    activeProductsCount: 14
  },
  {
    id: 'sup_04',
    code: 'TED-BKO',
    name: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    category: 'Ev Aletleri & Beyaz Eşya',
    contactPerson: 'Hakan Çetin',
    phone: '0216 585 90 00',
    email: 'kurumsal@beyazesyadagitim.com',
    city: 'İstanbul',
    paymentTerms: '60 Gün DBS',
    notes: 'A+++ NoFrost buzdolapları, inverter klimalar, ankastre setler',
    activeProductsCount: 22
  },
  {
    id: 'sup_05',
    code: 'TED-MOD',
    name: 'Modüler Ahşap & TV Sistemleri Ltd.',
    category: 'Oturma Odası',
    contactPerson: 'Derya Aktaş',
    phone: '0232 478 12 30',
    email: 'info@modulerahsap.com',
    city: 'Karabağlar / İzmir',
    paymentTerms: '30 Gün Açık Hesap',
    notes: 'Duvar üniteleri, lake konsollar ve akıllı sehpalar',
    activeProductsCount: 9
  }
];

export const INITIAL_PURCHASES: PurchaseRecord[] = [
  // 2024-04 Mal Alımları
  {
    id: 'pur_001',
    purchaseDate: '2024-04-02',
    periodMonth: '2024-04',
    supplierId: 'sup_01',
    supplierName: 'Asil Döşeme & Koltuk San. A.Ş.',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    quantity: 10,
    unitCost: 18500,
    totalCost: 185000,
    invoiceNo: 'IRS-2024-0312',
    notes: 'Nisan partisi 1. sevkiyat'
  },
  {
    id: 'pur_002',
    purchaseDate: '2024-04-05',
    periodMonth: '2024-04',
    supplierId: 'sup_02',
    supplierName: 'Ergonomik Yatak & Baza Sistemleri Ltd.',
    productCode: 'YTK-202',
    productName: 'Venedik Baza & Başlık (160x200)',
    category: 'Yatak Odası',
    quantity: 15,
    unitCost: 9200,
    totalCost: 138000,
    invoiceNo: 'IRS-2024-0344',
    notes: 'Gri nubuk kumaşlı seri'
  },
  {
    id: 'pur_003',
    purchaseDate: '2024-04-08',
    periodMonth: '2024-04',
    supplierId: 'sup_03',
    supplierName: 'Orman Ahşap & Masif Mobilya Ltd.',
    productCode: 'MAS-303',
    productName: 'Masif Meşe Açılır Yemek Masası',
    category: 'Yemek Odası',
    quantity: 8,
    unitCost: 11000,
    totalCost: 88000,
    invoiceNo: 'IRS-2024-0380',
    notes: '1. Sınıf doğal meşe'
  },
  {
    id: 'pur_004',
    purchaseDate: '2024-04-10',
    periodMonth: '2024-04',
    supplierId: 'sup_04',
    supplierName: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    productCode: 'BEY-901',
    productName: 'Inox NoFrost 580L Akıllı Buzdolabı',
    category: 'Ev Aletleri & Beyaz Eşya',
    quantity: 6,
    unitCost: 24500,
    totalCost: 147000,
    invoiceNo: 'BKO-FAT-2024-88',
    notes: 'A+++ Inverter seri'
  },

  // 2024-05 Mal Alımları
  {
    id: 'pur_005',
    purchaseDate: '2024-05-02',
    periodMonth: '2024-05',
    supplierId: 'sup_01',
    supplierName: 'Asil Döşeme & Koltuk San. A.Ş.',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    quantity: 8,
    unitCost: 20500,
    totalCost: 164000,
    invoiceNo: 'IRS-2024-0501',
    notes: 'Kumaş zam farkı uygulandı'
  },
  {
    id: 'pur_006',
    purchaseDate: '2024-05-03',
    periodMonth: '2024-05',
    supplierId: 'sup_02',
    supplierName: 'Ergonomik Yatak & Baza Sistemleri Ltd.',
    productCode: 'YTK-202',
    productName: 'Venedik Baza & Başlık (160x200)',
    category: 'Yatak Odası',
    quantity: 12,
    unitCost: 9400,
    totalCost: 112800,
    invoiceNo: 'IRS-2024-0518',
    notes: 'Antrasit renk opsiyonu'
  },
  {
    id: 'pur_007',
    purchaseDate: '2024-05-05',
    periodMonth: '2024-05',
    supplierId: 'sup_03',
    supplierName: 'Orman Ahşap & Masif Mobilya Ltd.',
    productCode: 'MAS-303',
    productName: 'Masif Meşe Açılır Yemek Masası',
    category: 'Yemek Odası',
    quantity: 6,
    unitCost: 12200,
    totalCost: 73200,
    invoiceNo: 'IRS-2024-0530',
    notes: 'Zamlı parti'
  },
  {
    id: 'pur_008',
    purchaseDate: '2024-05-06',
    periodMonth: '2024-05',
    supplierId: 'sup_03',
    supplierName: 'Orman Ahşap & Masif Mobilya Ltd.',
    productCode: 'SND-404',
    productName: "Monako Kumaş Sandalye (4'lü Paket)",
    category: 'Yemek Odası',
    quantity: 10,
    unitCost: 4800,
    totalCost: 48000,
    invoiceNo: 'IRS-2024-0535',
    notes: 'Kadife döşemeli'
  },
  {
    id: 'pur_009',
    purchaseDate: '2024-05-08',
    periodMonth: '2024-05',
    supplierId: 'sup_05',
    supplierName: 'Modüler Ahşap & TV Sistemleri Ltd.',
    productCode: 'TVU-505',
    productName: 'Nordic Meşe TV Ünitesi & Raf',
    category: 'Oturma Odası',
    quantity: 8,
    unitCost: 6800,
    totalCost: 54400,
    invoiceNo: 'MOD-IRS-2024-77',
    notes: 'Frenli menteşe'
  },
  {
    id: 'pur_010',
    purchaseDate: '2024-05-10',
    periodMonth: '2024-05',
    supplierId: 'sup_05',
    supplierName: 'Modüler Ahşap & TV Sistemleri Ltd.',
    productCode: 'GRD-606',
    productName: 'Bergama 6 Kapaklı Aynalı Gardırop',
    category: 'Yatak Odası',
    quantity: 4,
    unitCost: 22000,
    totalCost: 88000,
    invoiceNo: 'MOD-IRS-2024-82',
    notes: 'LED sensörlü askı'
  },
  {
    id: 'pur_011',
    purchaseDate: '2024-05-11',
    periodMonth: '2024-05',
    supplierId: 'sup_04',
    supplierName: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    productCode: 'BEY-901',
    productName: 'Inox NoFrost 580L Akıllı Buzdolabı',
    category: 'Ev Aletleri & Beyaz Eşya',
    quantity: 8,
    unitCost: 25200,
    totalCost: 201600,
    invoiceNo: 'BKO-FAT-2024-114',
    notes: 'Mayıs ayı kampanyalı parti'
  },
  {
    id: 'pur_012',
    purchaseDate: '2024-05-12',
    periodMonth: '2024-05',
    supplierId: 'sup_04',
    supplierName: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    productCode: 'BEY-902',
    productName: '14 Kişilik HijyenMax Bulaşık Makinesi',
    category: 'Ev Aletleri & Beyaz Eşya',
    quantity: 12,
    unitCost: 14800,
    totalCost: 177600,
    invoiceNo: 'BKO-FAT-2024-118',
    notes: 'Buharlı hijyen fonksiyonu'
  }
];

export const INITIAL_WHOLESALE_PRICES: WholesalePriceItem[] = [
  // 2024-04 Dönemi
  {
    id: 'wp_01',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    wholesalePrice: 18500,
    periodMonth: '2024-04',
    supplier: 'Asil Döşeme & Koltuk San. A.Ş.',
    supplierId: 'sup_01',
    notes: 'İtalyan nubuk kumaş, gürgen iskelet',
    updatedAt: '2024-04-01'
  },
  {
    id: 'wp_02',
    productCode: 'YTK-202',
    productName: 'Venedik Baza & Başlık (160x200)',
    category: 'Yatak Odası',
    wholesalePrice: 9200,
    periodMonth: '2024-04',
    supplier: 'Ergonomik Yatak & Baza Sistemleri Ltd.',
    supplierId: 'sup_02',
    notes: 'Çift amortisörlü çelik kasa',
    updatedAt: '2024-04-01'
  },
  {
    id: 'wp_03',
    productCode: 'MAS-303',
    productName: 'Masif Meşe Açılır Yemek Masası',
    category: 'Yemek Odası',
    wholesalePrice: 11000,
    periodMonth: '2024-04',
    supplier: 'Orman Ahşap & Masif Mobilya Ltd.',
    supplierId: 'sup_03',
    notes: 'Doğal ahşap tabla, siyah metal ayak',
    updatedAt: '2024-04-01'
  },
  {
    id: 'wp_04',
    productCode: 'SND-404',
    productName: "Monako Kumaş Sandalye (4'lü Paket)",
    category: 'Yemek Odası',
    wholesalePrice: 4800,
    periodMonth: '2024-04',
    supplier: 'Orman Ahşap & Masif Mobilya Ltd.',
    supplierId: 'sup_03',
    notes: 'Leke tutmaz kadife döşeme',
    updatedAt: '2024-04-01'
  },
  {
    id: 'wp_05',
    productCode: 'TVU-505',
    productName: 'Nordic Meşe TV Ünitesi & Raf',
    category: 'Oturma Odası',
    wholesalePrice: 6500,
    periodMonth: '2024-04',
    supplier: 'Modüler Ahşap & TV Sistemleri Ltd.',
    supplierId: 'sup_05',
    notes: 'Gizli kablo kanalı, frenli çekmeceler',
    updatedAt: '2024-04-01'
  },
  {
    id: 'wp_13',
    productCode: 'BEY-901',
    productName: 'Inox NoFrost 580L Akıllı Buzdolabı',
    category: 'Ev Aletleri & Beyaz Eşya',
    wholesalePrice: 24500,
    periodMonth: '2024-04',
    supplier: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    supplierId: 'sup_04',
    notes: 'Buzmatiği ve invertör kompresör',
    updatedAt: '2024-04-01'
  },

  // 2024-05 Dönemi
  {
    id: 'wp_06',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    wholesalePrice: 20500,
    periodMonth: '2024-05',
    supplier: 'Asil Döşeme & Koltuk San. A.Ş.',
    supplierId: 'sup_01',
    notes: 'Döşemelik nubuk kumaş zamlandı',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_07',
    productCode: 'YTK-202',
    productName: 'Venedik Baza & Başlık (160x200)',
    category: 'Yatak Odası',
    wholesalePrice: 9400,
    periodMonth: '2024-05',
    supplier: 'Ergonomik Yatak & Baza Sistemleri Ltd.',
    supplierId: 'sup_02',
    notes: 'Standart maliyet',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_08',
    productCode: 'MAS-303',
    productName: 'Masif Meşe Açılır Yemek Masası',
    category: 'Yemek Odası',
    wholesalePrice: 12200,
    periodMonth: '2024-05',
    supplier: 'Orman Ahşap & Masif Mobilya Ltd.',
    supplierId: 'sup_03',
    notes: 'Kereste zam farkı',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_09',
    productCode: 'SND-404',
    productName: "Monako Kumaş Sandalye (4'lü Paket)",
    category: 'Yemek Odası',
    wholesalePrice: 4800,
    periodMonth: '2024-05',
    supplier: 'Orman Ahşap & Masif Mobilya Ltd.',
    supplierId: 'sup_03',
    notes: 'Sabit fiyat',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_10',
    productCode: 'TVU-505',
    productName: 'Nordic Meşe TV Ünitesi & Raf',
    category: 'Oturma Odası',
    wholesalePrice: 6800,
    periodMonth: '2024-05',
    supplier: 'Modüler Ahşap & TV Sistemleri Ltd.',
    supplierId: 'sup_05',
    notes: 'Aksesuar kulp revizyonu',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_11',
    productCode: 'GRD-606',
    productName: 'Bergama 6 Kapaklı Aynalı Gardırop',
    category: 'Yatak Odası',
    wholesalePrice: 22000,
    periodMonth: '2024-05',
    supplier: 'Modüler Ahşap & TV Sistemleri Ltd.',
    supplierId: 'sup_05',
    notes: 'LED aydınlatmalı askılıklar',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_14',
    productCode: 'BEY-901',
    productName: 'Inox NoFrost 580L Akıllı Buzdolabı',
    category: 'Ev Aletleri & Beyaz Eşya',
    wholesalePrice: 25500,
    periodMonth: '2024-05',
    supplier: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    supplierId: 'sup_04',
    notes: 'Enerji sınıfı güncellemesi',
    updatedAt: '2024-05-01'
  },
  {
    id: 'wp_15',
    productCode: 'BEY-902',
    productName: '14 Kişilik HijyenMax Bulaşık Makinesi',
    category: 'Ev Aletleri & Beyaz Eşya',
    wholesalePrice: 15200,
    periodMonth: '2024-05',
    supplier: 'Beko & Arçelik Yetkili Dağıtım A.Ş.',
    supplierId: 'sup_04',
    notes: 'Kazan garantisi',
    updatedAt: '2024-05-01'
  }
];

export const INITIAL_PERIOD_STATUSES: MonthlyPeriodStatus[] = [
  {
    periodMonth: '2024-04',
    isClosed: true,
    closedAt: '2024-05-01 18:30',
    closedBy: 'Sistem Yöneticisi',
    notes: 'Nisan 2024 mali dönemi mutabakatla kapatılmış ve kilitlenmiştir.'
  },
  {
    periodMonth: '2024-05',
    isClosed: false,
    notes: 'Aktif açık dönem (İşlemler devam ediyor).'
  }
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sal_001',
    salesRep: 'Ahmet Yılmaz',
    date: '2024-05-04',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    quantity: 2,
    unitSalePrice: 32000,
    discountPercent: 5,
    totalSalePrice: 60800,
    customerName: 'Kaya Mimarlık Ltd.',
    invoiceNo: 'FAT-2024-0891',
    hasWholesalePrice: true
  },
  {
    id: 'sal_002',
    salesRep: 'Zeynep Kaya',
    date: '2024-05-06',
    productCode: 'YTK-202',
    productName: 'Venedik Baza & Başlık (160x200)',
    category: 'Yatak Odası',
    quantity: 3,
    unitSalePrice: 15500,
    discountPercent: 0,
    totalSalePrice: 46500,
    customerName: 'Gülhan Konutları',
    invoiceNo: 'FAT-2024-0892',
    hasWholesalePrice: true
  },
  {
    id: 'sal_003',
    salesRep: 'Ahmet Yılmaz',
    date: '2024-05-07',
    productCode: 'SEH-707',
    productName: "Akasya Yan Sehpa (3'lü C Sehpa)",
    category: 'Aksesuar',
    quantity: 5,
    unitSalePrice: 3400,
    discountPercent: 0,
    totalSalePrice: 17000,
    customerName: 'Burak Serbest',
    invoiceNo: 'FAT-2024-0893',
    hasWholesalePrice: false
  },
  {
    id: 'sal_004',
    salesRep: 'Mehmet Demir',
    date: '2024-05-09',
    productCode: 'MAS-303',
    productName: 'Masif Meşe Açılır Yemek Masası',
    category: 'Yemek Odası',
    quantity: 1,
    unitSalePrice: 19500,
    discountPercent: 10,
    totalSalePrice: 17550,
    customerName: 'Deniz Ertekin',
    invoiceNo: 'FAT-2024-0894',
    hasWholesalePrice: true
  },
  {
    id: 'sal_005',
    salesRep: 'Mehmet Demir',
    date: '2024-05-10',
    productCode: 'SND-404',
    productName: "Monako Kumaş Sandalye (4'lü Paket)",
    category: 'Yemek Odası',
    quantity: 2,
    unitSalePrice: 8200,
    discountPercent: 0,
    totalSalePrice: 16400,
    customerName: 'Deniz Ertekin',
    invoiceNo: 'FAT-2024-0895',
    hasWholesalePrice: true
  },
  {
    id: 'sal_006',
    salesRep: 'Elif Şahin',
    date: '2024-05-12',
    productCode: 'BEY-901',
    productName: 'Inox NoFrost 580L Akıllı Buzdolabı',
    category: 'Ev Aletleri & Beyaz Eşya',
    quantity: 2,
    unitSalePrice: 38500,
    discountPercent: 0,
    totalSalePrice: 77000,
    customerName: 'Aksoy İnşaat Örnek Daire',
    invoiceNo: 'FAT-2024-0896',
    hasWholesalePrice: true
  },
  {
    id: 'sal_007',
    salesRep: 'Zeynep Kaya',
    date: '2024-05-13',
    productCode: 'BEY-902',
    productName: '14 Kişilik HijyenMax Bulaşık Makinesi',
    category: 'Ev Aletleri & Beyaz Eşya',
    quantity: 3,
    unitSalePrice: 22000,
    discountPercent: 5,
    totalSalePrice: 62700,
    customerName: 'Vadi Evleri A Blok',
    invoiceNo: 'FAT-2024-0897',
    hasWholesalePrice: true
  },
  {
    id: 'sal_008',
    salesRep: 'Ahmet Yılmaz',
    date: '2024-05-15',
    productCode: 'BRJ-808',
    productName: 'Milenyum Döner Berjer',
    category: 'Koltuk Takımları',
    quantity: 2,
    unitSalePrice: 8900,
    discountPercent: 0,
    totalSalePrice: 17800,
    customerName: 'Vadi Rezidans 402',
    invoiceNo: 'FAT-2024-0898',
    hasWholesalePrice: false
  },
  {
    id: 'sal_009',
    salesRep: 'Elif Şahin',
    date: '2024-05-18',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    quantity: 1,
    unitSalePrice: 19000,
    discountPercent: 0,
    totalSalePrice: 19000,
    customerName: 'Spot Alıcı Tasfiye',
    invoiceNo: 'FAT-2024-0899',
    hasWholesalePrice: true
  },
  {
    id: 'sal_010',
    salesRep: 'Mehmet Demir',
    date: '2024-05-20',
    productCode: 'TVU-505',
    productName: 'Nordic Meşe TV Ünitesi & Raf',
    category: 'Oturma Odası',
    quantity: 2,
    unitSalePrice: 11500,
    discountPercent: 5,
    totalSalePrice: 21850,
    customerName: 'Yıldız Otelcilik',
    invoiceNo: 'FAT-2024-0900',
    hasWholesalePrice: true
  },
  // 2024-04 Geçmiş Ay Satışları
  {
    id: 'sal_011',
    salesRep: 'Ahmet Yılmaz',
    date: '2024-04-12',
    productCode: 'KLT-101',
    productName: "Chesterfield 3'lü Deri Koltuk",
    category: 'Koltuk Takımları',
    quantity: 3,
    unitSalePrice: 31000,
    discountPercent: 0,
    totalSalePrice: 93000,
    customerName: 'Av. Cengizhan Bey',
    invoiceNo: 'FAT-2024-0750',
    hasWholesalePrice: true
  },
  {
    id: 'sal_012',
    salesRep: 'Zeynep Kaya',
    date: '2024-04-22',
    productCode: 'MAS-303',
    productName: 'Masif Meşe Açılır Yemek Masası',
    category: 'Yemek Odası',
    quantity: 2,
    unitSalePrice: 18500,
    discountPercent: 5,
    totalSalePrice: 35150,
    customerName: 'Pınar Hanım',
    invoiceNo: 'FAT-2024-0775',
    hasWholesalePrice: true
  },
  {
    id: 'sal_013',
    salesRep: 'Elif Şahin',
    date: '2024-04-25',
    productCode: 'BEY-901',
    productName: 'Inox NoFrost 580L Akıllı Buzdolabı',
    category: 'Ev Aletleri & Beyaz Eşya',
    quantity: 1,
    unitSalePrice: 37000,
    discountPercent: 0,
    totalSalePrice: 37000,
    customerName: 'Gültekin Villa Projesi',
    invoiceNo: 'FAT-2024-0780',
    hasWholesalePrice: true
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_05_01',
    title: 'Merkez Mağaza & Showroom Kira Bedeli',
    category: 'Kira',
    expenseType: 'FIXED',
    amount: 55000,
    date: '2024-05-05',
    periodMonth: '2024-05',
    paymentStatus: 'PAID',
    paymentMethod: 'Havale / EFT',
    invoiceNo: 'KRA-2024-05',
    supplierOrVendor: 'Mülk Sahibi - Kaya Emlak Yatırım',
    notes: 'Showroom kirası',
    createdAt: '2024-05-05T09:00:00Z'
  },
  {
    id: 'exp_05_02',
    title: 'Personel Maaş & Prim Ödemeleri',
    category: 'Personel & Maaşlar',
    expenseType: 'FIXED',
    amount: 76000,
    date: '2024-05-08',
    periodMonth: '2024-05',
    paymentStatus: 'PAID',
    paymentMethod: 'Banka Maaş Hesabı',
    invoiceNo: 'BOR-2024-05',
    supplierOrVendor: 'Personel Maaş Bordroları',
    notes: 'Maaş ve Mayıs satış primleri',
    createdAt: '2024-05-08T10:00:00Z'
  },
  {
    id: 'exp_05_03',
    title: 'Showroom Elektrik & Doğalgaz Faturası',
    category: 'Elektrik & Su & Doğalgaz',
    expenseType: 'VARIABLE',
    amount: 11200,
    date: '2024-05-13',
    periodMonth: '2024-05',
    paymentStatus: 'PAID',
    paymentMethod: 'Otomatik Ödeme',
    invoiceNo: 'UED-2024-7742',
    supplierOrVendor: 'Uludağ Elektrik Dağıtım A.Ş.',
    notes: 'Aylık elektrik tüketimi',
    createdAt: '2024-05-13T12:00:00Z'
  },
  {
    id: 'exp_05_04',
    title: 'Müşteri Ev Teslimatları & Mazot Gideri',
    category: 'Nakliye & Lojistik',
    expenseType: 'VARIABLE',
    amount: 16800,
    date: '2024-05-20',
    periodMonth: '2024-05',
    paymentStatus: 'PAID',
    paymentMethod: 'Taşıt Tanıma',
    invoiceNo: 'PO-2024-0899',
    supplierOrVendor: 'Petrol Ofisi',
    notes: 'Şehir içi ve çevre ilçe teslimatları',
    createdAt: '2024-05-20T15:00:00Z'
  },
  {
    id: 'exp_05_05',
    title: 'Mali Müşavirlik Hizmet Bedeli',
    category: 'Muhasebe & Mali Müşavirlik',
    expenseType: 'FIXED',
    amount: 7500,
    date: '2024-05-25',
    periodMonth: '2024-05',
    paymentStatus: 'PAID',
    paymentMethod: 'Havale / EFT',
    invoiceNo: 'SMM-2024-05',
    supplierOrVendor: 'Güngör Serbest Muhasebe Ltd.',
    notes: 'Mayıs ayı müşavirlik',
    createdAt: '2024-05-25T11:00:00Z'
  }
];

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat_01',
    name: 'Koltuk Takımları',
    code: 'KLT',
    color: '#10b981',
    targetMarginPercent: 35,
    description: 'Salon ve oturma grubu koltuk takımları, köşe takımları ve berjerler',
    subcategories: [
      { id: 'sub_01_01', code: 'KLT-KOS', name: 'Köşe Koltuk Takımı', description: 'L ve U tipi köşe takımları' },
      { id: 'sub_01_02', code: 'KLT-UCL', name: "3'lü / 4'lü Koltuk", description: 'Yataklı ve sandıklı oturma üniteleri' },
      { id: 'sub_01_03', code: 'KLT-BRJ', name: 'Berjer & Tekli Koltuk', description: 'Döner ayaklı ve klasik berjerler' },
      { id: 'sub_01_04', code: 'KLT-PUF', name: 'Puf & Dinlenme Koltuğu', description: 'Ayak ucu ve dekoratif puflar' }
    ]
  },
  {
    id: 'cat_02',
    name: 'Yatak Odası',
    code: 'YTK',
    color: '#06b6d4',
    targetMarginPercent: 32,
    description: 'Karyola, baza, başlık, ortopedik yataklar ve gardırop sistemleri',
    subcategories: [
      { id: 'sub_02_01', code: 'YTK-BAZ', name: 'Baza & Yatak Başlığı', description: 'Amortisörlü sandıklı bazalar' },
      { id: 'sub_02_02', code: 'YTK-ORT', name: 'Ortopedik / Visco Yatak', description: 'Pocket yaylı ve ergonomik yataklar' },
      { id: 'sub_02_03', code: 'YTK-GRD', name: 'Gardırop & Dolap', description: 'Sürgülü ve aynalı gardıroplar' },
      { id: 'sub_02_04', code: 'YTK-KMD', name: 'Komodin & Şifonyer', description: 'Çekmeceli yan üniteler' }
    ]
  },
  {
    id: 'cat_03',
    name: 'Yemek Odası',
    code: 'YMK',
    color: '#f59e0b',
    targetMarginPercent: 30,
    description: 'Yemek masaları, sandalyeler, vitrin ve konsol takımları',
    subcategories: [
      { id: 'sub_03_01', code: 'YMK-MAS', name: 'Açılır Yemek Masası', description: 'Masif ve lake açılır masalar' },
      { id: 'sub_03_02', code: 'YMK-SND', name: 'Yemek Sandalyesi', description: 'Döşemeli ahşap & metal ayaklı sandalyeler' },
      { id: 'sub_03_03', code: 'YMK-KNS', name: 'Konsol & Ayna', description: 'Yemek odası büfe ve konsolları' }
    ]
  },
  {
    id: 'cat_04',
    name: 'Ev Aletleri & Beyaz Eşya',
    code: 'BEY',
    color: '#8b5cf6',
    targetMarginPercent: 22,
    description: 'Buzdolabı, çamaşır, bulaşık makineleri ve ankastre mutfak setleri',
    subcategories: [
      { id: 'sub_04_01', code: 'BEY-SOĞ', name: 'Buzdolabı & Derin Dondurucu', description: 'NoFrost ve Inox buzdolapları' },
      { id: 'sub_04_02', code: 'BEY-YIK', name: 'Çamaşır & Kurutma Makinesi', description: 'Inverter motorlu yüksek kapasiteli makineler' },
      { id: 'sub_04_03', code: 'BEY-BLS', name: 'Bulaşık Makinesi', description: 'A+++ enerji sınıflı modeller' },
      { id: 'sub_04_04', code: 'BEY-ANK', name: 'Ankastre Set & Fırın', description: 'Ocak, davlumbaz ve fırın grupları' }
    ]
  },
  {
    id: 'cat_05',
    name: 'Oturma Odası',
    code: 'OTR',
    color: '#ec4899',
    targetMarginPercent: 34,
    description: 'TV üniteleri, orta sehpalar, zigon sehpalar ve kitaplıklar',
    subcategories: [
      { id: 'sub_05_01', code: 'OTR-TVU', name: 'TV Ünitesi & Duvar Rafı', description: 'Akıllı kablo kanallı TV üniteleri' },
      { id: 'sub_05_02', code: 'OTR-SHP', name: 'Orta & Zigon Sehpa', description: 'Masif meşe ve mermer tablalı sehpalar' },
      { id: 'sub_05_03', code: 'OTR-KTP', name: 'Kitaplık & Vitrin', description: 'Dekoratif açık raf ve kitaplık sistemleri' }
    ]
  }
];
