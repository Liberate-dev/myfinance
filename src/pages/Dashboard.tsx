import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { SpendingChart } from '../components/SpendingChart';
import { SuggestionCard } from '../components/SuggestionCard';

interface MonthlySummary {
  user_id: number;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  fund_balance: number;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
}

interface Suggestion {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  priority: number;
  action?: string;
}

// Terminal-style Icons
const ArrowUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SkeletonLine = ({ className = 'h-4 w-full' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

export const Dashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

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
    });
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [summaryRes, categoriesRes, transactionsRes, suggestionsRes] = await Promise.all([
          apiClient.get<MonthlySummary>('/summary'),
          apiClient.get<CategoryBreakdown[]>('/summary/categories'),
          apiClient.get<Transaction[]>('/summary/transactions'),
          apiClient.get<Suggestion[]>('/suggestions'),
        ]);

        setSummary(summaryRes.data);
        setCategories(categoriesRes.data);
        setRecentTransactions(transactionsRes.data);
        setSuggestions(suggestionsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card">
              <SkeletonLine className="w-20 h-3 mb-3" />
              <SkeletonLine className="w-40 h-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card h-64" />
            <div className="card h-48" />
          </div>
          <div className="space-y-6">
            <div className="card h-48" />
            <div className="card h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">DASHBOARD</h1>
          <p className="text-text-muted font-mono text-sm mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-text-muted font-mono text-xs">
          <span className="w-2 h-2 bg-finance-green animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="stat-card group hover:border-finance-green transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-finance-green/10 border border-finance-green/30 group-hover:bg-finance-green/20">
                <ArrowUpIcon />
              </div>
              <div>
                <p className="section-header">Total Income</p>
                <p className="money text-2xl font-bold text-finance-green">
                  {formatCurrency(summary?.total_income || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-terminal-border">
            <Link
              to="/income"
              className="text-xs font-mono text-text-muted hover:text-finance-green transition-colors flex items-center gap-1"
            >
              VIEW DETAILS <ArrowUpIcon />
            </Link>
          </div>
        </div>

        {/* Expense Card */}
        <div className="stat-card group hover:border-finance-red transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-finance-red/10 border border-finance-red/30 group-hover:bg-finance-red/20">
                <ArrowDownIcon />
              </div>
              <div>
                <p className="section-header">Total Expense</p>
                <p className="money text-2xl font-bold text-finance-red">
                  {formatCurrency(summary?.total_expense || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-terminal-border">
            <Link
              to="/expense"
              className="text-xs font-mono text-text-muted hover:text-finance-red transition-colors flex items-center gap-1"
            >
              VIEW DETAILS <ArrowDownIcon />
            </Link>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`stat-card group transition-all ${(summary?.fund_balance || 0) >= 0 ? 'hover:border-finance-green' : 'hover:border-finance-red'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${(summary?.fund_balance || 0) >= 0 ? 'bg-finance-green/10 border border-finance-green/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
                <WalletIcon />
              </div>
              <div>
                <p className="section-header">Fund Balance</p>
                <p className={`money text-2xl font-bold ${(summary?.fund_balance || 0) >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                  {formatCurrency(summary?.fund_balance || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-terminal-border">
            <span className={`badge ${(summary?.fund_balance || 0) >= 0 ? 'badge-green' : 'badge-red'}`}>
              {(summary?.fund_balance || 0) >= 0 ? 'POSITIVE' : 'NEGATIVE'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Spending Overview</h2>
              <Link to="/reports" className="text-xs font-mono text-finance-green hover:text-finance-green-dim transition-colors">
                VIEW REPORTS →
              </Link>
            </div>
            <SpendingChart data={categories} chartType="pie" />
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/income"
                className="flex flex-col items-center gap-2 p-4 bg-terminal-light border border-terminal-border hover:border-finance-green transition-all group"
              >
                <div className="p-3 bg-finance-green/10 border border-finance-green/30 group-hover:bg-finance-green/20">
                  <ArrowUpIcon />
                </div>
                <span className="text-xs font-mono text-text-secondary group-hover:text-finance-green">ADD INCOME</span>
              </Link>

              <Link
                to="/expense"
                className="flex flex-col items-center gap-2 p-4 bg-terminal-light border border-terminal-border hover:border-finance-red transition-all group"
              >
                <div className="p-3 bg-finance-red/10 border border-finance-red/30 group-hover:bg-finance-red/20">
                  <ArrowDownIcon />
                </div>
                <span className="text-xs font-mono text-text-secondary group-hover:text-finance-red">ADD EXPENSE</span>
              </Link>

              <Link
                to="/funds"
                className="flex flex-col items-center gap-2 p-4 bg-terminal-light border border-terminal-border hover:border-finance-blue transition-all group"
              >
                <div className="p-3 bg-finance-blue/10 border border-finance-blue/30 group-hover:bg-finance-blue/20">
                  <WalletIcon />
                </div>
                <span className="text-xs font-mono text-text-secondary group-hover:text-finance-blue">MANAGE FUNDS</span>
              </Link>

              <Link
                to="/budget"
                className="flex flex-col items-center gap-2 p-4 bg-terminal-light border border-terminal-border hover:border-finance-yellow transition-all group"
              >
                <div className="p-3 bg-finance-yellow/10 border border-finance-yellow/30 group-hover:bg-finance-yellow/20">
                  <ChartIcon />
                </div>
                <span className="text-xs font-mono text-text-secondary group-hover:text-finance-yellow">SET BUDGET</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggestions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Suggestions</h2>
              <span className="badge badge-green">{suggestions.length}</span>
            </div>
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.slice(0, 4).map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 border border-terminal-border flex items-center justify-center">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-text-muted text-xs font-mono">NO SUGGESTIONS</p>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Recent Transactions</h2>
              <Link
                to="/transactions"
                className="text-xs font-mono text-finance-green hover:text-finance-green-dim transition-colors"
              >
                VIEW ALL →
              </Link>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div
                    key={`${transaction.type}-${transaction.id}`}
                    className="flex items-center gap-3 p-3 bg-terminal-light border border-terminal-border hover:border-finance-green/50 transition-colors"
                  >
                    <div className={`p-2 border ${transaction.type === 'income' ? 'border-finance-green/30 text-finance-green' : 'border-finance-red/30 text-finance-red'}`}>
                      {transaction.type === 'income' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-text-primary truncate">
                        {transaction.description || transaction.category}
                      </p>
                      <p className="text-xs font-mono text-text-muted">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <span className={`money text-sm font-bold ${transaction.type === 'income' ? 'text-finance-green' : 'text-finance-red'}`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 border border-terminal-border flex items-center justify-center">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-text-muted text-xs font-mono mb-2">NO TRANSACTIONS</p>
                <Link to="/expense" className="text-xs font-mono text-finance-green hover:text-finance-green-dim">
                  ADD FIRST TRANSACTION →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
