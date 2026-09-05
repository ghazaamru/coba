import type { Transaction, ExpenseCategory, TransactionType } from '../db';

export type { Transaction, ExpenseCategory, TransactionType };

export interface FilterState {
  month: string; // YYYY-MM or 'all'
  category: ExpenseCategory | 'all';
  type: TransactionType | 'all';
  search: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  color: string;
}

export interface SummaryData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}
