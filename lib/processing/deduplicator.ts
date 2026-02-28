import Levenshtein from 'fast-levenshtein';
import { isSupabaseConfigured } from '../db/supabase';

export interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateOf?: number;
  similarityScore?: number;
}

/**
 * Detect if a new item is a duplicate of existing items
 * Uses two-stage approach:
 * 1. Exact URL match
 * 2. Title similarity within time window
 *
 * Note: Deduplication temporarily disabled for Supabase
 */
export function detectDuplicate(
  canonicalUrl: string,
  titleEn: string,
  publishedAt: number
): DeduplicationResult {
  // TODO: Implement deduplication for Supabase
  if (isSupabaseConfigured()) {
    return { isDuplicate: false };
  }

  const { getDatabase } = require('../db/client');
  const db = getDatabase();

  // Stage 1: Exact URL match
  const urlMatch = db
    .prepare('SELECT id FROM feed_items WHERE canonical_url = ?')
    .get(canonicalUrl) as { id: number } | undefined;

  if (urlMatch) {
    return {
      isDuplicate: true,
      duplicateOf: urlMatch.id,
      similarityScore: 1.0,
    };
  }

  // Stage 2: Title similarity within ±6 hour window
  const TIME_WINDOW = 6 * 60 * 60; // 6 hours in seconds
  const timeStart = publishedAt - TIME_WINDOW;
  const timeEnd = publishedAt + TIME_WINDOW;

  const recentItems = db
    .prepare(
      `SELECT id, title_en FROM feed_items
       WHERE published_at BETWEEN ? AND ?
       AND title_en IS NOT NULL
       AND is_duplicate = 0
       LIMIT 1000`
    )
    .all(timeStart, timeEnd) as { id: number; title_en: string }[];

  const SIMILARITY_THRESHOLD = 0.75;
  let bestMatch: { id: number; score: number } | null = null;

  for (const item of recentItems) {
    const score = calculateTitleSimilarity(titleEn, item.title_en);

    if (score >= SIMILARITY_THRESHOLD) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: item.id, score };
      }
    }
  }

  if (bestMatch) {
    return {
      isDuplicate: true,
      duplicateOf: bestMatch.id,
      similarityScore: bestMatch.score,
    };
  }

  return { isDuplicate: false };
}

/**
 * Calculate normalized similarity score between two titles
 * Uses Levenshtein distance with normalization
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

  const norm1 = normalize(title1);
  const norm2 = normalize(title2);

  if (norm1 === norm2) return 1.0;

  const distance = Levenshtein.get(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);

  return maxLen > 0 ? 1 - distance / maxLen : 1;
}

/**
 * Create normalized title for clustering
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100);
}
