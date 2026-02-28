# Architecture du Pipeline de Scénarios

## Vue d'ensemble

Le pipeline d'analyse de scénarios transforme des flux RSS bruts en probabilités de scénarios géopolitiques avec impacts détaillés par domaine.

```
┌─────────────────────────────────────────────────────────────┐
│                       FEED ITEMS (RSS)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Reuters │  │ Al Jaz. │  │   BBC   │  │ France24│  ...  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
└───────┼───────────┼───────────┼───────────┼────────────────┘
        └───────────┴───────────┴───────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               STEP 1: EVENT EXTRACTION                      │
│                  (event-extractor.ts)                       │
│                                                              │
│  Input:  FeedItem[] (title, content, metadata)              │
│  Output: EventFrame[] (typed events with actors)            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Pattern Matching:                                  │    │
│  │  • Regex patterns for event types                 │    │
│  │  • Actor extraction (countries, orgs)             │    │
│  │  • Severity analysis (keywords)                   │    │
│  │  • Confidence calculation                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Example Output:                                             │
│  {                                                           │
│    event_type: "strike",                                    │
│    actors: ["US", "Yemen"],                                 │
│    severity: "high",                                        │
│    confidence: 0.85,                                        │
│    feed_item_id: 123                                        │
│  }                                                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               STEP 2: SIGNAL MAPPING                        │
│                  (signal-mapper.ts)                         │
│                                                              │
│  Input:  EventFrame[] + Source Reliability Map              │
│  Output: Signal[] (normalized, weighted signals)            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Signal Generation:                                 │    │
│  │  • Generate signal IDs (SIG_STRIKE_US_YEMEN)     │    │
│  │  • Calculate weights (event × severity × conf)    │    │
│  │  • Apply recency decay (7-day half-life)         │    │
│  │  • Merge duplicate signals                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Formula:                                                    │
│  weight = (base × severity × confidence) + actor_bonus      │
│  recency = exp(-ln(2) × age_days / 7)                      │
│  score = weight × reliability × recency                     │
│                                                              │
│  Example Output:                                             │
│  {                                                           │
│    signal_id: "SIG_STRIKE_US_YEMEN",                       │
│    weight: 0.75,                                            │
│    reliability: 0.9,                                        │
│    recency_factor: 0.95,                                    │
│    feed_item_ids: [123, 456]                                │
│  }                                                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 3: SCENARIO SCORING                       │
│                 (scenario-scorer.ts)                        │
│                                                              │
│  Input:  Signal[] + Scenario Templates                      │
│  Output: ScenarioScore[] (probabilities + trends)           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Scoring Algorithm:                                 │    │
│  │  1. Check required signals                        │    │
│  │  2. Calculate boost from supporting signals       │    │
│  │  3. Apply inhibit from conflicting signals        │    │
│  │  4. Convert raw score → probability (logistic)    │    │
│  │  5. Calculate confidence from signal quality      │    │
│  │  6. Detect trend (rising/stable/falling)          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Formula:                                                    │
│  raw = baseline + boost - inhibit + activity                │
│  prob = 1 / (1 + exp(-k × (raw - 0.5)))                   │
│                                                              │
│  Scenario Templates:                                         │
│  ┌──────────────────────────────────────────┐              │
│  │ 1. Statu quo instable          (40%)     │              │
│  │ 2. Escalade limitée            (30%)     │              │
│  │ 3. Escalade multi-acteurs      (15%)     │              │
│  │ 4. Attaques infrastructures    (20%)     │              │
│  │ 5. Crise politique interne     (10%)     │              │
│  │ 6. Vague protestations         (15%)     │              │
│  │ 7. Choc économique/énergie     (20%)     │              │
│  │ 8. Renforcement sécuritaire    (25%)     │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
│  Example Output:                                             │
│  {                                                           │
│    scenario_id: "multi_actor_escalation",                   │
│    probability: 0.68,                                       │
│    confidence: 0.82,                                        │
│    trend: "rising",                                         │
│    active_signals: [...]                                    │
│  }                                                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             STEP 4: IMPACT CALCULATION                      │
│                (impact-calculator.ts)                       │
│                                                              │
│  Input:  ScenarioScore[] (with active signals)              │
│  Output: ImpactMatrix[] (domain-specific impacts)           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Impact Rules:                                      │    │
│  │  • Match signals to domain rules                  │    │
│  │  • Map severity → impact level                    │    │
│  │  • Generate reasoning (template-based)            │    │
│  │  • Link to supporting sources                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Impact Domains:                                             │
│  ┌──────────────────────────────────────────┐              │
│  │ ✈️  Aviation         (flight safety)     │              │
│  │ ⚡ Energy           (supply disruption)  │              │
│  │ 💻 Cyber            (threat level)       │              │
│  │ 🏥 Humanitarian     (crisis severity)    │              │
│  │ 📦 Supply Chain     (logistics impact)   │              │
│  │ 💰 Financial        (market volatility)  │              │
│  │ 🛡️  Security         (risk level)        │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
│  Example Output:                                             │
│  {                                                           │
│    scenario_id: "multi_actor_escalation",                   │
│    impacts: [                                               │
│      {                                                       │
│        domain: "aviation",                                  │
│        level: "high",                                       │
│        reasoning: "Risque accru pour les vols...",          │
│        supporting_signals: ["SIG_STRIKE_US_YEMEN"],         │
│        source_links: [123, 456]                             │
│      }                                                       │
│    ],                                                        │
│    overall_severity: "high"                                 │
│  }                                                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   PIPELINE RESULT                           │
│                                                              │
│  {                                                           │
│    events: EventFrame[],         // Step 1 output           │
│    signals: Signal[],            // Step 2 output           │
│    scores: ScenarioScore[],      // Step 3 output           │
│    impacts: ImpactMatrix[],      // Step 4 output           │
│    changelog: ScenarioChangelog[], // Changes detected      │
│    stats: {                                                  │
│      events_extracted: 42,                                  │
│      signals_generated: 28,                                 │
│      scenarios_scored: 8,                                   │
│      processing_time_ms: 156                                │
│    },                                                        │
│    validation_errors: []         // Anti-hallucination      │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Flow de données détaillé

### 1. Event Extraction

```
FeedItem
├── title: "US strikes Houthi targets"
├── content: "US military conducted..."
├── reliability: 0.9
└── published_at: 1234567890
        ↓
    [Pattern Matching]
        ↓
EventFrame
├── event_type: "strike"
├── actors: ["US", "Houthis"]
├── severity: "high"
├── confidence: 0.85
└── feed_item_id: 123
```

### 2. Signal Mapping

```
EventFrame
├── event_type: "strike"
├── actors: ["US", "Houthis"]
├── severity: "high"
└── confidence: 0.85
        ↓
    [Weight Calculation]
    base = 0.8 (strike weight)
    severity = 1.5 (high multiplier)
    confidence = 0.85
    weight = 0.8 × 1.5 × 0.85 = 1.02 (capped to 1.0)
        ↓
    [Recency Decay]
    age = 2 hours
    recency = exp(-ln(2) × 2/168) = 0.99
        ↓
Signal
├── signal_id: "SIG_STRIKE_US_HOUTHIS"
├── weight: 1.0
├── reliability: 0.9
├── recency_factor: 0.99
└── final_score: 1.0 × 0.9 × 0.99 = 0.891
```

### 3. Scenario Scoring

```
Scenario Template: "multi_actor_escalation"
├── baseline_probability: 0.15
├── required_signals: ["SIG_STRIKE", "SIG_MULTI_ACTOR"]
├── boost_signals: ["SIG_TROOP_MOVEMENT"]
└── inhibit_signals: ["SIG_NEGOTIATION"]
        ↓
    [Signal Matching]
    ✓ SIG_STRIKE_US_HOUTHIS matches required
    ✓ SIG_TROOP_MOVEMENT_IRAN matches boost
    ✗ No inhibit signals
        ↓
    [Score Calculation]
    raw = 0.15 (baseline)
        + 0.891 (required signal)
        + 0.445 (boost × 0.5)
        = 1.486
        ↓
    [Probability Conversion]
    prob = 1 / (1 + exp(-2 × 1.486))
         = 0.95 (95%)
        ↓
ScenarioScore
├── probability: 0.95
├── confidence: 0.85
├── trend: "rising"
└── active_signals: [...]
```

### 4. Impact Calculation

```
ScenarioScore + Active Signals
        ↓
    [Domain Matching]
    Rule: aviation
    ├── trigger_events: ["strike", "border_closure"]
    ├── trigger_actors: ["Iran", "Israel", "US"]
    └── severity_mapping: high → high
        ↓
    [Signal Matching]
    ✓ SIG_STRIKE_US_HOUTHIS matches
        event: "strike" ✓
        actor: "US" ✓
        severity: "high" → impact: "high"
        ↓
    [Reasoning Generation]
    Template: "Risque accru pour les vols... {events}"
    Result: "Risque accru pour les vols... strike"
        ↓
ImpactDomain
├── domain: "aviation"
├── level: "high"
├── reasoning: "Risque accru..."
├── supporting_signals: ["SIG_STRIKE_US_HOUTHIS"]
└── source_links: [123, 456]
```

## Anti-hallucination

Le pipeline implémente plusieurs mécanismes de sécurité:

### 1. Traçabilité complète

```
Signal → EventFrame → FeedItem → RSS Source
  │          │            │
  └──────────┴────────────┴─→ TOUJOURS TRACÉ
```

Chaque affirmation doit pouvoir être retracée jusqu'à une source RSS originale.

### 2. Validation automatique

```typescript
validateImpactMatrix(impact)
  ↓
✓ All impacts have supporting_signals
✓ All impacts have source_links
✓ All impacts have reasoning text
```

### 3. Seuils de confidence

```
Signal confidence threshold: 0.3 (30%)
├─ Below threshold → Filtered out
└─ Above threshold → Included in scoring

Scenario confidence calculation:
├─ Average signal reliability
├─ Average signal recency
└─ Number of supporting signals
```

### 4. Formulations prudentes

```
❌ "Une attaque va se produire"
✓ "Risque accru d'attaques"

❌ "Le conflit va s'étendre"
✓ "Probabilité d'extension: 68%"

❌ "Les marchés vont crasher"
✓ "Volatilité des marchés financiers en raison de sanctions"
```

## Performance

### Complexité algorithmique

| Étape | Complexité | Note |
|-------|-----------|------|
| Event Extraction | O(n × p) | n=items, p=patterns |
| Signal Mapping | O(n) | Linear merge |
| Scenario Scoring | O(s × t) | s=signals, t=templates |
| Impact Calculation | O(s × r) | s=scenarios, r=rules |

### Temps de traitement typiques

```
100 items  →  50-100ms
500 items  →  200-300ms
1000 items →  400-500ms
```

### Optimisations

1. Pattern compilation (une seule fois au démarrage)
2. Signal deduplication (évite les calculs redondants)
3. Top-K filtering (limite les signaux traités)
4. Lazy evaluation (calcule seulement ce qui est demandé)

## Configuration

```typescript
const config: PipelineConfig = {
  minSignalConfidence: 0.3,   // Seuil de confidence
  topSignalsLimit: 50,        // Max signaux
  topScenariosLimit: 5,       // Max scénarios retournés
  changeThreshold: 0.15,      // Seuil de changement (15%)
  enableValidation: true,     // Anti-hallucination
};
```

## Extension

### Ajouter un type d'événement

1. Ajouter le type dans `types/scenario.ts`:
```typescript
export type EventType = ... | 'new_event_type';
```

2. Ajouter le poids dans `EVENT_WEIGHTS`:
```typescript
export const EVENT_WEIGHTS = {
  ...
  new_event_type: 0.7,
};
```

3. Ajouter les patterns dans `event-extractor.ts`:
```typescript
{
  event_type: 'new_event_type',
  patterns: [/pattern1/i, /pattern2/i],
  severity_base: 'medium',
}
```

### Ajouter un scénario

1. Créer le template dans `types/scenario.ts`:
```typescript
{
  id: 'new_scenario',
  name: 'Nouveau Scénario',
  description: '...',
  required_signals: ['SIG_PATTERN1'],
  boost_signals: ['SIG_PATTERN2'],
  inhibit_signals: ['SIG_PATTERN3'],
  baseline_probability: 0.2,
}
```

### Ajouter un domaine d'impact

1. Ajouter le type dans `types/scenario.ts`:
```typescript
domain: 'aviation' | ... | 'new_domain';
```

2. Ajouter la règle dans `impact-calculator.ts`:
```typescript
{
  domain: 'new_domain',
  trigger_events: ['event1', 'event2'],
  trigger_actors: ['actor1'],
  severity_mapping: { low: 'low', ... },
  reasoning_template: '...',
}
```

## Tests

```bash
# Lancer les tests
npm test -- lib/scenarios/__tests__/pipeline.test.ts

# Tests couverts:
✓ Exécution pipeline complète
✓ Extraction d'événements
✓ Mapping de signaux
✓ Scoring de scénarios
✓ Calcul d'impacts
✓ Validation anti-hallucination
✓ Génération de résumés
```

## Maintenance

### Tuning des poids

Ajuster les poids si les scénarios sont sur/sous-estimés:

```typescript
// Augmenter l'importance des frappes
EVENT_WEIGHTS.strike = 0.9; // (était 0.8)

// Réduire l'importance des protestations
EVENT_WEIGHTS.protest = 0.4; // (était 0.55)
```

### Ajustement de la décroissance temporelle

Modifier la demi-vie des signaux:

```typescript
// Dans signal-mapper.ts
const halfLifeDays = 5; // (était 7)
// Signaux plus récents auront plus de poids
```

### Calibration des probabilités

Ajuster la fonction logistique:

```typescript
// Dans scenario-scorer.ts
const k = 3; // Steepness (était 2)
const x0 = 0.5; // Midpoint
// Plus k est élevé, plus la courbe est abrupte
```
