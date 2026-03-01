/**
 * Orchestrator Pipeline
 *
 * Main orchestrator that coordinates all pipeline stages.
 * Processes feed items through the complete pipeline:
 * FeedItem → EventFrame → Signals → Scenarios
 */

import { ingestRawItem, type IngestRawItemInput, type IngestRawItemResult } from './ingestRawItem';
import { canonicalizeAndDedup, type CanonicalizationResult } from './canonicalizeAndDedup';
import { extractEventFrame, type ExtractionResult } from './extractEventFrame';
import { mapSignals, type SignalMappingResult } from './mapSignals';

export interface PipelineInput {
  feedItem: IngestRawItemInput;
}

export interface PipelineResult {
  success: boolean;
  feed_item_id?: number;
  is_duplicate?: boolean;
  event_frame_id?: number;
  signal_activations?: number[];
  stages: {
    ingest: IngestRawItemResult;
    canonicalize?: CanonicalizationResult;
    extract?: ExtractionResult;
    signals?: SignalMappingResult;
  };
  error?: string;
  duration_ms?: number;
}

/**
 * Check if orchestrator is enabled via feature flag
 */
export function isOrchestratorEnabled(): boolean {
  return process.env.ORCH_ENABLED === 'true';
}

/**
 * Process a single feed item through the complete pipeline
 */
export async function processFeedItem(input: PipelineInput): Promise<PipelineResult> {
  const startTime = Date.now();
  const result: PipelineResult = {
    success: false,
    stages: {
      ingest: { success: false, is_duplicate: false },
    },
  };

  try {
    // Stage 1: Ingest raw item
    const ingestResult = await ingestRawItem(input.feedItem);
    result.stages.ingest = ingestResult;

    if (!ingestResult.success) {
      result.error = `Ingestion failed: ${ingestResult.error}`;
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    result.feed_item_id = ingestResult.feed_item_id;
    result.is_duplicate = ingestResult.is_duplicate;

    // Skip further processing for duplicates
    if (ingestResult.is_duplicate) {
      result.success = true;
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    if (!ingestResult.feed_item_id) {
      result.error = 'No feed_item_id returned from ingestion';
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    // Stage 2: Canonicalize and deduplicate (optional - table doesn't exist yet)
    if (isOrchestratorEnabled()) {
      try {
        const canonicalResult = await canonicalizeAndDedup(ingestResult.feed_item_id);
        result.stages.canonicalize = canonicalResult;
      } catch (error) {
        console.warn('Canonicalization failed (non-fatal):', error);
      }
    }

    // Stage 3: Extract event frame (only if orchestrator enabled)
    if (isOrchestratorEnabled()) {
      const extractResult = await extractEventFrame(ingestResult.feed_item_id);
      result.stages.extract = extractResult;

      if (!extractResult.success) {
        result.error = `Event extraction failed: ${extractResult.error}`;
        result.duration_ms = Date.now() - startTime;
        return result;
      }

      // Skip signal mapping if event was skipped (not an event)
      if (extractResult.skipped) {
        result.success = true;
        result.duration_ms = Date.now() - startTime;
        return result;
      }

      result.event_frame_id = extractResult.event_frame_id;

      // Stage 4: Map signals (only if event frame was created)
      if (extractResult.event_frame_id) {
        const signalsResult = await mapSignals(extractResult.event_frame_id);
        result.stages.signals = signalsResult;

        if (!signalsResult.success) {
          result.error = `Signal mapping failed: ${signalsResult.error}`;
          result.duration_ms = Date.now() - startTime;
          return result;
        }

        result.signal_activations = signalsResult.activation_ids;
      }
    }

    result.success = true;
    result.duration_ms = Date.now() - startTime;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown pipeline error';
    result.duration_ms = Date.now() - startTime;
    return result;
  }
}

/**
 * Process multiple feed items in batch
 */
export async function processFeedItemsBatch(inputs: PipelineInput[]): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];

  for (const input of inputs) {
    const result = await processFeedItem(input);
    results.push(result);
  }

  return results;
}

/**
 * Get pipeline statistics
 */
export interface PipelineStats {
  total_processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  events_created: number;
  signals_activated: number;
  avg_duration_ms: number;
}

export function calculatePipelineStats(results: PipelineResult[]): PipelineStats {
  const stats: PipelineStats = {
    total_processed: results.length,
    successful: 0,
    failed: 0,
    duplicates: 0,
    events_created: 0,
    signals_activated: 0,
    avg_duration_ms: 0,
  };

  let totalDuration = 0;

  for (const result of results) {
    if (result.success) {
      stats.successful++;
    } else {
      stats.failed++;
    }

    if (result.is_duplicate) {
      stats.duplicates++;
    }

    if (result.event_frame_id) {
      stats.events_created++;
    }

    if (result.signal_activations) {
      stats.signals_activated += result.signal_activations.length;
    }

    if (result.duration_ms) {
      totalDuration += result.duration_ms;
    }
  }

  stats.avg_duration_ms = results.length > 0 ? totalDuration / results.length : 0;

  return stats;
}
