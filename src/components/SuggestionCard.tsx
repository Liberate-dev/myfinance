interface Suggestion {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  priority: number;
  action?: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export const SuggestionCard = ({ suggestion }: SuggestionCardProps) => {
  const getStyles = () => {
    switch (suggestion.type) {
      case 'warning':
        return {
          bg: 'bg-finance-yellow/10',
          border: 'border-finance-yellow/30',
          icon: 'text-finance-yellow',
          text: 'text-text-primary',
          badge: 'badge-yellow',
        };
      case 'info':
        return {
          bg: 'bg-finance-blue/10',
          border: 'border-finance-blue/30',
          icon: 'text-finance-blue',
          text: 'text-text-primary',
          badge: 'badge-blue',
        };
      case 'success':
        return {
          bg: 'bg-finance-green/10',
          border: 'border-finance-green/30',
          icon: 'text-finance-green',
          text: 'text-text-primary',
          badge: 'badge-green',
        };
    }
  };

  const styles = getStyles();

  const getIcon = () => {
    switch (suggestion.type) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`${styles.bg} border ${styles.border} p-4 transition-all hover:border-finance-green/50`}>
      <div className="flex items-start gap-3">
        <div className={`${styles.icon} p-2 border border-current/30 flex-shrink-0`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${styles.badge} uppercase`}>
              {suggestion.type}
            </span>
          </div>
          <p className={`${styles.text} text-sm font-mono`}>
            {suggestion.message}
          </p>
          {suggestion.action && (
            <button className="mt-2 text-xs font-mono text-finance-green hover:text-finance-green-dim transition-colors">
              {suggestion.action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;
