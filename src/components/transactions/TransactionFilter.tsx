import React from 'react';
import { Search } from 'lucide-react';
import type { FilterState, ExpenseCategory, TransactionType } from '../../types';

interface TransactionFilterProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
}

const CATEGORIES: (ExpenseCategory | 'all')[] = [
  'all',
  'Housing',
  'Groceries',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Personal',
  'Income',
  'Other',
];

export const TransactionFilter: React.FC<TransactionFilterProps> = ({ filters, onChange }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search by notes..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          type="month"
          value={filters.month === 'all' ? '' : filters.month}
          onChange={(e) => onChange({ month: e.target.value || 'all' })}
          className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        />

        <select
          value={filters.type}
          onChange={(e) => onChange({ type: e.target.value as TransactionType | 'all' })}
          className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="expense">Expenses</option>
          <option value="income">Incomes</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value as ExpenseCategory | 'all' })}
          className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
