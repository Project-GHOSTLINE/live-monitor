import { getDatabase } from '../db/client';

export class RateLimiter {
  /**
   * Check if a source can be fetched based on rate limit
   */
  static canFetch(sourceId: number): boolean {
    const db = getDatabase();

    const source = db
      .prepare('SELECT last_fetched_at, rate_limit_seconds FROM sources WHERE id = ?')
      .get(sourceId) as { last_fetched_at?: number; rate_limit_seconds: number } | undefined;

    if (!source || !source.last_fetched_at) {
      return true; // Never fetched before
    }

    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - source.last_fetched_at;

    return elapsed >= source.rate_limit_seconds;
  }

  /**
   * Update last fetched timestamp for a source
   */
  static recordFetch(sourceId: number): void {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    db.prepare('UPDATE sources SET last_fetched_at = ? WHERE id = ?').run(now, sourceId);
  }

  /**
   * Get next available fetch time for a source
   */
  static getNextFetchTime(sourceId: number): Date | null {
    const db = getDatabase();

    const source = db
      .prepare('SELECT last_fetched_at, rate_limit_seconds FROM sources WHERE id = ?')
      .get(sourceId) as { last_fetched_at?: number; rate_limit_seconds: number } | undefined;

    if (!source?.last_fetched_at) return null;

    const nextFetch = source.last_fetched_at + source.rate_limit_seconds;
    return new Date(nextFetch * 1000);
  }

  /**
   * Get all sources that can be fetched now
   */
  static getFetchableSources(): number[] {
    const db = getDatabase();

    const sources = db
      .prepare('SELECT id FROM sources WHERE is_active = 1')
      .all() as { id: number }[];

    return sources.filter(s => this.canFetch(s.id)).map(s => s.id);
  }
}
