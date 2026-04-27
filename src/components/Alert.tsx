import { type FC, useState, useEffect, useCallback } from 'react';
import { get, post, del } from '../lib/api';

interface Alert {
  id: number;
  fund_id: number | null;
  fund_name?: string;
  type: 'low_balance' | 'budget_exceeded';
  threshold: number;
  is_active: boolean;
  created_at: string;
}

interface Fund {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
}

const BellIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const AlertForm: FC<{
  funds: Fund[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ funds, onSubmit, onCancel, isLoading }) => {
  const [alertType, setAlertType] = useState<'low_balance' | 'budget_exceeded'>('low_balance');
  const [fundId, setFundId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedThreshold = parseFloat(threshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError('Enter valid threshold amount');
      return;
    }

    try {
      await onSubmit({
        type: alertType,
        fund_id: fundId,
        threshold: parsedThreshold
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-finance-red/10 border border-finance-red/30 text-finance-red font-mono text-sm">
          {error}
        </div>
      )}

      {/* Alert Type */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Alert Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAlertType('low_balance')}
            className={`p-3 border ${alertType === 'low_balance' ? 'border-finance-yellow bg-finance-yellow/10' : 'border-terminal-border bg-terminal-light'}`}
            disabled={isLoading}
          >
            <span className="font-mono text-sm">LOW BALANCE</span>
          </button>
          <button
            type="button"
            onClick={() => setAlertType('budget_exceeded')}
            className={`p-3 border ${alertType === 'budget_exceeded' ? 'border-finance-red bg-finance-red/10' : 'border-terminal-border bg-terminal-light'}`}
            disabled={isLoading}
          >
            <span className="font-mono text-sm">BUDGET EXCEEDED</span>
          </button>
        </div>
      </div>

      {/* Fund */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Fund (optional)</label>
        <select
          value={fundId ?? ''}
          onChange={(e) => setFundId(e.target.value ? parseInt(e.target.value) : null)}
          className="input"
          disabled={isLoading}
        >
          <option value="">All Funds</option>
          {funds.map(fund => (
            <option key={fund.id} value={fund.id}>{fund.icon} {fund.name}</option>
          ))}
        </select>
      </div>

      {/* Threshold */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
          {alertType === 'low_balance' ? 'Minimum Balance' : 'Budget Limit'}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted font-mono font-semibold">Rp</div>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="input pl-12"
            placeholder="0"
            min="0"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? 'CREATING...' : 'CREATE →'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          CANCEL
        </button>
      </div>
    </form>
  );
};

export const Alerts: FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alertsRes, fundsRes] = await Promise.all([
        get<{ alerts: Alert[] }>('/alerts'),
        get<{ funds: Fund[] }>('/funds')
      ]);
      setAlerts(alertsRes.alerts);
      setFunds(fundsRes.funds);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await post('/alerts', data);
      setShowForm(false);
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this alert?')) return;
    try {
      await del(`/alerts/${id}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <div className="card animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display">Alerts</h3>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <PlusIcon />
          ADD
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-terminal-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md">
            <h3 className="text-sm font-mono uppercase tracking-wider text-text-muted mb-4">
              NEW ALERT
            </h3>
            <AlertForm
              funds={funds}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* List */}
      {alerts.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-muted font-mono text-sm">No alerts configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`card flex items-center gap-4 ${!alert.is_active ? 'opacity-50' : ''}`}
            >
              <div className={`p-2 ${alert.type === 'low_balance' ? 'bg-finance-yellow/10 border border-finance-yellow/30' : 'bg-finance-red/10 border border-finance-red/30'}`}>
                <BellIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${alert.type === 'low_balance' ? 'text-finance-yellow' : 'text-finance-red'}`}>
                    {alert.type === 'low_balance' ? 'LOW BALANCE' : 'BUDGET EXCEEDED'}
                  </span>
                  <span className="badge badge-yellow">
                    Rp {alert.threshold.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-sm font-mono truncate">
                  {alert.fund_name ? `Fund: ${alert.fund_name}` : 'All Funds'}
                </p>
                <p className="text-xs text-text-muted">
                  Created: {formatDate(alert.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 border font-mono text-xs ${alert.is_active ? 'border-finance-green text-finance-green' : 'border-terminal-border text-text-muted'}`}>
                  {alert.is_active ? 'ACTIVE' : 'OFF'}
                </span>
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="px-3 py-1 border border-finance-red/30 text-finance-red font-mono text-xs hover:bg-finance-red/10"
                >
                  DEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
