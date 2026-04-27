import { getDb } from './User.js';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  is_default: boolean;
  user_id?: number; // If set, it's a custom user category
}

export interface UserCategory extends Category {
  user_id: number;
}

export const PREDEFINED_CATEGORIES: Omit<Category, 'id'>[] = [
  // Income categories
  { name: 'Salary', type: 'income', icon: '💰', is_default: true },
  { name: 'Freelance', type: 'income', icon: '💻', is_default: true },
  { name: 'Investment', type: 'income', icon: '📈', is_default: true },
  // Expense categories
  { name: 'Food', type: 'expense', icon: '🍔', is_default: true },
  { name: 'Transport', type: 'expense', icon: '🚗', is_default: true },
  { name: 'Entertainment', type: 'expense', icon: '🎬', is_default: true },
  { name: 'Bills', type: 'expense', icon: '📄', is_default: true },
  { name: 'Shopping', type: 'expense', icon: '🛒', is_default: true },
  { name: 'Health', type: 'expense', icon: '🏥', is_default: true },
  { name: 'Other', type: 'expense', icon: '📦', is_default: true }
];

export const CategoryModel = {
  create: (name: string, type: 'income' | 'expense', icon: string, isDefault: boolean = false, userId?: number): Category | UserCategory => {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO categories (name, type, icon, is_default, user_id) VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, type, icon, isDefault ? 1 : 0, userId || null);
    return CategoryModel.findById(Number(result.lastInsertRowid))!;
  },

  findById: (id: number): Category | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM categories WHERE id = ?');
    const row = stmt.get(id) as { id: number; name: string; type: string; icon: string; is_default: number; user_id: number | null } | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'income' | 'expense',
      icon: row.icon,
      is_default: row.is_default === 1,
      user_id: row.user_id ?? undefined
    };
  },

  findAll: (): Category[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM categories ORDER BY type, name');
    const rows = stmt.all() as { id: number; name: string; type: string; icon: string; is_default: number; user_id: number | null }[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'income' | 'expense',
      icon: row.icon,
      is_default: row.is_default === 1,
      user_id: row.user_id ?? undefined
    }));
  },

  findByUserId: (userId: number): UserCategory[] => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name');
    const rows = stmt.all(userId) as { id: number; name: string; type: string; icon: string; is_default: number; user_id: number }[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'income' | 'expense',
      icon: row.icon,
      is_default: false,
      user_id: row.user_id
    }));
  },

  findByType: (type: 'income' | 'expense', userId?: number): Category[] => {
    const database = getDb();
    let rows;
    if (userId !== undefined) {
      // Get default categories + user's custom categories
      const stmt = database.prepare('SELECT * FROM categories WHERE type = ? AND (is_default = 1 OR user_id = ?) ORDER BY is_default DESC, name');
      rows = stmt.all(type, userId) as { id: number; name: string; type: string; icon: string; is_default: number; user_id: number | null }[];
    } else {
      const stmt = database.prepare('SELECT * FROM categories WHERE type = ? ORDER BY is_default DESC, name');
      rows = stmt.all(type) as { id: number; name: string; type: string; icon: string; is_default: number; user_id: number | null }[];
    }
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'income' | 'expense',
      icon: row.icon,
      is_default: row.is_default === 1,
      user_id: row.user_id ?? undefined
    }));
  },

  findByTypeAndUser: (type: 'income' | 'expense', userId: number): Category[] => {
    return CategoryModel.findByType(type, userId);
  },

  nameExists: (name: string, type: 'income' | 'expense', userId?: number): boolean => {
    const database = getDb();
    let stmt;
    if (userId !== undefined) {
      stmt = database.prepare('SELECT 1 FROM categories WHERE name = ? AND type = ? AND (is_default = 1 OR user_id = ?)');
      return stmt.get(name, type, userId) !== undefined;
    }
    stmt = database.prepare('SELECT 1 FROM categories WHERE name = ? AND type = ?');
    return stmt.get(name, type) !== undefined;
  },

  update: (id: number, name: string, icon: string): Category | undefined => {
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE categories SET name = ?, icon = ?
      WHERE id = ? AND is_default = 0
    `);
    stmt.run(name, icon, id);
    return CategoryModel.findById(id);
  },

  delete: (id: number, userId: number): boolean => {
    const database = getDb();
    // Only delete custom categories (not default ones)
    const stmt = database.prepare('DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = 0');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
};

export function initializeCategoryTable(): void {
  const database = getDb();

  // First, create the table if it doesn't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      icon TEXT NOT NULL DEFAULT '📦',
      is_default INTEGER NOT NULL DEFAULT 0,
      user_id INTEGER DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(name, type, user_id)
    )
  `);

  // Migration: Add user_id column if it doesn't exist (for existing databases)
  try {
    const columns = database.prepare("PRAGMA table_info(categories)").all() as { name: string }[];
    const hasUserId = columns.some(col => col.name === 'user_id');
    if (!hasUserId) {
      database.exec('ALTER TABLE categories ADD COLUMN user_id INTEGER DEFAULT NULL');
      database.exec('ALTER TABLE categories ADD COLUMN FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('[DB] Migration: Added user_id column to categories table');
    }
  } catch (err) {
    // Column might already exist or table was just created with it
    console.log('[DB] Note: user_id column check skipped');
  }

  // Seed predefined categories if they don't exist
  for (const category of PREDEFINED_CATEGORIES) {
    if (!CategoryModel.nameExists(category.name, category.type)) {
      CategoryModel.create(category.name, category.type, category.icon, category.is_default);
      console.log(`[DB] Seeded category: ${category.name} (${category.type})`);
    }
  }
}