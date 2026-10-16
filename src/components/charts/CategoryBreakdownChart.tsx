import React, { useState } from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  type?: 'Gider' | 'Gelir';
}

const PALETTE = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  transactions,
  type = 'Gider',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = transactions.filter(
    t => (t.type === type || (type === 'Gider' && t.type === 'Mal Alımı')) && t.status !== 'İptal'
  );

  const total = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryMap: { [cat: string]: number } = {};
  filtered.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const categories = Object.entries(categoryMap)
    .map(([name, amount], idx) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: PALETTE[idx % PALETTE.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
            {type === 'Gider' ? 'Gider Kategorileri' : 'Gelir Kategorileri'} Dağılımı
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Harcama kalemlerine göre oransal bakiye
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {categories.length} Kategori
        </span>
      </div>

      {total === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
          Bu dönem için {type.toLowerCase()} kaydı bulunamadı
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex justify-center relative">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-slate-800/80"
              />
              {categories.map(cat => {
                const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += cat.percentage;
                const isSelected = selectedCategory === cat.name;

                return (
                  <circle
                    key={cat.name}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onMouseEnter={() => setSelectedCategory(cat.name)}
                    onMouseLeave={() => setSelectedCategory(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {selectedCategory || 'Toplam'}
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                {selectedCategory
                  ? formatCurrency(categoryMap[selectedCategory] || 0)
                  : formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="md:col-span-7 space-y-2 max-h-52 overflow-y-auto pr-1">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.name;
              return (
                <div
                  key={cat.name}
                  onMouseEnter={() => setSelectedCategory(cat.name)}
                  onMouseLeave={() => setSelectedCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-900 dark:text-slate-100 font-medium">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono w-10 text-right">
                      %{cat.percentage.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
