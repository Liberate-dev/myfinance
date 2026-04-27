import { type FC, useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../lib/api';
import { BudgetProgress, type BudgetVsActual } from '../components/BudgetProgress';
import { CurrencyInput } from '../components/CurrencyInput';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

interface Budget {
  id: number;
  category: string;
  amount: number;
}

interface BudgetSummary {
  year: number;
  month: number;
  budgets: BudgetVsActual[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
}

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-8 w-8 text-terminal-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const BudgetForm: FC<{
  budget?: Budget;
  categories: Category[];
  onSubmit: (data: { category: string; amount: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ budget, categories, onSubmit, onCancel, isLoading }) => {
  const [category, setCategory] = useState(budget?.category || '');
  const [amount, setAmount] = useState(budget?.amount.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ category, amount: parseFloat(amount) });
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Category</label>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input appearance-none"
            required
          >
            <option value="">Select a category</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Monthly Budget Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted font-mono font-semibold">
            Rp
          </div>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            placeholder="500000"
            className="input pl-12"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'SAVING...' : budget ? 'UPDATE →' : 'CREATE →'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
};

const BudgetPage: FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchBudgetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const data = await get<BudgetSummary>(`/budgets/vs-actual?year=${year}&month=${month}`);
      setBudgetData(data);
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await get<{ categories: Category[] }>('/categories/type/expense');
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchBudgetData();
    fetchCategories();
  }, [fetchBudgetData, fetchCategories]);

  const handleSubmit = async (formData: { category: string; amount: number }) => {
    setIsSubmitting(true);
    try {
      if (editingBudget) {
        await put(`/budgets/${editingBudget.id}`, formData);
      } else {
        await post('/budgets', formData);
      }
      setShowForm(false);
      setEditingBudget(undefined);
      await fetchBudgetData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await del(`/budgets/${id}`);
      await fetchBudgetData();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Blackscreen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-terminal-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner />
            <p className="text-terminal-green font-mono text-sm tracking-wider animate-pulse">LOADING...</p>
          </div>
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">BUDGET</h1>
          <p className="text-text-muted font-mono text-sm mt-1">Track spending against budgets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <CalendarIcon />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input pl-10 pr-8 appearance-none cursor-pointer"
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const date = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return (
                  <option key={value} value={value}>
                    {date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => { setEditingBudget(undefined); setShowForm(true); }}
            className="btn-primary"
          >
            <PlusIcon />
            ADD BUDGET
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {budgetData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-finance-blue/10 border border-finance-blue/30">
                <ChartIcon />
              </div>
              <div>
                <p className="section-header">Total Budget</p>
                <p className="money text-xl font-bold text-finance-blue">{formatCurrency(budgetData.totalBudget)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-finance-red/10 border border-finance-red/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <p className="section-header">Total Spent</p>
                <p className="money text-xl font-bold text-finance-red">{formatCurrency(budgetData.totalSpent)}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${budgetData.totalRemaining >= 0 ? 'bg-finance-green/10 border border-finance-green/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="section-header">Remaining</p>
                <p className={`money text-xl font-bold ${budgetData.totalRemaining >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                  {formatCurrency(budgetData.totalRemaining)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card w-full max-w-md animate-scale-in">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              {editingBudget ? 'EDIT BUDGET' : 'ADD NEW BUDGET'}
            </h2>
            <BudgetForm
              budget={editingBudget}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingBudget(undefined); }}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Budget Progress */}
      {!isLoading && budgetData && budgetData.budgets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border border-terminal-border flex items-center justify-center">
            <ChartIcon />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-display">NO BUDGETS SET</h3>
          <p className="text-text-muted font-mono text-sm mb-6 max-w-sm mx-auto">
            Set monthly budgets for expense categories to track limits
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <PlusIcon />
            CREATE FIRST BUDGET
          </button>
        </div>
      ) : budgetData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetData.budgets.map((data) => (
            <BudgetProgress
              key={data.budget.id}
              data={data}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetPage;