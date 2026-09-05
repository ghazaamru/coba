import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from './StatCard';
import type { SummaryData } from '../../types';

export const SummaryCards: React.FC<{ summary: SummaryData }> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatCard label="Total Balance" amount={summary.totalBalance} icon={<Wallet className="w-5 h-5 text-indigo-400" />} />
      <StatCard label="Total Income" amount={summary.totalIncome} variant="income" icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
      <StatCard label="Total Expenses" amount={summary.totalExpense} variant="expense" icon={<TrendingDown className="w-5 h-5 text-rose-400" />} />
    </div>
  );
};
