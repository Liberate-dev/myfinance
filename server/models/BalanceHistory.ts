import { getDb } from './User.js';

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
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO balance_history
      (user_id, fund_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userId, fundId, type, amount, balanceBefore, balanceAfter,
      referenceId || null, referenceType || null, description || null
    );
    return BalanceHistoryModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): BalanceHistory | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM balance_history WHERE id = ?');
    const row = stmt.get(id) as {
      id: number;
      user_id: number;
      fund_id: number;
      type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      reference_id: number | null;
      reference_type: string | null;
      description: string | null;
      created_at: string;
    } | undefined;

    if (!row) return undefined;
    return {
      id: row.id,
      user_id: row.user_id,
      fund_id: row.fund_id,
      type: row.type as BalanceChangeType,
      amount: row.amount,
      balance_before: row.balance_before,
      balance_after: row.balance_after,
      reference_id: row.reference_id,
      reference_type: row.reference_type,
      description: row.description || '',
      created_at: row.created_at
    };
  },

  findByFundId: (fundId: number, limit = 50): BalanceHistory[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM balance_history WHERE fund_id = ? ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(fundId, limit) as Array<{
      id: number;
      user_id: number;
      fund_id: number;
      type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      reference_id: number | null;
      reference_type: string | null;
      description: string | null;
      created_at: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      fund_id: row.fund_id,
      type: row.type as BalanceChangeType,
      amount: row.amount,
      balance_before: row.balance_before,
      balance_after: row.balance_after,
      reference_id: row.reference_id,
      reference_type: row.reference_type,
      description: row.description || '',
      created_at: row.created_at
    }));
  },

  findByUserId: (userId: number, limit = 100): BalanceHistory[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM balance_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(userId, limit) as Array<{
      id: number;
      user_id: number;
      fund_id: number;
      type: string;
      amount: number;
      balance_before: number;
      balance_after: number;
      reference_id: number | null;
      reference_type: string | null;
      description: string | null;
      created_at: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      fund_id: row.fund_id,
      type: row.type as BalanceChangeType,
      amount: row.amount,
      balance_before: row.balance_before,
      balance_after: row.balance_after,
      reference_id: row.reference_id,
      reference_type: row.reference_type,
      description: row.description || '',
      created_at: row.created_at
    }));
  }
};

export function initializeBalanceHistoryTable(): void {
  const database = getDb();

  database.exec(`
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

  // Create index for faster lookups
  database.exec(`CREATE INDEX IF NOT EXISTS idx_balance_history_fund ON balance_history(fund_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_balance_history_user ON balance_history(user_id)`);
}
