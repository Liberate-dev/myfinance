import { type FC, useState } from 'react';
import { apiClient } from '../lib/api';

interface ExportButtonProps {
  type?: 'income' | 'expense' | 'all';
  month?: string;
  label?: string;
  className?: string;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export const ExportButton: FC<ExportButtonProps> = ({
  type = 'all',
  month,
  label = 'Export CSV',
  className = '',
  onSuccess,
  onError
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ type });
      if (month) {
        params.append('month', month);
      }

      const response = await apiClient.get(`/export/csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const contentDisposition = response.headers['content-disposition'];
      let filename = `export_${type}_${Date.now()}.csv`;

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

      onSuccess?.(filename);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      onError?.(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center gap-2 px-3 py-2 border border-terminal-border bg-terminal-light text-text-muted font-mono text-xs uppercase tracking-wider hover:border-finance-green hover:text-finance-green transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isExporting ? (
        <>
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.279 5.814 3.351 7.618l2.649-1.327z"></path>
          </svg>
          EXPORTING...
        </>
      ) : (
        <>
          <DownloadIcon />
          {label}
        </>
      )}
    </button>
  );
};

export default ExportButton;