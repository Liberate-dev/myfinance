import { exec, queryAll, queryOne, run } from './db.js';

export interface Fund {
  id: number;
  user_id: number;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance: number;
  color: string;
  icon: string;
  created_at: string;
}

export const FundModel = {
  create: (userId: number, name: string, type: 'cash' | 'bank' | 'e-wallet', balance: number, color: string, icon: string): Fund => {
    const result = run(
      `INSERT INTO funds (user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, type, balance, color, icon]
    );
    return FundModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): Fund | undefined => {
    const row = queryOne<any>('SELECT * FROM funds WHERE id = ?', [id]);
    if (!row) return undefined;
    return { ...row, type: row.type as 'cash' | 'bank' | 'e-wallet' };
  },

  findByUserId: (userId: number): Fund[] => {
    const rows = queryAll<any>('SELECT * FROM funds WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(row => ({ ...row, type: row.type as 'cash' | 'bank' | 'e-wallet' }));
  },

  update: (id: number, userId: number, name: string, type: 'cash' | 'bank' | 'e-wallet', balance: number, color: string, icon: string): Fund | undefined => {
    run(
      `UPDATE funds SET name = ?, type = ?, balance = ?, color = ?, icon = ? WHERE id = ? AND user_id = ?`,
      [name, type, balance, color, icon, id, userId]
    );
    return FundModel.findById(id);
  },

  updateBalance: (id: number, userId: number, amount: number): Fund | undefined => {
    run(`UPDATE funds SET balance = balance + ? WHERE id = ? AND user_id = ?`, [amount, id, userId]);
    return FundModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM funds WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  },

  getTotalBalance: (userId: number): number => {
    const row = queryOne<{ total: number }>('SELECT COALESCE(SUM(balance), 0) as total FROM funds WHERE user_id = ?', [userId]);
    return row?.total || 0;
  }
};

export function initializeFundTable(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS funds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e-wallet')),
      balance REAL NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      icon TEXT NOT NULL DEFAULT '💰',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}
