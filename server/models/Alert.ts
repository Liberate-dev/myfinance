import { exec, queryAll, queryOne, run } from './db.js';

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
    const result = run(
      `INSERT INTO alerts (user_id, fund_id, type, threshold, is_active) VALUES (?, ?, ?, ?, 1)`,
      [userId, fundId, type, threshold]
    );
    return AlertModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): Alert | undefined => {
    const row = queryOne<any>('SELECT * FROM alerts WHERE id = ?', [id]);
    if (!row) return undefined;
    return { ...row, is_active: row.is_active === 1 };
  },

  findByUserId: (userId: number): Alert[] => {
    const rows = queryAll<any>('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(row => ({ ...row, is_active: row.is_active === 1 }));
  },

  findByFundId: (fundId: number): Alert[] => {
    const rows = queryAll<any>('SELECT * FROM alerts WHERE fund_id = ?', [fundId]);
    return rows.map(row => ({ ...row, is_active: row.is_active === 1 }));
  },

  findActiveByType: (userId: number, type: 'low_balance' | 'budget_exceeded'): Alert[] => {
    const rows = queryAll<any>('SELECT * FROM alerts WHERE user_id = ? AND type = ? AND is_active = 1', [userId, type]);
    return rows.map(row => ({ ...row, is_active: true }));
  },

  updateThreshold: (id: number, userId: number, threshold: number): boolean => {
    const result = run('UPDATE alerts SET threshold = ? WHERE id = ? AND user_id = ?', [threshold, id, userId]);
    return result.changes > 0;
  },

  toggleActive: (id: number, userId: number, isActive: boolean): boolean => {
    const result = run('UPDATE alerts SET is_active = ? WHERE id = ? AND user_id = ?', [isActive ? 1 : 0, id, userId]);
    return result.changes > 0;
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM alerts WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  },

  checkLowBalanceAlerts: (userId: number): Alert[] => {
    return queryAll<any>(`
      SELECT a.* FROM alerts a
      JOIN funds f ON a.fund_id = f.id
      WHERE a.user_id = ? AND a.type = 'low_balance' AND a.is_active = 1
      AND f.balance < a.threshold
    `, [userId]);
  }
};

export function initializeAlertTable(): void {
  exec(`
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
