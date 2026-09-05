import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, type Transaction, type ExpenseCategory, type TransactionType } from '../../db';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

const CATEGORIES: ExpenseCategory[] = [
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

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, initialData }) => {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setDate(initialData.date);
      setNotes(initialData.notes);
    } else {
      setAmount('');
      setType('expense');
      setCategory('Groceries');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (initialData && initialData.id) {
      await db.transactions.update(initialData.id, {
        amount: numAmount,
        type,
        category: type === 'income' ? 'Income' : category,
        date,
        notes: notes.trim(),
      });
    } else {
      await db.transactions.add({
        amount: numAmount,
        type,
        category: type === 'income' ? 'Income' : category,
        date,
        notes: notes.trim(),
        createdAt: Date.now(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-white">
            {initialData ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'Income') setCategory('Groceries');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                type === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Income');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                type === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Amount (IDR)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.filter((c) => c !== 'Income').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Description</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Coffee with friends"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl shadow transition cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
