import { getDb } from './User.js';

export interface Transfer {
  id: number;
  user_id: number;
  from_fund_id: number;
  to_fund_id: number;
  amount: number;
  note: string;
  created_at: string;
}

export const TransferModel = {
  create: (userId: number, fromFundId: number, toFundId: number, amount: number, note?: string): Transfer => {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO transfers (user_id, from_fund_id, to_fund_id, amount, note) VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, fromFundId, toFundId, amount, note || null);
    return TransferModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Transfer | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM transfers WHERE id = ?');
    return stmt.get(id) as Transfer | undefined;
  },

  findByUserId: (userId: number): Transfer[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM transfers WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as Transfer[];
  },

  findByFundId: (fundId: number): Transfer[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM transfers WHERE from_fund_id = ? OR to_fund_id = ? ORDER BY created_at DESC');
    return stmt.all(fundId, fundId) as Transfer[];
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    const stmt = database.prepare('DELETE FROM transfers WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export function initializeTransferTable(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_fund_id INTEGER NOT NULL,
      to_fund_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (from_fund_id) REFERENCES funds(id) ON DELETE CASCADE,
      FOREIGN KEY (to_fund_id) REFERENCES funds(id) ON DELETE CASCADE,
      CHECK (from_fund_id != to_fund_id),
      CHECK (amount > 0)
    )
  `);
}
