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
  tags?: string[];
  createdAt: number;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  limit: number;
}

export interface RecurringSubscription {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  billingDay: number;
  active: boolean;
}

const STORAGE_KEY = 'xpense_tracker_db_v1';
const BUDGET_STORAGE_KEY = 'xpense_tracker_budgets_v1';
const SUBS_STORAGE_KEY = 'xpense_tracker_subs_v1';

const INITIAL_SUBSCRIPTIONS: RecurringSubscription[] = [
  { id: 'sub_1', name: 'Cloud Infrastructure VPS', amount: 350000, category: 'Housing & Utilities', billingDay: 1, active: true },
  { id: 'sub_2', name: 'Figma & Developer Tools', amount: 240000, category: 'Other', billingDay: 15, active: true },
  { id: 'sub_3', name: 'Gym & Health Membership', amount: 450000, category: 'Healthcare', billingDay: 20, active: true },
  { id: 'sub_4', name: 'Streaming & Media Bundle', amount: 186000, category: 'Entertainment', billingDay: 28, active: true },
];

const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'Food & Dining', limit: 2000000 },
  { category: 'Groceries', limit: 3000000 },
  { category: 'Transportation', limit: 1000000 },
  { category: 'Housing & Utilities', limit: 2500000 },
  { category: 'Entertainment', limit: 800000 },
  { category: 'Shopping', limit: 1500000 },
];

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

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    try {
      const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_BUDGETS;
  });

  const [subscriptions, setSubscriptions] = useState<RecurringSubscription[]>(() => {
    try {
      const stored = localStorage.getItem(SUBS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    } catch (err) {
      console.error('Failed to sync budgets to localStorage:', err);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(subscriptions));
    } catch (err) {
      console.error('Failed to sync subscriptions to localStorage:', err);
    }
  }, [subscriptions]);

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
  const [currentTab, setCurrentTab] = useState<'overview' | 'activity' | 'analytics' | 'subscriptions' | 'data'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<RecurringSubscription | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCategory, setSubCategory] = useState<ExpenseCategory>('Housing & Utilities');
  const [subBillingDay, setSubBillingDay] = useState(1);
  const [subError, setSubError] = useState('');

  // Form input state
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Food & Dining');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');

  // Portability Status feedback
  const [portabilityMessage, setPortabilityMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFormOpen) {
        setIsFormOpen(false);
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      ) {
        return;
      }

      if ((e.key === 'n' || e.key === 'N') && !isFormOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        handleOpenAdd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormOpen]);

  useEffect(() => {
    if (isFormOpen) {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingTx(null);
    setFormType('expense');
    setFormAmount('');
    setFormCategory('Food & Dining');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    setFormTags('');
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
    setFormTags(tx.tags ? tx.tags.join(', ') : '');
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

    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

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
                tags: parsedTags.length > 0 ? parsedTags : undefined,
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
        tags: parsedTags.length > 0 ? parsedTags : undefined,
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

  const handleOpenAddSub = () => {
    setEditingSub(null);
    setSubName('');
    setSubAmount('');
    setSubCategory('Housing & Utilities');
    setSubBillingDay(1);
    setSubError('');
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: RecurringSubscription) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubAmount(sub.amount.toString());
    setSubCategory(sub.category);
    setSubBillingDay(sub.billingDay);
    setSubError('');
    setIsSubModalOpen(true);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(subAmount.replace(/[^0-9.]/g, ''));
    if (!subName.trim()) {
      setSubError('Subscription name is required.');
      return;
    }
    if (isNaN(rawVal) || rawVal <= 0) {
      setSubError('Please enter a valid amount.');
      return;
    }

    if (editingSub) {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === editingSub.id
            ? { ...s, name: subName.trim(), amount: rawVal, category: subCategory, billingDay: subBillingDay }
            : s
        )
      );
    } else {
      const newSub: RecurringSubscription = {
        id: 'sub_' + Date.now().toString(36),
        name: subName.trim(),
        amount: rawVal,
        category: subCategory,
        billingDay: subBillingDay,
        active: true,
      };
      setSubscriptions((prev) => [newSub, ...prev]);
    }
    setIsSubModalOpen(false);
  };

  const handleDeleteSub = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleSubActive = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handlePostSubToLedger = (sub: RecurringSubscription) => {
    const today = new Date().toISOString().slice(0, 10);
    const newTx: Transaction = {
      id: generateId(),
      amount: sub.amount,
      type: 'expense',
      category: subCategory,
      date: today,
      notes: `Recurring: ${sub.name}`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setPortabilityMessage({
      text: `Posted "${sub.name}" (${formatIDR(sub.amount)}) to Ledger.`,
      isError: false,
    });
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const t of transactions) {
      if (t.tags) {
        for (const tag of t.tags) {
          tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [transactions]);

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
      if (filterTag !== 'all' && (!t.tags || !t.tags.includes(filterTag))) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNotes = t.notes.toLowerCase().includes(q);
        const matchCategory = t.category.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        const matchTag = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!matchNotes && !matchCategory && !matchAmount && !matchTag) return false;
      }
      return true;
    });
  }, [transactions, selectedMonth, filterType, filterCategory, filterTag, searchQuery]);

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

  const budgetMetrics = useMemo(() => {
    const scope =
      selectedMonth === 'all'
        ? transactions
        : transactions.filter((t) => t.date.startsWith(selectedMonth));

    const expenseOnly = scope.filter((t) => t.type === 'expense');
    const spentMap = new Map<ExpenseCategory, number>();
    for (const t of expenseOnly) {
      spentMap.set(t.category, (spentMap.get(t.category) || 0) + t.amount);
    }

    return budgets
      .map((b) => {
        const spent = spentMap.get(b.category) || 0;
        const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        const remaining = b.limit - spent;
        const isOver = remaining < 0;
        const isWarning = percent >= 80 && !isOver;

        return {
          category: b.category,
          limit: b.limit,
          spent,
          percent,
          remaining,
          isOver,
          isWarning,
          color: CATEGORY_COLORS[b.category] || '#71717a',
        };
      })
      .filter((b) => b.limit > 0);
  }, [transactions, budgets, selectedMonth]);

  const activeSubTotal = useMemo(() => {
    return subscriptions
      .filter((s) => s.active)
      .reduce((sum, s) => sum + s.amount, 0);
  }, [subscriptions]);

  const analyticsData = useMemo(() => {
    const scope =
      selectedMonth === 'all'
        ? transactions
        : transactions.filter((t) => t.date.startsWith(selectedMonth));

    const dailyMap = new Map<string, { expense: number; income: number }>();
    for (const t of scope) {
      const prev = dailyMap.get(t.date) || { expense: 0, income: 0 };
      if (t.type === 'expense') prev.expense += t.amount;
      else prev.income += t.amount;
      dailyMap.set(t.date, prev);
    }

    const sortedDays = Array.from(dailyMap.entries())
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalDays = sortedDays.length || 1;
    const totalExpenses = sortedDays.reduce((sum, d) => sum + d.expense, 0);
    const avgDailyBurn = totalExpenses / totalDays;
    const maxDayExpense = Math.max(...sortedDays.map((d) => d.expense), 1);

    const highestExpenseDays = [...sortedDays]
      .filter((d) => d.expense > 0)
      .sort((a, b) => b.expense - a.expense)
      .slice(0, 5);

    return {
      sortedDays,
      totalExpenses,
      avgDailyBurn,
      maxDayExpense,
      highestExpenseDays,
      activeDaysCount: totalDays,
    };
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
  const handleExportCSV = () => {
    try {
      const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes', 'Tags'];
      const rows = transactions.map((t) => [
        t.date,
        t.type,
        `"${t.category.replace(/"/g, '""')}"`,
        t.amount,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${(t.tags ? t.tags.join(';') : '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ledger-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setPortabilityMessage({ text: 'CSV export downloaded successfully.', isError: false });
    } catch {
      setPortabilityMessage({ text: 'Failed to export CSV.', isError: true });
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file must contain a header row and at least one data row.');
        }

        const validItems: Transaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const cols: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let j = 0; j < row.length; j++) {
            const char = row[j];
            if (char === '"') {
              if (inQuotes && row[j + 1] === '"') {
                current += '"';
                j++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              cols.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          cols.push(current);

          if (cols.length >= 4) {
            const date = cols[0].trim();
            const type = cols[1].trim().toLowerCase() === 'income' ? 'income' : 'expense';
            const category = (cols[2].trim() || (type === 'income' ? 'Salary & Income' : 'Other')) as ExpenseCategory;
            const amount = Math.abs(parseFloat(cols[3].replace(/[^0-9.]/g, '')) || 0);
            const notes = cols[4] ? cols[4].trim() : '';
            const tags = cols[5] ? cols[5].split(';').map((t) => t.trim()).filter((t) => t.length > 0) : undefined;

            if (date && amount > 0) {
              validItems.push({
                id: generateId(),
                amount,
                type,
                category,
                date,
                notes,
                tags,
                createdAt: Date.now(),
              });
            }
          }
        }

        if (validItems.length === 0) {
          throw new Error('No valid transactions found in CSV.');
        }

        setTransactions((prev) => [...validItems, ...prev]);
        setPortabilityMessage({
          text: `Successfully imported ${validItems.length} transactions from CSV.`,
          isError: false,
        });
      } catch (err: unknown) {
        setPortabilityMessage({
          text: err instanceof Error ? err.message : 'Invalid CSV format.',
          isError: true,
        });
      }
    };
    reader.readAsText(file);
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  };

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
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono tracking-tight leading-none">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800/80 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                currentTab === 'overview'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentTab('activity')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                currentTab === 'activity'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Activity ({transactions.length})
            </button>
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                currentTab === 'analytics'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setCurrentTab('subscriptions')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                currentTab === 'subscriptions'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Subscriptions ({subscriptions.filter((s) => s.active).length})
            </button>
            <button
              onClick={() => setCurrentTab('data')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-tight whitespace-nowrap transition cursor-pointer shrink-0 ${
                currentTab === 'data'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Backup & Restore
            </button>
          </div>

          {/* Month Range Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
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
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
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
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
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
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
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

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Category Budgets & Spending Caps
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    {selectedMonth === 'all' ? 'Cumulative vs Monthly Target' : `Period: ${selectedMonth}`}
                  </p>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition cursor-pointer"
                >
                  Adjust Limits
                </button>
              </div>

              {budgetMetrics.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-zinc-400 border border-dashed border-zinc-800/80 rounded-lg">
                  No monthly category limits set. Click "Adjust Limits" to configure.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {budgetMetrics.map((b) => (
                    <div
                      key={b.category}
                      className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: b.color }}
                          />
                          <span className="font-medium text-zinc-200 truncate">{b.category}</span>
                        </div>
                        <span
                          className={`font-mono font-bold text-[11px] tabular-nums ${
                            b.isOver
                              ? 'text-rose-400'
                              : b.isWarning
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {b.percent.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                        <div
                          style={{
                            width: `${Math.min(b.percent, 100)}%`,
                            backgroundColor: b.isOver ? '#f43f5e' : b.isWarning ? '#f59e0b' : b.color,
                          }}
                          className="h-full rounded-full transition-all duration-300"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>{formatIDR(b.spent)}</span>
                        <span className="text-zinc-400">of {formatIDR(b.limit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
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
                  <div className="p-8 text-center text-xs font-mono text-zinc-400">
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

                {allTags.length > 0 && (
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="bg-zinc-950 text-xs text-zinc-300 border border-zinc-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="all">All Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        #{tag}
                      </option>
                    ))}
                  </select>
                )}

                {(searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterTag !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setFilterCategory('all');
                      setFilterTag('all');
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
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  tx.type === 'income' ? '#22c55e' : CATEGORY_COLORS[tx.category],
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-100 truncate">
                                {tx.notes || tx.category}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
                                <span>{tx.category}</span>
                                {tx.tags && tx.tags.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      {tx.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="text-[10px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
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
                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                              <button
                                onClick={() => handleOpenEdit(tx)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                aria-label={`Edit ${tx.notes || tx.category}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
                                aria-label={`Delete ${tx.notes || tx.category}`}
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

        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Daily Burn Rate
                </span>
                <div className="text-2xl font-mono font-bold text-zinc-100 tabular-nums mt-1">
                  {formatIDR(analyticsData.avgDailyBurn)}
                  <span className="text-xs font-normal text-zinc-400 ml-1">/ day</span>
                </div>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  Over {analyticsData.activeDaysCount} active recording days
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Highest Outflow Day
                </span>
                <div className="text-2xl font-mono font-bold text-rose-400 tabular-nums mt-1">
                  {formatIDR(analyticsData.maxDayExpense)}
                </div>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  Peak single-day expenditure
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Total Month Outflow
                </span>
                <div className="text-2xl font-mono font-bold text-zinc-100 tabular-nums mt-1">
                  {formatIDR(analyticsData.totalExpenses)}
                </div>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  {selectedMonth === 'all' ? 'All records' : `Scope: ${selectedMonth}`}
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Daily Expenditure Timeline
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Chronological daily debit volume
                  </p>
                </div>
              </div>

              {analyticsData.sortedDays.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-zinc-400 border border-dashed border-zinc-800/80 rounded-lg">
                  No transaction data available for timeline.
                </div>
              ) : (
                <div className="pt-4 pb-2">
                  <div className="h-44 flex items-end gap-1.5 sm:gap-2 overflow-x-auto pb-2">
                    {analyticsData.sortedDays.map((d) => {
                      const heightPercent = Math.max(
                        6,
                        (d.expense / (analyticsData.maxDayExpense || 1)) * 100
                      );
                      return (
                        <div
                          key={d.date}
                          className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center gap-1.5 group relative"
                        >
                          <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[10px] font-mono text-zinc-200 whitespace-nowrap z-20 shadow-lg">
                            {d.date}: {formatIDR(d.expense)}
                          </div>

                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-sm transition-all duration-200 ${
                              d.expense > 0 ? 'bg-zinc-300 group-hover:bg-rose-400' : 'bg-zinc-800/40'
                            }`}
                          />

                          <span className="text-[9px] font-mono text-zinc-400 truncate w-full text-center">
                            {d.date.slice(8)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Top Spending Dates
              </h3>
              <div className="divide-y divide-zinc-800/60">
                {analyticsData.highestExpenseDays.map((d) => (
                  <div key={d.date} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300">{d.date}</span>
                    <span className="font-bold text-rose-400 tabular-nums">
                      -{formatIDR(d.expense)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Monthly Recurring Commitments
                </span>
                <div className="text-2xl font-mono font-bold text-zinc-100 tabular-nums mt-1">
                  {formatIDR(activeSubTotal)}
                  <span className="text-xs font-normal text-zinc-400 ml-1">/ month</span>
                </div>
              </div>
              <button
                onClick={handleOpenAddSub}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition active:scale-[0.98] cursor-pointer self-start sm:self-auto"
              >
                + Add Subscription
              </button>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 overflow-hidden">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    sub.active ? 'hover:bg-zinc-900/60' : 'opacity-50 bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[sub.category] }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-100 truncate">{sub.name}</p>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                            Due day {sub.billingDay}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{sub.category}</p>
                      </div>
                    </div>

                    <div className="sm:hidden text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-zinc-100 tabular-nums">
                        {formatIDR(sub.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-zinc-800/40 sm:border-0">
                    <div className="hidden sm:block text-right mr-2">
                      <span className="text-xs font-mono font-bold text-zinc-100 tabular-nums">
                        {formatIDR(sub.amount)}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePostSubToLedger(sub)}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono rounded-md transition cursor-pointer"
                      title="Post today's bill to ledger"
                    >
                      Post Bill
                    </button>

                    <button
                      onClick={() => handleToggleSubActive(sub.id)}
                      className={`text-[11px] font-mono px-2 py-1.5 rounded border transition cursor-pointer ${
                        sub.active
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {sub.active ? 'Active' : 'Paused'}
                    </button>

                    <button
                      onClick={() => handleOpenEditSub(sub)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition cursor-pointer"
                      aria-label={`Edit ${sub.name}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition cursor-pointer"
                      aria-label={`Delete ${sub.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="p-8 text-center text-xs font-mono text-zinc-400">
                  No recurring subscriptions configured.
                </div>
              )}
            </div>
          </div>
        )}

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

                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV (Spreadsheet)</span>
                </button>

                <button
                  onClick={() => csvFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition active:scale-[0.98] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import from CSV</span>
                </button>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportCSV}
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
        className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs tracking-tight rounded-full shadow-xl border border-zinc-300 transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        aria-label="Add Transaction (Press N)"
        title="New Posting (N)"
      >
        <Plus className="w-4 h-4 text-zinc-950" />
        <span>New Posting</span>
        <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 border border-zinc-300">
          N
        </kbd>
      </button>

      {/* Fast Entry Modal / Bottom Sheet */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl p-5 shadow-2xl space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto pb-8 sm:pb-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  {editingTx ? 'Edit Transaction' : 'Record Transaction'}
                </h3>
                <p className="text-[11px] font-mono text-zinc-400">
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
                <label htmlFor="tx-amount" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Amount (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                    Rp
                  </span>
                  <input
                    id="tx-amount"
                    ref={amountInputRef}
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-base font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 tabular-nums"
                  />
                </div>
              </div>

              {/* Category (Expenses Only) */}
              {formType === 'expense' && (
                <div>
                  <label htmlFor="tx-category" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Category</span>
                  </label>
                  <select
                    id="tx-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 cursor-pointer"
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
                <label htmlFor="tx-date" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Posting Date</span>
                </label>
                <input
                  id="tx-date"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label htmlFor="tx-notes" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Notes / Narration</span>
                </label>
                <input
                  id="tx-notes"
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Monthly cloud subscription"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label htmlFor="tx-tags" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Hashtags (comma separated)</span>
                </label>
                <input
                  id="tx-tags"
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. work, travel, project-alpha"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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

      {/* Budget Configuration Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl p-5 shadow-2xl space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto pb-8 sm:pb-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Monthly Category Caps</h3>
                <p className="text-[11px] font-mono text-zinc-400">Set target thresholds per expense category</p>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {CATEGORIES.filter((c) => c !== 'Salary & Income').map((cat) => {
                const currentBudget = budgets.find((b) => b.category === cat)?.limit || 0;
                return (
                  <div key={cat} className="flex items-center justify-between gap-3">
                    <label htmlFor={`budget-${cat}`} className="text-xs text-zinc-300 font-medium truncate flex-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                      <span className="truncate">{cat}</span>
                    </label>
                    <div className="w-36 relative shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">
                        Rp
                      </span>
                      <input
                        id={`budget-${cat}`}
                        type="number"
                        step="50000"
                        min="0"
                        value={currentBudget === 0 ? '' : currentBudget}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setBudgets((prev) => {
                            const exists = prev.some((b) => b.category === cat);
                            if (exists) {
                              return prev.map((b) => (b.category === cat ? { ...b, limit: val } : b));
                            }
                            return [...prev, { category: cat, limit: val }];
                          });
                        }}
                        placeholder="No limit"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 tabular-nums"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Edit / Create Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl p-5 shadow-2xl space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto pb-8 sm:pb-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  {editingSub ? 'Edit Subscription' : 'Add Recurring Commitment'}
                </h3>
                <p className="text-[11px] font-mono text-zinc-400">Fixed monthly recurring expense</p>
              </div>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {subError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{subError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSub} className="space-y-4">
              <div>
                <label htmlFor="sub-name" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Service / Provider Name
                </label>
                <input
                  id="sub-name"
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Netflix / AWS / Spotify"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="sub-amount" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Monthly Amount (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                    Rp
                  </span>
                  <input
                    id="sub-amount"
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-base font-mono font-bold text-zinc-100 focus:outline-none focus:border-zinc-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sub-category" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Category
                </label>
                <select
                  id="sub-category"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {CATEGORIES.filter((c) => c !== 'Salary & Income').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sub-day" className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Billing Day of Month (1 - 31)
                </label>
                <input
                  id="sub-day"
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={subBillingDay}
                  onChange={(e) => setSubBillingDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 tabular-nums"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  {editingSub ? 'Update Subscription' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
