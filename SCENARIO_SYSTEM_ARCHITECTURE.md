# Scenario Analysis System Architecture

Visual guide to system architecture and data flow.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEWS INGESTION LAYER                            │
│                                                                         │
│  RSS Feeds → Feed Items → Translation → Entity Extraction → Clustering │
│     ↓            ↓            ↓              ↓                  ↓       │
│  [sources]  [feed_items]  [trans_cache]  [entities]      [clusters]    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ feed_item_id
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EVENT EXTRACTION LAYER                           │
│                                                                         │
│  ┌────────────────────────────────────────────────────────┐            │
│  │  Event Extractor (AI/Rules)                            │            │
│  │  - Analyzes feed_item content                          │            │
│  │  - Extracts structured events                          │            │
│  │  - Classifies event type                               │            │
│  │  - Identifies actors and locations                     │            │
│  │  - Assigns severity (1-10)                             │            │
│  │  - Calculates confidence (0.0-1.0)                     │            │
│  └────────────────────────────────────────────────────────┘            │
│                                 │                                       │
│                                 ▼                                       │
│                         [event_frames]                                  │
│                      {                                                  │
│                        event_type: 'airspace_closure',                 │
│                        actors: [{name, role, country}],                │
│                        location: {country, region},                    │
│                        severity: 8,                                    │
│                        confidence: 0.92,                               │
│                        evidence: "text excerpt"                        │
│                      }                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ event_frame_id
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SIGNAL ACTIVATION LAYER                         │
│                                                                         │
│  ┌────────────────────────────────────────────────────────┐            │
│  │  Signal Matcher                                         │            │
│  │  - Maps event_type → signal_code                       │            │
│  │  - Checks signal catalog                               │            │
│  │  - Creates signal activation                           │            │
│  │  - Sets expiration (now + half_life × 3)               │            │
│  └────────────────────────────────────────────────────────┘            │
│                                 │                                       │
│                    ┌────────────┴────────────┐                         │
│                    ▼                         ▼                         │
│              [signals]              [signal_activations]               │
│          (Catalog of 19+)            {                                 │
│          {                             signal_id: 1,                   │
│            code: 'SIG_AIRSPACE_CLOSED', event_frame_id: 123,          │
│            weight: 0.8,                 confidence: 0.92,              │
│            decay_rate: 0.1,             activated_at: 1709136000,     │
│            half_life_hours: 24,         expires_at: 1709222400,       │
│            scope: 'regional',           is_active: true,              │
│            requires_verification: true  is_verified: false            │
│          }                            }                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ signal_id
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SCENARIO SCORING LAYER                           │
│                                                                         │
│  ┌────────────────────────────────────────────────────────┐            │
│  │  Score Calculator                                       │            │
│  │  - Gets all active scenarios                           │            │
│  │  - For each scenario:                                  │            │
│  │    • Find trigger signals                              │            │
│  │    • Get active signal activations                     │            │
│  │    • Calculate decay for each activation               │            │
│  │    • Weight × Confidence × Decay                       │            │
│  │    • Sum all contributions                             │            │
│  │    • Normalize to [0, 1]                               │            │
│  │    • Calculate probability                             │            │
│  │  - Determine trend (compare with previous)             │            │
│  └────────────────────────────────────────────────────────┘            │
│                                 │                                       │
│                    ┌────────────┴────────────┐                         │
│                    ▼                         ▼                         │
│        [scenario_definitions]        [scenario_scores]                 │
│        (3 Pre-loaded)                 {                                │
│        {                                scenario_id: 1,                │
│          code: 'SCENARIO_NATO_RUSSIA', score: 0.736,                  │
│          trigger_signals: [            probability: 0.82,             │
│            'SIG_TROOPS_MOBILIZED',     trend: 'increasing',           │
│            'SIG_AIRSPACE_CLOSED',      active_signals: [...],         │
│            'SIG_AIR_DEFENSE_ACTIVE'    signal_count: 3,               │
│          ],                             confidence: 0.88,              │
│          base_threshold: 0.3,          calculated_at: 1709136000      │
│          impact_areas: [...]         }                                │
│        }                                                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ scenario_id
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         IMPACT ASSESSMENT LAYER                         │
│                                                                         │
│  ┌────────────────────────────────────────────────────────┐            │
│  │  Impact Analyzer                                        │            │
│  │  - For each high-probability scenario:                 │            │
│  │    • Assess impact by domain                           │            │
│  │    • Determine impact level                            │            │
│  │    • Calculate impact score (0-100)                    │            │
│  │    • Identify timeframe                                │            │
│  │    • Assess reversibility                              │            │
│  │    • Link supporting evidence                          │            │
│  └────────────────────────────────────────────────────────┘            │
│                                 │                                       │
│                                 ▼                                       │
│                        [impact_matrix]                                  │
│                      {                                                  │
│                        scenario_id: 1,                                 │
│                        domain: 'aviation',                             │
│                        impact_level: 'high',                           │
│                        impact_score: 75,                               │
│                        reasoning: "Airspace closures...",              │
│                        timeframe: 'immediate',                         │
│                        reversibility: 'reversible',                    │
│                        affected_regions: ['Eastern Europe']            │
│                      }                                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUDIT & CHANGELOG LAYER                        │
│                                                                         │
│                        [scenario_changelog]                             │
│                      {                                                  │
│                        scenario_id: 1,                                 │
│                        change_type: 'threshold_crossed',               │
│                        delta: {                                        │
│                          field: 'probability',                         │
│                          old_value: 0.6,                               │
│                          new_value: 0.82                               │
│                        },                                              │
│                        reason: 'New airspace closure detected',        │
│                        triggered_by: 'event:123',                      │
│                        timestamp: 1709136000                           │
│                      }                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example

### Example: Ukraine Airspace Closure

```
1. NEWS INGESTION
   ├─ RSS Feed: "Ukraine closes airspace over eastern regions"
   ├─ Translated to English
   ├─ Saved to feed_items (id: 12345)
   └─ Entities extracted: [Ukraine, Russia, Eastern Europe]

2. EVENT EXTRACTION
   ├─ AI/Rules analyze content
   ├─ Extract structured event:
   │  {
   │    event_type: 'airspace_closure',
   │    actors: [{name: 'Ukraine', role: 'defender', country: 'UA'}],
   │    location: {country: 'Ukraine', region: 'Eastern'},
   │    severity: 8,
   │    confidence: 0.92,
   │    evidence: "Ukraine closes airspace over eastern regions"
   │  }
   └─ Save to event_frames (id: 1)

3. SIGNAL ACTIVATION
   ├─ Match event_type 'airspace_closure' → 'SIG_AIRSPACE_CLOSED'
   ├─ Find signal in catalog (id: 1, weight: 0.8, half_life: 24h)
   ├─ Create activation:
   │  {
   │    signal_id: 1,
   │    event_frame_id: 1,
   │    confidence: 0.92,
   │    activated_at: 1709136000,
   │    expires_at: 1709222400 (24h × 3 = 72h from now)
   │  }
   └─ Save to signal_activations (id: 1)

4. SCENARIO SCORING
   ├─ Find scenarios with 'SIG_AIRSPACE_CLOSED' in trigger_signals
   │  → SCENARIO_NATO_RUSSIA (id: 1)
   │
   ├─ Get all active signal activations for this scenario:
   │  - SIG_AIRSPACE_CLOSED (activated 2h ago, weight: 0.8, confidence: 0.92)
   │  - SIG_TROOPS_MOBILIZED (activated 5d ago, weight: 0.9, confidence: 0.88)
   │
   ├─ Calculate decay for each:
   │  - Airspace: 2h / 24h = 0.083 half-lives → decay = 0.5^0.083 = 0.944
   │  - Troops: 120h / 168h = 0.714 half-lives → decay = 0.5^0.714 = 0.611
   │
   ├─ Calculate contributions:
   │  - Airspace: 0.8 × 0.92 × 0.944 = 0.695
   │  - Troops: 0.9 × 0.88 × 0.611 = 0.484
   │  - Total: 0.695 + 0.484 = 1.179 → normalized to 1.0
   │
   ├─ Calculate probability:
   │  - score / threshold = 1.0 / 0.3 = 3.33 → capped at 1.0
   │  - probability = 1.0 (100%)
   │
   ├─ Determine trend:
   │  - Previous score: 0.72
   │  - Current score: 1.0
   │  - Trend: 'increasing' (38% increase)
   │
   └─ Save to scenario_scores:
      {
        scenario_id: 1,
        score: 1.0,
        probability: 1.0,
        trend: 'increasing',
        signal_count: 2,
        confidence: 0.88
      }

5. IMPACT ASSESSMENT
   ├─ Scenario probability (100%) > threshold → assess impacts
   │
   ├─ Aviation Domain:
   │  - Impact Level: HIGH
   │  - Impact Score: 75/100
   │  - Reasoning: "Airspace closures affecting Eastern European routes"
   │  - Timeframe: immediate
   │  - Reversibility: reversible
   │  - Affected Regions: [Eastern Europe, Baltic States]
   │
   ├─ Energy Domain:
   │  - Impact Level: MODERATE
   │  - Impact Score: 50/100
   │  - Reasoning: "Potential disruption to energy transit routes"
   │  - Timeframe: short_term
   │  - Reversibility: partially_reversible
   │
   └─ Save to impact_matrix

6. CHANGELOG
   ├─ Scenario crossed threshold (0.3 → 1.0)
   └─ Log to scenario_changelog:
      {
        change_type: 'threshold_crossed',
        delta: {field: 'probability', old_value: 0.3, new_value: 1.0},
        reason: 'Airspace closure activated SIG_AIRSPACE_CLOSED',
        triggered_by: 'event:1',
        new_score: 1.0
      }
```

## Scoring Formula Breakdown

### Signal Decay Calculation
```
decay_factor = 0.5 ^ (hours_elapsed / half_life_hours)

Examples:
- Just activated (0h / 24h): 0.5^0 = 1.0 (100%)
- After 12h (12h / 24h): 0.5^0.5 = 0.707 (70.7%)
- After 24h (24h / 24h): 0.5^1 = 0.5 (50%)
- After 48h (48h / 24h): 0.5^2 = 0.25 (25%)
- After 72h (72h / 24h): 0.5^3 = 0.125 (12.5%)
```

### Signal Contribution Calculation
```
contribution = signal.weight × activation.confidence × decay_factor

Example:
SIG_AIRSPACE_CLOSED activated 2 hours ago
- weight: 0.8
- confidence: 0.92
- decay_factor: 0.944 (2h / 24h half-life)
- contribution: 0.8 × 0.92 × 0.944 = 0.695
```

### Scenario Score Calculation
```
raw_score = Σ (contribution for each active signal)
normalized_score = min(raw_score, 1.0)

Example:
- Signal 1 contribution: 0.695
- Signal 2 contribution: 0.484
- Signal 3 contribution: 0.312
- raw_score: 1.491
- normalized_score: min(1.491, 1.0) = 1.0
```

### Probability Calculation
```
probability = min(normalized_score / base_threshold, 1.0)

Examples:
- score: 0.6, threshold: 0.3 → probability: min(2.0, 1.0) = 1.0 (100%)
- score: 0.2, threshold: 0.3 → probability: 0.667 (66.7%)
- score: 0.1, threshold: 0.3 → probability: 0.333 (33.3%)
```

### Trend Determination
```
if current_score > previous_score × 1.1:
  trend = 'increasing'
elif current_score < previous_score × 0.9:
  trend = 'decreasing'
else:
  trend = 'stable'

Examples:
- previous: 0.6, current: 0.72 → 0.72 > 0.66 → increasing
- previous: 0.6, current: 0.62 → stable (within 10%)
- previous: 0.6, current: 0.48 → 0.48 < 0.54 → decreasing
```

## API Request/Response Flow

```
┌──────────────┐
│  Client/UI   │
└──────┬───────┘
       │
       │ POST /api/events/extract
       │ {feed_item_id, event_type, actors, ...}
       ▼
┌─────────────────────────────────┐
│  Event Extraction Endpoint      │
│  1. createEventFrame()          │
│  2. getSignalByCode()           │
│  3. activateSignal()            │
└──────┬──────────────────────────┘
       │
       │ Response: {event_frame, activated_signals}
       ▼
┌──────────────┐
│  Client/UI   │
└──────┬───────┘
       │
       │ POST /api/scenarios/calculate-all
       ▼
┌─────────────────────────────────┐
│  Scenario Calculation Endpoint  │
│  For each scenario:             │
│    1. calculateScenarioScore()  │
│    2. saveScenarioScore()       │
│    3. logScenarioChange()       │
└──────┬──────────────────────────┘
       │
       │ Response: {results[], errors[]}
       ▼
┌──────────────┐
│  Client/UI   │
└──────┬───────┘
       │
       │ GET /api/scenarios/scores
       ▼
┌─────────────────────────────────┐
│  Scenarios Fetch Endpoint       │
│  1. getScenariosWithScores()    │
└──────┬──────────────────────────┘
       │
       │ Response: {scenarios: [...]}
       ▼
┌──────────────────────────────────┐
│  Dashboard Display               │
│  - Scenario cards                │
│  - Probability gauges            │
│  - Trend indicators              │
│  - Active signal counts          │
└──────────────────────────────────┘
```

## Time-Based Processing

### Signal Expiration
```
Signal Activated → Loses Relevance Over Time → Eventually Expires

Timeline:
t=0h:   activation.is_active = true,  decay_factor = 1.0    (100%)
t=24h:  activation.is_active = true,  decay_factor = 0.5    (50%)
t=48h:  activation.is_active = true,  decay_factor = 0.25   (25%)
t=72h:  activation.is_active = false, expires_at reached

After expiration:
- Signal no longer contributes to scenario score
- Historical record preserved
- Can be reactivated by new event
```

### Scenario Score Evolution
```
Score updates based on:
1. New signal activations (increase score)
2. Signal decay over time (decrease score)
3. Signal expiration (remove from calculation)

Example Timeline:
Day 1: New airspace closure → score: 0.8
Day 2: Signal decays 50% → score: 0.4
Day 3: New troop movement → score: 0.9
Day 4: Both signals decay → score: 0.6
Day 5: Airspace signal expires → score: 0.3
```

## Performance Characteristics

### Query Performance
```
Event Frame Creation:     < 10ms   (single INSERT)
Signal Activation:        < 10ms   (single INSERT)
Score Calculation:        < 50ms   (JOIN + aggregation)
Dashboard Load:           < 100ms  (multiple JOINs)
Full Recalculation:       < 500ms  (all scenarios)
```

### Scale Estimates
```
Data Volume (per month):
- Feed Items: 10,000
- Event Frames: 2,000 (20% extraction rate)
- Signal Activations: 3,000 (1.5 signals per event avg)
- Scenario Scores: 2,160 (3 scenarios × 24 updates/day)

Storage (per year):
- Event Frames: ~50MB
- Signal Activations: ~75MB
- Scenario Scores: ~250MB
- Total: ~400MB (excluding feed_items)
```

### Optimization Points
```
1. Index Usage:
   - event_frames(event_type, created_at)
   - signal_activations(signal_id, activated_at, is_active)
   - scenario_scores(scenario_id, calculated_at)

2. Query Patterns:
   - Time-range filters (past 7-30 days)
   - Active-only filters (is_active = true)
   - JOIN on primary keys only

3. Caching Opportunities:
   - Signal catalog (rarely changes)
   - Scenario definitions (rarely changes)
   - Recent scores (5-minute cache)
```

## Summary

The scenario analysis system provides:

**Input:** Unstructured news feed items
**Processing:**
1. Extract structured events
2. Activate normalized signals
3. Calculate scenario probabilities
4. Assess multi-domain impacts
5. Track changes over time

**Output:**
- Real-time scenario probability scores (0-100%)
- Signal activation tracking
- Impact assessments by domain
- Change history and audit trail

All operations are optimized for performance with proper indexing, efficient queries, and scalable architecture supporting 10K+ events per month.
