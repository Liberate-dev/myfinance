import { execNoSave, queryAll, queryOne, run, saveDb } from './db.js';

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
    const result = run(
      `INSERT INTO incomes (user_id, fund_id, amount, description, date, source) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, fundId, amount, description, date, source]
    );
    return IncomeModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): Income | undefined => {
    return queryOne<Income>('SELECT * FROM incomes WHERE id = ?', [id]);
  },

  findByUserId: (userId: number): Income[] => {
    return queryAll<Income>('SELECT * FROM incomes WHERE user_id = ? ORDER BY date DESC, created_at DESC', [userId]);
  },

  findByUserIdAndDateRange: (userId: number, startDate: string, endDate: string): Income[] => {
    return queryAll<Income>(
      `SELECT * FROM incomes WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date DESC, created_at DESC`,
      [userId, startDate, endDate]
    );
  },

  findByFundId: (fundId: number): Income[] => {
    return queryAll<Income>('SELECT * FROM incomes WHERE fund_id = ? ORDER BY date DESC', [fundId]);
  },

  update: (id: number, userId: number, fundId: number, amount: number, description: string, date: string, source: string): Income | undefined => {
    run(
      `UPDATE incomes SET fund_id = ?, amount = ?, description = ?, date = ?, source = ? WHERE id = ? AND user_id = ?`,
      [fundId, amount, description, date, source, id, userId]
    );
    return IncomeModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM incomes WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  }
};

export function initializeIncomeTable(): void {
  execNoSave(`
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
}
