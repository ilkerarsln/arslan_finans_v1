import React, { useState } from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyFlowChartProps {
  transactions: Transaction[];
}

interface MonthData {
  monthKey: string;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}

const MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

export const MonthlyFlowChart: React.FC<MonthlyFlowChartProps> = ({ transactions }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group by month for the current year or last 6 months
  const now = new Date();
  const currentYear = now.getFullYear();

  // Create last 6 months list
  const months: MonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, now.getMonth() - i, 1);
    const mIndex = d.getMonth();
    const y = d.getFullYear();
    const key = `${y}-${String(mIndex + 1).padStart(2, '0')}`;
    months.push({
      monthKey: key,
      monthName: `${MONTH_NAMES[mIndex]} ${y.toString().slice(-2)}`,
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  // Aggregate transactions
  transactions.forEach(tx => {
    if (tx.status === 'İptal') return;
    const txDate = tx.date.slice(0, 7); // YYYY-MM
    const found = months.find(m => m.monthKey === txDate);
    if (found) {
      if (tx.type === 'Gelir') found.income += tx.amount;
      else if (tx.type === 'Gider') found.expense += tx.amount;
    }
  });

  months.forEach(m => {
    m.net = m.income - m.expense;
  });

  // Calculate chart bounds
  const maxVal = Math.max(
    ...months.map(m => Math.max(m.income, m.expense)),
    10000
  );
  const roundedMax = Math.ceil(maxVal / 10000) * 10000;

  // Chart SVG dimensions
  const height = 220;
  const width = 500;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / months.length;
  const barWidth = Math.min(groupWidth * 0.32, 22);

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / roundedMax) * chartHeight;
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
            Aylık Gelir ve Gider Dağılımı
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Son 6 aylık nakit giriş ve çıkış karşılaştırması
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-xs"></span>
            <span className="text-slate-600 dark:text-slate-300">Gelir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block shadow-xs"></span>
            <span className="text-slate-600 dark:text-slate-300">Gider</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + chartHeight * (1 - pct);
            const val = roundedMax * pct;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray={pct === 0 ? 'none' : '3 3'}
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono-num font-medium"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {months.map((m, idx) => {
            const groupX = paddingLeft + idx * groupWidth;
            const centerX = groupX + groupWidth / 2;
            const incH = (m.income / roundedMax) * chartHeight;
            const expH = (m.expense / roundedMax) * chartHeight;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={m.monthKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Background hover highlight */}
                {isHovered && (
                  <rect
                    x={groupX + 4}
                    y={paddingTop}
                    width={groupWidth - 8}
                    height={chartHeight}
                    className="fill-slate-100/60 dark:fill-slate-800/40 rounded-lg"
                    rx="4"
                  />
                )}

                {/* Income Bar */}
                <rect
                  x={centerX - barWidth - 2}
                  y={paddingTop + chartHeight - incH}
                  width={barWidth}
                  height={Math.max(incH, 2)}
                  rx="3"
                  className="fill-emerald-500 hover:fill-emerald-400 transition-all duration-200"
                />

                {/* Expense Bar */}
                <rect
                  x={centerX + 2}
                  y={paddingTop + chartHeight - expH}
                  width={barWidth}
                  height={Math.max(expH, 2)}
                  rx="3"
                  className="fill-rose-500 hover:fill-rose-400 transition-all duration-200"
                />

                {/* Month Label */}
                <text
                  x={centerX}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {m.monthName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900/95 text-white dark:bg-slate-800 border border-slate-700/80 shadow-xl rounded-lg p-2.5 text-xs z-20 backdrop-blur-sm transition-all"
            style={{
              left: `${Math.min(
                Math.max(
                  ((paddingLeft + hoveredIndex * groupWidth + groupWidth / 2) / width) * 100,
                  20
                ),
                80
              )}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex justify-between gap-4">
              <span>{months[hoveredIndex].monthName}</span>
              <span
                className={`font-mono-num font-bold ${
                  months[hoveredIndex].net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                Net: {formatCurrency(months[hoveredIndex].net)}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Gelir:
                </span>
                <span className="font-mono-num font-medium">
                  {formatCurrency(months[hoveredIndex].income)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Gider:
                </span>
                <span className="font-mono-num font-medium">
                  {formatCurrency(months[hoveredIndex].expense)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
