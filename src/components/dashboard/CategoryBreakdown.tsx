import React from 'react';
import type { Transaction } from '../../types';
import { calculateCategorySummaries } from '../../utils/svgChartHelpers';
import { formatCurrency } from '../../utils/formatters';

export const CategoryBreakdown: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const summaries = calculateCategorySummaries(transactions);

  if (summaries.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
        No expense records found for this period.
      </div>
    );
  }

  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-6">
      <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Expense Breakdown</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6 justify-around">
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="rotate-[-90deg]">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {summaries.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += item.percentage;

              return (
                <circle
                  key={item.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  className="transition-all duration-500 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute text-center">
            <span className="text-xs text-slate-400 font-medium">Categories</span>
            <p className="text-sm font-bold text-white">{summaries.length}</p>
          </div>
        </div>

        <div className="w-full space-y-3">
          {summaries.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.category}
                </span>
                <span className="text-slate-400 font-medium">
                  {formatCurrency(item.total)} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
