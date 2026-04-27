import { getDb } from './User.js';

export interface Income {
  id: number;
  user_id: number;
  fund_id: number;
  amount: number;
  description: string;
  date: string;
  source: string;
  created_at: string;
}

export const IncomeModel = {
  create: (userId: number, fundId: number, amount: number, description: string, date: string, source: string): Income => {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO incomes (user_id, fund_id, amount, description, date, source) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, fundId, amount, description, date, source);
    return IncomeModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Income | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM incomes WHERE id = ?');
    return stmt.get(id) as Income | undefined;
  },

  findByUserId: (userId: number): Income[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM incomes WHERE user_id = ? ORDER BY date DESC, created_at DESC');
    return stmt.all(userId) as Income[];
  },

  findByUserIdAndDateRange: (userId: number, startDate: string, endDate: string): Income[] => {
    const database = getDb();
    const stmt = database.prepare(`
      SELECT * FROM incomes
      WHERE user_id = ? AND date >= ? AND date <= ?
      ORDER BY date DESC, created_at DESC
    `);
    return stmt.all(userId, startDate, endDate) as Income[];
  },

  findByFundId: (fundId: number): Income[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM incomes WHERE fund_id = ? ORDER BY date DESC');
    return stmt.all(fundId) as Income[];
  },

  update: (id: number, userId: number, fundId: number, amount: number, description: string, date: string, source: string): Income | undefined => {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE incomes SET fund_id = ?, amount = ?, description = ?, date = ?, source = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(fundId, amount, description, date, source, id, userId);
    return IncomeModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM incomes WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export function initializeIncomeTable(): void {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fund_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
    )
  `);

  // Migration: Add fund_id to existing tables
  try {
    const columns = database.prepare("PRAGMA table_info(incomes)").all() as { name: string }[];
    const hasFundId = columns.some(col => col.name === 'fund_id');
    if (!hasFundId) {
      database.exec('ALTER TABLE incomes ADD COLUMN fund_id INTEGER NOT NULL DEFAULT 1');
      database.exec('ALTER TABLE incomes ADD FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE');
      console.log('[DB] Migration: Added fund_id column to incomes table');
    }
  } catch (err) {
    console.log('[DB] Note: fund_id column check skipped for incomes');
  }
}