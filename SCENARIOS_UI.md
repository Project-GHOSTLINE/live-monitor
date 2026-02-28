# Interface de Visualisation des Scénarios

## Vue d'ensemble

Interface de visualisation en temps réel des scénarios d'escalade basée sur l'analyse des flux d'actualité.

## Pages

### 1. `/scenarios` - Vue d'ensemble des scénarios

**Fonctionnalités:**
- Liste de tous les scénarios actifs avec probabilités
- Tri par probabilité ou date de mise à jour
- Filtres par région
- Indicateurs visuels de tendance (↑↓→)
- Code couleur basé sur le niveau de probabilité:
  - Vert: < 20% (Faible)
  - Jaune: 20-50% (Moyen)
  - Orange: 50-70% (Élevé)
  - Rouge: ≥ 70% (Critique)

**Composants:**
- `ScenarioCard`: Carte de scénario avec métadonnées
- `Navigation`: Barre de navigation partagée

### 2. `/scenarios/[id]` - Détail d'un scénario

**Sections:**
- **En-tête**: Probabilité actuelle, tendance, confiance
- **Graphique d'évolution**: Historique des changements de probabilité
- **Matrice d'impact**: Impact par domaine (aviation, énergie, cyber, etc.)
- **Timeline des signaux**: Signaux actifs récents avec sources
- **Historique des changements**: Changelog des modifications

**Composants:**
- `ProbabilityChart`: Graphique canvas de l'évolution temporelle
- `ImpactMatrix`: Tableau des impacts par domaine
- `SignalTimeline`: Liste des signaux avec sources cliquables
- `ChangelogFeed`: Flux des changements récents

## Architecture Technique

### Stack Frontend
- **Framework**: Next.js 16 (App Router)
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS
- **Dates**: date-fns
- **Language**: TypeScript

### API Routes

#### `GET /api/scenarios`
Retourne la liste des scénarios avec scores calculés.

**Query params:**
- `region`: Filtre par région (optional)
- `sort_by`: `probability` | `updated_at`

**Response:**
```typescript
{
  scenarios: Array<{
    scenario_id: string;
    name: string;
    description: string;
    probability: number;
    confidence: number;
    trend: 'rising' | 'falling' | 'stable';
    active_signals: Signal[];
    last_updated: number;
  }>;
  last_updated: number;
  total: number;
}
```

#### `GET /api/scenarios/[id]`
Retourne les détails complets d'un scénario.

**Response:**
```typescript
{
  scenario: ScenarioScore & { name: string; description: string };
  impacts: ImpactMatrix;
  changelog: ScenarioChangelog[];
}
```

### Logique de Calcul

#### 1. Extraction d'événements (`lib/scenarios/calculator.ts`)
- Analyse des feed items récents (7 derniers jours)
- Pattern matching pour détection des types d'événements
- Extraction des acteurs et lieux
- Calcul de la sévérité et confiance

#### 2. Génération de signaux
- Agrégation des événements similaires
- Calcul du poids basé sur le type d'événement
- Facteur de récence (décroissance exponentielle, half-life 48h)
- Multiplicateur de sévérité

#### 3. Scoring des scénarios
- Filtrage des signaux pertinents par scénario
- Calcul du score brut basé sur les signaux actifs
- Normalisation de probabilité (fonction sigmoïde)
- Calcul de confiance basé sur qualité/quantité des sources

#### 4. Calcul des impacts (`lib/scenarios/impacts.ts`)
Analyse l'impact par domaine:
- **Aviation**: Fermetures d'espaces aériens, retards
- **Énergie**: Disruptions d'approvisionnement
- **Cyber**: Attaques sur infrastructures
- **Humanitaire**: Crises, déplacements
- **Supply Chain**: Ruptures logistiques
- **Finance**: Volatilité des marchés
- **Sécurité**: Menaces, restrictions

#### 5. Changelog (`lib/scenarios/changelog.ts`)
Suivi des changements:
- Augmentation/diminution de probabilité (> 5%)
- Nouveaux signaux détectés
- Changements d'impact

### Base de données SQLite

**Tables:**
- `scenario_scores`: Historique des scores calculés
- `scenario_changelog`: Historique des changements

## Design Patterns

### Performance
- Server-side rendering avec Next.js
- Auto-refresh toutes les 30-60 secondes via TanStack Query
- Canvas natif pour graphiques (pas de lib externe lourde)
- Virtualisation pour longues listes de signaux

### Accessibilité
- Texte alternatif sur tous les indicateurs visuels
- Navigation au clavier
- Code couleur + icônes (pas seulement couleur)
- Contraste WCAG AA

### UX
- Style sobre et professionnel
- Sources toujours visibles et cliquables
- Timestamps clairs sur tout
- Avertissements sur nature prédictive des analyses
- Responsive mobile-first

## Scénarios Définis

1. **Statu quo instable**: Continuation sans escalade majeure
2. **Escalade limitée**: Augmentation frappes entre acteurs existants
3. **Escalade multi-acteurs**: Extension du conflit
4. **Attaques infrastructures critiques**: Ciblage infrastructures civiles
5. **Crise politique interne**: Instabilité politique majeure
6. **Vague de protestations régionales**: Mobilisations populaires massives
7. **Choc économique et énergétique**: Disruption approvisionnements
8. **Renforcement sécuritaire global**: Mesures de sécurité accrues

## Development

### Démarrage
```bash
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Tests
```bash
# TODO: Ajouter tests unitaires
npm test
```

## Configuration

Variables d'environnement requises:
- `DATABASE_PATH`: Chemin vers la base SQLite

## Améliorations Futures

1. **Graphiques avancés**: Intégrer Chart.js ou Recharts pour graphiques interactifs
2. **Notifications**: Alertes push pour changements significatifs
3. **Export**: PDF/CSV des rapports de scénarios
4. **Comparaison**: Vue côte-à-côte de plusieurs scénarios
5. **Prédictions**: ML pour améliorer la précision des probabilités
6. **Sources externes**: Intégration API météo, marchés financiers
7. **Collaboration**: Annotations et commentaires d'experts
8. **Historical replay**: Visualisation de l'évolution dans le temps

## Notes Importantes

- Les probabilités sont indicatives, pas des prédictions définitives
- La qualité dépend de la diversité et fiabilité des sources
- Nécessite ingestion régulière de feeds pour données à jour
- Stockage historique permet analyse de tendances
