import { exec, queryOne, run } from './db.js';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

export const UserModel = {
  create: (email: string, password: string, name: string): User => {
    const result = run(`INSERT INTO users (email, password, name) VALUES (?, ?, ?)`, [email, password, name]);
    return UserModel.findByEmail(email)!;
  },

  findByEmail: (email: string): User | undefined => {
    return queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
  },

  findById: (id: number): User | undefined => {
    return queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
  },

  emailExists: (email: string): boolean => {
    return UserModel.findByEmail(email) !== undefined;
  },

  updatePassword: (id: number, newPassword: string): void => {
    run('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);
  }
};

export function initializeUserTable(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
