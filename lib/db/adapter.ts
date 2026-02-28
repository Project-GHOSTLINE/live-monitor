// @ts-nocheck
import { getSupabase, isSupabaseConfigured } from './supabase';
import { getDatabase as getSQLite } from './client';

/**
 * Unified database adapter that works with both SQLite (dev) and Supabase (prod)
 */
export class DatabaseAdapter {
  private useSupabase: boolean;

  constructor() {
    this.useSupabase = isSupabaseConfigured();
  }

  async insert(table: string, data: Record<string, any>): Promise<number> {
    // Clean undefined values
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    if (this.useSupabase) {
      const supabase = getSupabase();
      const { data: result, error } = await supabase
        .from(table)
        .insert(cleanData as any)
        .select('id')
        .single<{ id: number }>();

      if (error) throw error;
      return result?.id || 0;
    } else {
      const db = getSQLite();
      const keys = Object.keys(cleanData);
      const values = Object.values(cleanData).map(v => (v === undefined ? null : v));
      const placeholders = keys.map(() => '?').join(', ');

      const stmt = db.prepare(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
      );

      const result = stmt.run(...values);
      return result.lastInsertRowid as number;
    }
  }

  async update(table: string, id: number, data: Record<string, any>): Promise<void> {
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }

    if (this.useSupabase) {
      const supabase = getSupabase();
      const { error } = await supabase.from(table).update(cleanData as any).eq('id', id);

      if (error) throw error;
    } else {
      const db = getSQLite();
      const keys = Object.keys(cleanData);
      const values = Object.values(cleanData).map(v => (v === undefined ? null : v));
      const setClause = keys.map(k => `${k} = ?`).join(', ');

      const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
      stmt.run(...values, id);
    }
  }

  async get(table: string, id: number): Promise<any> {
    if (this.useSupabase) {
      const supabase = getSupabase();
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();

      if (error) throw error;
      return data;
    } else {
      const db = getSQLite();
      const stmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
      return stmt.get(id);
    }
  }

  async all(table: string, where?: string, params?: any[]): Promise<any[]> {
    if (this.useSupabase) {
      const supabase = getSupabase();
      let query = supabase.from(table).select('*');

      // Simple where clause parsing for Supabase
      if (where) {
        // This is a simplified implementation
        // For production, you'd want a more robust query builder
        console.warn('WHERE clauses not fully supported with Supabase adapter');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const db = getSQLite();
      const query = where ? `SELECT * FROM ${table} WHERE ${where}` : `SELECT * FROM ${table}`;

      const stmt = db.prepare(query);
      return params ? stmt.all(...params) : stmt.all();
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.useSupabase) {
      const supabase = getSupabase();
      const { data, error } = await supabase.rpc('execute_sql', { query: sql, params });

      if (error) {
        console.warn('Direct SQL queries not supported with Supabase, using limited support');
        throw error;
      }
      return data || [];
    } else {
      const db = getSQLite();
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    }
  }

  async exec(sql: string, params: any[] = []): Promise<void> {
    if (this.useSupabase) {
      const supabase = getSupabase();
      const { error } = await supabase.rpc('execute_sql', { query: sql, params });

      if (error) throw error;
    } else {
      const db = getSQLite();
      const stmt = db.prepare(sql);
      stmt.run(...params);
    }
  }

  async count(table: string, where?: string, params?: any[]): Promise<number> {
    if (this.useSupabase) {
      const supabase = getSupabase();
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } else {
      const db = getSQLite();
      const query = where
        ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
        : `SELECT COUNT(*) as count FROM ${table}`;

      const stmt = db.prepare(query);
      const result: any = params ? stmt.get(...params) : stmt.get();
      return result.count;
    }
  }
}

// Singleton instance
let dbAdapter: DatabaseAdapter | null = null;

export function getDB(): DatabaseAdapter {
  if (!dbAdapter) {
    dbAdapter = new DatabaseAdapter();
  }
  return dbAdapter;
}
