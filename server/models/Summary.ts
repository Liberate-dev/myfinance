import { queryAll, queryOne } from './db.js';

export interface MonthlySummary {
  user_id: number;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

export const SummaryModel = {
  getMonthlySummary: (userId: number, month: number, year: number): MonthlySummary | null => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const incomeResult = queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = ? AND date >= ? AND date <= ?`,
      [userId, startDate, endDate]
    );

    const expenseResult = queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?`,
      [userId, startDate, endDate]
    );

    const totalIncome = incomeResult?.total || 0;
    const totalExpense = expenseResult?.total || 0;

    return { user_id: userId, month, year, total_income: totalIncome, total_expense: totalExpense, balance: totalIncome - totalExpense };
  },

  getTopCategories: (userId: number, month: number, year: number, limit: number = 5): CategoryBreakdown[] => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const totalResult = queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?`,
      [userId, startDate, endDate]
    );
    const totalExpense = totalResult?.total || 0;
    if (totalExpense === 0) return [];

    const results = queryAll<{ category: string; total: number }>(
      `SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category ORDER BY total DESC LIMIT ?`,
      [userId, startDate, endDate, limit]
    );

    return results.map(row => ({
      category: row.category,
      total: row.total,
      percentage: Math.round((row.total / totalExpense) * 100 * 100) / 100
    }));
  },

  getRecentTransactions: (userId: number, limit: number = 5) => {
    const incomes = queryAll<{ id: number; amount: number; description: string; date: string; source: string; category: string; type: 'income' }>(
      `SELECT id, amount, description, date, source, source as category, 'income' as type FROM incomes WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
      [userId, limit]
    );

    const expenses = queryAll<{ id: number; amount: number; description: string; date: string; category: string; type: 'expense' }>(
      `SELECT id, amount, description, date, category, 'expense' as type FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?`,
      [userId, limit]
    );

    const allTransactions = [...incomes, ...expenses].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id - a.id;
    });

    return allTransactions.slice(0, limit);
  }
};
