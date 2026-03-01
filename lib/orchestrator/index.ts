/**
 * Orchestrator Module Index
 *
 * Exports all orchestrator pipeline functions and types
 */

// Main pipeline
export {
  processFeedItem,
  processFeedItemsBatch,
  calculatePipelineStats,
  isOrchestratorEnabled,
  type PipelineInput,
  type PipelineResult,
  type PipelineStats,
} from './pipeline';

// Stage 1: Ingest
export {
  ingestRawItem,
  ingestRawItemsBatch,
  type IngestRawItemInput,
  type IngestRawItemResult,
} from './ingestRawItem';

// Stage 2: Canonicalize
export {
  canonicalizeAndDedup,
  canonicalizeAndDedupBatch,
  type CanonicalItem,
  type CanonicalizationResult,
} from './canonicalizeAndDedup';

// Stage 3: Extract Events
export {
  extractEventFrame,
  extractEventFramesBatch,
  type ExtractedEventFrame,
  type ExtractionResult,
} from './extractEventFrame';

// Stage 4: Map Signals
export {
  mapSignals,
  mapSignalsBatch,
  getActiveSignals,
  type Signal,
  type SignalActivation,
  type SignalMappingResult,
} from './mapSignals';
