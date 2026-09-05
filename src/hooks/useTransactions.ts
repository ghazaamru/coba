import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { FilterState, SummaryData } from '../types';

export const useTransactions = (filters: FilterState) => {
  const transactions = useLiveQuery(
    async () => {
      let collection = db.transactions.orderBy('date').reverse();

      if (filters.type !== 'all') {
        collection = db.transactions.where('type').equals(filters.type).reverse();
      }

      let results = await collection.toArray();

      if (filters.month !== 'all') {
        results = results.filter((t) => t.date.startsWith(filters.month));
      }
      if (filters.category !== 'all') {
        results = results.filter((t) => t.category === filters.category);
      }
      if (filters.search.trim() !== '') {
        const query = filters.search.toLowerCase();
        results = results.filter((t) => t.notes.toLowerCase().includes(query));
      }

      return results;
    },
    [filters.month, filters.category, filters.type, filters.search],
    []
  );

  const allMonthlyTransactions = useLiveQuery(
    async () => {
      if (filters.month === 'all') {
        return await db.transactions.toArray();
      }
      return await db.transactions.where('date').between(`${filters.month}-01`, `${filters.month}-31`, true, true).toArray();
    },
    [filters.month],
    []
  );

  const summary: SummaryData = (allMonthlyTransactions || []).reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.totalIncome += t.amount;
        acc.totalBalance += t.amount;
      } else {
        acc.totalExpense += t.amount;
        acc.totalBalance -= t.amount;
      }
      return acc;
    },
    { totalBalance: 0, totalIncome: 0, totalExpense: 0 }
  );

  return {
    transactions: transactions || [],
    monthlyTransactions: allMonthlyTransactions || [],
    summary,
    isLoading: transactions === undefined,
  };
};
