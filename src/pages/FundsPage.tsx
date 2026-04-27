import { type FC, useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../lib/api';
import { FundCard, type Fund } from '../components/FundCard';
import { CurrencyInput } from '../components/CurrencyInput';
import { FundTransfer } from '../components/FundTransfer';
import { BalanceHistory } from '../components/BalanceHistory';

interface FundFormData {
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: string;
  color: string;
  icon: string;
}

const initialFormData: FundFormData = {
  name: '',
  type: 'bank',
  balance: '0',
  color: '#3B82F6',
  icon: '💰'
};

const colorOptions = [
  '#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

const iconOptions = ['💰', '🏦', '💳', '📱', '🪙', '🏧', '💵', '🧾', '🎁', '⭐'];

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SwapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const FundForm: FC<{
  fund?: Fund;
  onSubmit: (data: FundFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ fund, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<FundFormData>(
    fund
      ? { name: fund.name, type: fund.type, balance: fund.balance.toString(), color: fund.color, icon: fund.icon }
      : initialFormData
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input"
          placeholder="e.g., Main Bank Account"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'cash' | 'bank' | 'e-wallet' })}
          className="input"
        >
          <option value="cash">Cash</option>
          <option value="bank">Bank Account</option>
          <option value="e-wallet">E-Wallet</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Initial Balance</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted font-mono font-semibold">
            Rp
          </div>
          <CurrencyInput
            value={formData.balance}
            onChange={(val) => setFormData({ ...formData, balance: val })}
            placeholder="0"
            className="input pl-12"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 border-2 transition-all ${formData.color === color ? 'border-finance-green scale-110' : 'border-transparent hover:border-terminal-border'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Icon</label>
        <div className="grid grid-cols-10 gap-2">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData({ ...formData, icon })}
              className={`w-10 h-10 border flex items-center justify-center text-xl transition-all ${
                formData.icon === icon
                  ? 'border-finance-green bg-finance-green/10'
                  : 'border-terminal-border bg-terminal-light hover:border-finance-green/50'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'SAVING...' : fund ? 'UPDATE →' : 'CREATE →'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
};

const FundsPage: FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Fund | null>(null);

  const fetchFunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await get<{ funds: Fund[]; totalBalance: number }>('/funds');
      setFunds(data.funds);
      setTotalBalance(data.totalBalance);
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleSubmit = async (formData: FundFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        color: formData.color,
        icon: formData.icon
      };

      if (editingFund) {
        await put(`/funds/${editingFund.id}`, payload);
      } else {
        await post('/funds', payload);
      }
      setShowForm(false);
      setEditingFund(undefined);
      await fetchFunds();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (fund: Fund) => {
    setEditingFund(fund);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this fund?')) return;
    try {
      await del(`/funds/${id}`);
      await fetchFunds();
    } catch (error) {
      console.error('Failed to delete fund:', error);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">FUNDS</h1>
          <p className="text-text-muted font-mono text-sm mt-1">Manage fund sources</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="btn-secondary"
            disabled={funds.length < 2}
            title="Transfer between funds"
          >
            <SwapIcon />
            TRANSFER
          </button>
          <button
            onClick={() => { setEditingFund(undefined); setShowForm(true); }}
            className="btn-primary"
          >
            <PlusIcon />
            ADD FUND
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="card border-finance-blue/30">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-finance-blue/10 border border-finance-blue/30">
            <WalletIcon />
          </div>
          <div>
            <p className="section-header">Total Balance</p>
            <p className="money text-3xl font-bold text-finance-green">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card w-full max-w-md animate-scale-in">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              {editingFund ? 'EDIT FUND' : 'ADD NEW FUND'}
            </h2>
            <FundForm
              fund={editingFund}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingFund(undefined); }}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card w-full max-w-md animate-scale-in">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              TRANSFER BETWEEN FUNDS
            </h2>
            <FundTransfer
              funds={funds}
              onSuccess={() => { setShowTransfer(false); fetchFunds(); }}
              onCancel={() => setShowTransfer(false)}
            />
          </div>
        </div>
      )}

      {/* Balance History Modal */}
      {viewingHistory && (
        <BalanceHistory
          fund={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {/* Funds Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12" />
                <div className="flex-1">
                  <div className="h-5 w-24 mb-2" />
                  <div className="h-4 w-16" />
                </div>
              </div>
              <div className="h-8 w-32" />
            </div>
          ))}
        </div>
      ) : funds.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 border border-terminal-border flex items-center justify-center">
            <WalletIcon />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-text-primary mb-2 font-display">NO FUNDS YET</h3>
          <p className="text-text-muted font-mono text-sm mb-6 max-w-sm mx-auto">
            Add bank accounts, cash, e-wallets to start tracking
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <PlusIcon />
            ADD FIRST FUND
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funds.map((fund) => (
            <FundCard
              key={fund.id}
              fund={fund}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewHistory={setViewingHistory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FundsPage;