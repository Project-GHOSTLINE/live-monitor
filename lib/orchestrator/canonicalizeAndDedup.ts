/**
 * Canonicalization and Deduplication Module
 *
 * Normalizes feed items into canonical format and detects duplicates.
 * Second stage of the orchestrator pipeline.
 *
 * Pipeline: feed_items → canonicalizeAndDedup → canonical_items table
 *
 * NOTE: Based on migration plan, canonical_items table will be created in future migration.
 * For now, this module prepares the logic and returns canonical data structure.
 */

import { DatabaseAdapter } from '@/lib/db/adapter';
import type { FeedItem } from '@/types/feed';

export interface CanonicalItem {
  id?: number;
  feed_item_ids: number[]; // Array of source feed_item IDs
  canonical_title: string;
  canonical_summary: string;
  canonical_url: string; // Primary URL
  source_urls: string[]; // All related URLs (evidence)
  published_at: number; // Unix timestamp in SECONDS (earliest)
  last_updated_at: number; // Unix timestamp in SECONDS (latest)
  reliability_score: number; // Aggregated reliability (1-5)
  verification_count: number; // Number of sources reporting same event
  entity_places: string[]; // Merged unique places
  entity_orgs: string[]; // Merged unique organizations
  tags: string[]; // Merged unique tags
  created_at?: number;
}

export interface CanonicalizationResult {
  success: boolean;
  canonical_item?: CanonicalItem;
  is_new: boolean;
  merged_with?: number; // ID of existing canonical item if merged
  error?: string;
}

/**
 * Calculate similarity between two titles (0-1)
 * Uses simple word overlap algorithm
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalize = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3) // Ignore short words
    );
  };

  const words1 = normalize(title1);
  const words2 = normalize(title2);

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find similar canonical items based on title similarity
 */
async function findSimilarCanonicalItems(
  db: DatabaseAdapter,
  title: string,
  timeWindow: number = 86400 // 24 hours in seconds
): Promise<CanonicalItem[]> {
  try {
    // Note: canonical_items table doesn't exist yet in current schema
    // This is prepared for future implementation
    // For now, return empty array
    return [];

    // Future implementation:
    // const now = Math.floor(Date.now() / 1000);
    // const candidates = await db.query(
    //   'SELECT * FROM canonical_items WHERE published_at >= ? ORDER BY published_at DESC LIMIT 100',
    //   [now - timeWindow]
    // );
    //
    // return candidates
    //   .map((item: any) => ({
    //     ...item,
    //     feed_item_ids: JSON.parse(item.feed_item_ids || '[]'),
    //     source_urls: JSON.parse(item.source_urls || '[]'),
    //     entity_places: JSON.parse(item.entity_places || '[]'),
    //     entity_orgs: JSON.parse(item.entity_orgs || '[]'),
    //     tags: JSON.parse(item.tags || '[]'),
    //   }))
    //   .filter((item: CanonicalItem) =>
    //     calculateTitleSimilarity(title, item.canonical_title) > 0.7
    //   );
  } catch (error) {
    console.error('Error finding similar canonical items:', error);
    return [];
  }
}

/**
 * Merge unique arrays
 */
function mergeUniqueArrays<T>(arr1: T[], arr2: T[]): T[] {
  return Array.from(new Set([...arr1, ...arr2]));
}

/**
 * Calculate aggregated reliability from multiple sources
 */
function calculateAggregatedReliability(reliabilities: number[]): number {
  if (reliabilities.length === 0) return 3; // Default medium reliability

  // Use weighted average with higher weight for more sources
  const sum = reliabilities.reduce((acc, r) => acc + r, 0);
  const avg = sum / reliabilities.length;

  // Boost reliability slightly if multiple sources confirm
  const boost = Math.min(1, reliabilities.length * 0.1);

  return Math.min(5, Math.round(avg + boost));
}

/**
 * Canonicalize a feed item
 *
 * @param feed_item_id - ID of feed item to canonicalize
 * @returns Canonicalization result
 */
export async function canonicalizeAndDedup(
  feed_item_id: number
): Promise<CanonicalizationResult> {
  const db = new DatabaseAdapter();

  try {
    // Fetch the feed item
    const feedItem = await db.get('feed_items', feed_item_id);

    if (!feedItem) {
      return {
        success: false,
        is_new: false,
        error: 'Feed item not found',
      };
    }

    // Find similar canonical items
    const similarItems = await findSimilarCanonicalItems(
      db,
      feedItem.title_en || feedItem.title_original
    );

    const now = Math.floor(Date.now() / 1000);

    // If similar item found, merge
    if (similarItems.length > 0) {
      const matchingItem = similarItems[0];

      // Create merged canonical item
      const mergedItem: CanonicalItem = {
        id: matchingItem.id,
        feed_item_ids: mergeUniqueArrays(matchingItem.feed_item_ids, [feed_item_id]),
        canonical_title: matchingItem.canonical_title, // Keep original
        canonical_summary: matchingItem.canonical_summary, // Keep original
        canonical_url: matchingItem.canonical_url, // Keep original
        source_urls: mergeUniqueArrays(matchingItem.source_urls, [feedItem.source_url]),
        published_at: Math.min(matchingItem.published_at, feedItem.published_at),
        last_updated_at: now,
        reliability_score: calculateAggregatedReliability([
          matchingItem.reliability_score,
          feedItem.reliability,
        ]),
        verification_count: matchingItem.verification_count + 1,
        entity_places: mergeUniqueArrays(
          matchingItem.entity_places,
          feedItem.entity_places || []
        ),
        entity_orgs: mergeUniqueArrays(matchingItem.entity_orgs, feedItem.entity_orgs || []),
        tags: mergeUniqueArrays(matchingItem.tags, feedItem.tags || []),
      };

      // TODO: Update canonical_items table when it exists
      // await db.update('canonical_items', matchingItem.id, {
      //   feed_item_ids: JSON.stringify(mergedItem.feed_item_ids),
      //   source_urls: JSON.stringify(mergedItem.source_urls),
      //   last_updated_at: mergedItem.last_updated_at,
      //   reliability_score: mergedItem.reliability_score,
      //   verification_count: mergedItem.verification_count,
      //   entity_places: JSON.stringify(mergedItem.entity_places),
      //   entity_orgs: JSON.stringify(mergedItem.entity_orgs),
      //   tags: JSON.stringify(mergedItem.tags),
      // });

      return {
        success: true,
        canonical_item: mergedItem,
        is_new: false,
        merged_with: matchingItem.id,
      };
    }

    // No similar item found - create new canonical item
    const newCanonicalItem: CanonicalItem = {
      feed_item_ids: [feed_item_id],
      canonical_title: feedItem.title_en || feedItem.title_original,
      canonical_summary: feedItem.summary_en || feedItem.content_original || '',
      canonical_url: feedItem.canonical_url,
      source_urls: [feedItem.source_url],
      published_at: feedItem.published_at,
      last_updated_at: now,
      reliability_score: feedItem.reliability,
      verification_count: 1,
      entity_places: feedItem.entity_places || [],
      entity_orgs: feedItem.entity_orgs || [],
      tags: feedItem.tags || [],
      created_at: now,
    };

    // TODO: Insert into canonical_items table when it exists
    // const canonical_id = await db.insert('canonical_items', {
    //   feed_item_ids: JSON.stringify(newCanonicalItem.feed_item_ids),
    //   canonical_title: newCanonicalItem.canonical_title,
    //   canonical_summary: newCanonicalItem.canonical_summary,
    //   canonical_url: newCanonicalItem.canonical_url,
    //   source_urls: JSON.stringify(newCanonicalItem.source_urls),
    //   published_at: newCanonicalItem.published_at,
    //   last_updated_at: newCanonicalItem.last_updated_at,
    //   reliability_score: newCanonicalItem.reliability_score,
    //   verification_count: newCanonicalItem.verification_count,
    //   entity_places: JSON.stringify(newCanonicalItem.entity_places),
    //   entity_orgs: JSON.stringify(newCanonicalItem.entity_orgs),
    //   tags: JSON.stringify(newCanonicalItem.tags),
    //   created_at: newCanonicalItem.created_at,
    // });
    //
    // newCanonicalItem.id = canonical_id;

    return {
      success: true,
      canonical_item: newCanonicalItem,
      is_new: true,
    };
  } catch (error) {
    console.error('Canonicalization failed:', error);
    return {
      success: false,
      is_new: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch canonicalize multiple feed items
 */
export async function canonicalizeAndDedupBatch(
  feed_item_ids: number[]
): Promise<CanonicalizationResult[]> {
  const results: CanonicalizationResult[] = [];

  for (const id of feed_item_ids) {
    const result = await canonicalizeAndDedup(id);
    results.push(result);
  }

  return results;
}
