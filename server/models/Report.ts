import { getDb } from './User.js';

export interface MonthlyReport {
  user_id: number;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  income_by_category: { category: string; total: number }[];
  expense_by_category: { category: string; total: number }[];
  top_expenses: { category: string; total: number; percentage: number }[];
  daily_breakdown: { date: string; income: number; expense: number }[];
}

export interface YearlyReport {
  user_id: number;
  year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  monthly_summary: {
    month: number;
    income: number;
    expense: number;
    balance: number;
  }[];
  expense_by_category: { category: string; total: number }[];
}

export const ReportModel = {
  getMonthlyReport: (userId: number, year: number, month: number): MonthlyReport => {
    const database = getDb();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get totals
    const totalsStmt = database.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM (
        SELECT amount, 'income' as type FROM incomes WHERE user_id = ? AND date >= ? AND date <= ?
        UNION ALL
        SELECT amount, 'expense' as type FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
      )
    `);
    const totals = totalsStmt.get(userId, startDate, endDate, userId, startDate, endDate) as { total_income: number; total_expense: number };

    // Get income by category
    const incomeCatStmt = database.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM incomes
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `);
    const incomeByCategory = incomeCatStmt.all(userId, startDate, endDate) as { category: string; total: number }[];

    // Get expense by category
    const expenseCatStmt = database.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `);
    const expenseByCategory = expenseCatStmt.all(userId, startDate, endDate) as { category: string; total: number }[];

    // Get top expenses
    const topExpenses = expenseByCategory.slice(0, 5).map(item => ({
      category: item.category,
      total: item.total,
      percentage: totals.total_expense > 0 ? Math.round((item.total / totals.total_expense) * 100) : 0
    }));

    // Get daily breakdown
    const dailyStmt = database.prepare(`
      SELECT date, type, COALESCE(SUM(amount), 0) as total
      FROM (
        SELECT date, 'income' as type, amount FROM incomes WHERE user_id = ? AND date >= ? AND date <= ?
        UNION ALL
        SELECT date, 'expense' as type, amount FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
      )
      GROUP BY date, type
      ORDER BY date
    `);
    const dailyRows = dailyStmt.all(userId, startDate, endDate, userId, startDate, endDate) as { date: string; type: string; total: number }[];

    // Group by date
    const dailyMap = new Map<string, { income: number; expense: number }>();
    for (const row of dailyRows) {
      if (!dailyMap.has(row.date)) {
        dailyMap.set(row.date, { income: 0, expense: 0 });
      }
      const current = dailyMap.get(row.date)!;
      if (row.type === 'income') {
        current.income += row.total;
      } else {
        current.expense += row.total;
      }
    }
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, amounts]) => ({
      date,
      ...amounts
    }));

    return {
      user_id: userId,
      month,
      year,
      total_income: totals.total_income,
      total_expense: totals.total_expense,
      balance: totals.total_income - totals.total_expense,
      income_by_category: incomeByCategory,
      expense_by_category: expenseByCategory,
      top_expenses: topExpenses,
      daily_breakdown: dailyBreakdown
    };
  },

  getYearlyReport: (userId: number, year: number): YearlyReport => {
    const database = getDb();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get yearly totals
    const totalsStmt = database.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
      FROM (
        SELECT amount, 'income' as type FROM incomes WHERE user_id = ? AND date >= ? AND date <= ?
        UNION ALL
        SELECT amount, 'expense' as type FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
      )
    `);
    const totals = totalsStmt.get(userId, startDate, endDate, userId, startDate, endDate) as { total_income: number; total_expense: number };

    // Get monthly summary
    const monthlyStmt = database.prepare(`
      SELECT
        strftime('%m', date) as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM (
        SELECT date, amount, 'income' as type FROM incomes WHERE user_id = ? AND date >= ? AND date <= ?
        UNION ALL
        SELECT date, amount, 'expense' as type FROM expenses WHERE user_id = ? AND date >= ? AND date <= ?
      )
      GROUP BY strftime('%m', date)
      ORDER BY month
    `);
    const monthlyRows = monthlyStmt.all(userId, startDate, endDate, userId, startDate, endDate) as { month: string; income: number; expense: number }[];

    const monthlySummary = monthlyRows.map(row => ({
      month: parseInt(row.month),
      income: row.income,
      expense: row.expense,
      balance: row.income - row.expense
    }));

    // Get expense by category for the year
    const expenseCatStmt = database.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY category
      ORDER BY total DESC
    `);
    const expenseByCategory = expenseCatStmt.all(userId, startDate, endDate) as { category: string; total: number }[];

    return {
      user_id: userId,
      year,
      total_income: totals.total_income,
      total_expense: totals.total_expense,
      balance: totals.total_income - totals.total_expense,
      monthly_summary: monthlySummary,
      expense_by_category: expenseByCategory
    };
  }
};
