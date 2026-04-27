import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database singleton - initialized lazily
let _db: SqlJsDatabase | null = null;
let _dbPath: string = '';

export async function getDb(): Promise<SqlJsDatabase> {
  if (!_db) {
    _dbPath = path.join(__dirname, '..', 'data.db');
    console.log('[DB] Opening database at:', _dbPath);

    const SQL = await initSqlJs();

    // Load existing database or create new
    if (fs.existsSync(_dbPath)) {
      const buffer = fs.readFileSync(_dbPath);
      _db = new SQL.Database(buffer);
    } else {
      _db = new SQL.Database();
    }

    console.log('[DB] Database opened successfully');
  }
  return _db;
}

export function saveDb(): void {
  if (_db && _dbPath) {
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(_dbPath, buffer);
  }
}

export function closeDb(): void {
  if (_db) {
    saveDb();
    _db.close();
    _db = null;
  }
}

// Helper to run a query that returns rows
export function queryAll<T>(sql: string, params: any[] = []): T[] {
  if (!_db) throw new Error('Database not initialized');
  const stmt = _db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

// Helper to run a query that returns single row
export function queryOne<T>(sql: string, params: any[] = []): T | undefined {
  if (!_db) throw new Error('Database not initialized');
  const stmt = _db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

// Helper to run a mutation (INSERT, UPDATE, DELETE)
export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!_db) throw new Error('Database not initialized');
  _db.run(sql, params);
  const lastId = _db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] as number || 0;
  const changes = _db.getRowsModified();
  saveDb();
  return { lastInsertRowid: lastId, changes };
}

// Helper to run raw SQL (for CREATE TABLE etc)
export function exec(sql: string): void {
  if (!_db) throw new Error('Database not initialized');
  _db.run(sql);
  saveDb();
}
