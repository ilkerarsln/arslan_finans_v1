import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  getUniqueAnaKategoriler,
  getUniqueAltKategoriler,
  getUniqueUrunGruplari,
} from '../../data/initialCategories';
import { Layers, FolderTree, Tag } from 'lucide-react';

interface CategoryCascaderProps {
  anaKategori: string;
  altKategori: string;
  urunGrubu: string;
  onChange: (updates: { anaKategori: string; altKategori: string; urunGrubu: string }) => void;
  disabled?: boolean;
  required?: boolean;
}

export const CategoryCascader: React.FC<CategoryCascaderProps> = ({
  anaKategori,
  altKategori,
  urunGrubu,
  onChange,
  disabled = false,
  required = true,
}) => {
  const { categoryHierarchy } = useFinance();

  const anaList = useMemo(() => {
    return getUniqueAnaKategoriler(categoryHierarchy);
  }, [categoryHierarchy]);

  const altList = useMemo(() => {
    return getUniqueAltKategoriler(categoryHierarchy, anaKategori);
  }, [categoryHierarchy, anaKategori]);

  const grupList = useMemo(() => {
    return getUniqueUrunGruplari(categoryHierarchy, anaKategori, altKategori);
  }, [categoryHierarchy, anaKategori, altKategori]);

  const handleAnaChange = (newAna: string) => {
    const validAlts = getUniqueAltKategoriler(categoryHierarchy, newAna);
    const newAlt = validAlts.includes(altKategori) ? altKategori : validAlts[0] || '';
    const validGrups = getUniqueUrunGruplari(categoryHierarchy, newAna, newAlt);
    const newGrup = validGrups.includes(urunGrubu) ? urunGrubu : validGrups[0] || '';

    onChange({
      anaKategori: newAna,
      altKategori: newAlt,
      urunGrubu: newGrup,
    });
  };

  const handleAltChange = (newAlt: string) => {
    const validGrups = getUniqueUrunGruplari(categoryHierarchy, anaKategori, newAlt);
    const newGrup = validGrups.includes(urunGrubu) ? urunGrubu : validGrups[0] || '';

    onChange({
      anaKategori,
      altKategori: newAlt,
      urunGrubu: newGrup,
    });
  };

  const handleGrupChange = (newGrup: string) => {
    onChange({
      anaKategori,
      altKategori,
      urunGrubu: newGrup,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. ANA KATEGORİ */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          <span>1. Ana Kategori {required && <span className="text-rose-500">*</span>}</span>
        </label>
        <select
          value={anaKategori}
          onChange={e => handleAnaChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition outline-none"
        >
          <option value="">Seçiniz...</option>
          {anaList.map(a => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-slate-400 mt-0.5 block">Örn: MOBİLYA, BEYAZ EŞYA</span>
      </div>

      {/* 2. ALT KATEGORİ */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <FolderTree className="w-3.5 h-3.5 text-sky-500" />
          <span>2. Alt Kategori {required && <span className="text-rose-500">*</span>}</span>
        </label>
        <div className="relative">
          <input
            list="alt-kategori-options"
            type="text"
            value={altKategori}
            onChange={e => handleAltChange(e.target.value.toUpperCase())}
            placeholder={anaKategori ? 'Seçiniz veya yazınız...' : 'Önce Ana Kategori seçiniz'}
            disabled={disabled || !anaKategori}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-sky-500 transition outline-none disabled:opacity-50"
          />
          <datalist id="alt-kategori-options">
            {altList.map(item => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5 block">Örn: BAMBİ, ALTUS, MEDİSA</span>
      </div>

      {/* 3. ÜRÜN GRUBU */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-500" />
          <span>3. Ürün Grubu {required && <span className="text-rose-500">*</span>}</span>
        </label>
        <div className="relative">
          <input
            list="urun-grubu-options"
            type="text"
            value={urunGrubu}
            onChange={e => handleGrupChange(e.target.value.toUpperCase())}
            placeholder={altKategori ? 'Seçiniz veya yazınız...' : 'Önce Alt Kategori seçiniz'}
            disabled={disabled || !altKategori}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 transition outline-none disabled:opacity-50"
          />
          <datalist id="urun-grubu-options">
            {grupList.map(item => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5 block">Örn: BAMBİ YATAK, ALTUS FIRIN</span>
      </div>
    </div>
  );
};
