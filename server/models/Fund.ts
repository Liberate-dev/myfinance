import { getDb } from './User.js';

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
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO funds (user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, name, type, balance, color, icon);
    return FundModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Fund | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM funds WHERE id = ?');
    const row = stmt.get(id) as { id: number; user_id: number; name: string; type: string; balance: number; color: string; icon: string; created_at: string } | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      type: row.type as 'cash' | 'bank' | 'e-wallet',
      balance: row.balance,
      color: row.color,
      icon: row.icon,
      created_at: row.created_at
    };
  },

  findByUserId: (userId: number): Fund[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM funds WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId) as { id: number; user_id: number; name: string; type: string; balance: number; color: string; icon: string; created_at: string }[];
    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      type: row.type as 'cash' | 'bank' | 'e-wallet',
      balance: row.balance,
      color: row.color,
      icon: row.icon,
      created_at: row.created_at
    }));
  },

  update: (id: number, userId: number, name: string, type: 'cash' | 'bank' | 'e-wallet', balance: number, color: string, icon: string): Fund | undefined => {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE funds SET name = ?, type = ?, balance = ?, color = ?, icon = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(name, type, balance, color, icon, id, userId);
    return FundModel.findById(id);
  },

  updateBalance: (id: number, userId: number, amount: number): Fund | undefined => {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE funds SET balance = balance + ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(amount, id, userId);
    return FundModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM funds WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  },

  getTotalBalance: (userId: number): number => {
    const database = getDb();
    const stmt = database.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM funds WHERE user_id = ?');
    const row = stmt.get(userId) as { total: number };
    return row.total;
  }
};

export function initializeFundTable(): void {
  const database = getDb();
  database.exec(`
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
