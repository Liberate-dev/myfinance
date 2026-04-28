import { execNoSave, queryAll, queryOne, run } from './db.js';

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  is_default: boolean;
  user_id?: number;
}

export const PREDEFINED_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salary', type: 'income', icon: '💰', is_default: true },
  { name: 'Freelance', type: 'income', icon: '💻', is_default: true },
  { name: 'Investment', type: 'income', icon: '📈', is_default: true },
  { name: 'Food', type: 'expense', icon: '🍔', is_default: true },
  { name: 'Transport', type: 'expense', icon: '🚗', is_default: true },
  { name: 'Entertainment', type: 'expense', icon: '🎬', is_default: true },
  { name: 'Bills', type: 'expense', icon: '📄', is_default: true },
  { name: 'Shopping', type: 'expense', icon: '🛒', is_default: true },
  { name: 'Health', type: 'expense', icon: '🏥', is_default: true },
  { name: 'Other', type: 'expense', icon: '📦', is_default: true }
];

export const CategoryModel = {
  create: (name: string, type: 'income' | 'expense', icon: string, isDefault: boolean = false, userId?: number) => {
    const result = run(`INSERT INTO categories (name, type, icon, is_default, user_id) VALUES (?, ?, ?, ?, ?)`,
      [name, type, icon, isDefault ? 1 : 0, userId || null]);
    return CategoryModel.findById(result.lastInsertRowid);
  },

  findById: (id: number) => {
    const row = queryOne<any>('SELECT * FROM categories WHERE id = ?', [id]);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      is_default: row.is_default === 1,
      user_id: row.user_id ?? undefined
    };
  },

  findAll: () => {
    const rows = queryAll<any>('SELECT * FROM categories ORDER BY type, name', []);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      is_default: row.is_default === 1,
      user_id: row.user_id ?? undefined
    }));
  },

  findByUserId: (userId: number) => {
    const rows = queryAll<any>('SELECT * FROM categories WHERE user_id = ? ORDER BY name', [userId]);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      is_default: false,
      user_id: row.user_id
    }));
  },

  findByType: (type: 'income' | 'expense', userId?: number) => {
    let rows;
    if (userId !== undefined) {
      rows = queryAll<any>('SELECT * FROM categories WHERE type = ? AND (is_default = 1 OR user_id = ?) ORDER BY is_default DESC, name', [type, userId]);
    } else {
      rows = queryAll<any>('SELECT * FROM categories WHERE type = ? ORDER BY is_default DESC, name', [type]);
    }
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      is_default: row.is_default === 1,
      user_id: row.user_id ?? undefined
    }));
  },

  nameExists: (name: string, type: 'income' | 'expense', userId?: number) => {
    if (userId !== undefined) {
      return queryOne('SELECT 1 FROM categories WHERE name = ? AND type = ? AND (is_default = 1 OR user_id = ?)', [name, type, userId]) !== undefined;
    }
    return queryOne('SELECT 1 FROM categories WHERE name = ? AND type = ?', [name, type]) !== undefined;
  },

  update: (id: number, name: string, icon: string) => {
    run(`UPDATE categories SET name = ?, icon = ? WHERE id = ? AND is_default = 0`, [name, icon, id]);
    return CategoryModel.findById(id);
  },

  delete: (id: number, userId: number) => {
    const result = run('DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = 0', [id, userId]);
    return result.changes > 0;
  }
};

export function initializeCategoryTable(): void {
  execNoSave(`
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

  for (const category of PREDEFINED_CATEGORIES) {
    if (!CategoryModel.nameExists(category.name, category.type)) {
      CategoryModel.create(category.name, category.type, category.icon, category.is_default);
      console.log(`[DB] Seeded category: ${category.name} (${category.type})`);
    }
  }
}
