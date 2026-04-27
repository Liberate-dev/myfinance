import { getDb } from './User.js';

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
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO budgets (user_id, category, amount, period) VALUES (?, ?, ?, 'monthly')
    `);
    const result = stmt.run(userId, category, amount);
    return BudgetModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Budget | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM budgets WHERE id = ?');
    const row = stmt.get(id) as { id: number; user_id: number; category: string; amount: number; period: string; created_at: string } | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      user_id: row.user_id,
      category: row.category,
      amount: row.amount,
      period: 'monthly',
      created_at: row.created_at
    };
  },

  findByUserId: (userId: number): Budget[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM budgets WHERE user_id = ? ORDER BY category');
    const rows = stmt.all(userId) as { id: number; user_id: number; category: string; amount: number; period: string; created_at: string }[];
    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      category: row.category,
      amount: row.amount,
      period: 'monthly',
      created_at: row.created_at
    }));
  },

  findByUserIdAndCategory: (userId: number, category: string): Budget | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM budgets WHERE user_id = ? AND category = ?');
    const row = stmt.get(userId, category) as { id: number; user_id: number; category: string; amount: number; period: string; created_at: string } | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      user_id: row.user_id,
      category: row.category,
      amount: row.amount,
      period: 'monthly',
      created_at: row.created_at
    };
  },

  update: (id: number, userId: number, amount: number): Budget | undefined => {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE budgets SET amount = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(amount, id, userId);
    return BudgetModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },

  getBudgetVsActual: (userId: number, year: number, month: number): BudgetVsActual[] => {
    const budgets = BudgetModel.findByUserId(userId);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const database = getDb();
    const stmt = database.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as spent
      FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
      GROUP BY category
    `);
    const spentRows = stmt.all(userId, startDate, endDate) as { category: string; spent: number }[];
    const spentMap = new Map(spentRows.map(row => [row.category, row.spent]));

    return budgets.map(budget => {
      const spent = spentMap.get(budget.category) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      return {
        budget,
        spent,
        remaining,
        percentage
      };
    });
  }
};

export function initializeBudgetTable(): void {
  const database = getDb();
  database.exec(`
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
