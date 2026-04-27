import { type FC } from 'react';

interface BudgetVsActual {
  budget: {
    id: number;
    category: string;
    amount: number;
  };
  spent: number;
  remaining: number;
  percentage: number;
}

interface BudgetProgressProps {
  data: BudgetVsActual;
  onEdit?: (budget: BudgetVsActual['budget']) => void;
  onDelete?: (id: number) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const BudgetProgress: FC<BudgetProgressProps> = ({ data, onEdit, onDelete }) => {
  const { budget, spent, remaining, percentage } = data;

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-finance-red';
    if (pct >= 80) return 'bg-finance-yellow';
    return 'bg-finance-green';
  };

  const getProgressBgColor = (pct: number) => {
    if (pct >= 100) return 'bg-finance-red/10 border border-finance-red/30';
    if (pct >= 80) return 'bg-finance-yellow/10 border border-finance-yellow/30';
    return 'bg-finance-green/10 border border-finance-green/30';
  };

  const getTextColor = (pct: number) => {
    if (pct >= 100) return 'text-finance-red';
    if (pct >= 80) return 'text-finance-yellow';
    return 'text-finance-green';
  };

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-mono text-sm font-semibold text-text-primary">{budget.category}</h3>
          <p className="text-xs font-mono text-text-muted">
            BUDGET: {formatCurrency(budget.amount)}
          </p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
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
              onClick={() => onDelete(budget.id)}
              className="p-2 text-text-muted hover:text-finance-red hover:bg-finance-red/10 border border-transparent hover:border-finance-red/30 transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className={getTextColor(percentage)}>
            {formatCurrency(spent)} SPENT
          </span>
          <span className="text-text-muted">{percentage}%</span>
        </div>
        <div className={`h-3 ${getProgressBgColor(percentage)}`}>
          <div
            className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Remaining */}
      <div className="flex justify-between text-xs font-mono">
        <span className="text-text-muted">REMAINING</span>
        <span className={`font-semibold ${remaining >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
          {formatCurrency(remaining)}
        </span>
      </div>
    </div>
  );
};

export type { BudgetVsActual };