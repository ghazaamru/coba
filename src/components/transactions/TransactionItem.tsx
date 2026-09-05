import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { db, type Transaction } from '../../db';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CATEGORY_COLORS } from '../../utils/svgChartHelpers';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onEdit }) => {
  const handleDelete = async () => {
    if (transaction.id && confirm('Delete this transaction?')) {
      await db.transactions.delete(transaction.id);
    }
  };

  const isIncome = transaction.type === 'income';

  return (
    <div className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2.5 h-10 rounded-full shrink-0"
          style={{ backgroundColor: isIncome ? '#10b981' : CATEGORY_COLORS[transaction.category] }}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {transaction.notes || transaction.category}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>{transaction.category}</span>
            <span>•</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
