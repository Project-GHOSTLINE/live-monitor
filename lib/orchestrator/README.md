# Orchestrator Pipeline

Event processing orchestrator for WW3 Monitor. Transforms raw RSS feed items into structured event frames and signal activations.

## Architecture

```
┌─────────────┐
│ RSS Feeds   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Ingest Raw Item                                │
│ - Validate source data                                  │
│ - Detect duplicates (canonical URL)                     │
│ - Store in feed_items table                             │
│ - Return feed_item_id                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 2: Canonicalize & Deduplicate                     │
│ - Normalize title/content                               │
│ - Detect similar items (title similarity > 70%)         │
│ - Merge duplicates into canonical items                 │
│ - Aggregate source URLs (evidence)                      │
│ NOTE: canonical_items table not yet in schema           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 3: Extract Event Frame                            │
│ - Classify event type (18 types)                        │
│ - Resolve location (offline geo with 563 cities)        │
│ - Calculate severity (1-10 scale)                       │
│ - Extract actors, casualties, weapons                   │
│ - Store in event_frames table                           │
│ - Skip non-events (confidence < 35%)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Stage 4: Map Signals                                    │
│ - Match events against 19 signal definitions            │
│ - Calculate confidence scores                           │
│ - Create signal activations with expiry                 │
│ - Store in signal_activations table                     │
└─────────────────────────────────────────────────────────┘
```

## Pipeline Stages

### Stage 1: Raw Item Ingestion

**Module**: `ingestRawItem.ts`

**Purpose**: Validate and store raw feed items

**Input**:
```typescript
{
  source_id: number;
  source_name: string;
  source_url: string;
  canonical_url: string;
  published_at: number; // SECONDS (not milliseconds!)
  title_original: string;
  content_original?: string;
  lang: string;
  reliability: number; // 1-5 or 0-1 (auto-normalized)
  entity_places?: string[];
  entity_orgs?: string[];
  tags?: string[];
}
```

**Output**:
```typescript
{
  success: boolean;
  feed_item_id?: number;
  is_duplicate: boolean;
  duplicate_of?: number;
  error?: string;
}
```

**Features**:
- Duplicate detection by canonical URL
- Timestamp validation (must be in seconds)
- Reliability normalization (converts 0-1 to 1-5 scale)
- Graceful error handling

### Stage 2: Canonicalization

**Module**: `canonicalizeAndDedup.ts`

**Purpose**: Merge similar items into canonical records

**Algorithm**:
- Jaccard similarity for title matching (>70% threshold)
- 24-hour time window for candidate search
- Merge entity arrays (unique values only)
- Aggregate reliability scores

**Status**: Prepared for future `canonical_items` table (not in current schema)

### Stage 3: Event Frame Extraction

**Module**: `extractEventFrame.ts`

**Purpose**: Extract structured event data from unstructured text

**Event Types** (18 total):
- **Kinetic**: missile_strike, drone_strike, airstrike, artillery_shelling, naval_strike, ground_assault, rocket_attack, air_defense
- **Non-Kinetic**: protest, sanction, cyberattack, diplomatic_action, intelligence_ops, information_warfare
- **Incident**: explosion, accident, sabotage, unknown

**Extraction Process**:
1. Classify event type using keyword pattern matching
2. Calculate severity (1-10) based on type and indicators
3. Resolve location using offline geo library
4. Extract actors (attacker, target)
5. Extract casualties (killed, wounded, civilian flag)
6. Store evidence (first 500 chars of text)

**Skipping Logic**:
- Skip if confidence < 35% (not an event)
- Skip if no location found (can't map)

### Stage 4: Signal Mapping

**Module**: `mapSignals.ts`

**Purpose**: Detect strategic signals from events

**Signals** (19 seeded):
- **Military**: SIG_AIRSPACE_CLOSED, SIG_TROOPS_MOBILIZED, SIG_NAVAL_DEPLOYMENT, SIG_AIR_DEFENSE_ACTIVE, SIG_MILITARY_EXERCISE
- **Diplomatic**: SIG_EMBASSY_CLOSURE, SIG_AMBASSADOR_RECALLED, SIG_DIPLOMATIC_BREAKDOWN, SIG_ALLIANCE_INVOKED
- **Economic**: SIG_SANCTIONS_IMPOSED, SIG_ENERGY_DISRUPTION, SIG_FINANCIAL_RESTRICTIONS
- **Cyber**: SIG_CYBER_ATTACK_MAJOR, SIG_COMM_DISRUPTION
- **Infrastructure**: SIG_BORDER_CLOSED, SIG_TRANSPORT_DISRUPTION
- **Humanitarian**: SIG_MASS_EVACUATION, SIG_REFUGEE_CRISIS, SIG_CIVILIAN_CASUALTIES

**Matching Rules**:
- Event type match (e.g., air_defense → SIG_AIR_DEFENSE_ACTIVE)
- Keyword pattern match (regex)
- Minimum severity threshold
- Confidence boost for strong matches

**Expiration**:
- Each signal has a half-life (e.g., 168 hours)
- Expiration = activation_time + (3 × half_life)
- Signals decay over time

## API Endpoints

### POST /api/orchestrator/process

Process feed items through orchestrator pipeline

**Authentication**: Required (Bearer token)

**Rate Limit**: 10 requests/minute

**Request Body**:
```json
{
  "feed_item_id": 123,      // Process single item
  "batch_size": 10          // Or process batch of unprocessed
}
```

**Response**:
```json
{
  "success": true,
  "processed": 10,
  "stats": {
    "total_processed": 10,
    "successful": 9,
    "failed": 1,
    "duplicates": 2,
    "events_created": 7,
    "signals_activated": 12,
    "avg_duration_ms": 450
  }
}
```

### GET /api/events

Query event frames

**Query Parameters**:
- `window`: 1h, 6h, 24h, 7d, 30d (default: 24h)
- `type`: Event type filter (e.g., missile_strike)
- `severity`: Minimum severity (1-10)
- `limit`: Max results (default: 100, max: 1000)
- `offset`: Pagination offset

**Response**:
```json
{
  "events": [
    {
      "id": 1,
      "event_type": "missile_strike",
      "severity": 8,
      "occurred_at": 1709136000,
      "location": {
        "lat": 31.7683,
        "lng": 35.2137,
        "precision": "city",
        "display_name": "Jerusalem"
      },
      "actors": {
        "attacker": "Iran",
        "target": "Israel"
      },
      "confidence": 0.85,
      "source_url": "https://..."
    }
  ],
  "total": 42,
  "response_time_ms": 23
}
```

## Feature Flag

Set environment variable:
```bash
ORCH_ENABLED=true
```

**When disabled**:
- Pipeline returns gracefully
- APIs return empty results with message
- No errors thrown

## Usage Example

```typescript
import { processFeedItem } from '@/lib/orchestrator';

const result = await processFeedItem({
  feedItem: {
    source_id: 1,
    source_name: 'Reuters',
    source_url: 'https://reuters.com/article/123',
    canonical_url: 'https://reuters.com/article/123',
    published_at: Math.floor(Date.now() / 1000), // SECONDS!
    title_original: 'Missile strike reported in Gaza',
    content_original: 'Multiple casualties reported...',
    lang: 'en',
    reliability: 4,
    entity_places: ['Gaza City'],
    tags: ['Military'],
  },
});

console.log(result);
// {
//   success: true,
//   feed_item_id: 194,
//   event_frame_id: 42,
//   signal_activations: [15, 16],
//   stages: { ... },
//   duration_ms: 456
// }
```

## Error Handling

All modules follow consistent error handling:
- Return `{ success: false, error: string }` on failure
- Never throw exceptions (graceful degradation)
- Log errors to console with context
- Partial failures don't break pipeline

## Performance Targets

- **Ingestion**: <50ms per item
- **Event extraction**: <200ms per item
- **Signal mapping**: <100ms per event
- **End-to-end pipeline**: <500ms per item
- **Batch processing**: 10-20 items/second

## Database Schema

See `lib/db/migrations/003_event_processing_sqlite.sql` for table schemas:
- `event_frames`: Structured event data
- `signals`: Signal definitions (19 seeded)
- `signal_activations`: Signal detection records

## Testing

Process existing feed items:
```bash
curl -X POST https://yourdomain.com/api/orchestrator/process \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10}'
```

Query events:
```bash
curl "https://yourdomain.com/api/events?window=24h&severity=7"
```

## Future Enhancements

1. **canonical_items table**: Add to schema for deduplication
2. **Weapon system extraction**: Detect specific weapons (ATACMS, Shahed-136)
3. **Target type classification**: Infrastructure, military, civilian
4. **Multi-source verification**: Auto-verify with 2+ sources
5. **Real-time processing**: Trigger pipeline on RSS ingest
6. **Batch optimization**: Process 100+ items in parallel

## Dependencies

- `lib/db/adapter.ts`: Database abstraction
- `lib/geo/resolveLocation.ts`: Offline geo resolution
- `types/feed.ts`: FeedItem types
- `types/map/EventFrame.ts`: Event types
