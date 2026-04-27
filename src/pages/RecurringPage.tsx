import { type FC } from 'react';
import { RecurringTransactions } from '../components/RecurringTransaction';

const RecurringPage: FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">RECURRING</h1>
        <p className="text-text-muted font-mono text-sm mt-1">Manage recurring income and expenses</p>
      </div>
      <RecurringTransactions />
    </div>
  );
};

export default RecurringPage;