import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database singleton - initialized lazily
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = path.join(__dirname, 'data.db');
    console.log('[DB] Opening database at:', dbPath);

    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');

    // Create tables
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('[DB] Database opened successfully');
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

export const UserModel = {
  create: (email: string, password: string, name: string): User => {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO users (email, password, name) VALUES (?, ?, ?)
    `);
    const result = stmt.run(email, password, name);
    return UserModel.findById(Number(result.lastInsertRowid))!;
  },

  findByEmail: (email: string): User | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  },

  findById: (id: number): User | undefined => {
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  emailExists: (email: string): boolean => {
    const database = getDb();
    const stmt = database.prepare('SELECT 1 FROM users WHERE email = ?');
    return stmt.get(email) !== undefined;
  },

  updatePassword: (id: number, newPassword: string): void => {
    const database = getDb();
    const stmt = database.prepare('UPDATE users SET password = ? WHERE id = ?');
    stmt.run(newPassword, id);
  }
};

export function initializeDatabase(): void {
  // Just triggers the lazy initialization
  getDb();
}
