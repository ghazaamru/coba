import Dexie, { type Table } from 'dexie';

export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Housing'
  | 'Groceries'
  | 'Transportation'
  | 'Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Personal'
  | 'Income'
  | 'Other';

export interface Transaction {
  id?: number;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory;
  date: string; // ISO format: YYYY-MM-DD
  notes: string;
  createdAt: number; // Unix timestamp
}

export class ExpenseDatabase extends Dexie {
  transactions!: Table<Transaction, number>;

  constructor() {
    super('ExpenseTrackerDB');

    // ponytail: single version schema; add migrations when altering indexed fields
    this.version(1).stores({
      transactions: '++id, type, category, date, createdAt',
    });
  }
}

export const db = new ExpenseDatabase();
