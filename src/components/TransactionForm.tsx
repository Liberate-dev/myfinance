import { type FC, useState, useEffect } from 'react';
import { CurrencyInput } from './CurrencyInput';

interface Fund {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
}

interface TransactionFormProps {
  type: 'income' | 'expense';
  funds: Fund[];
  selectedFundId?: number;
  onFundChange?: (fundId: number) => void;
  initialData?: {
    fund_id?: number;
    amount?: number;
    description?: string;
    category?: string;
    date?: string;
    notes?: string;
  };
  onSubmit: (data: {
    fund_id: number;
    amount: number;
    description: string;
    category: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const incomeCategories = [
  { name: 'Salary', icon: '💰' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Investment', icon: '📈' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Refund', icon: '💵' },
  { name: 'Bonus', icon: '🎉' },
];

const expenseCategories = [
  { name: 'Food', icon: '🍔' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Bills', icon: '📄' },
  { name: 'Shopping', icon: '🛒' },
  { name: 'Health', icon: '🏥' },
  { name: 'Education', icon: '📚' },
  { name: 'Other', icon: '📦' },
];

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export const TransactionForm: FC<TransactionFormProps> = ({
  type,
  funds,
  selectedFundId,
  onFundChange,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedFund, setSelectedFund] = useState<number>(selectedFundId || funds[0]?.id || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(
    initialData?.date?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');

  const availableCategories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (!category && availableCategories.length > 0) {
      setCategory(availableCategories[0].name);
    }
  }, [category, availableCategories]);

  useEffect(() => {
    if (selectedFundId && selectedFundId !== selectedFund) {
      setSelectedFund(selectedFundId);
    }
  }, [selectedFundId]);

  const handleFundChange = (fundId: number) => {
    setSelectedFund(fundId);
    onFundChange?.(fundId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedFund) {
      setError('Select a fund');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter valid amount');
      return;
    }

    if (!category) {
      setError('Select a category');
      return;
    }

    try {
      await onSubmit({
        fund_id: selectedFund,
        amount: parsedAmount,
        description: description.trim(),
        category,
        date: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
      });

      if (!initialData) {
        setDescription('');
        setAmount('');
        setNotes('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const currentFund = funds.find(f => f.id === selectedFund);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-finance-red/10 border border-finance-red/30">
          <div className="flex-shrink-0 text-finance-red">
            <AlertIcon />
          </div>
          <p className="text-sm font-mono text-finance-red">{error}</p>
        </div>
      )}

      {/* Fund Selection */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
          {type === 'income' ? 'Destination Fund' : 'Source Fund'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {funds.map((fund) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => handleFundChange(fund.id)}
              className={`p-3 border text-left transition-all ${
                selectedFund === fund.id
                  ? 'border-finance-green bg-finance-green/10'
                  : 'border-terminal-border bg-terminal-light hover:border-finance-green/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{fund.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{fund.name}</p>
                  <p className={`text-xs font-bold ${
                    fund.balance >= 0 ? 'text-finance-green' : 'text-finance-red'
                  }`}>
                    Rp {fund.balance.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {funds.length === 0 && (
          <p className="text-sm text-text-muted mt-2">
            No funds available. Create a fund first.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder={type === 'income' ? 'Monthly salary' : 'Grocery shopping'}
            disabled={isLoading}
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted font-mono font-semibold">
              Rp
            </div>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              disabled={isLoading}
              className="input pl-12"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input appearance-none"
              disabled={isLoading}
            >
              {availableCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>
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

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            disabled={isLoading}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
            Notes (optional)
          </label>
          <input
            type="text"
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Additional notes..."
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Balance info for expenses */}
      {type === 'expense' && currentFund && (
        <div className="text-xs font-mono text-text-muted flex items-center gap-2">
          <WalletIcon />
          <span>Available: Rp {currentFund.balance.toLocaleString('id-ID')}</span>
          {parseFloat(amount) > currentFund.balance && (
            <span className="text-finance-red"> - Insufficient balance</span>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || funds.length === 0}
          className={type === 'income' ? 'btn-primary flex-1' : 'btn-danger flex-1'}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              PROCESSING...
            </>
          ) : (
            initialData ? 'UPDATE →' : `ADD ${type.toUpperCase()} →`
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary"
          >
            CANCEL
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
