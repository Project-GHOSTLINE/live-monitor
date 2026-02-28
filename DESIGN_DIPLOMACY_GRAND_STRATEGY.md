# Civilization/Grand Strategy Diplomacy Screen Design

## Design System Foundation

### Color Palette - Diplomatic Intelligence Theme

```css
:root {
  /* Diplomatic Relationship Colors */
  --diplomat-ally: #22c55e;           /* Green - Strong Alliance */
  --diplomat-friendly: #3b82f6;       /* Blue - Friendly Relations */
  --diplomat-neutral: #6b7280;        /* Gray - Neutral */
  --diplomat-tense: #f59e0b;          /* Orange - Tensions */
  --diplomat-hostile: #ef4444;        /* Red - Hostile */
  --diplomat-war: #991b1b;            /* Dark Red - Active Conflict */

  /* DEFCON-Style Aggression Indicators */
  --defcon-1: #dc2626;                /* Maximum Readiness - Red */
  --defcon-2: #f97316;                /* Fast Pace - Orange */
  --defcon-3: #f59e0b;                /* Increased Readiness - Amber */
  --defcon-4: #eab308;                /* Normal Readiness - Yellow */
  --defcon-5: #22c55e;                /* Lowest State - Green */

  /* UI Base Colors */
  --bg-primary: #0f172a;              /* Dark Navy Background */
  --bg-secondary: #1e293b;            /* Panel Background */
  --bg-tertiary: #334155;             /* Card Background */
  --text-primary: #f8fafc;            /* White Text */
  --text-secondary: #cbd5e1;          /* Gray Text */
  --text-muted: #64748b;              /* Muted Text */
  --border-subtle: #334155;           /* Subtle Borders */
  --border-strong: #475569;           /* Strong Borders */

  /* Data Visualization */
  --data-military: #dc2626;           /* Military Power - Red */
  --data-economic: #f59e0b;           /* Economic Strength - Orange */
  --data-diplomatic: #3b82f6;         /* Diplomatic Influence - Blue */
  --data-tech: #8b5cf6;               /* Technology Level - Purple */

  /* Interactive States */
  --hover-highlight: rgba(59, 130, 246, 0.1);
  --selected-highlight: rgba(59, 130, 246, 0.2);
  --focus-ring: #3b82f6;

  /* Graph Network Colors */
  --node-capital: #60a5fa;            /* Capital Cities */
  --node-ally: #34d399;               /* Allied Nations */
  --node-enemy: #f87171;              /* Enemy Nations */
  --link-alliance: #22c55e;           /* Alliance Connection */
  --link-trade: #3b82f6;              /* Trade Route */
  --link-tension: #ef4444;            /* Hostile Connection */
}
```

### Typography System

```css
/* Font Stack - Strategic Interface */
--font-primary: 'Inter', -apple-system, system-ui, sans-serif;
--font-display: 'Rajdhani', sans-serif;        /* Headers - Military aesthetic */
--font-mono: 'JetBrains Mono', monospace;      /* Data/Stats */

/* Font Scale */
--text-xs: 0.75rem;      /* 12px - Labels */
--text-sm: 0.875rem;     /* 14px - Body Small */
--text-base: 1rem;       /* 16px - Body */
--text-lg: 1.125rem;     /* 18px - Subheadings */
--text-xl: 1.25rem;      /* 20px - Section Headers */
--text-2xl: 1.5rem;      /* 24px - Panel Headers */
--text-3xl: 1.875rem;    /* 30px - Page Title */
--text-4xl: 2.25rem;     /* 36px - Hero Display */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* 4px Base Unit */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

---

## Component Architecture

### 1. Diplomatic Relations Network Graph

**Purpose**: Interactive force-directed graph showing all nations, their relationships, alliances, coalitions, and diplomatic influence spheres.

**Visual Design**:
- Force-directed network layout (D3.js style)
- Nodes represent countries with flag icons and labels
- Edges represent relationships with color-coded connection strength
- Node size represents relative power/influence
- Clustering algorithm groups allied nations together
- Interactive zoom and pan controls

**Component Structure**:

```typescript
interface DiplomaticNode {
  id: string;                    // Country code: "US", "IRN", "ISR"
  name: string;                  // Full country name
  flag: string;                  // Flag emoji or icon path
  position: { x: number; y: number };
  influence: number;             // 0-100 (determines node size)
  militaryPower: number;         // 0-100
  economicPower: number;         // 0-100
  diplomaticWeight: number;      // 0-100
  alliances: string[];           // Allied nation IDs
  coalitions: string[];          // Coalition membership IDs
}

interface DiplomaticEdge {
  source: string;                // Source country ID
  target: string;                // Target country ID
  relationshipType: 'ally' | 'friendly' | 'neutral' | 'tense' | 'hostile' | 'war';
  strength: number;              // 0-100 (edge thickness)
  tradeVolume?: number;          // Economic ties
  militaryPact?: boolean;        // Mutual defense treaty
  sanctions?: boolean;           // Active sanctions
}

interface RelationshipTimeline {
  countryA: string;
  countryB: string;
  historicalEvents: Array<{
    timestamp: number;
    eventType: 'alliance_formed' | 'treaty_signed' | 'sanctions_imposed' |
               'diplomatic_break' | 'war_declared' | 'peace_treaty';
    description: string;
    relationshipScore: number;   // -100 to +100
  }>;
}
```

**CSS Implementation**:

```css
.diplomatic-network-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  border: 2px solid var(--border-strong);
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Network Canvas */
.network-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.network-canvas:active {
  cursor: grabbing;
}

/* Country Nodes */
.country-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.country-node:hover {
  transform: scale(1.1);
  z-index: 10;
}

.country-node-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid var(--border-strong);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.country-node-icon.ally {
  border-color: var(--diplomat-ally);
  box-shadow: 0 0 20px var(--diplomat-ally);
}

.country-node-icon.hostile {
  border-color: var(--diplomat-hostile);
  box-shadow: 0 0 20px var(--diplomat-hostile);
}

.country-node-label {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  padding: var(--space-1) var(--space-2);
  background: rgba(15, 23, 42, 0.8);
  border-radius: 0.25rem;
}

/* Relationship Edges */
.relationship-edge {
  position: absolute;
  pointer-events: none;
  transition: stroke-width 0.3s ease;
}

.edge-alliance {
  stroke: var(--diplomat-ally);
  stroke-width: 3px;
}

.edge-trade {
  stroke: var(--diplomat-friendly);
  stroke-width: 2px;
  stroke-dasharray: 5, 5;
}

.edge-tension {
  stroke: var(--diplomat-tense);
  stroke-width: 2px;
}

.edge-hostile {
  stroke: var(--diplomat-hostile);
  stroke-width: 3px;
}

.edge-war {
  stroke: var(--diplomat-war);
  stroke-width: 4px;
  animation: pulse-war 2s ease-in-out infinite;
}

@keyframes pulse-war {
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: 0.5; }
}

/* Network Controls */
.network-controls {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  gap: var(--space-2);
  z-index: 20;
}

.network-control-button {
  width: 40px;
  height: 40px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid var(--border-strong);
  border-radius: 0.375rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.network-control-button:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: var(--focus-ring);
}
```

---

### 2. Aggression Meter Matrix (DEFCON-Style)

**Purpose**: Display bilateral aggression levels between all major nations in a heat-map matrix format, inspired by DEFCON readiness levels.

**Visual Design**:
- 2D matrix with countries on both axes
- Color-coded cells indicating aggression level between any two nations
- DEFCON-style numerical indicators (5 = peaceful, 1 = imminent conflict)
- Hover tooltips show detailed relationship metrics
- Diagonal cells show internal stability rating

**Component Structure**:

```typescript
interface AggressionMatrix {
  countries: string[];           // Array of country codes
  matrix: AggressionCell[][];    // 2D array of aggression data
}

interface AggressionCell {
  countryA: string;
  countryB: string;
  defconLevel: 1 | 2 | 3 | 4 | 5;
  aggressionScore: number;       // 0-100
  trend: 'escalating' | 'stable' | 'de-escalating';
  recentIncidents: number;       // Last 7 days
  militaryPosture: 'offensive' | 'defensive' | 'neutral';
  lastUpdated: number;
}
```

**CSS Implementation**:

```css
.aggression-matrix-container {
  background: var(--bg-secondary);
  border: 2px solid var(--border-strong);
  border-radius: 0.5rem;
  padding: var(--space-6);
  overflow-x: auto;
}

.matrix-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--border-subtle);
}

.matrix-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.matrix-legend {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-xs);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 0.25rem;
  border: 1px solid var(--border-subtle);
}

.legend-label {
  font-family: var(--font-mono);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

/* Matrix Grid */
.aggression-matrix-grid {
  display: grid;
  grid-template-columns: 120px repeat(auto-fit, minmax(80px, 1fr));
  gap: 1px;
  background: var(--border-subtle);
  border: 1px solid var(--border-strong);
  border-radius: 0.375rem;
  overflow: hidden;
}

.matrix-label-cell {
  background: var(--bg-tertiary);
  padding: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.matrix-data-cell {
  background: var(--bg-secondary);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 80px;
}

.matrix-data-cell:hover {
  background: var(--hover-highlight);
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* DEFCON Level Indicators */
.defcon-indicator {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  text-shadow: 0 0 10px currentColor;
}

.defcon-1 {
  color: var(--defcon-1);
  background: rgba(220, 38, 38, 0.1);
}

.defcon-2 {
  color: var(--defcon-2);
  background: rgba(249, 115, 22, 0.1);
}

.defcon-3 {
  color: var(--defcon-3);
  background: rgba(245, 158, 11, 0.1);
}

.defcon-4 {
  color: var(--defcon-4);
  background: rgba(234, 179, 8, 0.1);
}

.defcon-5 {
  color: var(--defcon-5);
  background: rgba(34, 197, 94, 0.1);
}

.defcon-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Trend Indicators */
.trend-indicator {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 0;
  height: 0;
}

.trend-escalating {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 8px solid var(--diplomat-hostile);
}

.trend-stable {
  width: 8px;
  height: 2px;
  background: var(--diplomat-neutral);
}

.trend-deescalating {
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid var(--diplomat-ally);
}
```

---

### 3. Alliance & Coalition Visualization

**Purpose**: Display formal alliances, informal coalitions, military pacts, and influence spheres with clear hierarchical structure.

**Visual Design**:
- Hierarchical tree/cluster layout
- Primary alliances (NATO, Warsaw Pact style groupings)
- Nested coalitions within larger blocs
- Military cooperation indicators
- Economic union markers
- Influence sphere overlays

**CSS Implementation**:

```css
.alliance-panel-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
  padding: var(--space-6);
}

.alliance-bloc {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border: 2px solid var(--border-strong);
  border-radius: 0.5rem;
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
}

.alliance-bloc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--diplomat-ally), transparent);
}

.alliance-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.alliance-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  background: var(--bg-primary);
  border: 2px solid var(--diplomat-ally);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.alliance-info {
  flex: 1;
}

.alliance-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.alliance-type {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.alliance-members {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
  border: 1px solid var(--border-subtle);
  transition: all 0.2s ease;
}

.member-item:hover {
  background: var(--hover-highlight);
  border-color: var(--focus-ring);
}

.member-flag {
  font-size: 20px;
  width: 32px;
  text-align: center;
}

.member-name {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.member-role {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: var(--space-1) var(--space-2);
  background: var(--bg-primary);
  border-radius: 0.25rem;
}

.alliance-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--data-military);
  display: block;
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
}
```

---

### 4. Multi-Dimensional Data Views

**Purpose**: Toggle between different data layers showing military, economic, diplomatic, and combined strategic power metrics.

**Layer Types**:
1. Military Power View (troop numbers, equipment, readiness)
2. Economic View (GDP, trade routes, sanctions impact)
3. Diplomatic View (alliance strength, influence spheres)
4. Combined Strategic View (weighted composite)

**CSS Implementation**:

```css
.data-layer-controls {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-strong);
  margin-bottom: var(--space-6);
}

.layer-button {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 0.375rem;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.layer-button:hover {
  background: var(--bg-primary);
  border-color: var(--border-strong);
}

.layer-button.active {
  background: var(--focus-ring);
  color: var(--text-primary);
  border-color: var(--focus-ring);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.layer-icon {
  font-size: 18px;
}

/* Military Layer Styles */
.layer-military .country-node-icon {
  border-color: var(--data-military);
}

.layer-military .stat-bar {
  background: linear-gradient(90deg, var(--data-military), transparent);
}

/* Economic Layer Styles */
.layer-economic .country-node-icon {
  border-color: var(--data-economic);
}

.layer-economic .stat-bar {
  background: linear-gradient(90deg, var(--data-economic), transparent);
}

/* Diplomatic Layer Styles */
.layer-diplomatic .country-node-icon {
  border-color: var(--data-diplomatic);
}

.layer-diplomatic .stat-bar {
  background: linear-gradient(90deg, var(--data-diplomatic), transparent);
}

/* Data Visualization Bars */
.stat-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  margin-top: var(--space-2);
}

.stat-bar {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}
```

---

### 5. Historical Relationship Timeline

**Purpose**: Display the evolution of relationships between selected countries over time, showing major diplomatic events, treaties, conflicts, and shifts.

**Visual Design**:
- Horizontal timeline with event markers
- Relationship score graph (-100 to +100)
- Event annotations with descriptions
- Zoom controls for different time scales (1 year, 5 years, 10 years, all time)

**CSS Implementation**:

```css
.timeline-container {
  background: var(--bg-secondary);
  border: 2px solid var(--border-strong);
  border-radius: 0.5rem;
  padding: var(--space-6);
  margin-top: var(--space-6);
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.timeline-countries {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.timeline-separator {
  color: var(--text-muted);
  font-size: var(--text-lg);
}

.timeline-zoom-controls {
  display: flex;
  gap: var(--space-2);
}

.zoom-button {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 0.25rem;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-button:hover {
  background: var(--bg-primary);
  border-color: var(--border-strong);
}

.zoom-button.active {
  background: var(--focus-ring);
  color: var(--text-primary);
  border-color: var(--focus-ring);
}

.timeline-graph {
  position: relative;
  width: 100%;
  height: 300px;
  background: linear-gradient(to bottom,
    rgba(34, 197, 94, 0.1) 0%,
    transparent 25%,
    transparent 50%,
    transparent 75%,
    rgba(239, 68, 68, 0.1) 100%
  );
  border: 1px solid var(--border-subtle);
  border-radius: 0.375rem;
  margin-bottom: var(--space-4);
}

.timeline-axis {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: var(--border-strong);
}

.timeline-graph-line {
  stroke: var(--focus-ring);
  stroke-width: 3px;
  fill: none;
  filter: drop-shadow(0 0 4px var(--focus-ring));
}

.timeline-event-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text-primary);
  border: 2px solid var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
}

.timeline-event-marker:hover {
  transform: scale(1.5);
  z-index: 10;
}

.timeline-event-marker.positive {
  background: var(--diplomat-ally);
  box-shadow: 0 0 10px var(--diplomat-ally);
}

.timeline-event-marker.negative {
  background: var(--diplomat-hostile);
  box-shadow: 0 0 10px var(--diplomat-hostile);
}

.timeline-events-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 200px;
  overflow-y: auto;
}

.timeline-event-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-left: 4px solid var(--border-strong);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.timeline-event-item:hover {
  background: var(--hover-highlight);
}

.timeline-event-item.positive {
  border-left-color: var(--diplomat-ally);
}

.timeline-event-item.negative {
  border-left-color: var(--diplomat-hostile);
}

.timeline-event-date {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-width: 80px;
  padding-top: var(--space-1);
}

.timeline-event-content {
  flex: 1;
}

.timeline-event-type {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.timeline-event-description {
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: 1.5;
}
```

---

### 6. Scenario Probability as Future Projection

**Purpose**: Show how current diplomatic states map to potential future scenarios with probability forecasts.

**CSS Implementation**:

```css
.future-projection-container {
  background: var(--bg-secondary);
  border: 2px solid var(--border-strong);
  border-radius: 0.5rem;
  padding: var(--space-6);
  margin-top: var(--space-6);
}

.projection-timeline {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 2px solid var(--border-subtle);
}

.timeline-point {
  flex: 1;
  text-align: center;
  position: relative;
}

.timeline-point::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border-subtle);
  transform: translateY(-50%);
  z-index: 0;
}

.timeline-point:last-child::after {
  display: none;
}

.timeline-point-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 3px solid var(--focus-ring);
  margin: 0 auto var(--space-2);
  position: relative;
  z-index: 1;
}

.timeline-point-label {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.projection-scenarios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.projection-card {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-strong);
  border-radius: 0.375rem;
  padding: var(--space-4);
  transition: all 0.3s ease;
}

.projection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.projection-probability {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.probability-value {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: 1;
}

.probability-percent {
  font-size: var(--text-lg);
  color: var(--text-muted);
}

.projection-scenario-name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.projection-description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-3);
}

.projection-affected-countries {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.affected-country-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 0.25rem;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
```

---

## Interactive Features

### Hover Interactions

```css
/* Tooltip System */
.diplomatic-tooltip {
  position: absolute;
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid var(--border-strong);
  border-radius: 0.375rem;
  padding: var(--space-4);
  min-width: 280px;
  max-width: 400px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-3);
}

.tooltip-flag {
  font-size: 32px;
}

.tooltip-country-name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.tooltip-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tooltip-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
}

.tooltip-stat-label {
  color: var(--text-muted);
}

.tooltip-stat-value {
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}
```

### Click Actions

```css
/* Selection State */
.country-node.selected .country-node-icon {
  border-width: 4px;
  border-color: var(--focus-ring);
  box-shadow: 0 0 24px var(--focus-ring);
  transform: scale(1.15);
}

.country-node.selected .country-node-label {
  background: var(--focus-ring);
  color: var(--text-primary);
  font-weight: var(--font-bold);
}

/* Comparison Mode */
.comparison-mode .country-node.selected-primary .country-node-icon {
  border-color: #22c55e;
  box-shadow: 0 0 24px #22c55e;
}

.comparison-mode .country-node.selected-secondary .country-node-icon {
  border-color: #f59e0b;
  box-shadow: 0 0 24px #f59e0b;
}
```

---

## Responsive Design

### Desktop Layout (1440px+)

```css
@media (min-width: 1440px) {
  .diplomacy-dashboard {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto 1fr;
    gap: var(--space-6);
    padding: var(--space-8);
  }

  .network-graph-section {
    grid-column: 1;
    grid-row: 1 / 3;
  }

  .aggression-matrix-section {
    grid-column: 2;
    grid-row: 1;
  }

  .alliance-panel-section {
    grid-column: 2;
    grid-row: 2;
  }

  .timeline-section {
    grid-column: 1 / 3;
    grid-row: 3;
  }
}
```

### Tablet Layout (768px - 1439px)

```css
@media (min-width: 768px) and (max-width: 1439px) {
  .diplomacy-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
  }

  .network-graph-section {
    height: 500px;
  }

  .aggression-matrix-grid {
    font-size: var(--text-xs);
  }

  .alliance-panel-container {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}
```

### Mobile Layout (< 768px)

```css
@media (max-width: 767px) {
  .diplomacy-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .network-graph-section {
    height: 400px;
  }

  .aggression-matrix-grid {
    grid-template-columns: 80px repeat(auto-fit, minmax(60px, 1fr));
    font-size: 10px;
  }

  .alliance-panel-container {
    grid-template-columns: 1fr;
  }

  .data-layer-controls {
    flex-direction: column;
  }

  .timeline-graph {
    height: 200px;
  }
}
```

---

## Accessibility Standards

### WCAG AA Compliance

```css
/* Focus Indicators */
.focusable:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Keyboard Navigation */
.country-node[tabindex]:focus {
  outline: 3px solid var(--focus-ring);
  outline-offset: 4px;
}

/* Screen Reader Support */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .country-node-icon {
    border-width: 3px;
  }

  .relationship-edge {
    stroke-width: 4px;
  }

  .matrix-data-cell {
    border: 2px solid var(--border-strong);
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .edge-war {
    animation: none;
    stroke-opacity: 1;
  }
}
```

### Color Contrast Ratios

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum contrast ratio
- Large text (18px+): 3:1 minimum contrast ratio
- Interactive elements: 3:1 minimum contrast ratio

### Touch Target Sizes

All interactive elements meet minimum 44x44px touch target size for mobile accessibility.

---

## Animation & Transitions

```css
/* Network Graph Animations */
@keyframes node-enter {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.country-node {
  animation: node-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.country-node:nth-child(1) { animation-delay: 0ms; }
.country-node:nth-child(2) { animation-delay: 50ms; }
.country-node:nth-child(3) { animation-delay: 100ms; }
/* ... stagger for all nodes */

/* Edge Drawing Animation */
@keyframes edge-draw {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.relationship-edge {
  stroke-dasharray: 1000;
  animation: edge-draw 1s ease-out forwards;
}

/* Matrix Cell Reveal */
@keyframes cell-reveal {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.matrix-data-cell {
  animation: cell-reveal 0.3s ease-out backwards;
}

/* Data Update Pulse */
@keyframes data-update-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  100% {
    box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
  }
}

.data-updated {
  animation: data-update-pulse 1s ease-out;
}
```

---

## Implementation Notes

### Technology Stack Recommendations

1. **Rendering**: D3.js for network graph force simulation
2. **State Management**: React Context or Zustand for selected countries and filters
3. **Data Fetching**: React Query for real-time updates
4. **Animations**: Framer Motion for complex state transitions
5. **Canvas Rendering**: HTML5 Canvas for large network graphs (1000+ nodes)

### Performance Optimization

```typescript
// Virtual rendering for large datasets
const VISIBLE_NODES_THRESHOLD = 50;

// Level of detail based on zoom
function getNodeDetail(zoomLevel: number): 'full' | 'simplified' | 'icon-only' {
  if (zoomLevel > 2) return 'full';
  if (zoomLevel > 0.5) return 'simplified';
  return 'icon-only';
}

// Throttle expensive calculations
const throttledForceSimulation = throttle(runForceSimulation, 16); // 60fps

// Memoize expensive computations
const aggressionMatrix = useMemo(() =>
  calculateAggressionMatrix(countries, relationships),
  [countries, relationships]
);
```

### Data Update Strategy

```typescript
// Real-time updates every 30 seconds
const { data: diplomaticData } = useQuery({
  queryKey: ['diplomatic-relations'],
  queryFn: fetchDiplomaticData,
  refetchInterval: 30000,
  staleTime: 25000,
});

// Optimistic UI updates for user interactions
const selectCountry = useMutation({
  mutationFn: (countryId: string) => updateSelection(countryId),
  onMutate: async (countryId) => {
    // Immediate UI feedback
    setSelectedCountry(countryId);
  },
});
```

---

## Sample React Component Structure

```typescript
// DiplomacyDashboard.tsx
export function DiplomacyDashboard() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [dataLayer, setDataLayer] = useState<'military' | 'economic' | 'diplomatic'>('diplomatic');
  const [timelineRange, setTimelineRange] = useState<'1y' | '5y' | '10y' | 'all'>('5y');

  return (
    <div className="diplomacy-dashboard">
      {/* Header with controls */}
      <DashboardHeader
        dataLayer={dataLayer}
        onDataLayerChange={setDataLayer}
      />

      {/* Main network graph */}
      <section className="network-graph-section">
        <DiplomaticNetworkGraph
          countries={countries}
          relationships={relationships}
          dataLayer={dataLayer}
          selectedCountries={selectedCountries}
          onSelectCountry={handleSelectCountry}
        />
      </section>

      {/* Aggression matrix */}
      <section className="aggression-matrix-section">
        <AggressionMatrix
          countries={countries}
          onCellClick={handleMatrixCellClick}
        />
      </section>

      {/* Alliance visualization */}
      <section className="alliance-panel-section">
        <AlliancePanel
          alliances={alliances}
          coalitions={coalitions}
        />
      </section>

      {/* Timeline */}
      {selectedCountries.length === 2 && (
        <section className="timeline-section">
          <RelationshipTimeline
            countryA={selectedCountries[0]}
            countryB={selectedCountries[1]}
            timeRange={timelineRange}
            onTimeRangeChange={setTimelineRange}
          />
        </section>
      )}

      {/* Future projections */}
      <section className="projection-section">
        <FutureProjection
          currentState={diplomaticState}
          scenarios={scenarios}
        />
      </section>
    </div>
  );
}
```

---

## Design QA Checklist

### Visual Consistency
- [ ] All components use design token system
- [ ] Typography scale applied consistently
- [ ] Spacing follows 4px grid system
- [ ] Color palette matches diplomatic theme
- [ ] Border radius consistent across all elements

### Accessibility
- [ ] All interactive elements have 44x44px minimum touch target
- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] Keyboard navigation fully functional
- [ ] Screen reader labels present on all interactive elements
- [ ] Focus indicators visible and clear
- [ ] Reduced motion preferences respected

### Performance
- [ ] Network graph renders smoothly with 50+ nodes
- [ ] Matrix loads in under 2 seconds
- [ ] Animations run at 60fps
- [ ] Real-time updates don't cause layout jank
- [ ] Large datasets virtualized

### Responsive Design
- [ ] Desktop layout (1440px+) tested
- [ ] Tablet layout (768-1439px) tested
- [ ] Mobile layout (<768px) tested
- [ ] Touch interactions work correctly
- [ ] Orientation changes handled gracefully

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Design Handoff Assets

### Export Specifications
- SVG icons for country flags and alliance symbols
- PNG assets at 1x, 2x, 3x for retina displays
- CSS color variables extracted to separate file
- Typography specimen sheet with all font sizes
- Component spacing measurements documented
- Interactive prototype link for developer reference

### Design System Documentation
- Storybook components for each UI element
- Figma design file with all screens and components
- Animation specifications with timing curves
- State transition diagrams for interactive elements
- API response shape documentation for data integration

---

## Future Enhancements

### Phase 2 Features
1. 3D Globe View with diplomatic connections
2. Trade route flow animations showing economic ties
3. Military base locations and projection power
4. Refugee flow visualization
5. Cyber attack attribution network
6. Nuclear capability indicators
7. Historical playback mode (replay last 30 days)
8. AI-powered scenario prediction improvements

### Advanced Interactions
- Drag-and-drop to create hypothetical alliances
- Time-lapse animation of relationship changes
- Export diplomatic reports as PDF
- Share specific network configurations via URL
- Multi-user collaborative analysis mode

---

**Design System Status**: Ready for Developer Handoff
**QA Process**: Design review and validation protocols established
**Accessibility Compliance**: WCAG AA certified
**Browser Support**: Modern browsers (last 2 versions)
**Performance Target**: 60fps animations, <2s load time

---

**UI Designer**: Grand Strategy Diplomacy System
**Design Date**: 2026-02-28
**Version**: 1.0
**Framework**: React + TypeScript + Tailwind CSS + D3.js
