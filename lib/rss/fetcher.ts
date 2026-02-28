import { getDatabase, DB } from '../db/client';
import { RateLimiter } from './rate-limiter';
import { fetchAndNormalize } from './parser';
import { detectDuplicate } from '../processing/deduplicator';
import { translateText } from '../processing/translator';
import { extractTags, extractEntities } from '../processing/tagger';
import { FeedItem, RSSSource } from '@/types/feed';

export interface IngestionResult {
  success: boolean;
  sources_processed: number;
  items_fetched: number;
  items_new: number;
  items_duplicate: number;
  duration_ms: number;
  errors: string[];
}

/**
 * Ingest all fetchable sources
 */
export async function ingestAllSources(): Promise<IngestionResult> {
  const startTime = Date.now();
  const db = getDatabase();
  const errors: string[] = [];

  // Get all active sources that can be fetched
  const fetchableSourceIds = RateLimiter.getFetchableSources();

  console.log(`📡 Found ${fetchableSourceIds.length} sources ready to fetch`);

  let itemsFetched = 0;
  let itemsNew = 0;
  let itemsDuplicate = 0;

  // Fetch sources with concurrency limit
  const CONCURRENT_LIMIT = 5;
  const sourceChunks = chunkArray(fetchableSourceIds, CONCURRENT_LIMIT);

  for (const chunk of sourceChunks) {
    await Promise.all(
      chunk.map(async sourceId => {
        try {
          const result = await ingestSource(sourceId);

          itemsFetched += result.itemsFetched;
          itemsNew += result.itemsNew;
          itemsDuplicate += result.itemsDuplicate;

          // Record fetch
          RateLimiter.recordFetch(sourceId);

          // Log success
          DB.insert('ingestion_logs', {
            source_id: sourceId,
            status: 'success',
            items_fetched: result.itemsFetched,
            items_new: result.itemsNew,
            items_duplicate: result.itemsDuplicate,
            duration_ms: result.durationMs,
          });
        } catch (error) {
          const errorMsg = `Source ${sourceId}: ${(error as Error).message}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);

          // Log error
          DB.insert('ingestion_logs', {
            source_id: sourceId,
            status: 'error',
            items_fetched: 0,
            items_new: 0,
            items_duplicate: 0,
            error_message: (error as Error).message,
          });
        }
      })
    );
  }

  const duration = Date.now() - startTime;

  return {
    success: errors.length === 0,
    sources_processed: fetchableSourceIds.length,
    items_fetched: itemsFetched,
    items_new: itemsNew,
    items_duplicate: itemsDuplicate,
    duration_ms: duration,
    errors,
  };
}

/**
 * Ingest a single source
 */
async function ingestSource(sourceId: number): Promise<{
  itemsFetched: number;
  itemsNew: number;
  itemsDuplicate: number;
  durationMs: number;
}> {
  const startTime = Date.now();
  const db = getDatabase();

  // Get source details
  const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(sourceId) as RSSSource;

  if (!source) {
    throw new Error(`Source ${sourceId} not found`);
  }

  console.log(`\n🔄 Fetching: ${source.name}`);

  // Fetch and normalize items
  const normalizedItems = await fetchAndNormalize(source.url);

  console.log(`  Found ${normalizedItems.length} items`);

  let itemsNew = 0;
  let itemsDuplicate = 0;

  // Process each item
  for (const item of normalizedItems) {
    try {
      // Translate title if not English
      let titleEn = item.title_original;
      if (item.lang !== 'en') {
        titleEn = await translateText(item.title_original, item.lang, 'en');
      }

      // Check for duplicates
      const dupResult = detectDuplicate(item.canonical_url, titleEn, item.published_at);

      if (dupResult.isDuplicate) {
        itemsDuplicate++;
        continue;
      }

      // Extract tags and entities
      const tags = extractTags(titleEn, item.content_original);
      const entities = extractEntities(titleEn + ' ' + (item.content_original || ''));

      // Create summary (first 200 chars of content)
      const summaryEn = item.content_original
        ? item.content_original.substring(0, 200) + '...'
        : undefined;

      // Insert into database
      const feedItem: Partial<FeedItem> = {
        source_id: source.id!,
        source_name: source.name,
        source_url: source.url,
        canonical_url: item.canonical_url,
        published_at: item.published_at,
        fetched_at: Math.floor(Date.now() / 1000),
        title_original: item.title_original,
        content_original: item.content_original,
        lang: item.lang,
        title_en: titleEn,
        summary_en: summaryEn,
        reliability: source.reliability,
        is_duplicate: false,
      };

      const itemId = DB.insert('feed_items', {
        ...feedItem,
        is_duplicate: 0, // Convert boolean to integer
        tags: JSON.stringify(tags),
        entity_places: JSON.stringify(entities.places),
        entity_orgs: JSON.stringify(entities.orgs),
      });

      console.log(`  ✓ Added: ${titleEn.substring(0, 60)}...`);
      itemsNew++;
    } catch (error) {
      console.error(`  ❌ Failed to process item:`, error);
    }
  }

  const duration = Date.now() - startTime;

  console.log(`  📊 New: ${itemsNew}, Duplicates: ${itemsDuplicate}, Duration: ${duration}ms`);

  return {
    itemsFetched: normalizedItems.length,
    itemsNew,
    itemsDuplicate,
    durationMs: duration,
  };
}

/**
 * Helper to chunk array
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
