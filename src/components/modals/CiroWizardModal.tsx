import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  X,
  Sparkles,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  Download,
  Save,
  RotateCcw,
  Sliders,
  DollarSign,
  ChevronRight,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CiroMatrixRow } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

// Seasonal distribution weights (percentages summing to 100)
const DISTRIBUTION_PRESETS = {
  equal: {
    label: 'Aylara Eşit Dağıtım',
    description: 'Her ay eşit oranda (%8.33) paylaştırılır',
    weights: [8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.34, 8.34, 8.34, 8.34, 8.33, 8.33],
  },
  summer: {
    label: 'Yaz & Düğün / Çeyiz Sezonu',
    description: 'Mayıs-Eylül döneminde %12-14 yoğunlaşma',
    weights: [4.5, 5.0, 6.5, 8.0, 12.0, 14.0, 15.0, 13.0, 10.0, 5.0, 4.0, 3.0],
  },
  yearend: {
    label: 'Yıl Sonu & Kampanya Ağırlıklı',
    description: 'Sonbahar ve kış indirim dönemlerinde artış',
    weights: [5.0, 5.0, 6.0, 7.0, 7.0, 8.0, 8.0, 9.0, 11.0, 11.0, 12.0, 11.0],
  },
  growth: {
    label: 'Doğrusal Büyüme Trendi',
    description: 'Yılın başından sonuna düzenli organik artış',
    weights: [4.0, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.0, 11.5, 12.0, 12.0],
  },
};

export const CiroWizardModal: React.FC = () => {
  const {
    isCiroWizardOpen,
    setIsCiroWizardOpen,
    productBrands,
    productCategories,
    ciroMatrixData,
    importCiroMatrixFromExcel,
    showToast,
  } = useFinance();

  const [targetYear, setTargetYear] = useState<number>(2025);
  const [selectedGroup, setSelectedGroup] = useState<'BEYAZ EŞYA' | 'MOBİLYA'>('BEYAZ EŞYA');
  const [annualTarget, setAnnualTarget] = useState<number>(3600000);
  const [targetMargin, setTargetMargin] = useState<number>(25);
  const [distributionType, setDistributionType] = useState<keyof typeof DISTRIBUTION_PRESETS>('summer');

  // Selected brands and their percentage shares within the group
  const defaultBrandsForGroup = useMemo(() => {
    if (selectedGroup === 'BEYAZ EŞYA') {
      return ['ALTUS', 'UĞUR', 'BOSCH', 'HOOVER'];
    }
    return ['BAMBİ', 'MEDİSA', 'MOBİLYA', 'YATAK'];
  }, [selectedGroup]);

  const [selectedBrands, setSelectedBrands] = useState<string[]>(['ALTUS', 'UĞUR', 'BOSCH']);
  const [brandWeights, setBrandWeights] = useState<Record<string, number>>({
    ALTUS: 40,
    UĞUR: 35,
    BOSCH: 25,
  });

  const handleClose = () => {
    setIsCiroWizardOpen(false);
  };

  const handleGroupChange = (grp: 'BEYAZ EŞYA' | 'MOBİLYA') => {
    setSelectedGroup(grp);
    if (grp === 'BEYAZ EŞYA') {
      setSelectedBrands(['ALTUS', 'UĞUR', 'BOSCH']);
      setBrandWeights({ ALTUS: 40, UĞUR: 35, BOSCH: 25 });
      setTargetMargin(25);
    } else {
      setSelectedBrands(['BAMBİ', 'MEDİSA', 'MOBİLYA']);
      setBrandWeights({ BAMBİ: 40, MEDİSA: 30, MOBİLYA: 30 });
      setTargetMargin(50);
    }
  };

  const handleToggleBrand = (brandName: string) => {
    if (selectedBrands.includes(brandName)) {
      if (selectedBrands.length === 1) {
        showToast('En az bir marka seçili olmalıdır.', 'info');
        return;
      }
      const updated = selectedBrands.filter(b => b !== brandName);
      setSelectedBrands(updated);
      // Re-distribute weight equally
      const newWeight = Math.round(100 / updated.length);
      const nextWeights: Record<string, number> = {};
      updated.forEach((b, idx) => {
        nextWeights[b] = idx === updated.length - 1 ? 100 - newWeight * (updated.length - 1) : newWeight;
      });
      setBrandWeights(nextWeights);
    } else {
      const updated = [...selectedBrands, brandName];
      setSelectedBrands(updated);
      const newWeight = Math.round(100 / updated.length);
      const nextWeights: Record<string, number> = {};
      updated.forEach((b, idx) => {
        nextWeights[b] = idx === updated.length - 1 ? 100 - newWeight * (updated.length - 1) : newWeight;
      });
      setBrandWeights(nextWeights);
    }
  };

  const handleBrandWeightChange = (brandName: string, weight: number) => {
    setBrandWeights(prev => ({
      ...prev,
      [brandName]: Math.max(1, Math.min(100, weight)),
    }));
  };

  // Calculate month-by-month projection
  const calculatedRows: CiroMatrixRow[] = useMemo(() => {
    const preset = DISTRIBUTION_PRESETS[distributionType];
    const totalBrandWeight = selectedBrands.reduce((sum, b) => sum + (brandWeights[b] || 0), 0) || 100;

    return selectedBrands.map((brandName, idx) => {
      const brandRatio = (brandWeights[brandName] || 0) / totalBrandWeight;
      const brandAnnualAmount = annualTarget * brandRatio;

      const monthsObj: { [monthIndex: number]: number } = {};
      preset.weights.forEach((w, mIdx) => {
        const monthRatio = w / 100;
        monthsObj[mIdx] = Math.round(brandAnnualAmount * monthRatio);
      });

      return {
        id: `wiz-${selectedGroup.toLowerCase().replace(/[^a-z0-9]/g, '')}-${brandName.toLowerCase()}-${idx}`,
        group: selectedGroup,
        name: brandName,
        profitMargin: targetMargin,
        months: monthsObj,
        isLiveSynced: false,
      };
    });
  }, [selectedGroup, selectedBrands, brandWeights, annualTarget, targetMargin, distributionType]);

  const totalCalculatedRevenue = useMemo(() => {
    return calculatedRows.reduce((sum, row) => {
      const rowSum = Object.values(row.months).reduce((a, b) => a + b, 0);
      return sum + rowSum;
    }, 0);
  }, [calculatedRows]);

  const estimatedTotalProfit = useMemo(() => {
    return totalCalculatedRevenue * (targetMargin / 100);
  }, [totalCalculatedRevenue, targetMargin]);

  // Apply to live Ciro Matrix in FinanceContext
  const handleApplyToMatrix = () => {
    try {
      // Find existing year data
      const currentYearData = ciroMatrixData.find(y => y.year === targetYear);
      let nextRows: CiroMatrixRow[] = [];

      if (currentYearData) {
        // Keep rows not matching selected group/brands, replace matching ones
        const keptRows = currentYearData.rows.filter(
          r => !(r.group === selectedGroup && selectedBrands.includes(r.name))
        );
        nextRows = [...keptRows, ...calculatedRows];
      } else {
        nextRows = [...calculatedRows];
      }

      importCiroMatrixFromExcel(targetYear, nextRows);
      showToast(`${targetYear} yılı için ${calculatedRows.length} marka ciro verisi matrise aktarıldı.`, 'success');
      handleClose();
    } catch (err) {
      console.error(err);
      showToast('Ciro verisi matrise aktarılırken hata oluştu.', 'error');
    }
  };

  // Export projection to Excel
  const handleExportExcel = () => {
    try {
      const headers = ['GRUP', 'Kategori / Marka', 'Ort. Kârlılık (%)', ...MONTH_NAMES, 'YILLIK TOPLAM'];
      const dataRows = calculatedRows.map(row => {
        const mValues = MONTH_NAMES.map((_, i) => row.months[i] || 0);
        const rowTotal = mValues.reduce((a, b) => a + b, 0);
        return [row.group, row.name, row.profitMargin, ...mValues, rowTotal];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Ciro_Sihirbazi_${targetYear}`);
      XLSX.writeFile(wb, `ciro_sihirbazi_projeksiyon_${targetYear}_${selectedGroup.replace(/\s+/g, '_')}.xlsx`);
      showToast('Sihirbaz projeksiyonu Excel olarak indirildi.', 'info');
    } catch (e) {
      console.error(e);
      showToast('Excel dışa aktarılamadı.', 'error');
    }
  };

  if (!isCiroWizardOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Veri Ciro Sihirbazı
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  ERP Otomatik Dağıtım Motoru
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Yıllık ciro hedeflerinizi mevsimsellik ve marka ağırlıklarına göre otomatik hesaplayıp Ciro Matrisine aktarın.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Year, Group & Target */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Hedef Yıl
              </label>
              <select
                value={targetYear}
                onChange={e => setTargetYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={2024}>2024 Yılı</option>
                <option value={2025}>2025 Yılı</option>
                <option value={2026}>2026 Yılı</option>
                <option value={2027}>2027 Yılı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                Ana Kategori Grubu
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleGroupChange('BEYAZ EŞYA')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    selectedGroup === 'BEYAZ EŞYA'
                      ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Beyaz Eşya
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupChange('MOBİLYA')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                    selectedGroup === 'MOBİLYA'
                      ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Mobilya
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Yıllık Grup Hedef Cirosu (₺)
              </label>
              <input
                type="number"
                step="50000"
                min="0"
                value={annualTarget}
                onChange={e => setAnnualTarget(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                {formatCurrency(annualTarget)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-500" />
                Hedef Kârlılık Marjı (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetMargin}
                onChange={e => setTargetMargin(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
                Tahmini Kâr: {formatCurrency(estimatedTotalProfit)}
              </span>
            </div>
          </div>

          {/* Step 2: Distribution Model Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-500" />
              Mevsimsellik & Aylık Dağıtım Modeli
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {(Object.keys(DISTRIBUTION_PRESETS) as Array<keyof typeof DISTRIBUTION_PRESETS>).map(key => {
                const preset = DISTRIBUTION_PRESETS[key];
                const isSelected = distributionType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDistributionType(key)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{preset.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Brand Selection and Weights */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" />
                Grup İçi Marka Payları & Ağırlıklandırma
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tıklayarak markaları dahil edin veya hariç bırakın.
              </span>
            </div>

            {/* Brand Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {defaultBrandsForGroup.map(brand => {
                const isSelected = selectedBrands.includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => handleToggleBrand(brand)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700'
                    }`}
                  >
                    <span>{brand}</span>
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Weights Sliders/Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {selectedBrands.map(b => (
                <div key={b} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{b}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={brandWeights[b] || 0}
                      onChange={e => handleBrandWeightChange(b, Number(e.target.value))}
                      className="w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-right"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Month Projection Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Hesaplanan 12 Aylık Ciro Projeksiyonu
              </span>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                Yıllık Toplam: {formatCurrency(totalCalculatedRevenue)}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Marka</th>
                    <th className="py-2.5 px-2 font-semibold text-center">Kâr %</th>
                    {MONTH_NAMES.map(m => (
                      <th key={m} className="py-2.5 px-2 font-semibold text-right">
                        {m.substring(0, 3)}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-semibold text-right bg-emerald-50/50 dark:bg-emerald-950/30">
                      Toplam
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {calculatedRows.map(row => {
                    const rowTotal = Object.values(row.months).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={row.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">
                          {row.name}
                        </td>
                        <td className="py-2 px-2 text-center text-amber-600 dark:text-amber-400 font-bold">
                          %{row.profitMargin}
                        </td>
                        {MONTH_NAMES.map((_, i) => (
                          <td key={i} className="py-2 px-2 text-right text-slate-700 dark:text-slate-300 text-[11px]">
                            {((row.months[i] || 0) / 1000).toFixed(0)}k
                          </td>
                        ))}
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                          {formatCurrency(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Matrise aktarıldığında {targetYear} yılı Ciro & Kârlılık Matrisinde anında canlı güncellenecektir.</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Excel İndir (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleApplyToMatrix}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Matrise Aktar ve Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
