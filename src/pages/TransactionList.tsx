import { type FC, useState, useEffect, useCallback } from 'react';
import { get } from '../lib/api';
import { TransactionCard, type Transaction } from '../components/TransactionCard';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type FilterType = 'all' | 'income' | 'expense';

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SortIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
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
          <div className="flex-1">
            <div className="h-5 w-32 mb-2" />
            <div className="h-4 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState: FC = () => (
  <div className="card text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 border border-terminal-border flex items-center justify-center">
      <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-display">NO TRANSACTIONS YET</h3>
    <p className="text-text-muted font-mono text-sm max-w-sm mx-auto">
      Add income or expenses to see them here
    </p>
  </div>
);

export const TransactionList: FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      const [incomesRes, expensesRes] = await Promise.all([
        get<{ incomes: Transaction[] }>(`/incomes?startDate=${startDate}&endDate=${endDate}`),
        get<{ expenses: Transaction[] }>(`/expenses?startDate=${startDate}&endDate=${endDate}`),
      ]);

      setTransactions([...incomesRes.incomes, ...expensesRes.expenses]);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      default:
        return 0;
    }
  });

  const filteredTransactions = sortedTransactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

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
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">TRANSACTIONS</h1>
        <p className="text-text-muted font-mono text-sm mt-1">All income and expenses</p>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-finance-green/5 border border-finance-green/20">
            <div className="p-2 bg-finance-green/10 border border-finance-green/30">
              <TrendUpIcon />
            </div>
            <div>
              <p className="section-header">Income</p>
              <p className="money text-xl font-bold text-finance-green">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-finance-red/5 border border-finance-red/20">
            <div className="p-2 bg-finance-red/10 border border-finance-red/30">
              <TrendDownIcon />
            </div>
            <div>
              <p className="section-header">Expenses</p>
              <p className="money text-xl font-bold text-finance-red">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 border ${balance >= 0 ? 'bg-finance-blue/5 border-finance-blue/20' : 'bg-finance-red/5 border-finance-red/20'}`}>
            <div className={`p-2 ${balance >= 0 ? 'bg-finance-blue/10 border border-finance-blue/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="section-header">Balance</p>
              <p className={`money text-xl font-bold ${balance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <FilterIcon />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="input pl-10"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <SortIcon />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input pl-10"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id || transaction._id}
              transaction={transaction}
              showActions={false}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {filteredTransactions.length > 0 && (
        <div className="text-center text-sm font-mono text-text-muted">
          SHOWING {filteredTransactions.length} OF {transactions.length} TRANSACTIONS
        </div>
      )}
    </div>
  );
};

export default TransactionList;