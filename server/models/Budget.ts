import { exec, queryAll, queryOne, run } from './db.js';

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  amount: number;
  period: 'monthly';
  created_at: string;
}

export interface BudgetVsActual {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}

export const BudgetModel = {
  create: (userId: number, category: string, amount: number): Budget => {
    const result = run(
      `INSERT INTO budgets (user_id, category, amount, period) VALUES (?, ?, ?, 'monthly')`,
      [userId, category, amount]
    );
    return BudgetModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): Budget | undefined => {
    const row = queryOne<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!row) return undefined;
    return { ...row, period: 'monthly' as const };
  },

  findByUserId: (userId: number): Budget[] => {
    const rows = queryAll<any>('SELECT * FROM budgets WHERE user_id = ? ORDER BY category', [userId]);
    return rows.map(row => ({ ...row, period: 'monthly' as const }));
  },

  findByUserIdAndCategory: (userId: number, category: string): Budget | undefined => {
    const row = queryOne<any>('SELECT * FROM budgets WHERE user_id = ? AND category = ?', [userId, category]);
    if (!row) return undefined;
    return { ...row, period: 'monthly' as const };
  },

  update: (id: number, userId: number, amount: number): Budget | undefined => {
    run(`UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?`, [amount, id, userId]);
    return BudgetModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  },

  getBudgetVsActual: (userId: number, year: number, month: number): BudgetVsActual[] => {
    const budgets = BudgetModel.findByUserId(userId);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const spentRows = queryAll<{ category: string; spent: number }>(
      `SELECT category, COALESCE(SUM(amount), 0) as spent FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY category`,
      [userId, startDate, endDate]
    );
    const spentMap = new Map(spentRows.map(row => [row.category, row.spent]));

    return budgets.map(budget => {
      const spent = spentMap.get(budget.category) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      return { budget, spent, remaining, percentage };
    });
  }
};

export function initializeBudgetTable(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, category)
    )
  `);
}
