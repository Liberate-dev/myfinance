import { getDb } from './User.js';

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
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO expenses (user_id, fund_id, amount, description, date, category) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, fundId, amount, description, date, category);
    return ExpenseModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Expense | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM expenses WHERE id = ?');
    return stmt.get(id) as Expense | undefined;
  },

  findByUserId: (userId: number): Expense[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC');
    return stmt.all(userId) as Expense[];
  },

  findByUserIdAndDateRange: (userId: number, startDate: string, endDate: string): Expense[] => {
    const database = getDb();
    const stmt = database.prepare(`
      SELECT * FROM expenses
      WHERE user_id = ? AND date >= ? AND date <= ?
      ORDER BY date DESC, created_at DESC
    `);
    return stmt.all(userId, startDate, endDate) as Expense[];
  },

  findByFundId: (fundId: number): Expense[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM expenses WHERE fund_id = ? ORDER BY date DESC');
    return stmt.all(fundId) as Expense[];
  },

  update: (id: number, userId: number, fundId: number, amount: number, description: string, date: string, category: string): Expense | undefined => {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE expenses SET fund_id = ?, amount = ?, description = ?, date = ?, category = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(fundId, amount, description, date, category, id, userId);
    return ExpenseModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export function initializeExpenseTable(): void {
  const database = getDb();
  database.exec(`
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

  // Migration: Add fund_id to existing tables
  try {
    const columns = database.prepare("PRAGMA table_info(expenses)").all() as { name: string }[];
    const hasFundId = columns.some(col => col.name === 'fund_id');
    if (!hasFundId) {
      database.exec('ALTER TABLE expenses ADD COLUMN fund_id INTEGER NOT NULL DEFAULT 1');
      database.exec('ALTER TABLE expenses ADD FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE');
      console.log('[DB] Migration: Added fund_id column to expenses table');
    }
  } catch (err) {
    console.log('[DB] Note: fund_id column check skipped for expenses');
  }
}