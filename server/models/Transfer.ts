import { execNoSave, queryAll, queryOne, run } from './db.js';

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
    const result = run(
      `INSERT INTO transfers (user_id, from_fund_id, to_fund_id, amount, note) VALUES (?, ?, ?, ?, ?)`,
      [userId, fromFundId, toFundId, amount, note || null]
    );
    return TransferModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): Transfer | undefined => {
    return queryOne<Transfer>('SELECT * FROM transfers WHERE id = ?', [id]);
  },

  findByUserId: (userId: number): Transfer[] => {
    return queryAll<Transfer>('SELECT * FROM transfers WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  },

  findByFundId: (fundId: number): Transfer[] => {
    return queryAll<Transfer>('SELECT * FROM transfers WHERE from_fund_id = ? OR to_fund_id = ? ORDER BY created_at DESC', [fundId, fundId]);
  },

  delete: (id: number, userId: number): boolean => {
    const result = run('DELETE FROM transfers WHERE id = ? AND user_id = ?', [id, userId]);
    return result.changes > 0;
  }
};

export function initializeTransferTable(): void {
  execNoSave(`
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
      FOREIGN KEY (to_fund_id) REFERENCES funds(id) ON DELETE CASCADE
    )
  `);
}
