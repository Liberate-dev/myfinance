import { type FC, useState, useEffect, useCallback } from 'react';
import { get } from '../lib/api';
import type { Fund } from './FundCard';

interface BalanceHistoryEntry {
  id: number;
  fund_id: number;
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'initial' | 'adjustment';
  amount: number;
  description: string;
  reference_id: number | null;
  reference_type: string | null;
  balance_after: number;
  created_at: string;
}

interface BalanceHistoryProps {
  fund: Fund;
  onClose: () => void;
}

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

const SwapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AdjustIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const typeConfig = {
  income: { icon: ArrowUpIcon, color: 'text-finance-green', bg: 'bg-finance-green/10', border: 'border-finance-green/30', label: 'INCOME' },
  expense: { icon: ArrowDownIcon, color: 'text-finance-red', bg: 'bg-finance-red/10', border: 'border-finance-red/30', label: 'EXPENSE' },
  transfer_in: { icon: SwapIcon, color: 'text-finance-blue', bg: 'bg-finance-blue/10', border: 'border-finance-blue/30', label: 'TRANSFER IN' },
  transfer_out: { icon: SwapIcon, color: 'text-finance-blue', bg: 'bg-finance-blue/10', border: 'border-finance-blue/30', label: 'TRANSFER OUT' },
  initial: { icon: WalletIcon, color: 'text-finance-yellow', bg: 'bg-finance-yellow/10', border: 'border-finance-yellow/30', label: 'INITIAL' },
  adjustment: { icon: AdjustIcon, color: 'text-finance-yellow', bg: 'bg-finance-yellow/10', border: 'border-finance-yellow/30', label: 'ADJUSTMENT' }
};

export const BalanceHistory: FC<BalanceHistoryProps> = ({ fund, onClose }) => {
  const [history, setHistory] = useState<BalanceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await get<{ history: BalanceHistoryEntry[] }>(`/balance-history/${fund.id}`);
      setHistory(response.history);
    } catch (error) {
      console.error('Failed to fetch balance history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fund.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wider text-text-muted">
              BALANCE HISTORY
            </h3>
            <p className="text-lg font-bold">{fund.icon} {fund.name}</p>
          </div>
          <button onClick={onClose} className="btn-secondary">
            CLOSE
          </button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-terminal-light rounded" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted font-mono text-sm">No history yet</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {history.map(entry => {
              const config = typeConfig[entry.type];
              const Icon = config.icon;
              const isPositive = entry.type === 'income' || entry.type === 'transfer_in' || entry.type === 'initial' || entry.type === 'adjustment';

              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 bg-terminal-light border border-terminal-border"
                >
                  <div className={`p-2 ${config.bg} border ${config.border}`}>
                    <Icon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-bold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-text-secondary truncate">
                      {entry.description || '-'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-bold ${isPositive ? 'text-finance-green' : 'text-finance-red'}`}>
                      {isPositive ? '+' : '-'}{formatCurrency(entry.amount)}
                    </p>
                    <p className="text-xs text-text-muted">
                      = {formatCurrency(entry.balance_after)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceHistory;
