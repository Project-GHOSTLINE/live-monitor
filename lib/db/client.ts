import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || './data/monitor.db';

  try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export function runMigrations() {
  const database = getDatabase();

  try {
    const migrationPath = join(process.cwd(), 'lib/db/migrations/001_initial.sql');
    const migration = readFileSync(migrationPath, 'utf-8');

    // Execute the entire migration file at once
    database.exec(migration);

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Helper functions for common queries
export class DB {
  static insert(table: string, data: Record<string, any>): number {
    const database = getDatabase();

    // Filter out undefined values and convert to null
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      cleanData[key] = value === undefined ? null : value;
    }

    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
    const placeholders = keys.map(() => '?').join(', ');

    const stmt = database.prepare(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    );

    const result = stmt.run(...values);
    return result.lastInsertRowid as number;
  }

  static update(table: string, id: number, data: Record<string, any>): void {
    const database = getDatabase();

    // Filter out undefined values and convert to null
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      cleanData[key] = value === undefined ? null : value;
    }

    const keys = Object.keys(cleanData);
    const values = Object.values(cleanData);
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    const stmt = database.prepare(
      `UPDATE ${table} SET ${setClause} WHERE id = ?`
    );

    stmt.run(...values, id);
  }

  static get(table: string, id: number): any {
    const database = getDatabase();
    const stmt = database.prepare(`SELECT * FROM ${table} WHERE id = ?`);
    return stmt.get(id);
  }

  static all(table: string, where?: string, params?: any[]): any[] {
    const database = getDatabase();
    const query = where
      ? `SELECT * FROM ${table} WHERE ${where}`
      : `SELECT * FROM ${table}`;

    const stmt = database.prepare(query);
    return params ? stmt.all(...params) : stmt.all();
  }

  static query(sql: string, params: any[] = []): any[] {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    return stmt.all(...params);
  }

  static exec(sql: string, params: any[] = []): void {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    stmt.run(...params);
  }

  static count(table: string, where?: string, params?: any[]): number {
    const database = getDatabase();
    const query = where
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${table}`;

    const stmt = database.prepare(query);
    const result: any = params ? stmt.get(...params) : stmt.get();
    return result.count;
  }
}
