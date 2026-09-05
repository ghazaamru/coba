import React from 'react';
import type { Transaction } from '../../types';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
        No transactions match your current filters.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <TransactionItem key={tx.id ?? tx.createdAt} transaction={tx} onEdit={onEdit} />
      ))}
    </div>
  );
};
