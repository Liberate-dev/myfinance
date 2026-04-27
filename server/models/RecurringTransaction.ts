import { getDb } from './User.js';

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
    const database = getDb();
    const nextRun = RecurringTransactionModel.calculateNextRun(startDate, frequency);

    const stmt = database.prepare(`
      INSERT INTO recurring_transactions
      (user_id, type, amount, description, category, fund_id, frequency, start_date, end_date, next_run, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(userId, type, amount, description, category, fundId, frequency, startDate, endDate || null, nextRun);
    return RecurringTransactionModel.findById(Number(result.lastInsertRowid))!;
  },

  calculateNextRun: (fromDate: string, frequency: RecurringFrequency): string => {
    const date = new Date(fromDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  },

  findById: (id: number): RecurringTransaction | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM recurring_transactions WHERE id = ?');
    const row = stmt.get(id) as {
      id: number;
      user_id: number;
      type: string;
      amount: number;
      description: string;
      category: string;
      fund_id: number;
      frequency: string;
      start_date: string;
      end_date: string | null;
      last_run: string | null;
      next_run: string;
      is_active: number;
      created_at: string;
    } | undefined;

    if (!row) return undefined;
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type as 'income' | 'expense',
      amount: row.amount,
      description: row.description,
      category: row.category,
      fund_id: row.fund_id,
      frequency: row.frequency as RecurringFrequency,
      start_date: row.start_date,
      end_date: row.end_date,
      last_run: row.last_run,
      next_run: row.next_run,
      is_active: row.is_active === 1,
      created_at: row.created_at
    };
  },

  findByUserId: (userId: number): RecurringTransaction[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM recurring_transactions WHERE user_id = ? ORDER BY next_run ASC');
    const rows = stmt.all(userId) as Array<{
      id: number;
      user_id: number;
      type: string;
      amount: number;
      description: string;
      category: string;
      fund_id: number;
      frequency: string;
      start_date: string;
      end_date: string | null;
      last_run: string | null;
      next_run: string;
      is_active: number;
      created_at: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type as 'income' | 'expense',
      amount: row.amount,
      description: row.description,
      category: row.category,
      fund_id: row.fund_id,
      frequency: row.frequency as RecurringFrequency,
      start_date: row.start_date,
      end_date: row.end_date,
      last_run: row.last_run,
      next_run: row.next_run,
      is_active: row.is_active === 1,
      created_at: row.created_at
    }));
  },

  findDue: (): RecurringTransaction[] => {
    const database = getDb();
    const today = new Date().toISOString().split('T')[0];
    const stmt = database.prepare(`
      SELECT * FROM recurring_transactions
      WHERE is_active = 1 AND next_run <= ?
      AND (end_date IS NULL OR end_date >= ?)
    `);
    return stmt.all(today, today) as RecurringTransaction[];
  },

  updateLastRun: (id: number, nextRun: string): void => {
    const database = getDb();
    const today = new Date().toISOString().split('T')[0];
    const stmt = database.prepare(`
      UPDATE recurring_transactions SET last_run = ?, next_run = ? WHERE id = ?
    `);
    stmt.run(today, nextRun, id);
  },

  toggleActive: (id: number, userId: number, isActive: boolean): boolean => {
    const database = getDb();
    const stmt = database.prepare('UPDATE recurring_transactions SET is_active = ? WHERE id = ? AND user_id = ?');
    const result = stmt.run(isActive ? 1 : 0, id, userId);
    return result.changes > 0;
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM recurring_transactions WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export function initializeRecurringTransactionTable(): void {
  const database = getDb();

  database.exec(`
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
