import { execNoSave, queryAll, queryOne, run } from './db.js';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  fund_id: number;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  last_run: string | null;
  next_run: string;
  is_active: boolean;
  created_at: string;
}

export const RecurringTransactionModel = {
  calculateNextRun: (fromDate: string, frequency: RecurringFrequency): string => {
    const date = new Date(fromDate);
    switch (frequency) {
      case 'daily': date.setDate(date.getDate() + 1); break;
      case 'weekly': date.setDate(date.getDate() + 7); break;
      case 'monthly': date.setMonth(date.getMonth() + 1); break;
    }
    return date.toISOString().split('T')[0];
  },

  create: (
    userId: number,
    type: 'income' | 'expense',
    amount: number,
    description: string,
    category: string,
    fundId: number,
    frequency: RecurringFrequency,
    startDate: string,
    endDate?: string | null
  ): RecurringTransaction => {
    const nextRun = RecurringTransactionModel.calculateNextRun(startDate, frequency);
    const result = run(
      `INSERT INTO recurring_transactions (user_id, type, amount, description, category, fund_id, frequency, start_date, end_date, next_run, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [userId, type, amount, description, category, fundId, frequency, startDate, endDate || null, nextRun]
    );
    return RecurringTransactionModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): RecurringTransaction | undefined => {
    const row = queryOne<any>('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    if (!row) return undefined;
    return {
      ...row,
      type: row.type as 'income' | 'expense',
      frequency: row.frequency as RecurringFrequency,
      is_active: row.is_active === 1
    };
  },

  findByUserId: (userId: number): RecurringTransaction[] => {
    const rows = queryAll<any>('SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY next_run ASC', [userId]);
    return rows.map(row => ({
      ...row,
      type: row.type as 'income' | 'expense',
      frequency: row.frequency as RecurringFrequency,
      is_active: row.is_active === 1
    }));
  },

  findDue: (): RecurringTransaction[] => {
    const today = new Date().toISOString().split('T')[0];
    return queryAll<any>(
      `SELECT * FROM recurring_transactions WHERE is_active = 1 AND next_run <= ? AND (end_date IS NULL OR end_date >= ?)`,
      [today, today]
    ).map(row => ({ ...row, is_active: true }));
  },

  updateLastRun: (id: number, nextRun: string): void => {
    const today = new Date().toISOString().split('T')[0];
    run(`UPDATE recurring_transactions SET last_run = ?, next_run = ? WHERE id = ?`, [today, nextRun, id]);
  },

  toggleActive: (id: number, userId: number, isActive: boolean): boolean => {
    const result = run('UPDATE recurring_transactions SET is_active = ? WHERE id = ? AND user_id = ?', [isActive ? 1 : 0, id, userId]);
    return result.changes > 0;
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  }
};

export function initializeRecurringTransactionTable(): void {
  execNoSave(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      fund_id INTEGER NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      start_date TEXT NOT NULL,
      end_date TEXT,
      last_run TEXT,
      next_run TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
    )
  `);
}
