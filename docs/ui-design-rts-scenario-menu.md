# RTS Command & Conquer Scenario Menu - UI Design Specification

**Design System**: Command & Conquer / StarCraft / Supreme Commander Tactical Interface
**Design Date**: 2026-02-28
**Version**: 1.0
**Target**: DEFCON-style Global Threat Matrix with Intelligence Deduction System

---

## Executive Summary

This design specification details a tactical Command & Conquer-inspired scenario menu system that transforms the existing WW3 threat monitoring system into an immersive RTS-style command interface. The design incorporates DEFCON threat levels, country aggression matrices, intelligence deduction panels, and real-time tactical overlays inspired by legendary RTS games.

---

## Design Foundations

### Color System - Tactical Military Palette

**DEFCON Threat Levels**
```css
/* DEFCON 1 - Nuclear War Imminent */
--defcon-1-primary: #dc2626;    /* Red 600 */
--defcon-1-glow: #ef4444;       /* Red 500 */
--defcon-1-bg: #450a0a;         /* Red 950 */
--defcon-1-border: #991b1b;     /* Red 800 */

/* DEFCON 2 - Next Step to Nuclear War */
--defcon-2-primary: #ea580c;    /* Orange 600 */
--defcon-2-glow: #f97316;       /* Orange 500 */
--defcon-2-bg: #431407;         /* Orange 950 */
--defcon-2-border: #c2410c;     /* Orange 800 */

/* DEFCON 3 - Increase in Force Readiness */
--defcon-3-primary: #f59e0b;    /* Amber 500 */
--defcon-3-glow: #fbbf24;       /* Amber 400 */
--defcon-3-bg: #451a03;         /* Amber 950 */
--defcon-3-border: #b45309;     /* Amber 700 */

/* DEFCON 4 - Increased Intelligence Watch */
--defcon-4-primary: #3b82f6;    /* Blue 500 */
--defcon-4-glow: #60a5fa;       /* Blue 400 */
--defcon-4-bg: #172554;         /* Blue 950 */
--defcon-4-border: #1d4ed8;     /* Blue 700 */

/* DEFCON 5 - Lowest State of Readiness */
--defcon-5-primary: #22c55e;    /* Green 500 */
--defcon-5-glow: #4ade80;       /* Green 400 */
--defcon-5-bg: #052e16;         /* Green 950 */
--defcon-5-border: #15803d;     /* Green 700 */
```

**Strategic Command Interface Colors**
```css
:root {
  /* Primary Command Colors */
  --command-green: #22c55e;       /* Friendly/Allied forces */
  --command-red: #ef4444;         /* Enemy/Hostile forces */
  --command-yellow: #f59e0b;      /* Neutral/Uncertain */
  --command-blue: #3b82f6;        /* Intelligence/Recon */
  --command-cyan: #06b6d4;        /* Cyber/Electronic warfare */

  /* Background Layers */
  --bg-command-center: #000000;   /* Pure black base */
  --bg-tactical-overlay: rgba(0, 0, 0, 0.85);
  --bg-panel: rgba(0, 20, 0, 0.6); /* Dark green tint */
  --bg-scanline: rgba(34, 197, 94, 0.03);

  /* Grid & HUD Elements */
  --grid-primary: rgba(34, 197, 94, 0.2);
  --grid-secondary: rgba(34, 197, 94, 0.1);
  --scanline-color: rgba(34, 197, 94, 0.1);

  /* Alert States */
  --alert-critical: #dc2626;
  --alert-warning: #f59e0b;
  --alert-info: #3b82f6;
  --alert-success: #22c55e;

  /* Text Hierarchy */
  --text-primary: #22c55e;        /* Main green */
  --text-secondary: rgba(34, 197, 94, 0.7);
  --text-muted: rgba(34, 197, 94, 0.4);
  --text-highlight: #4ade80;
}
```

### Typography System - Military Monospace

```css
:root {
  /* Font Families */
  --font-tactical: 'JetBrains Mono', 'Courier New', monospace;
  --font-fallback: system-ui, -apple-system, sans-serif;

  /* Font Scale - Military Display Sizes */
  --text-tactical-xs: 0.625rem;   /* 10px - Status codes */
  --text-tactical-sm: 0.75rem;    /* 12px - Data readouts */
  --text-tactical-base: 0.875rem; /* 14px - Standard text */
  --text-tactical-lg: 1rem;       /* 16px - Headers */
  --text-tactical-xl: 1.25rem;    /* 20px - Section headers */
  --text-tactical-2xl: 1.875rem;  /* 30px - Panel titles */
  --text-tactical-3xl: 3rem;      /* 48px - Alert displays */

  /* Letter Spacing - Wide Tracking for Military Readability */
  --tracking-command: 0.1em;      /* Standard tracking */
  --tracking-wide: 0.15em;        /* Alert text */
  --tracking-ultra: 0.25em;       /* DEFCON levels */

  /* Font Weights */
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-bold: 700;
}
```

### Spacing System - Grid-Based Layout

```css
:root {
  /* Base Unit: 8px tactical grid */
  --space-unit: 0.5rem;      /* 8px */

  /* Tactical Spacing Scale */
  --space-1: 0.25rem;        /* 4px */
  --space-2: 0.5rem;         /* 8px */
  --space-3: 0.75rem;        /* 12px */
  --space-4: 1rem;           /* 16px */
  --space-6: 1.5rem;         /* 24px */
  --space-8: 2rem;           /* 32px */
  --space-12: 3rem;          /* 48px */
  --space-16: 4rem;          /* 64px */
  --space-24: 6rem;          /* 96px */

  /* Border Widths */
  --border-tactical: 2px;
  --border-alert: 3px;
  --border-defcon: 4px;
}
```

---

## Component Architecture

### 1. DEFCON Aggression Matrix

The centerpiece component displaying country-to-country threat relationships in a heatmap grid format.

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ ▰▰▰ GLOBAL AGGRESSION MATRIX ▰▰▰           [LIVE] 14:23:45 │
├─────────────────────────────────────────────────────────────┤
│          │ USA  │ RUS  │ CHN  │ IRN  │ ISR  │ KSA  │ TUR  │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ USA      │  --  │ D-3  │ D-4  │ D-2  │ D-5  │ D-5  │ D-4  │
│ RUSSIA   │ D-3  │  --  │ D-4  │ D-4  │ D-4  │ D-4  │ D-3  │
│ CHINA    │ D-4  │ D-4  │  --  │ D-5  │ D-5  │ D-5  │ D-5  │
│ IRAN     │ D-2↑ │ D-4  │ D-5  │  --  │ D-1  │ D-3  │ D-4  │
│ ISRAEL   │ D-5  │ D-4  │ D-5  │ D-1↑ │  --  │ D-4  │ D-4  │
│ SAUDI A. │ D-5  │ D-4  │ D-5  │ D-3  │ D-4  │  --  │ D-4  │
│ TURKEY   │ D-4  │ D-3  │ D-5  │ D-4  │ D-4  │ D-4  │  --  │
└─────────────────────────────────────────────────────────────┘

Legend: D-1 ■ D-2 ■ D-3 ■ D-4 ■ D-5 ■  ↑Rising ↓Falling
```

#### Component Structure

```tsx
interface DefconMatrixProps {
  countries: CountryActor[];
  aggressionLevels: AggressionMatrix;
  lastUpdated: number;
  onCellClick?: (source: string, target: string) => void;
}

interface AggressionMatrix {
  [sourceCountry: string]: {
    [targetCountry: string]: {
      defconLevel: 1 | 2 | 3 | 4 | 5;
      trend: 'rising' | 'stable' | 'falling';
      recentEvents: Signal[];
      confidenceScore: number;
    };
  };
}
```

#### CSS Implementation

```css
.defcon-matrix {
  background: var(--bg-panel);
  border: var(--border-tactical) solid var(--grid-primary);
  backdrop-filter: blur(4px);
  font-family: var(--font-tactical);
}

.defcon-matrix-header {
  background: linear-gradient(90deg,
    rgba(34, 197, 94, 0.2) 0%,
    rgba(34, 197, 94, 0.05) 100%
  );
  border-bottom: var(--border-tactical) solid var(--grid-primary);
  padding: var(--space-4);
  font-size: var(--text-tactical-xl);
  letter-spacing: var(--tracking-wide);
  text-shadow: 0 0 8px currentColor;
}

.defcon-cell {
  position: relative;
  padding: var(--space-3);
  text-align: center;
  font-size: var(--text-tactical-base);
  font-weight: var(--weight-bold);
  border: 1px solid var(--grid-secondary);
  cursor: pointer;
  transition: all 150ms ease;
}

.defcon-cell:hover {
  border-color: var(--command-green);
  box-shadow: inset 0 0 20px rgba(34, 197, 94, 0.2);
  transform: scale(1.05);
  z-index: 10;
}

/* DEFCON Level Colors */
.defcon-1 {
  background: linear-gradient(135deg, var(--defcon-1-bg) 0%, #1a0505 100%);
  color: var(--defcon-1-primary);
  border-color: var(--defcon-1-border);
}

.defcon-2 {
  background: linear-gradient(135deg, var(--defcon-2-bg) 0%, #1a0805 100%);
  color: var(--defcon-2-primary);
  border-color: var(--defcon-2-border);
}

.defcon-3 {
  background: linear-gradient(135deg, var(--defcon-3-bg) 0%, #1a1005 100%);
  color: var(--defcon-3-primary);
  border-color: var(--defcon-3-border);
}

.defcon-4 {
  background: linear-gradient(135deg, var(--defcon-4-bg) 0%, #051020 100%);
  color: var(--defcon-4-primary);
  border-color: var(--defcon-4-border);
}

.defcon-5 {
  background: linear-gradient(135deg, var(--defcon-5-bg) 0%, #051810 100%);
  color: var(--defcon-5-primary);
  border-color: var(--defcon-5-border);
}

/* Trend Indicators */
.trend-rising::after {
  content: '↑';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: var(--text-tactical-sm);
  color: var(--alert-critical);
  animation: pulse-danger 2s infinite;
}

.trend-falling::after {
  content: '↓';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: var(--text-tactical-sm);
  color: var(--alert-success);
}

@keyframes pulse-danger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

### 2. Intelligence Deduction Panel

Shows the logical reasoning chain from raw signals to threat assessments.

#### Visual Design

```
┌──────────────────────────────────────────────────────────┐
│ ⬡ INTELLIGENCE DEDUCTION SYSTEM                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ RAW SIGNALS [23]                  ASSESSED THREATS [8]   │
│ ┌───────────────────┐            ┌──────────────────┐   │
│ │ • Iranian missile │            │ IRAN-ISRAEL      │   │
│ │   deployment      │───────────▶│ DEFCON 1         │   │
│ │ • IDF alertness   │            │ Conf: 87%        │   │
│ │   increase        │            └──────────────────┘   │
│ │ • Border closures │                                    │
│ └───────────────────┘                                    │
│         │                                                 │
│         ▼                                                 │
│ INFERENCE LAYER                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ IF missile_deployment + border_closure + IDF_alert │  │
│ │ THEN strike_imminent                               │  │
│ │ CONFIDENCE: signal_count × source_reliability      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                           │
│ CONFIDENCE BREAKDOWN:                                    │
│ ▓▓▓▓▓▓▓▓░░ 87% - High reliability sources               │
│ ▓▓▓▓▓▓▓▓▓░ 92% - Signal correlation                     │
│ ▓▓▓▓▓░░░░░ 65% - Historical pattern match               │
└──────────────────────────────────────────────────────────┘
```

#### Component Structure

```tsx
interface IntelligenceDeductionProps {
  scenario: ScenarioScore;
  deductionChain: DeductionNode[];
  confidenceFactors: ConfidenceBreakdown;
}

interface DeductionNode {
  level: 'signal' | 'inference' | 'conclusion';
  content: string;
  confidence: number;
  supportingData: Signal[];
  connectedTo?: string[]; // IDs of connected nodes
}

interface ConfidenceBreakdown {
  sourceReliability: number;
  signalCorrelation: number;
  historicalMatch: number;
  recencyFactor: number;
  overall: number;
}
```

---

### 3. Tactical Map Overlay

Real-time geographic visualization of threat hotspots and military movements.

#### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ ▰▰▰ TACTICAL SITUATION MAP ▰▰▰                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│          [Map with hexagonal grid overlay]              │
│                                                          │
│   ●━━━━━━━━━━━━━━●                                      │
│   RUSSIA    ⚔    UKRAINE                                │
│               ↓ TROOP MVT                               │
│                                                          │
│               🛡 IRAN                                    │
│                   ║                                      │
│                   ║ MISSILE RANGE                       │
│                   ▼                                      │
│               ⚠ ISRAEL                                  │
│                                                          │
│   HOTSPOT INTENSITY:                                    │
│   ●●●●● Critical  ●●●○○ Medium  ●○○○○ Low               │
│                                                          │
│   LEGEND:                                               │
│   ⚔ Active Conflict  🛡 Defense Posture  ⚠ Alert       │
│   ↓ Troop Movement  ▼ Missile Range  ━ Alliance        │
└─────────────────────────────────────────────────────────┘
```

#### Component Structure

```tsx
interface TacticalMapProps {
  hotspots: ThreatHotspot[];
  militaryAssets: MilitaryAsset[];
  alliances: Alliance[];
  timeframe: 'realtime' | '24h' | '7d';
}

interface ThreatHotspot {
  location: { lat: number; lng: number };
  intensity: 1 | 2 | 3 | 4 | 5;
  radius: number; // km
  activeSignals: Signal[];
  primaryActors: string[];
}

interface MilitaryAsset {
  type: 'troops' | 'missile' | 'naval' | 'air' | 'cyber';
  location: { lat: number; lng: number };
  owner: string;
  status: 'defensive' | 'offensive' | 'mobilizing' | 'deployed';
  range?: number; // km
}
```

---

### 4. Country Relationship Web

Network graph showing diplomatic, military, and economic relationships between actors.

#### Visual Design

```
┌──────────────────────────────────────────────────────────┐
│ ▰▰▰ GEOPOLITICAL NETWORK ▰▰▰                             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│           ╔════════╗                                      │
│           ║  USA   ║                                      │
│           ╚════════╝                                      │
│           /    |    \                                     │
│      ALLY/   TENSE   \ALLY                               │
│         /      |      \                                   │
│   ╔═══════╗ ╔═══════╗ ╔═══════╗                         │
│   ║  NATO ║ ║RUSSIA ║ ║ JAPAN ║                         │
│   ╚═══════╝ ╚═══════╝ ╚═══════╝                         │
│               |   \                                       │
│            ALLY    \HOSTILE                              │
│               |     \                                     │
│           ╔═══════╗ ╔═══════╗                            │
│           ║ SYRIA ║ ║UKRAINE║                            │
│           ╚═══════╝ ╚═══════╝                            │
│                                                           │
│  RELATIONSHIP STRENGTH:                                  │
│  ════ Alliance  ──── Neutral  ╍╍╍╍ Tense  ✕✕✕✕ Hostile  │
│                                                           │
│  NODE SIZE = Military Capability                         │
│  COLOR = Current Alert Level                             │
└──────────────────────────────────────────────────────────┘
```

#### Component Structure

```tsx
interface RelationshipWebProps {
  actors: Actor[];
  relationships: Relationship[];
  focusActor?: string;
  timeRange: '24h' | '7d' | '30d';
}

interface Actor {
  id: string;
  name: string;
  type: 'nation' | 'organization' | 'alliance';
  militaryCapability: number; // 0-100
  currentAlertLevel: 1 | 2 | 3 | 4 | 5;
  activeConflicts: number;
}

interface Relationship {
  source: string;
  target: string;
  type: 'alliance' | 'neutral' | 'tense' | 'hostile';
  strength: number; // 0-100
  recentEvents: Signal[];
  trend: 'improving' | 'stable' | 'deteriorating';
}
```

---

### 5. Military Posture Dashboard

Real-time display of military readiness levels for major actors.

#### Visual Design

```
┌──────────────────────────────────────────────────────────┐
│ ▰▰▰ MILITARY POSTURE ANALYSIS ▰▰▰                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ USA              ▓▓▓▓▓▓▓▓░░ 82% READINESS    DEFCON 4    │
│ ├ Ground Forces  ▓▓▓▓▓▓▓░░░ 75%                          │
│ ├ Air Power      ▓▓▓▓▓▓▓▓▓░ 95%                          │
│ ├ Naval          ▓▓▓▓▓▓▓▓░░ 88%                          │
│ └ Cyber Ops      ▓▓▓▓▓▓▓░░░ 78%                          │
│                                                           │
│ RUSSIA           ▓▓▓▓▓▓▓░░░ 71% READINESS    DEFCON 3    │
│ ├ Ground Forces  ▓▓▓▓▓▓▓▓▓▓ 98%                          │
│ ├ Air Power      ▓▓▓▓▓▓░░░░ 62%                          │
│ ├ Naval          ▓▓▓▓▓░░░░░ 54%                          │
│ └ Cyber Ops      ▓▓▓▓▓▓▓▓░░ 81%                          │
│                                                           │
│ IRAN             ▓▓▓▓▓▓▓▓▓░ 93% READINESS    DEFCON 2 ↑  │
│ ├ Ground Forces  ▓▓▓▓▓▓▓▓░░ 87%                          │
│ ├ Missile Forces ▓▓▓▓▓▓▓▓▓▓ 100% ⚠ DEPLOYED              │
│ ├ Naval          ▓▓▓▓▓░░░░░ 56%                          │
│ └ Cyber Ops      ▓▓▓▓▓▓▓▓▓░ 91%                          │
│                                                           │
│ ISRAEL           ▓▓▓▓▓▓▓▓▓░ 96% READINESS    DEFCON 1 ⚠  │
│ ├ Ground Forces  ▓▓▓▓▓▓▓▓▓▓ 100% ⚠ MOBILIZED             │
│ ├ Air Power      ▓▓▓▓▓▓▓▓▓▓ 100% ⚠ ACTIVE SORTIES        │
│ ├ Defense Systems▓▓▓▓▓▓▓▓▓▓ 100% ⚠ IRON DOME ACTIVE      │
│ └ Cyber Ops      ▓▓▓▓▓▓▓▓░░ 89%                          │
│                                                           │
│ ⚠ ALERT: 2 ACTORS AT MAXIMUM READINESS                   │
│ ⚠ TREND: 4 ACTORS ESCALATING IN PAST 24H                 │
└──────────────────────────────────────────────────────────┘
```

#### Component Structure

```tsx
interface MilitaryPostureProps {
  actors: string[];
  postures: PostureData[];
  alertThreshold: number;
}

interface PostureData {
  actor: string;
  overallReadiness: number; // 0-100
  defconLevel: 1 | 2 | 3 | 4 | 5;
  trend: 'escalating' | 'stable' | 'de-escalating';
  components: {
    groundForces: number;
    airPower: number;
    navalForces: number;
    missileForces?: number;
    cyberOps: number;
    defenseStems?: number;
  };
  recentChanges: {
    component: string;
    oldValue: number;
    newValue: number;
    timestamp: number;
    reason: string;
  }[];
}
```

---

### 6. Historical Aggression Timeline

Temporal visualization of how tensions have evolved over time.

#### Visual Design

```
┌──────────────────────────────────────────────────────────┐
│ ▰▰▰ AGGRESSION TIMELINE: IRAN vs ISRAEL ▰▰▰              │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ DEFCON                                                    │
│   1 ║                                         ●━━●        │
│   2 ║                           ●━━━━━━●━━━━━┘  │        │
│   3 ║              ●━━━━━━━━━━━┘                │        │
│   4 ║      ●━━━━━━┘                             │        │
│   5 ║━━━━━┘                                     │        │
│     ╚═══════════════════════════════════════════╧═══════▶│
│      JAN    FEB    MAR    APR    MAY    JUN    NOW       │
│                                                           │
│ KEY EVENTS:                                              │
│ FEB 12: Iranian cyber attack on Israeli infrastructure   │
│ MAR 28: IDF strikes Iranian proxies in Syria             │
│ APR 15: Missile test in Iran, 2000km range               │
│ MAY 03: Border incidents increase 300%                   │
│ JUN 14: Iranian missile deployment detected ⚠            │
│ JUN 20: Israeli Iron Dome on maximum alert ⚠             │
│                                                           │
│ FORECAST (AI-PREDICTED):                                 │
│ Next 7 days:  ●╍╍╍╍ DEFCON 1 sustained (78% confidence) │
│ Next 30 days: ●╍╍╍╍ Kinetic engagement (64% confidence) │
└──────────────────────────────────────────────────────────┘
```

---

## Animation & Sound Design Concepts

### Visual Animations

```css
/* Scan Line Effect - Classic CRT Monitor */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

.scanline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(34, 197, 94, 0.05) 50%,
    transparent 100%
  );
  pointer-events: none;
  animation: scanline 8s linear infinite;
}

/* Grid Pulse - Tactical Map */
@keyframes grid-pulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.3; }
}

.tactical-grid {
  background-image:
    linear-gradient(var(--grid-primary) 2px, transparent 2px),
    linear-gradient(90deg, var(--grid-primary) 2px, transparent 2px);
  background-size: 50px 50px;
  animation: grid-pulse 4s ease-in-out infinite;
}

/* Alert Pulse - DEFCON 1 Warning */
@keyframes alert-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--defcon-1-primary);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 20px 10px transparent;
    opacity: 0.7;
  }
}

.defcon-1-alert {
  animation: alert-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Data Stream Effect - Intelligence Feed */
@keyframes data-stream {
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(0); opacity: 0; }
}

.intelligence-stream-item {
  animation: data-stream 3s ease-out;
}

/* Holographic Flicker - Futuristic UI Elements */
@keyframes hologram-flicker {
  0%, 100% { opacity: 1; }
  5% { opacity: 0.8; }
  10% { opacity: 1; }
  15% { opacity: 0.9; }
  20% { opacity: 1; }
}

.hologram-element {
  animation: hologram-flicker 8s ease-in-out infinite;
}

/* Military Boot Sequence */
@keyframes boot-text {
  0% { opacity: 0; transform: translateX(-20px); }
  50% { opacity: 1; transform: translateX(0); }
  100% { opacity: 1; }
}

.boot-sequence-line {
  animation: boot-text 0.3s ease-out;
  animation-fill-mode: forwards;
}
```

### Sound Design Concepts

**Audio Triggers** (Implementation notes - not actual audio files)

```typescript
// Sound event mapping
const TACTICAL_SOUNDS = {
  // DEFCON level changes
  defcon_escalate: 'alert-rising-tone.wav',      // Rising pitch alarm
  defcon_de_escalate: 'alert-falling-tone.wav',  // Descending tone
  defcon_1_alert: 'klaxon-loop.wav',             // Continuous alarm

  // UI Interactions
  matrix_cell_hover: 'ui-beep-soft.wav',         // Soft electronic beep
  matrix_cell_click: 'ui-click-confirm.wav',     // Confirmation click
  panel_open: 'panel-slide.wav',                 // Mechanical slide
  panel_close: 'panel-close.wav',                // Mechanical close

  // Data Events
  signal_detected: 'radar-ping.wav',             // Sonar-style ping
  intelligence_update: 'data-received.wav',      // Digital chirp
  confidence_increase: 'positive-chime.wav',     // Upward chime

  // Alert States
  critical_alert: 'alert-critical.wav',          // Urgent alarm
  warning_alert: 'alert-warning.wav',            // Warning tone
  success_alert: 'alert-success.wav',            // Positive confirmation
};

// Example usage in React component
function playTacticalSound(soundId: keyof typeof TACTICAL_SOUNDS) {
  const audio = new Audio(`/sounds/tactical/${TACTICAL_SOUNDS[soundId]}`);
  audio.volume = 0.3; // Subtle, not intrusive
  audio.play().catch(() => {
    // Handle autoplay restrictions
  });
}
```

---

## Responsive Design Strategy

### Breakpoint Behavior

```css
/* Mobile: 320px - 767px */
@media (max-width: 767px) {
  .defcon-matrix {
    /* Stack matrix vertically, show fewer countries */
    display: block;
  }

  .tactical-map {
    /* Simplified map with touch controls */
    height: 300px;
  }

  .military-posture {
    /* Single column, expandable cards */
    grid-template-columns: 1fr;
  }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .defcon-matrix {
    /* Scrollable matrix with fixed headers */
    overflow-x: auto;
  }

  .dashboard-grid {
    /* 2-column layout for panels */
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 1024px - 1439px */
@media (min-width: 1024px) and (max-width: 1439px) {
  .dashboard-grid {
    /* 3-column layout */
    grid-template-columns: repeat(3, 1fr);
  }

  .defcon-matrix {
    /* Full matrix visible */
    grid-column: span 2;
  }
}

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) {
  .command-center {
    /* Ultra-wide layout with side panels */
    display: grid;
    grid-template-columns: 300px 1fr 300px;
  }

  .tactical-map {
    /* Full-size strategic map */
    height: 800px;
  }
}
```

---

## Accessibility Implementation

### WCAG AA Compliance

```css
/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  :root {
    --text-primary: #00ff00;        /* Pure green */
    --bg-command-center: #000000;   /* Pure black */
    --grid-primary: rgba(0, 255, 0, 0.4);
  }

  .defcon-cell {
    border-width: 3px; /* Thicker borders */
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .scanline-overlay,
  .grid-pulse,
  .hologram-flicker {
    animation: none;
  }
}

/* Focus Indicators for Keyboard Navigation */
.defcon-cell:focus,
.tactical-button:focus,
.country-node:focus {
  outline: 3px solid var(--command-green);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.3);
}

/* Screen Reader Enhancements */
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
```

### ARIA Labels

```tsx
// Example: DEFCON Matrix Cell
<div
  className="defcon-cell defcon-2"
  role="gridcell"
  tabIndex={0}
  aria-label={`Iran to Israel: DEFCON 2, Critical threat level, Rising trend`}
  aria-describedby={`cell-details-${sourceId}-${targetId}`}
  onClick={() => handleCellClick(source, target)}
  onKeyPress={(e) => e.key === 'Enter' && handleCellClick(source, target)}
>
  D-2 ↑
  <span id={`cell-details-${sourceId}-${targetId}`} className="sr-only">
    Based on 23 intelligence signals with 87% confidence.
    Recent events include missile deployment and border closures.
  </span>
</div>
```

---

## Data Visualization Approach

### Real-Time Update Strategy

```typescript
// WebSocket-based real-time updates
interface TacticalUpdate {
  type: 'defcon_change' | 'signal_detected' | 'posture_update';
  timestamp: number;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// React Query implementation with optimistic updates
const { data: aggressionMatrix } = useQuery({
  queryKey: ['aggression-matrix'],
  queryFn: fetchAggressionMatrix,
  refetchInterval: 10000, // 10 seconds
  staleTime: 5000,
  // Optimistic update on WebSocket event
  onSettled: (data, error, variables, context) => {
    if (error) {
      playTacticalSound('warning_alert');
    }
  }
});

// WebSocket listener for critical updates
useEffect(() => {
  const ws = new WebSocket('wss://api.ww3.local/tactical');

  ws.onmessage = (event) => {
    const update: TacticalUpdate = JSON.parse(event.data);

    if (update.priority === 'critical') {
      playTacticalSound('critical_alert');
      // Flash visual alert
      triggerVisualAlert(update.type);
    }

    // Update query cache immediately
    queryClient.setQueryData(['aggression-matrix'], (old) => ({
      ...old,
      ...update.data
    }));
  };

  return () => ws.close();
}, []);
```

### Performance Optimization

```typescript
// Virtualized scrolling for large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

function IntelligenceSignalList({ signals }: { signals: Signal[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: signals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 5, // Render 5 extra rows for smooth scrolling
  });

  return (
    <div ref={parentRef} className="signal-list-container">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <SignalRow
            key={virtualRow.key}
            signal={signals[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Implementation Roadmap

### Phase 1: Core Components (Week 1-2)
- [ ] DEFCON Aggression Matrix base component
- [ ] Country actor data modeling
- [ ] Real-time aggression level calculations
- [ ] Basic matrix cell interactions
- [ ] CSS tactical theme implementation

### Phase 2: Intelligence System (Week 3-4)
- [ ] Intelligence Deduction Panel
- [ ] Signal to threat inference logic
- [ ] Confidence breakdown visualizations
- [ ] Deduction chain animations

### Phase 3: Visual Enhancements (Week 5-6)
- [ ] Tactical Map Overlay with geographic data
- [ ] Relationship Web graph implementation
- [ ] Military Posture Dashboard
- [ ] Historical Timeline component
- [ ] Scan line and grid effects

### Phase 4: Interactivity & Polish (Week 7-8)
- [ ] WebSocket real-time updates
- [ ] Sound effect integration
- [ ] Responsive design refinements
- [ ] Accessibility audit and fixes
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## Technical Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.21",      // Real-time data fetching
    "@tanstack/react-virtual": "^3.13.19",    // Virtualized lists
    "d3": "^7.9.0",                            // Graph visualizations
    "react-force-graph": "^1.44.4",            // Relationship web
    "leaflet": "^1.9.4",                       // Tactical map
    "react-leaflet": "^4.2.1",                 // React Leaflet bindings
    "framer-motion": "^11.0.8",                // Advanced animations
    "howler": "^2.2.4"                         // Sound management
  },
  "devDependencies": {
    "@testing-library/react": "^14.2.1",       // Component testing
    "jest": "^29.7.0",                         // Unit testing
    "cypress": "^13.6.6"                       // E2E testing
  }
}
```

---

## File Structure

```
/Users/xunit/Desktop/ww3/
├── components/
│   ├── tactical/
│   │   ├── DefconMatrix.tsx          // Main aggression matrix
│   │   ├── DefconCell.tsx            // Individual matrix cell
│   │   ├── IntelligenceDeduction.tsx // Deduction panel
│   │   ├── DeductionNode.tsx         // Single deduction step
│   │   ├── TacticalMap.tsx           // Geographic overlay
│   │   ├── RelationshipWeb.tsx       // Network graph
│   │   ├── MilitaryPosture.tsx       // Readiness dashboard
│   │   ├── HistoricalTimeline.tsx    // Temporal visualization
│   │   └── TacticalHUD.tsx           // Main container
│   └── ui/
│       ├── ScanlineEffect.tsx        // Visual effects
│       ├── GridOverlay.tsx           // Tactical grid
│       └── AlertSystem.tsx           // Sound + visual alerts
├── styles/
│   ├── tactical-theme.css            // Main tactical theme
│   ├── defcon-colors.css             // DEFCON color system
│   └── animations.css                // Animation library
├── hooks/
│   ├── useTacticalData.ts            // Real-time data hooks
│   ├── useWebSocket.ts               // WebSocket management
│   └── useTacticalSound.ts           // Sound effect hooks
├── lib/
│   ├── aggression-calculator.ts      // DEFCON level logic
│   ├── deduction-engine.ts           // Intelligence inference
│   └── confidence-scorer.ts          // Confidence calculations
└── types/
    ├── tactical.ts                   // Tactical UI types
    └── aggression.ts                 // Aggression matrix types
```

---

## Design QA Checklist

### Visual Design
- [ ] All DEFCON levels have distinct, accessible color schemes (4.5:1 contrast minimum)
- [ ] Typography is readable at all sizes (minimum 14px for body text)
- [ ] Grid system is consistent across all components (8px base unit)
- [ ] Animations enhance usability without causing motion sickness
- [ ] Hover states provide clear visual feedback within 150ms
- [ ] Focus indicators are visible for keyboard navigation (3px outline minimum)

### Functionality
- [ ] Matrix cells are interactive and provide detailed drill-down
- [ ] Real-time updates occur without jarring layout shifts
- [ ] Sound effects can be muted/disabled
- [ ] All data visualizations update smoothly (60fps target)
- [ ] Error states are clearly communicated with recovery options
- [ ] Loading states use tactical boot sequence aesthetic

### Accessibility
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for all features (tab order logical)
- [ ] Screen reader announces DEFCON level changes
- [ ] Color is not the only indicator of threat level (icons + text)
- [ ] Reduced motion mode disables all animations
- [ ] High contrast mode increases border visibility

### Performance
- [ ] Initial load time under 2 seconds on 4G connection
- [ ] Matrix rendering with 50+ countries stays above 30fps
- [ ] WebSocket updates don't block UI thread
- [ ] Memory usage stable over 24-hour session
- [ ] Works on devices with 4GB RAM minimum
- [ ] Bundle size optimized (code splitting for map libraries)

### Responsive Design
- [ ] Mobile: Essential information visible, touch targets 44px minimum
- [ ] Tablet: Grid layout adapts to horizontal/vertical orientation
- [ ] Desktop: Full feature set with multi-panel layout
- [ ] Ultra-wide: Side panels utilize extra screen real estate
- [ ] Print stylesheet available for static reports

---

## Success Metrics

### User Experience
- **Information Access Time**: User can identify highest threat in under 3 seconds
- **Interaction Response**: All clicks/taps respond within 150ms
- **Data Comprehension**: 90%+ users correctly interpret DEFCON levels in usability testing
- **Visual Appeal**: 8/10+ rating on "command center immersion" scale

### Technical Performance
- **Frame Rate**: Maintain 60fps during normal operation, 30fps minimum during heavy updates
- **Bundle Size**: Tactical UI bundle under 500KB gzipped
- **API Response Time**: Aggression matrix calculation under 200ms
- **WebSocket Latency**: Real-time updates delivered within 500ms of event

### Accessibility
- **WCAG Compliance**: 100% WCAG AA conformance
- **Keyboard Navigation**: All features accessible without mouse
- **Screen Reader Support**: Logical reading order, complete ARIA coverage
- **Motion Sensitivity**: All users can disable animations completely

---

## Design Rationale

### Why Command & Conquer Style?

The C&C/RTS aesthetic provides several key advantages for a geopolitical threat monitoring system:

1. **Information Density**: RTS interfaces excel at displaying complex data hierarchies
2. **Spatial Reasoning**: Military minds think spatially - maps and grids match mental models
3. **Urgency Communication**: Color-coded alerts and animations convey threat immediacy
4. **Decision Support**: Clear cause-effect relationships aid strategic thinking
5. **Engagement**: Gamification elements increase user attention and retention

### Design Inspirations

**Command & Conquer: Red Alert**
- High-contrast green/red color scheme for friend/foe identification
- Monospace military fonts for data readability
- Sidebar-based UI layout for quick access to information
- Sound effects that reinforce urgency and action

**StarCraft**
- Resource monitoring and trend indicators
- Minimap with hotspot visualization
- Unit selection and group management patterns
- Real-time status updates without disrupting flow

**Supreme Commander**
- Strategic zoom levels (tactical to strategic view)
- Relationship lines between allied units
- Multi-panel information architecture
- Performance optimization for large-scale data

**DEFCON (Introversion)**
- Minimalist vector aesthetic
- DEFCON alert level system
- Global threat visualization
- Tension-building sound design

---

## Future Enhancements

### Phase 2 Features (Post-Launch)

1. **AI Advisor System**
   - Natural language explanations of threat assessments
   - Recommended actions based on scenario analysis
   - "What-if" scenario simulation

2. **Collaborative Command Center**
   - Multi-user mode for team threat analysis
   - Shared annotations on tactical map
   - Role-based access control (analyst, commander, observer)

3. **Historical Playback**
   - Scrub through past 30 days of aggression data
   - Identify patterns and precursor events
   - Export timeline visualizations

4. **Custom Alert Rules**
   - User-defined DEFCON thresholds
   - Email/SMS notifications for critical events
   - Watchlist for specific country pairs

5. **Mobile Command App**
   - iOS/Android native app with push notifications
   - Simplified interface for on-the-go monitoring
   - Biometric authentication for secure access

6. **3D Tactical Globe**
   - WebGL-based 3D globe visualization
   - Missile trajectory arcs
   - Satellite coverage visualization
   - Day/night cycle with real-time shadows

---

## Conclusion

This RTS-inspired tactical interface transforms geopolitical threat monitoring from a passive data consumption experience into an active command center simulation. By leveraging design patterns from Command & Conquer, StarCraft, and DEFCON, we create an interface that:

- **Communicates urgency effectively** through DEFCON color schemes and animations
- **Enables rapid threat assessment** via the aggression matrix heatmap
- **Supports analytical reasoning** through intelligence deduction panels
- **Maintains engagement** with real-time updates and tactical aesthetics
- **Scales gracefully** from mobile to ultra-wide displays
- **Remains accessible** to users with diverse abilities and preferences

The design prioritizes **information clarity**, **decision support**, and **immersive experience** while maintaining strict accessibility standards and performance benchmarks.

---

**Next Steps:**
1. Review design specification with development team
2. Create interactive Figma prototype for stakeholder approval
3. Begin Phase 1 implementation (DEFCON Matrix core component)
4. Conduct usability testing with military/intelligence domain experts
5. Iterate based on feedback and performance metrics

**Design System Repository**: `/Users/xunit/Desktop/ww3/docs/ui-design-rts-scenario-menu.md`
**Last Updated**: 2026-02-28
**Designer**: UI Designer Agent
**Status**: Ready for Implementation ✓
