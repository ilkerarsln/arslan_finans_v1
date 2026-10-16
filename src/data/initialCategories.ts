import { CategoryHierarchyItem } from '../types/finance';

export const INITIAL_CATEGORY_HIERARCHY: CategoryHierarchyItem[] = [
  // 1. MOBİLYA -> BAMBİ
  { id: 'cat-1', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ BASLIK' },
  { id: 'cat-2', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ BAZA' },
  { id: 'cat-3', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ BHC MOB' },
  { id: 'cat-4', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ EV TEKS' },
  { id: 'cat-5', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ KOMODIN' },
  { id: 'cat-6', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ OTEL BASLIK' },
  { id: 'cat-7', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ OTEL BAZA' },
  { id: 'cat-8', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ OTEL KOMODIN' },
  { id: 'cat-9', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ OTEL YATAK' },
  { id: 'cat-10', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ TV KLTK' },
  { id: 'cat-11', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ YATAK' },
  { id: 'cat-12', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ YATAK BEBE' },
  { id: 'cat-13', anaKategori: 'MOBİLYA', altKategori: 'BAMBİ', urunGrubu: 'BAMBİ YTK AKS' },

  // 2 & 4. BEYAZ EŞYA -> ALTUS
  { id: 'cat-14', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ANKASTRE DAVLUMBAZLAR' },
  { id: 'cat-15', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ANKASTRE FIRINLAR' },
  { id: 'cat-16', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ANKASTRE OCAKLAR' },
  { id: 'cat-17', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ASPİRATÖR' },
  { id: 'cat-18', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS BULAŞIK MAKİNELERİ' },
  { id: 'cat-19', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ÇAMAŞIR MAKİNELERİ' },
  { id: 'cat-20', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ÇEKMECELİ DERİN DONDURUCU' },
  { id: 'cat-21', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ÇİFT KAPILI BUZDOLAPLARI' },
  { id: 'cat-22', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ÇİFT KAPILI NF BUZDOLAPLARI' },
  { id: 'cat-23', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ISI POMPALI KURUTMA MAKİNELERİ' },
  { id: 'cat-24', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS KLİMA' },
  { id: 'cat-25', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS KOMBİ NF BUZDOLAPLARI' },
  { id: 'cat-26', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS NOFROST ÇEKMECELİ DERİN DONDURUCU' },
  { id: 'cat-27', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS SOLO SETÜSTÜ OCAKLAR' },
  { id: 'cat-28', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS TEK KAPILI BUZDOLAPLARI' },
  { id: 'cat-29', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS TV' },
  { id: 'cat-30', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS ÜSTTEN KAPAKLI DERİN DONDURUCU' },
  { id: 'cat-31', anaKategori: 'BEYAZ EŞYA', altKategori: 'ALTUS', urunGrubu: 'ALTUS YOĞUŞMALI KURUTMA MAKİNELERİ' },

  // 3. BEYAZ EŞYA -> KEA
  { id: 'cat-32', anaKategori: 'BEYAZ EŞYA', altKategori: 'KEA', urunGrubu: 'ALTUS KEA' },
  { id: 'cat-33', anaKategori: 'BEYAZ EŞYA', altKategori: 'KEA', urunGrubu: 'MUHTELİF KEA' },
  { id: 'cat-34', anaKategori: 'BEYAZ EŞYA', altKategori: 'KEA', urunGrubu: 'TEFAL KARCHER' },

  // 5. BEYAZ EŞYA -> BOSCH
  { id: 'cat-35', anaKategori: 'BEYAZ EŞYA', altKategori: 'BOSCH', urunGrubu: 'BOSCH' },

  // 6. BEYAZ EŞYA -> HOOVER
  { id: 'cat-36', anaKategori: 'BEYAZ EŞYA', altKategori: 'HOOVER', urunGrubu: 'HOOVER BULAŞIK MAKİNELERİ' },
  { id: 'cat-37', anaKategori: 'BEYAZ EŞYA', altKategori: 'HOOVER', urunGrubu: 'HOOVER ÇAMAŞIR MAKİNELERİ' },
  { id: 'cat-38', anaKategori: 'BEYAZ EŞYA', altKategori: 'HOOVER', urunGrubu: 'HOOVER KURUTMA MAKİNELERİ' },
  { id: 'cat-39', anaKategori: 'BEYAZ EŞYA', altKategori: 'HOOVER', urunGrubu: 'HOOVER KURUTMALI ÇAMAŞIR MAKİNESİ' },

  // 7. BEYAZ EŞYA -> UGUR
  { id: 'cat-40', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR ANKASTRE DAVLUMBAZ' },
  { id: 'cat-41', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR ANKASTRE FIRIN' },
  { id: 'cat-42', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR ANKASTRE OCAK' },
  { id: 'cat-43', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR BUZDOLABI' },
  { id: 'cat-44', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR CEKMECELI DONDURUCU' },
  { id: 'cat-45', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR ÇAMAŞIR MAKİNESİ' },
  { id: 'cat-46', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR KURUTMA MAKİNESİ' },
  { id: 'cat-47', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR NF CEKMECELİ DONDURUCU' },
  { id: 'cat-48', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR SETUSTU OCAK' },
  { id: 'cat-49', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR SU ARITMA' },
  { id: 'cat-50', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR ÜSTTEN KAPAKLI DONDURUCU' },
  { id: 'cat-51', anaKategori: 'BEYAZ EŞYA', altKategori: 'UGUR', urunGrubu: 'UGUR BULASIK MAKİNESİ' },

  // 8. MOBİLYA -> MOBİLYA
  { id: 'cat-52', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'AKABE' },
  { id: 'cat-53', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'ANKARA MOBİLYA' },
  { id: 'cat-54', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'AYTASHOME' },
  { id: 'cat-55', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'BENİMODAM' },
  { id: 'cat-56', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'HALİ' },
  { id: 'cat-57', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'İPEK' },
  { id: 'cat-58', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'LADİN' },
  { id: 'cat-59', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'ÖREN MOBİLYA' },
  { id: 'cat-60', anaKategori: 'MOBİLYA', altKategori: 'MOBİLYA', urunGrubu: 'SERHAT' },

  // 9. MOBİLYA -> YATAK
  { id: 'cat-61', anaKategori: 'MOBİLYA', altKategori: 'YATAK', urunGrubu: 'BEDLIFE CİBO' },
  { id: 'cat-62', anaKategori: 'MOBİLYA', altKategori: 'YATAK', urunGrubu: 'FİENTO' },

  // 10. MOBİLYA -> MASA
  { id: 'cat-63', anaKategori: 'MOBİLYA', altKategori: 'MASA', urunGrubu: 'BULUT AKSESUAR' },
  { id: 'cat-64', anaKategori: 'MOBİLYA', altKategori: 'MASA', urunGrubu: 'MASA SANDALYE' },

  // 11. MOBİLYA -> AKSESUAR
  { id: 'cat-65', anaKategori: 'MOBİLYA', altKategori: 'AKSESUAR', urunGrubu: 'BÜRO' },
  { id: 'cat-66', anaKategori: 'MOBİLYA', altKategori: 'AKSESUAR', urunGrubu: 'SEHPA' },
  { id: 'cat-67', anaKategori: 'MOBİLYA', altKategori: 'AKSESUAR', urunGrubu: 'ÜTÜ MASA KURUTMA' },
  { id: 'cat-68', anaKategori: 'MOBİLYA', altKategori: 'AKSESUAR', urunGrubu: 'DEKORASYON' },

  // 12. MOBİLYA -> MEDİSA
  { id: 'cat-69', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA DELUKS' },
  { id: 'cat-70', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA LUKS' },
  { id: 'cat-71', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA MAKSİ' },
  { id: 'cat-72', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA PREMİUM' },
  { id: 'cat-73', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA TEKİL' },
  { id: 'cat-74', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA YATAK ODASI' },
  { id: 'cat-75', anaKategori: 'MOBİLYA', altKategori: 'MEDİSA', urunGrubu: 'MEDİSA YEMEK ODASI' },

  // 13. BEYAZ EŞYA -> TV
  { id: 'cat-76', anaKategori: 'BEYAZ EŞYA', altKategori: 'TV', urunGrubu: 'SKYTECH' },
];

// Helper functions for Cascading UI
export const getUniqueAnaKategoriler = (hierarchy: CategoryHierarchyItem[]): string[] => {
  const set = new Set<string>();
  hierarchy.forEach(item => {
    if (item.anaKategori?.trim()) set.add(item.anaKategori.trim().toUpperCase());
  });
  return Array.from(set).sort();
};

export const getUniqueAltKategoriler = (
  hierarchy: CategoryHierarchyItem[],
  anaKategori?: string
): string[] => {
  const set = new Set<string>();
  hierarchy.forEach(item => {
    if (!anaKategori || item.anaKategori?.trim().toUpperCase() === anaKategori.trim().toUpperCase()) {
      if (item.altKategori?.trim()) set.add(item.altKategori.trim().toUpperCase());
    }
  });
  return Array.from(set).sort();
};

export const getUniqueUrunGruplari = (
  hierarchy: CategoryHierarchyItem[],
  anaKategori?: string,
  altKategori?: string
): string[] => {
  const set = new Set<string>();
  hierarchy.forEach(item => {
    const matchAna = !anaKategori || item.anaKategori?.trim().toUpperCase() === anaKategori.trim().toUpperCase();
    const matchAlt = !altKategori || item.altKategori?.trim().toUpperCase() === altKategori.trim().toUpperCase();
    if (matchAna && matchAlt) {
      if (item.urunGrubu?.trim()) set.add(item.urunGrubu.trim().toUpperCase());
    }
  });
  return Array.from(set).sort();
};

// Popular brands list
export const POPULAR_BRANDS = [
  'BOSCH',
  'ALTUS',
  'BAMBI',
  'UGUR',
  'HOOVER',
  'MEDİSA',
  'TEFAL',
  'KARCHER',
  'SKYTECH',
  'ARÇELİK',
  'BEKO',
  'VESTEL',
  'İPEK',
  'LADİN',
  'SERHAT',
  'FİENTO',
  'BEDLIFE',
  'DİĞER',
];
