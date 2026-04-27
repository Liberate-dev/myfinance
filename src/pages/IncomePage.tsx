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

const TrendUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
      <TrendUpIcon />
    </div>
    <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-display">NO INCOME RECORDED</h3>
    <p className="text-text-muted font-mono text-sm mb-6 max-w-sm mx-auto">
      Start tracking earnings to see history here
    </p>
    <button onClick={onAdd} className="btn-primary">
      <PlusIcon />
      ADD INCOME
    </button>
  </div>
);

export const IncomePage: FC = () => {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Transaction | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchFunds = useCallback(async () => {
    try {
      const data = await get<{ funds: Fund[] }>('/funds');
      setFunds(data.funds);
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  }, []);

  const fetchIncomes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      const response = await get<{ incomes: Transaction[] }>(`/incomes?startDate=${startDate}&endDate=${endDate}`);
      setIncomes(response.incomes);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
      setIncomes([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchIncomes();
    fetchFunds();
  }, [fetchIncomes, fetchFunds]);

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
      if (editingIncome) {
        const id = editingIncome.id || editingIncome._id;
        await put(`/incomes/${id}`, data);
        setEditingIncome(undefined);
      } else {
        await post('/incomes', data);
      }
      setShowForm(false);
      await fetchIncomes();
      await fetchFunds();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (income: Transaction) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income?')) return;
    try {
      await del(`/incomes/${id}`);
      await fetchIncomes();
      await fetchFunds();
    } catch (error) {
      console.error('Failed to delete income:', error);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingIncome(undefined);
  };

  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

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
          <h1 className="text-2xl font-display font-bold tracking-tight">INCOME</h1>
          <p className="text-text-muted font-mono text-sm mt-1">Track earnings and sources</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <button onClick={() => { setEditingIncome(undefined); setShowForm(true); }} className="btn-primary">
            <PlusIcon />
            ADD INCOME
          </button>
        </div>
      </div>

      {/* Total Card */}
      {totalIncome > 0 && (
        <div className="card border-finance-green/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-finance-green/10 border border-finance-green/30">
              <TrendUpIcon />
            </div>
            <div>
              <p className="section-header">Total Income</p>
              <p className="money text-2xl font-bold text-finance-green">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
            {editingIncome ? 'EDIT INCOME' : 'ADD NEW INCOME'}
          </h2>
          <TransactionForm
            type="income"
            funds={funds}
            selectedFundId={editingIncome?.fund_id}
            initialData={editingIncome}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : incomes.length === 0 ? (
        <EmptyState onAdd={() => { setEditingIncome(undefined); setShowForm(true); }} />
      ) : (
        <div className="space-y-4">
          {incomes.map((income) => {
            const fund = funds.find(f => f.id === income.fund_id);
            return (
              <TransactionCard
                key={income.id || income._id}
                transaction={income}
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

export default IncomePage;
