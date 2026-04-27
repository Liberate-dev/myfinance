import { type FC } from 'react';

interface Fund {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
}

interface FundCardProps {
  fund: Fund;
  onEdit?: (fund: Fund) => void;
  onDelete?: (id: number) => void;
  onViewHistory?: (fund: Fund) => void;
}

const typeLabels: Record<string, string> = {
  cash: 'CASH',
  bank: 'BANK ACCOUNT',
  'e-wallet': 'E-WALLET'
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const FundCard: FC<FundCardProps> = ({ fund, onEdit, onDelete, onViewHistory }) => {
  return (
    <div className="card group hover:border-finance-green/50 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-3 border"
            style={{ backgroundColor: fund.color + '15', borderColor: fund.color + '40' }}
          >
            <span className="text-2xl">{fund.icon}</span>
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-text-primary">{fund.name}</h3>
            <p className="text-xs font-mono text-text-muted">{typeLabels[fund.type]}</p>
          </div>
        </div>
        {(onEdit || onDelete || onViewHistory) && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onViewHistory && (
              <button
                onClick={() => onViewHistory(fund)}
                className="p-2 text-text-muted hover:text-finance-yellow hover:bg-finance-yellow/10 border border-transparent hover:border-finance-yellow/30 transition-colors"
                title="View History"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(fund)}
                className="p-2 text-text-muted hover:text-finance-blue hover:bg-finance-blue/10 border border-transparent hover:border-finance-blue/30 transition-colors"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(fund.id)}
                className="p-2 text-text-muted hover:text-finance-red hover:bg-finance-red/10 border border-transparent hover:border-finance-red/30 transition-colors"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-terminal-border">
        <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Balance</p>
        <p
          className="money text-xl font-bold"
          style={{ color: fund.color }}
        >
          {formatCurrency(fund.balance)}
        </p>
      </div>
    </div>
  );
};

export type { Fund };