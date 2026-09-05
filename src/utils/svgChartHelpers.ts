import type { CategorySummary, ExpenseCategory, Transaction } from '../types';

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Housing: '#6366f1',
  Groceries: '#10b981',
  Transportation: '#f59e0b',
  Utilities: '#06b6d4',
  Entertainment: '#ec4899',
  Healthcare: '#ef4444',
  Personal: '#8b5cf6',
  Income: '#10b981',
  Other: '#64748b',
};

export const calculateCategorySummaries = (transactions: Transaction[]): CategorySummary[] => {
  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTx.reduce((acc, t) => acc + t.amount, 0);

  if (totalExpense === 0) return [];

  const map = new Map<ExpenseCategory, number>();
  for (const t of expenseTx) {
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  }

  const summaries: CategorySummary[] = [];
  map.forEach((total, category) => {
    summaries.push({
      category,
      total,
      percentage: (total / totalExpense) * 100,
      color: CATEGORY_COLORS[category] || '#94a3b8',
    });
  });

  return summaries.sort((a, b) => b.total - a.total);
};
