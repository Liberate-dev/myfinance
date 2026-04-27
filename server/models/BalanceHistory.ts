import { exec, queryAll, queryOne, run } from './db.js';

export type BalanceChangeType = 'income' | 'expense' | 'transfer_in' | 'transfer_out' | 'initial' | 'adjustment';

export interface BalanceHistory {
  id: number;
  user_id: number;
  fund_id: number;
  type: BalanceChangeType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id: number | null;
  reference_type: string | null;
  description: string;
  created_at: string;
}

export const BalanceHistoryModel = {
  create: (
    userId: number,
    fundId: number,
    type: BalanceChangeType,
    amount: number,
    balanceBefore: number,
    balanceAfter: number,
    referenceId?: number,
    referenceType?: string,
    description?: string
  ): BalanceHistory => {
    const result = run(
      `INSERT INTO balance_history (user_id, fund_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, fundId, type, amount, balanceBefore, balanceAfter, referenceId || null, referenceType || null, description || null]
    );
    return BalanceHistoryModel.findById(result.lastInsertRowid)!;
  },

  findById: (id: number): BalanceHistory | undefined => {
    const row = queryOne<any>('SELECT * FROM balance_history WHERE id = ?', [id]);
    if (!row) return undefined;
    return { ...row, type: row.type as BalanceChangeType };
  },

  findByFundId: (fundId: number, limit = 50): BalanceHistory[] => {
    const rows = queryAll<any>('SELECT * FROM balance_history WHERE fund_id = ? ORDER BY created_at DESC LIMIT ?', [fundId, limit]);
    return rows.map(row => ({ ...row, type: row.type as BalanceChangeType }));
  },

  findByUserId: (userId: number, limit = 100): BalanceHistory[] => {
    const rows = queryAll<any>('SELECT * FROM balance_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    return rows.map(row => ({ ...row, type: row.type as BalanceChangeType }));
  }
};

export function initializeBalanceHistoryTable(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS balance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fund_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer_in', 'transfer_out', 'initial', 'adjustment')),
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE CASCADE
    )
  `);
  exec(`CREATE INDEX IF NOT EXISTS idx_balance_history_fund ON balance_history(fund_id)`);
  exec(`CREATE INDEX IF NOT EXISTS idx_balance_history_user ON balance_history(user_id)`);
}
