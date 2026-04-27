import { exec, queryAll, queryOne, run } from './db.js';

export interface Expense {
  id: number;
  user_id: number;
  fund_id: number;
  amount: number;
  description: string;
  date: string;
  category: string;
  created_at: string;
}

export const ExpenseModel = {
  create: (userId: number, fundId: number, amount: number, description: string, date: string, category: string): Expense => {
    const result = run(
      `INSERT INTO expenses (user_id, fund_id, amount, description, date, category) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, fundId, amount, description, date, category]
    );
    return ExpenseModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): Expense | undefined => {
    return queryOne<Expense>('SELECT * FROM expenses WHERE id = ?', [id]);
  },

  findByUserId: (userId: number): Expense[] => {
    return queryAll<Expense>('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC', [userId]);
  },

  findByUserIdAndDateRange: (userId: number, startDate: string, endDate: string): Expense[] => {
    return queryAll<Expense>(
      `SELECT * FROM expenses WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC`,
      [userId, startDate, endDate]
    );
  },

  findByFundId: (fundId: number): Expense[] => {
    return queryAll<Expense>('SELECT * FROM expenses WHERE fund_id = ? ORDER BY date DESC', [fundId]);
  },

  update: (id: number, userId: number, fundId: number, amount: number, description: string, date: string, category: string): Expense | undefined => {
    run(
      `UPDATE expenses SET fund_id = ?, amount = ?, description = ?, date = ?, category = ? WHERE id = ? AND user_id = ?`,
      [fundId, amount, description, date, category, id, userId]
    );
    return ExpenseModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  }
};

export function initializeExpenseTable(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fund_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
    )
  `);
}
