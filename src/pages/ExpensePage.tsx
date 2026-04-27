import { type FC, useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../lib/api';
import { TransactionCard, type Transaction } from '../components/TransactionCard';
import { TransactionForm } from '../components/TransactionForm';

interface Fund {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
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

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const SkeletonLine = ({ className = 'h-4 w-full' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

const MonthPicker: FC<{ value: string; onChange: (month: string) => void }> = ({ value, onChange }) => {
  const currentDate = new Date();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(date);
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
        <CalendarIcon />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10 pr-8 appearance-none cursor-pointer"
      >
        {months.map((date) => {
          const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return (
            <option key={monthValue} value={monthValue}>
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
  );
};

const LoadingSkeleton: FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <SkeletonLine className="w-12 h-12" />
            <div className="space-y-2">
              <SkeletonLine className="h-5 w-32" />
              <SkeletonLine className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonLine className="w-10 h-10" />
            <SkeletonLine className="w-10 h-10" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="card text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 border border-terminal-border flex items-center justify-center">
      <TrendDownIcon />
    </div>
    <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-display">NO EXPENSES RECORDED</h3>
    <p className="text-text-muted font-mono text-sm mb-6 max-w-sm mx-auto">
      Start tracking spending to see history here
    </p>
    <button onClick={onAdd} className="btn-danger">
      <PlusIcon />
      ADD EXPENSE
    </button>
  </div>
);

const CategoryModal: FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const iconOptions = ['🍔', '🚗', '🎬', '📄', '🛒', '🏥', '📱', '🏠', '✈️', '📚', '🎮', '👔', '💊', '🎁', '🛠️', '📦'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Category name required');
      return;
    }
    setIsSubmitting(true);
    try {
      await post('/categories', { name: name.trim(), type: 'expense', icon });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Create category error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create category';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="card w-full max-w-md animate-scale-in">
        <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">CREATE CUSTOM CATEGORY</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-finance-red/10 border border-finance-red/30 text-finance-red font-mono text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Coffee"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => setIcon(ico)}
                  className={`w-10 h-10 flex items-center justify-center text-xl border transition-all ${
                    icon === ico
                      ? 'border-finance-green bg-finance-green/10 text-finance-green'
                      : 'border-terminal-border bg-terminal-light hover:border-finance-green/50'
                  }`}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? 'CREATING...' : 'CREATE →'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ExpensePage: FC = () => {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Transaction | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const fetchFunds = useCallback(async () => {
    try {
      const data = await get<{ funds: Fund[] }>('/funds');
      setFunds(data.funds);
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      const response = await get<{ expenses: Transaction[] }>(`/expenses?startDate=${startDate}&endDate=${endDate}`);
      setExpenses(response.expenses);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchExpenses();
    fetchFunds();
  }, [fetchExpenses, fetchFunds]);

  const handleSubmit = async (data: {
    fund_id: number;
    amount: number;
    description: string;
    category: string;
    date: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        const id = editingExpense.id || editingExpense._id;
        await put(`/expenses/${id}`, data);
        setEditingExpense(undefined);
      } else {
        await post('/expenses', data);
      }
      setShowForm(false);
      await fetchExpenses();
      await fetchFunds();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Transaction) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await del(`/expenses/${id}`);
      await fetchExpenses();
      await fetchFunds();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingExpense(undefined);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">EXPENSES</h1>
          <p className="text-text-muted font-mono text-sm mt-1">Track spending and analyze habits</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn-secondary"
            title="Create custom category"
          >
            <TagIcon />
            CATEGORY
          </button>
          <button onClick={() => { setEditingExpense(undefined); setShowForm(true); }} className="btn-danger">
            <PlusIcon />
            ADD EXPENSE
          </button>
        </div>
      </div>

      {/* Total Card */}
      {totalExpenses > 0 && (
        <div className="card border-finance-red/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-finance-red/10 border border-finance-red/30">
              <TrendDownIcon />
            </div>
            <div>
              <p className="section-header">Total Expenses</p>
              <p className="money text-2xl font-bold text-finance-red">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
            {editingExpense ? 'EDIT EXPENSE' : 'ADD NEW EXPENSE'}
          </h2>
          <TransactionForm
            type="expense"
            funds={funds}
            selectedFundId={editingExpense?.fund_id}
            initialData={editingExpense}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSuccess={() => {
            setShowForm(true);
          }}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : expenses.length === 0 ? (
        <EmptyState onAdd={() => { setEditingExpense(undefined); setShowForm(true); }} />
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => {
            const fund = funds.find(f => f.id === expense.fund_id);
            return (
              <TransactionCard
                key={expense.id || expense._id}
                transaction={expense}
                onEdit={handleEdit}
                onDelete={handleDelete}
                fundName={fund?.name}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpensePage;
