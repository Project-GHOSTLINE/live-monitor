import { getDB } from '../db/adapter';

export class RateLimiter {
  /**
   * Check if a source can be fetched based on rate limit
   */
  static async canFetch(sourceId: number): Promise<boolean> {
    const db = getDB();

    const source = await db.get('sources', sourceId) as { last_fetched_at?: number; rate_limit_seconds: number } | undefined;

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
  static async recordFetch(sourceId: number): Promise<void> {
    const db = getDB();
    const now = Math.floor(Date.now() / 1000);

    await db.update('sources', sourceId, { last_fetched_at: now });
  }

  /**
   * Get next available fetch time for a source
   */
  static async getNextFetchTime(sourceId: number): Promise<Date | null> {
    const db = getDB();

    const source = await db.get('sources', sourceId) as { last_fetched_at?: number; rate_limit_seconds: number } | undefined;

    if (!source?.last_fetched_at) return null;

    const nextFetch = source.last_fetched_at + source.rate_limit_seconds;
    return new Date(nextFetch * 1000);
  }

  /**
   * Get all sources that can be fetched now
   */
  static async getFetchableSources(): Promise<number[]> {
    const db = getDB();

    const sources = await db.all('sources', 'is_active = 1') as { id: number }[];

    const fetchable: number[] = [];
    for (const s of sources) {
      if (await this.canFetch(s.id)) {
        fetchable.push(s.id);
      }
    }
    return fetchable;
  }
}
