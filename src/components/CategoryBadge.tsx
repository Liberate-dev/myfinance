import { type FC } from 'react';

interface CategoryBadgeProps {
  category: string;
  type: 'income' | 'expense';
  size?: 'sm' | 'md' | 'lg';
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  // Income
  salary: { bg: 'bg-finance-green/10', text: 'text-finance-green', border: 'border-finance-green/30' },
  freelance: { bg: 'bg-finance-blue/10', text: 'text-finance-blue', border: 'border-finance-blue/30' },
  investment: { bg: 'bg-finance-yellow/10', text: 'text-finance-yellow', border: 'border-finance-yellow/30' },
  bonus: { bg: 'bg-finance-green/10', text: 'text-finance-green', border: 'border-finance-green/30' },
  gift: { bg: 'bg-finance-blue/10', text: 'text-finance-blue', border: 'border-finance-blue/30' },
  // Expense
  food: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  transport: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  housing: { bg: 'bg-finance-yellow/10', text: 'text-finance-yellow', border: 'border-finance-yellow/30' },
  utilities: { bg: 'bg-finance-yellow/10', text: 'text-finance-yellow', border: 'border-finance-yellow/30' },
  entertainment: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  shopping: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  healthcare: { bg: 'bg-finance-red/10', text: 'text-finance-red', border: 'border-finance-red/30' },
  health: { bg: 'bg-finance-red/10', text: 'text-finance-red', border: 'border-finance-red/30' },
  education: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  bills: { bg: 'bg-finance-blue/10', text: 'text-finance-blue', border: 'border-finance-blue/30' },
  other: { bg: 'bg-text-muted/10', text: 'text-text-muted', border: 'border-text-muted/30' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const CategoryBadge: FC<CategoryBadgeProps> = ({
  category,
  size = 'md',
}) => {
  const styles = categoryColors[category.toLowerCase()] || categoryColors.other;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-mono ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]}`}
    >
      <span className="uppercase">{category}</span>
    </span>
  );
};

export default CategoryBadge;
