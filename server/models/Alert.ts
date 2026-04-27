import { getDb } from './User.js';

export interface Alert {
  id: number;
  user_id: number;
  fund_id: number;
  type: 'low_balance' | 'budget_exceeded' | 'recurring_due';
  threshold: number;
  is_active: boolean;
  created_at: string;
}

export const AlertModel = {
  create: (userId: number, fundId: number, type: 'low_balance' | 'budget_exceeded', threshold: number): Alert => {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO alerts (user_id, fund_id, type, threshold, is_active) VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(userId, fundId, type, threshold);
    return AlertModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Alert | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM alerts WHERE id = ?');
    return stmt.get(id) as Alert | undefined;
  },

  findByUserId: (userId: number): Alert[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Alert[];
  },

  findByFundId: (fundId: number): Alert[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM alerts WHERE fund_id = ?');
    return stmt.all(fundId) as Alert[];
  },

  findActiveByType: (userId: number, type: 'low_balance' | 'budget_exceeded'): Alert[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM alerts WHERE user_id = ? AND type = ? AND is_active = 1');
    return stmt.all(userId, type) as Alert[];
  },

  updateThreshold: (id: number, userId: number, threshold: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('UPDATE alerts SET threshold = ? WHERE id = ? AND user_id = ?');
    const result = stmt.run(threshold, id, userId);
    return result.changes > 0;
  },

  toggleActive: (id: number, userId: number, isActive: boolean): boolean => {
    const database = getDb();
    const stmt = database.prepare('UPDATE alerts SET is_active = ? WHERE id = ? AND user_id = ?');
    const result = stmt.run(isActive ? 1 : 0, id, userId);
    return result.changes > 0;
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },

  // Check if any fund has low balance
  checkLowBalanceAlerts: (userId: number): Alert[] => {
    const database = getDb();
    const stmt = database.prepare(`
      SELECT a.* FROM alerts a
      JOIN funds f ON a.fund_id = f.id
      WHERE a.user_id = ? AND a.type = 'low_balance' AND a.is_active = 1
      AND f.balance < a.threshold
    `);
    return stmt.all(userId) as Alert[];
  }
};

export function initializeAlertTable(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fund_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('low_balance', 'budget_exceeded', 'recurring_due')),
      threshold REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
    )
  `);
}
