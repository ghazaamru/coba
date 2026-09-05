import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Tag,
  FileText,
  Trash2,
  Edit3,
  Download,
  Upload,
  Wifi,
  WifiOff,
  X,
  Check,
  AlertCircle,
  Smartphone,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Scale
} from 'lucide-react';

// ==========================================
// 1. DATA TYPES & CONSTANTS
// ==========================================

export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transportation'
  | 'Housing & Utilities'
  | 'Healthcare'
  | 'Entertainment'
  | 'Shopping'
  | 'Salary & Income'
  | 'Investments'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory;
  date: string; // ISO: YYYY-MM-DD
  notes: string;
  createdAt: number;
}

const STORAGE_KEY = 'xpense_tracker_db_v1';

const CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Housing & Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Salary & Income',
  'Investments',
  'Other',
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Food & Dining': '#f59e0b',
  'Groceries': '#10b981',
  'Transportation': '#3b82f6',
  'Housing & Utilities': '#6366f1',
  'Healthcare': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Shopping': '#14b8a6',
  'Salary & Income': '#22c55e',
  'Investments': '#06b6d4',
  'Other': '#71717a',
};

// Initial starter seed data if storage is completely empty
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_seed_1',
    amount: 12500000,
    type: 'income',
    category: 'Salary & Income',
    date: new Date().toISOString().slice(0, 10),
    notes: 'Monthly Project Retainer',
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'tx_seed_2',
    amount: 85000,
    type: 'expense',
    category: 'Food & Dining',
    date: new Date().toISOString().slice(0, 10),
    notes: 'Artisan Roast & Toast',
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'tx_seed_3',
    amount: 450000,
    type: 'expense',
    category: 'Groceries',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    notes: 'Weekly Market Produce',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'tx_seed_4',
    amount: 150000,
    type: 'expense',
    category: 'Transportation',
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    notes: 'Fuel top-up',
    createdAt: Date.now() - 86400000 * 2,
  },
];

// ==========================================
// 2. HELPER UTILITIES
// ==========================================

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateHeader(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function generateId(): string {
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

// ==========================================
// 3. MAIN APPLICATION COMPONENT
// ==========================================

export default function App() {
  // Persistence state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_TRANSACTIONS;
  });

  // Save on updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (err) {
      console.error('Failed to sync state to localStorage:', err);
    }
  }, [transactions]);

  // Network listener
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA beforeinstallprompt handler
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // View state & Navigation
  const [currentTab, setCurrentTab] = useState<'overview' | 'activity' | 'data'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form input state
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Food & Dining');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Portability Status feedback
  const [portabilityMessage, setPortabilityMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingTx(null);
    setFormType('expense');
    setFormAmount('');
    setFormCategory('Food & Dining');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormNotes(tx.notes);
    setFormError('');
    setIsFormOpen(true);
  };

  // Save Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(formAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(rawVal) || rawVal <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formDate) {
      setFormError('Date is required.');
      return;
    }

    if (editingTx) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTx.id
            ? {
                ...t,
                amount: rawVal,
                type: formType,
                category: formType === 'income' ? 'Salary & Income' : formCategory,
                date: formDate,
                notes: formNotes.trim(),
              }
            : t
        )
      );
    } else {
      const newTx: Transaction = {
        id: generateId(),
        amount: rawVal,
        type: formType,
        category: formType === 'income' ? 'Salary & Income' : formCategory,
        date: formDate,
        notes: formNotes.trim() || (formType === 'income' ? 'Income Deposit' : formCategory),
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    setIsFormOpen(false);
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // -----------------------------------------------------------------
  // FINANCIAL CALCULATIONS & AGGREGATIONS
  // -----------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month filter
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) {
        return false;
      }
      // Type filter
      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }
      // Category filter
      if (filterCategory !== 'all' && t.category !== filterCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNotes = t.notes.toLowerCase().includes(q);
        const matchCategory = t.category.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        if (!matchNotes && !matchCategory && !matchAmount) return false;
      }
      return true;
    });
  }, [transactions, selectedMonth, filterType, filterCategory, searchQuery]);

  // Overall calculations for current selected month
  const monthlyMetrics = useMemo(() => {
    const scope =
      selectedMonth === 'all'
        ? transactions
        : transactions.filter((t) => t.date.startsWith(selectedMonth));

    let income = 0;
    let expense = 0;

    for (const t of scope) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }

    const net = income - expense;
    return { income, expense, net };
  }, [transactions, selectedMonth]);

  // Category breakdown metrics
  const categoryBreakdown = useMemo(() => {
    const scope =
      selectedMonth === 'all'
        ? transactions
        : transactions.filter((t) => t.date.startsWith(selectedMonth));

    const expenseOnly = scope.filter((t) => t.type === 'expense');
    const totalExp = expenseOnly.reduce((sum, t) => sum + t.amount, 0);

    const map = new Map<ExpenseCategory, number>();
    for (const t of expenseOnly) {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }

    if (totalExp === 0) return [];

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExp) * 100,
        color: CATEGORY_COLORS[category] || '#71717a',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonth]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt - a.createdAt;
    });

    const groups: { date: string; items: Transaction[]; totalExpense: number; totalIncome: number }[] = [];
    let currentGroup: { date: string; items: Transaction[]; totalExpense: number; totalIncome: number } | null = null;

    for (const tx of sorted) {
      if (!currentGroup || currentGroup.date !== tx.date) {
        currentGroup = {
          date: tx.date,
          items: [tx],
          totalExpense: tx.type === 'expense' ? tx.amount : 0,
          totalIncome: tx.type === 'income' ? tx.amount : 0,
        };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push(tx);
        if (tx.type === 'expense') currentGroup.totalExpense += tx.amount;
        if (tx.type === 'income') currentGroup.totalIncome += tx.amount;
      }
    }

    return groups;
  }, [filteredTransactions]);

  // -----------------------------------------------------------------
  // DATA PORTABILITY HANDLERS
  // -----------------------------------------------------------------
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(transactions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setPortabilityMessage({ text: 'Backup exported successfully.', isError: false });
    } catch {
      setPortabilityMessage({ text: 'Failed to export backup.', isError: true });
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          throw new Error('Import data must be an array of transaction objects.');
        }

        const validItems: Transaction[] = [];
        for (const item of parsed) {
          if (
            typeof item.amount === 'number' &&
            !isNaN(item.amount) &&
            (item.type === 'income' || item.type === 'expense') &&
            typeof item.category === 'string' &&
            typeof item.date === 'string'
          ) {
            validItems.push({
              id: item.id || generateId(),
              amount: Math.abs(item.amount),
              type: item.type,
              category: item.category as ExpenseCategory,
              date: item.date,
              notes: typeof item.notes === 'string' ? item.notes : '',
              createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            });
          }
        }

        if (validItems.length === 0) {
          throw new Error('No valid transaction records found in file.');
        }

        setTransactions(validItems);
        setPortabilityMessage({
          text: `Successfully restored ${validItems.length} transactions.`,
          isError: false,
        });
      } catch (err: unknown) {
        setPortabilityMessage({
          text: err instanceof Error ? err.message : 'Invalid backup format.',
          isError: true,
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Utility Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 border-b border-zinc-900 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-zinc-100">
              XP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-zinc-100">LEDGER</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono tracking-tight leading-none">
                Offline-First Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* PWA Install Button (Conditional) */}
            {deferredPrompt && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 transition active:scale-[0.98] cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Install</span>
              </button>
            )}

            {/* Offline / Online Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-colors ${
                isOnline
                  ? 'bg-zinc-900/60 border-zinc-800 text-emerald-400'
                  : 'bg-zinc-900/60 border-rose-900/60 text-rose-400 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>OFFLINE</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6 pb-28 sm:pb-12">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium tracking-tight transition cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentTab('activity')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium tracking-tight transition cursor-pointer ${
                currentTab === 'activity'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Activity ({transactions.length})
            </button>
            <button
              onClick={() => setCurrentTab('data')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium tracking-tight transition cursor-pointer ${
                currentTab === 'data'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Backup & Restore
            </button>
          </div>

          {/* Month Range Selector */}
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || 'all')}
              className="bg-zinc-900 text-xs font-mono text-zinc-300 border border-zinc-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer"
            />
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW */}
        {/* ------------------------------------------------------------- */}
        {currentTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Net Balance */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Net Position</span>
                  <Scale className="w-4 h-4 text-zinc-500" />
                </div>
                <div>
                  <div
                    className={`text-2xl font-mono font-bold tracking-tight tabular-nums ${
                      monthlyMetrics.net >= 0 ? 'text-zinc-100' : 'text-rose-400'
                    }`}
                  >
                    {formatIDR(monthlyMetrics.net)}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">
                    {selectedMonth === 'all' ? 'All recorded transactions' : `Period: ${selectedMonth}`}
                  </p>
                </div>
              </div>

              {/* Inflow */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-500/90">
                    Total Inflow
                  </span>
                  <div className="p-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold tracking-tight text-emerald-400 tabular-nums">
                    +{formatIDR(monthlyMetrics.income)}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">
                    Credits & deposits
                  </p>
                </div>
              </div>

              {/* Outflow */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-rose-500/90">
                    Total Outflow
                  </span>
                  <div className="p-1 rounded bg-rose-950/40 border border-rose-800/40 text-rose-400">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold tracking-tight text-zinc-100 tabular-nums">
                    -{formatIDR(monthlyMetrics.expense)}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">
                    Debits & expenditures
                  </p>
                </div>
              </div>
            </div>

            {/* Categorical Distribution Bar */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Expense Distribution
                </h3>
                <span className="text-xs font-mono text-zinc-500 tabular-nums">
                  {categoryBreakdown.length} Categories Active
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800/80 rounded-lg">
                  No expenditure recorded for the active period.
                </div>
              ) : (
                <>
                  {/* Segmented Stacked Progress Bar */}
                  <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/60 p-0.5 gap-0.5">
                    {categoryBreakdown.map((item) => (
                      <div
                        key={item.category}
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                        className="h-full rounded-xs transition-all duration-300"
                        title={`${item.category}: ${formatIDR(item.amount)} (${item.percentage.toFixed(1)}%)`}
                      />
                    ))}
                  </div>

                  {/* Dense Categorical Ledger Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-2">
                    {categoryBreakdown.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-zinc-300 truncate font-medium">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono shrink-0">
                          <span className="text-zinc-400 tabular-nums">
                            {item.percentage.toFixed(1)}%
                          </span>
                          <span className="text-zinc-100 font-semibold tabular-nums">
                            {formatIDR(item.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Recent Ledger Snapshot */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Recent Postings
                </h3>
                <button
                  onClick={() => setCurrentTab('activity')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>View All Postings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 overflow-hidden">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 flex items-center justify-between hover:bg-zinc-900/60 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 truncate">
                          {tx.notes || tx.category}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mt-0.5">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-mono font-bold tabular-nums ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatIDR(tx.amount)}
                      </div>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-8 text-center text-xs font-mono text-zinc-500">
                    No transactions recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ACTIVITY (FILTER & DATE-GROUPED POSTINGS) */}
        {/* ------------------------------------------------------------- */}
        {currentTab === 'activity' && (
          <div className="space-y-4">
            {/* Search & Filter Controls */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by description, category, or exact amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Type toggle */}
                <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-md">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition cursor-pointer ${
                      filterType === 'expense'
                        ? 'bg-zinc-800 text-rose-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition cursor-pointer ${
                      filterType === 'income'
                        ? 'bg-zinc-800 text-emerald-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Incomes
                  </button>
                </div>

                {/* Category dropdown */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {(searchQuery || filterType !== 'all' || filterCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterCategory('all');
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 font-mono px-2 py-1 underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Date-Grouped Transaction Stream */}
            {groupedTransactions.length === 0 ? (
              <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl p-12 text-center text-xs font-mono text-zinc-500">
                No matching transactions found for criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {groupedTransactions.map((group) => (
                  <div
                    key={group.date}
                    className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden"
                  >
                    {/* Date Group Header */}
                    <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-zinc-300">
                        {formatDateHeader(group.date)}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 tabular-nums">
                        {group.totalIncome > 0 && (
                          <span className="text-emerald-400/90 font-medium">
                            +{formatIDR(group.totalIncome)}
                          </span>
                        )}
                        {group.totalExpense > 0 && (
                          <span className="text-zinc-300 font-medium">
                            -{formatIDR(group.totalExpense)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Postings within Date Group */}
                    <div className="divide-y divide-zinc-800/40">
                      {group.items.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-3.5 flex items-center justify-between hover:bg-zinc-900/60 transition group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-2 h-8 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  tx.type === 'income' ? '#22c55e' : CATEGORY_COLORS[tx.category],
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-100 truncate">
                                {tx.notes || tx.category}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mt-0.5">
                                <span>{tx.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span
                                className={`text-xs font-mono font-bold tabular-nums ${
                                  tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'
                                }`}
                              >
                                {tx.type === 'income' ? '+' : '-'}
                                {formatIDR(tx.amount)}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleOpenEdit(tx)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition cursor-pointer"
                                aria-label="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition cursor-pointer"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: BACKUP & RESTORE */}
        {/* ------------------------------------------------------------- */}
        {currentTab === 'data' && (
          <div className="max-w-xl space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Data Portability & Schema
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  All ledger records live entirely in client-side storage. Create JSON backups to transfer between devices or restore prior records.
                </p>
              </div>

              {portabilityMessage && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    portabilityMessage.isError
                      ? 'bg-rose-950/30 border-rose-900 text-rose-300'
                      : 'bg-emerald-950/30 border-emerald-900 text-emerald-300'
                  }`}
                >
                  {portabilityMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{portabilityMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON Backup</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition active:scale-[0.98] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restore from JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </div>
            </div>

            {/* Storage Metadata */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 text-xs font-mono space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Storage Medium:</span>
                <span className="text-zinc-200">LocalStorage (Persistent)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Postings:</span>
                <span className="text-zinc-200">{transactions.length} records</span>
              </div>
              <div className="flex justify-between">
                <span>Network Protocol:</span>
                <span className="text-emerald-400">Zero-Latency Local Engine</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Entry Button for Mobile / Desktop Bottom Right */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs tracking-tight rounded-full shadow-lg border border-zinc-300 transition-all duration-150 active:scale-95 cursor-pointer"
        aria-label="Add Transaction"
      >
        <Plus className="w-4 h-4 text-zinc-950" />
        <span>New Posting</span>
      </button>

      {/* ------------------------------------------------------------- */}
      {/* FAST ENTRY MODAL / BOTTOM SHEET */}
      {/* ------------------------------------------------------------- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  {editingTx ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
                <p className="text-[11px] font-mono text-zinc-500">
                  {editingTx ? `Reference: ${editingTx.id}` : 'Local journal posting'}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
                    formType === 'expense'
                      ? 'bg-zinc-800 text-rose-400 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-2 text-xs font-semibold rounded-md transition cursor-pointer ${
                    formType === 'income'
                      ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Income Inflow
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Amount (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-base font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-600 tabular-nums"
                  />
                </div>
              </div>

              {/* Category (Expenses Only) */}
              {formType === 'expense' && (
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Category</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'Salary & Income').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Posting Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Notes / Narration</span>
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Monthly cloud subscription"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  {editingTx ? 'Update Entry' : 'Post Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
