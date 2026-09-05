import { db, type Transaction, type ExpenseCategory, type TransactionType } from '../db';

const VALID_TYPES: TransactionType[] = ['income', 'expense'];
const VALID_CATEGORIES: ExpenseCategory[] = [
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

export const exportTransactionsToJSON = async (): Promise<void> => {
  const allData = await db.transactions.toArray();
  const jsonStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const validateTransactionSchema = (item: unknown): item is Transaction => {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;

  const hasValidAmount = typeof candidate.amount === 'number' && !isNaN(candidate.amount) && candidate.amount >= 0;
  const hasValidType = typeof candidate.type === 'string' && VALID_TYPES.includes(candidate.type as TransactionType);
  const hasValidCategory = typeof candidate.category === 'string' && VALID_CATEGORIES.includes(candidate.category as ExpenseCategory);
  const hasValidDate = typeof candidate.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date);
  const hasValidNotes = typeof candidate.notes === 'string';

  return hasValidAmount && hasValidType && hasValidCategory && hasValidDate && hasValidNotes;
};

export const importTransactionsFromJSON = async (
  file: File,
  mode: 'replace' | 'merge' = 'merge'
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'Invalid JSON format: expected an array of transactions.' };
    }

    const validRecords: Transaction[] = [];
    for (const item of parsed) {
      if (!validateTransactionSchema(item)) {
        return { success: false, count: 0, error: 'JSON payload contains malformed transaction objects.' };
      }
      validRecords.push({
        amount: item.amount,
        type: item.type,
        category: item.category,
        date: item.date,
        notes: item.notes,
        createdAt: (item as Transaction).createdAt || Date.now(),
      });
    }

    await db.transaction('rw', db.transactions, async () => {
      if (mode === 'replace') {
        await db.transactions.clear();
      }
      await db.transactions.bulkAdd(validRecords);
    });

    return { success: true, count: validRecords.length };
  } catch (err) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Failed to parse JSON file.' };
  }
};
