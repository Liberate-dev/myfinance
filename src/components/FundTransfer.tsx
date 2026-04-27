import { type FC, useState } from 'react';
import { post } from '../lib/api';
import { CurrencyInput } from './CurrencyInput';

interface Fund {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
}

interface FundTransferProps {
  funds: Fund[];
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const FundTransfer: FC<FundTransferProps> = ({
  funds,
  onSuccess,
  onCancel,
  isLoading = false,
}) => {
  const [fromFund, setFromFund] = useState<number>(funds[0]?.id || 0);
  const [toFund, setToFund] = useState<number>(funds.find(f => f.id !== fromFund)?.id || 0);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const currentFromFund = funds.find(f => f.id === fromFund);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fromFund === toFund) {
      setError('Cannot transfer to the same fund');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter valid amount');
      return;
    }

    if (currentFromFund && parsedAmount > currentFromFund.balance) {
      setError('Insufficient balance in source fund');
      return;
    }

    try {
      await post('/transfers', {
        from_fund_id: fromFund,
        to_fund_id: toFund,
        amount: parsedAmount,
        note: note.trim() || undefined
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    }
  };

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

      {/* From Fund */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">From Fund</label>
        <div className="grid grid-cols-2 gap-2">
          {funds.map((fund) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => {
                setFromFund(fund.id);
                if (toFund === fund.id) {
                  setToFund(funds.find(f => f.id !== fund.id)?.id || 0);
                }
              }}
              className={`p-3 border text-left transition-all ${
                fromFund === fund.id
                  ? 'border-finance-red bg-finance-red/10'
                  : 'border-terminal-border bg-terminal-light hover:border-finance-red/50'
              }`}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{fund.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{fund.name}</p>
                  <p className={`text-xs font-bold ${fund.balance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                    Rp {fund.balance.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="p-2 bg-terminal-light border border-terminal-border">
          <ArrowRightIcon />
        </div>
      </div>

      {/* To Fund */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">To Fund</label>
        <div className="grid grid-cols-2 gap-2">
          {funds.filter(f => f.id !== fromFund).map((fund) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => setToFund(fund.id)}
              className={`p-3 border text-left transition-all ${
                toFund === fund.id
                  ? 'border-finance-green bg-finance-green/10'
                  : 'border-terminal-border bg-terminal-light hover:border-finance-green/50'
              }`}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{fund.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{fund.name}</p>
                  <p className={`text-xs font-bold ${fund.balance >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
                    Rp {fund.balance.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted font-mono font-semibold">
            Rp
          </div>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            placeholder="0"
            className="input pl-12"
            disabled={isLoading}
          />
        </div>
        {currentFromFund && (
          <p className="text-xs text-text-muted mt-1 font-mono">
            Available: Rp {currentFromFund.balance.toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          placeholder="Transfer reason..."
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || funds.length < 2}
          className="btn-primary flex-1"
        >
          {isLoading ? 'TRANSFERRING...' : 'TRANSFER →'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn-secondary"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
};

export default FundTransfer;
