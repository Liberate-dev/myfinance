import { type FC, useState, useEffect, useCallback } from 'react';
import { get, post, patch, del } from '../lib/api';
import { CurrencyInput } from './CurrencyInput';

interface Fund {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
}

interface RecurringTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  fund_id: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date: string | null;
  last_run: string | null;
  next_run: string;
  is_active: boolean;
}

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly'
};

const frequencyColors = {
  daily: 'badge-yellow',
  weekly: 'badge-blue',
  monthly: 'badge-green'
};

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 4v5h.582m15.356 2a8 8 0 11-.582 0M20.582 16H12m4 0v5h.582m-7.5-9.5l4 4m0 0l-4 4m4-4H4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const RecurringForm: FC<{
  funds: Fund[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ funds, onSubmit, onCancel, isLoading }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [fundId, setFundId] = useState(funds[0]?.id || 0);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const categories = type === 'income'
    ? ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus']
    : ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Health'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter valid amount');
      return;
    }

    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        description: description.trim(),
        category,
        fund_id: fundId,
        frequency,
        start_date: startDate
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-finance-red/10 border border-finance-red/30 text-finance-red font-mono text-sm">
          {error}
        </div>
      )}

      {/* Type */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setType('income'); setCategory('Salary'); }}
          className={`p-3 border ${type === 'income' ? 'border-finance-green bg-finance-green/10' : 'border-terminal-border bg-terminal-light'}`}
          disabled={isLoading}
        >
          <span className="text-finance-green font-mono text-sm">INCOME</span>
        </button>
        <button
          type="button"
          onClick={() => { setType('expense'); setCategory('Food'); }}
          className={`p-3 border ${type === 'expense' ? 'border-finance-red bg-finance-red/10' : 'border-terminal-border bg-terminal-light'}`}
          disabled={isLoading}
        >
          <span className="text-finance-red font-mono text-sm">EXPENSE</span>
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted font-mono font-semibold">Rp</div>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            placeholder="0"
            className="input pl-12"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          placeholder="Monthly rent, etc."
          disabled={isLoading}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
          disabled={isLoading}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Fund */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Fund</label>
        <select
          value={fundId}
          onChange={(e) => setFundId(parseInt(e.target.value))}
          className="input"
          disabled={isLoading}
        >
          {funds.map(fund => (
            <option key={fund.id} value={fund.id}>{fund.icon} {fund.name}</option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Frequency</label>
        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map(freq => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`p-2 border ${frequency === freq ? 'border-finance-green bg-finance-green/10' : 'border-terminal-border bg-terminal-light'}`}
              disabled={isLoading}
            >
              <span className="font-mono text-sm">{frequencyLabels[freq]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? 'CREATING...' : 'CREATE →'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          CANCEL
        </button>
      </div>
    </form>
  );
};

export const RecurringTransactions: FC = () => {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recRes, fundsRes] = await Promise.all([
        get<{ recurring: RecurringTransaction[] }>('/recurring'),
        get<{ funds: Fund[] }>('/funds')
      ]);
      setTransactions(recRes.recurring);
      setFunds(fundsRes.funds);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await post('/recurring', data);
      setShowForm(false);
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await patch(`/recurring/${id}/toggle`, {});
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this recurring transaction?')) return;
    try {
      await del(`/recurring/${id}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="card animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display">Recurring Transactions</h3>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          disabled={funds.length === 0}
        >
          <PlusIcon />
          ADD
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md">
            <h3 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              NEW RECURRING TRANSACTION
            </h3>
            <RecurringForm
              funds={funds}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* List */}
      {transactions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-muted font-mono text-sm">No recurring transactions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const fund = funds.find(f => f.id === tx.fund_id);
            return (
              <div
                key={tx.id}
                className={`card flex items-center gap-4 ${!tx.is_active ? 'opacity-50' : ''}`}
              >
                <div className={`p-2 ${tx.type === 'income' ? 'bg-finance-green/10 border border-finance-green/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
                  <RefreshIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${tx.type === 'income' ? 'text-finance-green' : 'text-finance-red'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <span className={`badge ${frequencyColors[tx.frequency]}`}>
                      {frequencyLabels[tx.frequency]}
                    </span>
                  </div>
                  <p className="text-sm font-mono truncate">{tx.description || tx.category}</p>
                  <p className="text-xs text-text-muted">
                    Next: {formatDate(tx.next_run)} • {fund?.icon} {fund?.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(tx.id)}
                    className={`px-3 py-1 border font-mono text-xs ${tx.is_active ? 'border-finance-green text-finance-green' : 'border-terminal-border text-text-muted'}`}
                  >
                    {tx.is_active ? 'ACTIVE' : 'PAUSED'}
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="px-3 py-1 border border-finance-red/30 text-finance-red font-mono text-xs hover:bg-finance-red/10"
                  >
                    DEL
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactions;
