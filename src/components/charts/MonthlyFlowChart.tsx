import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyFlowChartProps {
  transactions: Transaction[];
}

interface MonthData {
  monthKey: string;
  monthName: string;
  isCurrentMonth: boolean;
  income: number;
  expense: number;
  net: number;
}

const MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];

// Helper to extract YYYY-MM from various date formats (YYYY-MM-DD, DD.MM.YYYY, ISO)
function extractYearMonth(dateStr: string): string | null {
  if (!dateStr) return null;
  // If YYYY-MM...
  if (/^\d{4}[-/.]\d{1,2}/.test(dateStr)) {
    const parts = dateStr.split(/[-/.]/);
    return `${parts[0]}-${parts[1].padStart(2, '0')}`;
  }
  // If DD.MM.YYYY...
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/.test(dateStr)) {
    const parts = dateStr.split(/[-/.]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
}

export const MonthlyFlowChart: React.FC<MonthlyFlowChartProps> = ({ transactions }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rangeMode, setRangeMode] = useState<'6' | '12' | 'year'>('6');

  // Build chronologically ordered months: from oldest (left) to current month (right)
  const months: MonthData[] = useMemo(() => {
    const now = new Date();
    const result: MonthData[] = [];

    let count = 6;
    if (rangeMode === '12') count = 12;
    else if (rangeMode === 'year') count = now.getMonth() + 1; // From Jan of this year to now

    // Strictly chronological: i starts at (count - 1) down to 0 (0 = current month)
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const y = d.getFullYear();
      const key = `${y}-${String(mIndex + 1).padStart(2, '0')}`;
      result.push({
        monthKey: key,
        monthName: `${MONTH_NAMES[mIndex]} ${y.toString().slice(-2)}`,
        isCurrentMonth: i === 0,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    // Aggregate transactions into corresponding months
    transactions.forEach(tx => {
      if (tx.status === 'İptal') return;
      const txKey = extractYearMonth(tx.date);
      if (!txKey) return;

      const found = result.find(m => m.monthKey === txKey);
      if (found) {
        if (tx.type === 'Gelir') {
          found.income += tx.amount;
        } else if (tx.type === 'Gider') {
          found.expense += tx.amount;
        }
      }
    });

    result.forEach(m => {
      m.net = m.income - m.expense;
    });

    return result;
  }, [transactions, rangeMode]);

  // Calculate chart bounds
  const maxVal = Math.max(
    ...months.map(m => Math.max(m.income, m.expense)),
    10000
  );
  const roundedMax = Math.ceil(maxVal / 10000) * 10000;

  // Chart SVG dimensions
  const height = 230;
  const width = 560;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 25;
  const paddingBottom = 38;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / months.length;
  const barWidth = Math.min(groupWidth * 0.30, 18);

  return (
    <div className="w-full select-none">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
              Aylık Gelir ve Gider Dağılımı
            </h4>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 rounded-full">
              Kronolojik Akış
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geçmiş aylardan güncel aya doğru soldan sağa nakit akışı
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Range Selector */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setRangeMode('6')}
              className={`px-2 py-1 rounded-md transition ${
                rangeMode === '6'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Son 6 Ay
            </button>
            <button
              onClick={() => setRangeMode('12')}
              className={`px-2 py-1 rounded-md transition ${
                rangeMode === '12'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              12 Ay
            </button>
            <button
              onClick={() => setRangeMode('year')}
              className={`px-2 py-1 rounded-md transition ${
                rangeMode === 'year'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bu Yıl
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block shadow-xs"></span>
              <span className="text-slate-600 dark:text-slate-300">Gelir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block shadow-xs"></span>
              <span className="text-slate-600 dark:text-slate-300">Gider</span>
            </div>
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
                    x={groupX + 2}
                    y={paddingTop}
                    width={groupWidth - 4}
                    height={chartHeight}
                    className="fill-slate-100/60 dark:fill-slate-800/40 rounded-lg"
                    rx="4"
                  />
                )}

                {/* Income Bar */}
                <rect
                  x={centerX - barWidth - 1.5}
                  y={paddingTop + chartHeight - incH}
                  width={barWidth}
                  height={Math.max(incH, 2)}
                  rx="3"
                  className="fill-emerald-500 hover:fill-emerald-400 transition-all duration-200"
                />

                {/* Expense Bar */}
                <rect
                  x={centerX + 1.5}
                  y={paddingTop + chartHeight - expH}
                  width={barWidth}
                  height={Math.max(expH, 2)}
                  rx="3"
                  className="fill-rose-500 hover:fill-rose-400 transition-all duration-200"
                />

                {/* Current Month Highlight Dot */}
                {m.isCurrentMonth && (
                  <circle
                    cx={centerX}
                    cy={paddingTop + chartHeight + 6}
                    r="2.5"
                    className="fill-emerald-500 animate-pulse"
                  />
                )}

                {/* Month Label */}
                <text
                  x={centerX}
                  y={height - (m.isCurrentMonth ? 6 : 10)}
                  textAnchor="middle"
                  className={`text-[10px] transition-colors ${
                    m.isCurrentMonth
                      ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                      : isHovered
                      ? 'fill-slate-900 dark:fill-white font-semibold'
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
            className="absolute top-2 pointer-events-none bg-slate-900/95 text-white dark:bg-slate-800 border border-slate-700/80 shadow-xl rounded-xl p-2.5 text-xs z-20 backdrop-blur-sm transition-all min-w-[160px]"
            style={{
              left: `${Math.min(
                Math.max(
                  ((paddingLeft + hoveredIndex * groupWidth + groupWidth / 2) / width) * 100,
                  22
                ),
                78
              )}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex justify-between gap-4">
              <span>
                {months[hoveredIndex].monthName} {months[hoveredIndex].isCurrentMonth ? '(Bu Ay)' : ''}
              </span>
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
