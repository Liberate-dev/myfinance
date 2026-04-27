import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { apiClient } from '../lib/api';

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { success, error: showError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });

      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/export/all', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = `finance_data_${Date.now()}.csv`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = match[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      success('Data exported successfully');
    } catch {
      showError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    try {
      await apiClient.delete('/auth/clear-data');

      success('All data cleared successfully');
      setShowClearConfirm(false);
    } catch {
      showError('Failed to clear data');
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">SETTINGS</h1>
        <p className="text-text-muted font-mono text-sm mt-1">Manage account and preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-finance-blue/10 border border-finance-blue/30">
              <UserIcon />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-terminal-border">
              <span className="text-text-muted font-mono text-sm">Name</span>
              <span className="font-mono text-text-primary">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-mono text-sm">Email</span>
              <span className="font-mono text-text-primary">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-terminal-light border border-terminal-border">
              <LockIcon />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="btn-primary w-full"
            >
              {isChangingPassword ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  PROCESSING...
                </>
              ) : (
                'CHANGE PASSWORD →'
              )}
            </button>
          </form>
        </div>

        {/* Data Management Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-terminal-light border border-terminal-border">
              <DownloadIcon />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-terminal-light border border-terminal-border">
              <div>
                <h3 className="font-mono text-sm text-text-primary">Export All Data</h3>
                <p className="text-xs font-mono text-text-muted mt-1">Download all financial data as CSV</p>
              </div>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className="btn-secondary"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    EXPORTING...
                  </>
                ) : (
                  <>
                    <DownloadIcon />
                    EXPORT
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-finance-red/5 border border-finance-red/30">
              <div>
                <h3 className="font-mono text-sm text-finance-red">Clear All Data</h3>
                <p className="text-xs font-mono text-text-muted mt-1">Permanently delete all data</p>
              </div>
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearData}
                    className="btn-danger text-sm"
                  >
                    CONFIRM
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="btn-secondary text-sm"
                  >
                    CANCEL
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 border border-finance-red/50 text-finance-red font-mono text-sm hover:bg-finance-red/10 transition-colors"
                >
                  CLEAR DATA
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-finance-red/10 border border-finance-red/30">
              <LogoutIcon />
            </div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-muted">Account</h2>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn-danger w-full"
          >
            {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;