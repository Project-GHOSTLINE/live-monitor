/**
 * Raw Item Ingestion Module
 *
 * Validates and stores raw feed items in the database.
 * First stage of the orchestrator pipeline.
 *
 * Pipeline: RSS Feed → ingestRawItem → feed_items table
 */

import { DatabaseAdapter } from '@/lib/db/adapter';
import type { FeedItem } from '@/types/feed';

export interface IngestRawItemInput {
  source_id: number;
  source_name: string;
  source_url: string;
  canonical_url: string;
  published_at: number; // Unix timestamp in SECONDS
  title_original: string;
  content_original?: string;
  lang: string;
  reliability: number; // 0-1 or 1-5 depending on source
  entity_places?: string[];
  entity_orgs?: string[];
  tags?: string[];
}

export interface IngestRawItemResult {
  success: boolean;
  feed_item_id?: number;
  is_duplicate: boolean;
  duplicate_of?: number;
  error?: string;
}

/**
 * Check if item already exists based on canonical URL
 */
async function checkDuplicate(
  db: DatabaseAdapter,
  canonical_url: string
): Promise<{ isDuplicate: boolean; duplicateId?: number }> {
  try {
    const existing = await db.query(
      'SELECT id FROM feed_items WHERE canonical_url = ? LIMIT 1',
      [canonical_url]
    );

    if (existing && existing.length > 0) {
      return {
        isDuplicate: true,
        duplicateId: existing[0].id,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Duplicate check failed:', error);
    // On error, assume not duplicate to avoid blocking ingestion
    return { isDuplicate: false };
  }
}

/**
 * Validate raw item input
 */
function validateInput(input: IngestRawItemInput): { valid: boolean; error?: string } {
  if (!input.source_id || input.source_id <= 0) {
    return { valid: false, error: 'Invalid source_id' };
  }

  if (!input.canonical_url || input.canonical_url.trim() === '') {
    return { valid: false, error: 'canonical_url is required' };
  }

  if (!input.title_original || input.title_original.trim() === '') {
    return { valid: false, error: 'title_original is required' };
  }

  if (!input.published_at || input.published_at <= 0) {
    return { valid: false, error: 'Invalid published_at timestamp' };
  }

  // Check timestamp is in seconds (not milliseconds)
  const now = Math.floor(Date.now() / 1000);
  if (input.published_at > now + 86400) {
    // Allow up to 1 day in future
    return { valid: false, error: 'published_at appears to be in milliseconds, not seconds' };
  }

  return { valid: true };
}

/**
 * Normalize reliability score to 1-5 scale
 */
function normalizeReliability(reliability: number): number {
  if (reliability >= 1 && reliability <= 5) {
    return Math.round(reliability);
  }

  if (reliability >= 0 && reliability <= 1) {
    // Convert 0-1 scale to 1-5 scale
    return Math.max(1, Math.min(5, Math.round(reliability * 4 + 1)));
  }

  // Default to medium reliability
  return 3;
}

/**
 * Ingest a raw feed item
 *
 * @param input - Raw feed item data
 * @returns Result with feed_item_id or error
 */
export async function ingestRawItem(input: IngestRawItemInput): Promise<IngestRawItemResult> {
  const db = new DatabaseAdapter();

  try {
    // Validate input
    const validation = validateInput(input);
    if (!validation.valid) {
      return {
        success: false,
        is_duplicate: false,
        error: validation.error,
      };
    }

    // Check for duplicates
    const duplicateCheck = await checkDuplicate(db, input.canonical_url);
    if (duplicateCheck.isDuplicate) {
      return {
        success: true,
        is_duplicate: true,
        duplicate_of: duplicateCheck.duplicateId,
        feed_item_id: duplicateCheck.duplicateId,
      };
    }

    // Prepare data for insertion
    const now = Math.floor(Date.now() / 1000);
    const feedItemData: Partial<FeedItem> = {
      source_id: input.source_id,
      source_name: input.source_name,
      source_url: input.source_url,
      canonical_url: input.canonical_url,
      published_at: input.published_at,
      fetched_at: now,
      title_original: input.title_original,
      content_original: input.content_original,
      lang: input.lang,
      title_en: input.title_original, // Will be translated later
      summary_en: input.content_original,
      tags: input.tags,
      entity_places: input.entity_places,
      entity_orgs: input.entity_orgs,
      reliability: normalizeReliability(input.reliability),
      is_duplicate: false,
      created_at: now,
    };

    // Insert into database
    const feed_item_id = await db.insert('feed_items', feedItemData);

    return {
      success: true,
      feed_item_id,
      is_duplicate: false,
    };
  } catch (error) {
    console.error('Raw item ingestion failed:', error);
    return {
      success: false,
      is_duplicate: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch ingest multiple raw items
 *
 * @param items - Array of raw feed items
 * @returns Results for each item
 */
export async function ingestRawItemsBatch(
  items: IngestRawItemInput[]
): Promise<IngestRawItemResult[]> {
  const results: IngestRawItemResult[] = [];

  for (const item of items) {
    const result = await ingestRawItem(item);
    results.push(result);
  }

  return results;
}
