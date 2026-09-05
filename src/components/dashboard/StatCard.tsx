import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface StatCardProps {
  label: string;
  amount: number;
  icon: React.ReactNode;
  variant?: 'default' | 'income' | 'expense';
}

export const StatCard: React.FC<StatCardProps> = ({ label, amount, icon, variant = 'default' }) => {
  const colorMap = {
    default: 'text-slate-100 border-slate-800 bg-slate-900/60',
    income: 'text-emerald-400 border-emerald-950/50 bg-emerald-950/20',
    expense: 'text-rose-400 border-rose-950/50 bg-rose-950/20',
  };

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-sm flex items-center gap-4 ${colorMap[variant]}`}>
      <div className="p-3 rounded-xl bg-slate-800/80 text-slate-300">{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold tracking-tight text-white mt-0.5">{formatCurrency(amount)}</p>
      </div>
    </div>
  );
};
