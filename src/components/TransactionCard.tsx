import { type FC } from 'react';
import { CategoryBadge } from './CategoryBadge';

export interface Transaction {
  id?: string;
  _id?: string;
  fund_id?: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  fundName?: string;
}

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const TransactionCard: FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  showActions = true,
  fundName,
}) => {
  const transactionId = transaction.id || transaction._id || '';
  const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(transaction.amount);

  const isIncome = transaction.type === 'income';

  return (
    <div className="card card-hover group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className={`money text-xl font-bold ${isIncome ? 'text-finance-green' : 'text-finance-red'}`}>
              {isIncome ? '+' : '-'}{formattedAmount}
            </span>
            <CategoryBadge category={transaction.category} type={transaction.type} />
          </div>
          <p className="text-text-primary font-mono truncate">{transaction.description}</p>
          <div className="flex items-center gap-2 mt-1 text-text-muted">
            <CalendarIcon />
            <span className="text-sm font-mono">{formattedDate}</span>
            {fundName && (
              <>
                <span>•</span>
                <span className="text-sm font-mono">{fundName}</span>
              </>
            )}
          </div>
          {transaction.notes && (
            <p className="text-sm text-text-muted mt-2 font-mono truncate">
              {transaction.notes}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="p-2 text-text-muted hover:text-finance-green hover:bg-finance-green/10 border border-transparent hover:border-finance-green/30 transition-all"
                title="Edit"
              >
                <EditIcon />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => transactionId && onDelete(transactionId)}
                className="p-2 text-text-muted hover:text-finance-red hover:bg-finance-red/10 border border-transparent hover:border-finance-red/30 transition-all"
                title="Delete"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
