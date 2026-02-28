# Scenario Analysis Pipeline

Pipeline d'extraction d'événements et de scoring de scénarios en 4 étapes pour analyser les risques géopolitiques.

## Architecture

```
Feed Items (RSS)
    ↓
[1. Event Extraction]  ← Patterns regex + NER simple
    ↓
Event Frames
    ↓
[2. Signal Mapping]    ← Normalisation + pondération
    ↓
Signals
    ↓
[3. Scenario Scoring]  ← Formule probabiliste
    ↓
Scenario Scores
    ↓
[4. Impact Calculation] ← Impact par domaine
    ↓
Impact Matrices
```

## Utilisation

### Pipeline complet

```typescript
import { runPipeline } from '@/lib/scenarios';
import { FeedItem } from '@/types/feed';

const feedItems: FeedItem[] = [/* vos items RSS */];

const result = await runPipeline(feedItems);

console.log(`Événements extraits: ${result.stats.events_extracted}`);
console.log(`Signaux générés: ${result.stats.signals_generated}`);
console.log(`Top scénario: ${result.scores[0].scenario_id}`);
console.log(`Probabilité: ${(result.scores[0].probability * 100).toFixed(1)}%`);
```

### Pipeline incrémental

```typescript
import { runIncrementalPipeline } from '@/lib/scenarios';

// Après une première exécution
const newFeedItems: FeedItem[] = [/* nouveaux items */];

const result = await runIncrementalPipeline(
  newFeedItems,
  existingSignals,
  previousScores
);

console.log(`Changements: ${result.changelog.length}`);
```

### Extraction d'événements seule

```typescript
import { extractEvents } from '@/lib/scenarios';

const events = extractEvents(feedItems);

for (const event of events) {
  console.log(`${event.event_type}: ${event.actors.join(', ')}`);
  console.log(`Severity: ${event.severity}, Confidence: ${event.confidence}`);
}
```

### Mapping de signaux

```typescript
import { mapSignals, getTopSignals } from '@/lib/scenarios';

const reliabilityMap = new Map([
  [1, 0.9],  // feed_item_id → reliability
  [2, 0.85],
]);

const signals = mapSignals(events, reliabilityMap);
const topSignals = getTopSignals(signals, 20);
```

### Scoring de scénarios

```typescript
import { updateScenarioScores, getTopScenarios } from '@/lib/scenarios';

const scores = updateScenarioScores(signals);
const topScenarios = getTopScenarios(scores, 5);

for (const score of topScenarios) {
  console.log(`${score.scenario_id}: ${(score.probability * 100).toFixed(1)}%`);
  console.log(`Trend: ${score.trend}, Confidence: ${score.confidence}`);
}
```

### Calcul d'impacts

```typescript
import { calculateAllImpacts, generateImpactSummary } from '@/lib/scenarios';

const impacts = calculateAllImpacts(scores);

for (const impact of impacts) {
  const summary = generateImpactSummary(impact);
  console.log(`${impact.scenario_id}: ${summary}`);

  for (const domain of impact.impacts) {
    console.log(`  ${domain.domain}: ${domain.level}`);
    console.log(`  Reasoning: ${domain.reasoning}`);
  }
}
```

## Étapes du pipeline

### 1. Event Extraction

**Fichier**: `event-extractor.ts`

Extrait des événements structurés depuis les items RSS en utilisant:
- Patterns regex pour détecter les types d'événements
- NER simple pour identifier les acteurs (pays, organisations)
- Analyse de sévérité basée sur les mots-clés
- Calcul de confidence basé sur la qualité des sources

**Types d'événements supportés**:
- `strike` - Frappes militaires
- `cyber_attack` - Attaques cyber
- `troop_movement` - Mouvements de troupes
- `infrastructure_damage` - Dégâts aux infrastructures
- `civilian_casualties` - Victimes civiles
- `sanction` - Sanctions économiques
- `diplomatic_expulsion` - Expulsions diplomatiques
- `border_closure` - Fermetures de frontières
- `warning` - Avertissements/menaces
- `protest` - Protestations
- `aid_blockage` - Blocage de l'aide humanitaire
- `policy_change` - Changements de politique
- `alliance_shift` - Changements d'alliances
- `economic_disruption` - Perturbations économiques
- `negotiation` - Négociations (signal de désescalade)

**Output**: `EventFrame[]`

```typescript
interface EventFrame {
  event_type: EventType;
  actors: string[];
  location?: string;
  severity: SeverityLevel; // low/medium/high/critical
  confidence: number; // 0-1
  feed_item_id: number;
  extracted_at: number;
}
```

### 2. Signal Mapping

**Fichier**: `signal-mapper.ts`

Transforme les événements en signaux normalisés:
- Génération d'IDs de signaux (ex: `SIG_STRIKE_US_IRAN`)
- Calcul de poids basé sur type d'événement + sévérité + confidence
- Facteur de récence (décroissance exponentielle, demi-vie = 7 jours)
- Fusion des signaux identiques de sources multiples

**Formule de pondération**:
```
weight = (base_weight × severity_multiplier × confidence) + actor_bonus
recency_factor = exp(-ln(2) × (age_days / 7))
final_score = weight × reliability × recency_factor
```

**Output**: `Signal[]`

```typescript
interface Signal {
  signal_id: string;
  event_type: EventType;
  actors: string[];
  weight: number; // 0-1
  reliability: number; // From source
  severity: SeverityLevel;
  timestamp: number;
  feed_item_ids: number[]; // Supporting sources
  recency_factor: number; // Decay over time
}
```

### 3. Scenario Scoring

**Fichier**: `scenario-scorer.ts`

Calcule les probabilités pour chaque scénario:
- Vérifie les signaux requis
- Calcule le boost des signaux supportants
- Soustrait l'effet des signaux inhibiteurs
- Convertit score brut → probabilité (fonction logistique)
- Détecte les tendances (rising/stable/falling)

**Formule de scoring**:
```
raw_score = baseline + boost_score - inhibit_score + signal_activity_bonus
probability = 1 / (1 + exp(-5 × (raw_score - 0.5)))
```

**Scénarios par défaut**:
1. **Statu quo instable** - Continuation sans escalade majeure
2. **Escalade limitée** - Augmentation entre acteurs existants
3. **Escalade multi-acteurs** - Extension avec nouveaux acteurs
4. **Attaques infrastructures** - Ciblage infrastructures critiques
5. **Crise politique interne** - Instabilité politique majeure
6. **Vague protestations** - Mobilisations régionales
7. **Choc économique/énergie** - Disruption approvisionnements
8. **Renforcement sécuritaire** - Mesures de sécurité accrues

**Output**: `ScenarioScore[]`

```typescript
interface ScenarioScore {
  scenario_id: string;
  probability: number; // 0-1
  raw_score: number;
  active_signals: Signal[];
  confidence: number;
  trend: 'rising' | 'stable' | 'falling';
  last_updated: number;
}
```

### 4. Impact Calculation

**Fichier**: `impact-calculator.ts`

Calcule les impacts par domaine pour chaque scénario:
- Matching de signaux avec règles d'impact par domaine
- Mapping sévérité → niveau d'impact
- Génération de justifications liées aux signaux
- Traçabilité complète vers les sources

**Domaines d'impact**:
- `aviation` - Risques pour les vols
- `energy` - Approvisionnements énergétiques
- `cyber` - Menaces cyber
- `humanitarian` - Crises humanitaires
- `supply_chain` - Chaînes d'approvisionnement
- `financial` - Marchés financiers
- `security` - Risques sécuritaires

**Output**: `ImpactMatrix[]`

```typescript
interface ImpactMatrix {
  scenario_id: string;
  impacts: ImpactDomain[];
  overall_severity: SeverityLevel;
  last_updated: number;
}

interface ImpactDomain {
  domain: string;
  level: ImpactLevel; // low/medium/high
  reasoning: string;
  supporting_signals: string[]; // Signal IDs
  source_links: number[]; // Feed item IDs
}
```

## Anti-hallucination

Le pipeline implémente plusieurs mécanismes pour éviter les hallucinations:

1. **Traçabilité complète**: Chaque signal est lié à au moins un feed item
2. **Validation automatique**: Vérification que tous les impacts ont des sources
3. **Formulations prudentes**: Templates de reasoning avec "risque accru" plutôt que "va arriver"
4. **Seuils de confidence**: Filtrage des signaux faibles (< 0.3 par défaut)
5. **Validation errors**: Liste des erreurs de validation dans le résultat

```typescript
const result = await runPipeline(feedItems, undefined, {
  ...DEFAULT_CONFIG,
  enableValidation: true,
});

if (result.validation_errors.length > 0) {
  console.warn('Validation errors:', result.validation_errors);
}
```

## Configuration

```typescript
interface PipelineConfig {
  minSignalConfidence: number; // Default: 0.3
  topSignalsLimit: number; // Default: 50
  topScenariosLimit: number; // Default: 5
  changeThreshold: number; // Default: 0.15 (15%)
  enableValidation: boolean; // Default: true
}

const customConfig: PipelineConfig = {
  minSignalConfidence: 0.4,  // Plus strict
  topSignalsLimit: 100,      // Plus de signaux
  topScenariosLimit: 10,     // Plus de scénarios
  changeThreshold: 0.1,      // Détecter changements plus petits
  enableValidation: true,
};

const result = await runPipeline(feedItems, undefined, customConfig);
```

## Tests

```bash
# Installer les dépendances
npm install

# Lancer les tests
npm test -- lib/scenarios/__tests__/pipeline.test.ts

# Ou avec ts-node
npx ts-node lib/scenarios/__tests__/pipeline.test.ts
```

Les tests incluent:
1. Exécution complète du pipeline
2. Extraction d'événements
3. Mapping de signaux
4. Scoring de scénarios
5. Calcul d'impacts
6. Validation anti-hallucination
7. Génération de résumés

## Performance

Temps de traitement typiques (MacBook Pro M1):
- 100 feed items: ~50-100ms
- 500 feed items: ~200-300ms
- 1000 feed items: ~400-500ms

Optimisations:
- Pattern matching optimisé (compilation regex une seule fois)
- Fusion de signaux pour éviter les doublons
- Limitation du nombre de signaux traités
- Calculs vectoriels pour le scoring

## Intégration API

Exemple d'endpoint Next.js:

```typescript
// app/api/scenarios/analyze/route.ts
import { runPipeline } from '@/lib/scenarios';

export async function POST(req: Request) {
  const { feed_items } = await req.json();

  const result = await runPipeline(feed_items);

  return Response.json({
    scenarios: result.scores,
    impacts: result.impacts,
    stats: result.stats,
    validation_errors: result.validation_errors,
  });
}
```

## Évolutions futures

- [ ] ML-based event extraction (NER avancé)
- [ ] Apprentissage des poids de signaux
- [ ] Détection d'anomalies
- [ ] Prédiction temporelle (séries temporelles)
- [ ] Graphes de causalité entre événements
- [ ] Intégration LLM pour reasoning augmenté
- [ ] Dashboard de visualisation temps réel
- [ ] Alertes automatiques sur changements significatifs

## Ressources

- Types: `/types/scenario.ts`
- Tests: `/lib/scenarios/__tests__/pipeline.test.ts`
- Exemples: `/lib/scenarios/__tests__/pipeline.test.ts` (fonction `createMockFeedItems`)
