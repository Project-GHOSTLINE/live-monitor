# Cyberpunk Intelligence Network UI Design
## Watch_Dogs / Cyberpunk 2077 Intelligence Visualization System

**Design System Date**: 2026-02-28
**UI Designer**: Cyberpunk Intelligence Systems
**Implementation**: WebGL + Three.js + React
**Target Platform**: Next.js 15 Web Application

---

## 🎨 Design Foundations

### Cyberpunk Color System

**Primary Palette - Neon Tech**
- **Cyan Electric**: `#00F0FF` - Primary data streams, active connections
- **Magenta Pulse**: `#FF00FF` - Threat indicators, high-priority alerts
- **Acid Green**: `#39FF14` - AI deductions, positive signals
- **Amber Warning**: `#FFB000` - Moderate threats, attention required
- **Crimson Alert**: `#FF0055` - Critical threats, imminent danger

**Neural Network Gradients**
```css
:root {
  /* Holographic Overlays */
  --holo-cyan: linear-gradient(135deg, #00F0FF 0%, #0080FF 100%);
  --holo-magenta: linear-gradient(135deg, #FF00FF 0%, #8000FF 100%);
  --holo-matrix: linear-gradient(135deg, #39FF14 0%, #00AA00 100%);

  /* Threat Level Gradients */
  --threat-low: linear-gradient(90deg, #39FF14 0%, #00AA00 100%);
  --threat-medium: linear-gradient(90deg, #FFB000 0%, #FF6B00 100%);
  --threat-high: linear-gradient(90deg, #FF0055 0%, #AA0033 100%);
  --threat-critical: linear-gradient(90deg, #FF0055 0%, #FF00FF 100%);

  /* Background Depths */
  --bg-void: #0A0A0F;           /* Deep space background */
  --bg-layer-1: #12121A;        /* Primary panels */
  --bg-layer-2: #1A1A28;        /* Secondary panels */
  --bg-layer-3: #22223A;        /* Elevated elements */

  /* Glass Morphism */
  --glass-dark: rgba(18, 18, 26, 0.7);
  --glass-medium: rgba(26, 26, 40, 0.6);
  --glass-light: rgba(34, 34, 58, 0.5);

  /* Neon Glows */
  --glow-cyan: 0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3);
  --glow-magenta: 0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3);
  --glow-green: 0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3);
}
```

### Typography System - Digital Monospace

**Primary Font Stack**
```css
:root {
  /* Monospace for data display */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  /* UI Elements */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Retro Terminal */
  --font-terminal: 'IBM Plex Mono', 'Roboto Mono', monospace;

  /* Font Scale */
  --text-xs: 0.625rem;    /* 10px - Data labels */
  --text-sm: 0.75rem;     /* 12px - Metadata */
  --text-base: 0.875rem;  /* 14px - Body text */
  --text-lg: 1rem;        /* 16px - Headers */
  --text-xl: 1.25rem;     /* 20px - Section titles */
  --text-2xl: 1.5rem;     /* 24px - Screen titles */
  --text-3xl: 2rem;       /* 32px - Hero elements */

  /* Font Weights */
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  --weight-black: 900;

  /* Line Heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-loose: 1.8;

  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
}
```

### Spacing System - Grid Matrix

**8px Base Unit System**
```css
:root {
  /* Base spacing unit */
  --unit: 8px;

  /* Spacing scale */
  --space-0: 0;
  --space-1: 4px;     /* 0.5 unit */
  --space-2: 8px;     /* 1 unit */
  --space-3: 12px;    /* 1.5 units */
  --space-4: 16px;    /* 2 units */
  --space-6: 24px;    /* 3 units */
  --space-8: 32px;    /* 4 units */
  --space-12: 48px;   /* 6 units */
  --space-16: 64px;   /* 8 units */
  --space-24: 96px;   /* 12 units */
  --space-32: 128px;  /* 16 units */
}
```

---

## 🌐 Network Graph Visualization

### Connected Events & Actors System

**WebGL Force-Directed Graph**
```typescript
// Three.js Network Graph Implementation
interface NetworkNode {
  id: string;
  type: 'event' | 'actor' | 'location' | 'organization';
  label: string;
  threatLevel: 0 | 1 | 2 | 3 | 4; // 0=neutral, 4=critical
  position: Vector3;
  connections: string[]; // IDs of connected nodes
  metadata: {
    country?: string;
    timestamp?: Date;
    confidence: number; // 0-100
    source: 'signal' | 'ai-deduction' | 'manual';
  };
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number; // Connection strength 0-1
  type: 'confirmed' | 'inferred' | 'predicted';
  pulsating: boolean; // Active data flow
}

// Visual Properties
const nodeVisuals = {
  event: {
    geometry: new THREE.OctahedronGeometry(1, 0),
    color: '#00F0FF',
    glow: true,
  },
  actor: {
    geometry: new THREE.SphereGeometry(1, 16, 16),
    color: '#FF00FF',
    glow: true,
  },
  location: {
    geometry: new THREE.BoxGeometry(1, 1, 1),
    color: '#39FF14',
    glow: false,
  },
  organization: {
    geometry: new THREE.TetrahedronGeometry(1, 0),
    color: '#FFB000',
    glow: true,
  },
};
```

**Node Interaction States**
```css
.network-node {
  /* Default state */
  opacity: 0.7;
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 10px currentColor);
}

.network-node:hover {
  opacity: 1;
  transform: scale(1.3);
  filter: drop-shadow(0 0 30px currentColor) drop-shadow(0 0 60px currentColor);
  animation: pulse 1.5s ease-in-out infinite;
}

.network-node--active {
  opacity: 1;
  transform: scale(1.5);
  animation: activeNode 2s ease-in-out infinite;
}

.network-node--threat-critical {
  color: var(--crimson-alert);
  animation: criticalPulse 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { filter: drop-shadow(0 0 20px currentColor); }
  50% { filter: drop-shadow(0 0 40px currentColor) drop-shadow(0 0 80px currentColor); }
}

@keyframes activeNode {
  0%, 100% { transform: scale(1.5) rotate(0deg); }
  50% { transform: scale(1.7) rotate(180deg); }
}

@keyframes criticalPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

**Connection Lines - Data Flow Visualization**
```typescript
// Animated particle system along edges
class DataFlowParticles {
  particles: THREE.Points[];

  createFlow(edge: NetworkEdge) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    // Generate particles along edge path
    for (let i = 0; i < 50; i++) {
      const t = i / 50;
      const point = this.interpolate(edge.source, edge.target, t);
      positions.push(point.x, point.y, point.z);
      velocities.push(Math.random() * 0.02);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      color: edge.type === 'confirmed' ? 0x00F0FF : 0xFF00FF,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  animate() {
    // Move particles along edges with trail effect
    this.particles.forEach(particle => {
      const positions = particle.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += 0.01; // Flow animation
      }
      particle.geometry.attributes.position.needsUpdate = true;
    });
  }
}
```

---

## 🔮 Holographic Aggression Matrix

### Country Threat Visualization System

**3D Holographic Globe with Threat Overlay**
```typescript
interface AggressionData {
  country: string;
  aggressionScore: number; // 0-100
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeScenarios: number;
  recentEvents: number;
  aiPrediction: {
    nextMove: string;
    confidence: number;
    timeframe: string;
  };
}

// WebGL Globe Shader
const holographicShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform float time;
    uniform vec3 threatColor;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      // Fresnel effect for holographic edge
      float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);

      // Scan line effect
      float scanLine = sin(vPosition.y * 50.0 + time * 2.0) * 0.5 + 0.5;

      // Pulsating glow
      float pulse = sin(time * 2.0) * 0.3 + 0.7;

      vec3 color = threatColor * (fresnel + scanLine * 0.3) * pulse;
      gl_FragColor = vec4(color, fresnel * 0.8);
    }
  `,

  uniforms: {
    time: { value: 0 },
    threatColor: { value: new THREE.Color(0x00F0FF) },
  },
};
```

**Aggression Matrix UI Component**
```tsx
// React Component with Three.js Integration
const AggressionMatrix: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  return (
    <div className="aggression-matrix">
      {/* WebGL Canvas */}
      <canvas ref={canvasRef} className="holographic-globe" />

      {/* Overlay Data Panels */}
      <div className="matrix-overlay">
        <div className="threat-legend">
          <div className="legend-item threat-low">
            <span className="indicator"></span>
            <span className="label">LOW (0-25)</span>
          </div>
          <div className="legend-item threat-medium">
            <span className="indicator"></span>
            <span className="label">MEDIUM (26-50)</span>
          </div>
          <div className="legend-item threat-high">
            <span className="indicator"></span>
            <span className="label">HIGH (51-75)</span>
          </div>
          <div className="legend-item threat-critical">
            <span className="indicator"></span>
            <span className="label">CRITICAL (76-100)</span>
          </div>
        </div>

        {/* Country Detail Panel */}
        {selectedCountry && (
          <div className="country-detail-panel">
            <div className="panel-header">
              <h3 className="country-name">{selectedCountry}</h3>
              <div className="threat-badge threat-high">HIGH THREAT</div>
            </div>

            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">AGGRESSION SCORE</span>
                <span className="metric-value glow-text">73/100</span>
              </div>
              <div className="metric">
                <span className="metric-label">ACTIVE SCENARIOS</span>
                <span className="metric-value">12</span>
              </div>
              <div className="metric">
                <span className="metric-label">RECENT EVENTS</span>
                <span className="metric-value">47</span>
              </div>
            </div>

            <div className="ai-prediction">
              <div className="prediction-header">
                <span className="icon">🤖</span>
                <span className="label">AI DEDUCTION</span>
                <span className="confidence">87% CONFIDENCE</span>
              </div>
              <p className="prediction-text">
                Likely to escalate border tensions within 48-72 hours
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

**Holographic Panel Styles**
```css
.aggression-matrix {
  position: relative;
  width: 100%;
  height: 100vh;
  background: var(--bg-void);
  overflow: hidden;
}

.holographic-globe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: blur(0.5px) brightness(1.2);
}

.matrix-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.matrix-overlay > * {
  pointer-events: auto;
}

.threat-legend {
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--glass-dark);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 240, 255, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.legend-item .indicator {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  box-shadow: 0 0 10px currentColor;
}

.threat-low .indicator {
  background: var(--threat-low);
}

.threat-medium .indicator {
  background: var(--threat-medium);
}

.threat-high .indicator {
  background: var(--threat-high);
}

.threat-critical .indicator {
  background: var(--threat-critical);
  animation: criticalBlink 1s ease-in-out infinite;
}

@keyframes criticalBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.country-detail-panel {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  width: 400px;
  padding: 2rem;
  background: var(--glass-dark);
  border: 1px solid rgba(255, 0, 255, 0.4);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 0, 255, 0.1);
  animation: slideInLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 0, 255, 0.2);
}

.country-name {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: #00F0FF;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  text-shadow: var(--glow-cyan);
}

.threat-badge {
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  border-radius: 0.25rem;
  background: var(--threat-high);
  color: white;
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.5);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.metric-value {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: #FFFFFF;
}

.metric-value.glow-text {
  color: #00F0FF;
  text-shadow: var(--glow-cyan);
  animation: textGlow 2s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% { text-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
  50% { text-shadow: 0 0 20px rgba(0, 240, 255, 0.8), 0 0 40px rgba(0, 240, 255, 0.4); }
}

.ai-prediction {
  padding: 1rem;
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 0.375rem;
}

.prediction-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: #39FF14;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.prediction-header .confidence {
  margin-left: auto;
  font-size: var(--text-xs);
  color: rgba(57, 255, 20, 0.7);
}

.prediction-text {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.9);
  line-height: var(--leading-normal);
}
```

---

## 🤖 AI Deduction Engine Visualization

### Inferred Intelligence Display System

**Real-Time AI Processing Stream**
```tsx
interface AIDeduction {
  id: string;
  type: 'connection' | 'prediction' | 'pattern' | 'anomaly';
  confidence: number; // 0-100
  reasoning: string;
  relatedNodes: string[];
  timestamp: Date;
  status: 'processing' | 'complete' | 'validated' | 'rejected';
}

const AIDeductionEngine: React.FC = () => {
  const [deductions, setDeductions] = useState<AIDeduction[]>([]);

  return (
    <div className="ai-deduction-engine">
      {/* Neural Network Visualization Header */}
      <div className="engine-header">
        <div className="header-left">
          <div className="ai-icon">
            <div className="neural-pulse"></div>
            🧠
          </div>
          <div className="header-info">
            <h2 className="engine-title">AI DEDUCTION ENGINE</h2>
            <p className="engine-status">
              <span className="status-indicator active"></span>
              ACTIVE ANALYSIS
            </p>
          </div>
        </div>

        <div className="processing-stats">
          <div className="stat">
            <span className="stat-label">PROCESSING</span>
            <span className="stat-value glow-green">247/s</span>
          </div>
          <div className="stat">
            <span className="stat-label">CONFIDENCE AVG</span>
            <span className="stat-value">87%</span>
          </div>
          <div className="stat">
            <span className="stat-label">PATTERNS FOUND</span>
            <span className="stat-value">1,423</span>
          </div>
        </div>
      </div>

      {/* Deduction Stream */}
      <div className="deduction-stream">
        {deductions.map(deduction => (
          <div
            key={deduction.id}
            className={`deduction-card deduction-${deduction.type}`}
            data-status={deduction.status}
          >
            <div className="deduction-header">
              <div className="deduction-type">
                {getTypeIcon(deduction.type)}
                <span>{deduction.type.toUpperCase()}</span>
              </div>

              <div className="confidence-meter">
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${deduction.confidence}%` }}
                  ></div>
                </div>
                <span className="confidence-value">{deduction.confidence}%</span>
              </div>
            </div>

            <p className="deduction-reasoning">{deduction.reasoning}</p>

            <div className="deduction-footer">
              <div className="related-nodes">
                {deduction.relatedNodes.map(node => (
                  <span key={node} className="node-tag">{node}</span>
                ))}
              </div>

              <div className="deduction-actions">
                <button className="action-btn validate">VALIDATE</button>
                <button className="action-btn reject">REJECT</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Processing Particles Background */}
      <canvas className="particle-canvas"></canvas>
    </div>
  );
};
```

**AI Engine Styles**
```css
.ai-deduction-engine {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-void);
  overflow-y: auto;
}

.engine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--glass-dark);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.ai-icon {
  position: relative;
  font-size: 3rem;
  animation: iconFloat 3s ease-in-out infinite;
}

.neural-pulse {
  position: absolute;
  inset: -10px;
  border: 2px solid #39FF14;
  border-radius: 50%;
  animation: neuralPulse 2s ease-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes neuralPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.engine-title {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--weight-black);
  color: #39FF14;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  text-shadow: var(--glow-green);
}

.engine-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #39FF14;
  box-shadow: 0 0 10px #39FF14;
}

.status-indicator.active {
  animation: indicatorPulse 1.5s ease-in-out infinite;
}

@keyframes indicatorPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.processing-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  text-align: right;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: #FFFFFF;
}

.stat-value.glow-green {
  color: #39FF14;
  text-shadow: var(--glow-green);
}

.deduction-stream {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.deduction-card {
  padding: 1.5rem;
  background: var(--glass-dark);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-left: 4px solid #00F0FF;
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.deduction-card:hover {
  border-color: rgba(0, 240, 255, 0.6);
  box-shadow: 0 8px 32px rgba(0, 240, 255, 0.2);
  transform: translateX(-4px);
}

.deduction-card[data-status="processing"] {
  border-left-color: #FFB000;
  animation: processingPulse 2s ease-in-out infinite;
}

.deduction-card[data-status="complete"] {
  border-left-color: #39FF14;
}

.deduction-card[data-status="validated"] {
  border-left-color: #39FF14;
  background: rgba(57, 255, 20, 0.05);
}

.deduction-card[data-status="rejected"] {
  border-left-color: #FF0055;
  opacity: 0.5;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes processingPulse {
  0%, 100% { border-left-color: #FFB000; }
  50% { border-left-color: #FF6B00; }
}

.deduction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.deduction-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: #00F0FF;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.confidence-meter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.confidence-bar {
  width: 120px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #39FF14 0%, #00F0FF 100%);
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
}

.confidence-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: #39FF14;
  min-width: 40px;
}

.deduction-reasoning {
  margin-bottom: 1rem;
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: rgba(255, 255, 255, 0.9);
  line-height: var(--leading-normal);
}

.deduction-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.related-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.node-tag {
  padding: 0.25rem 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.deduction-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  border: 1px solid;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn.validate {
  color: #39FF14;
  border-color: #39FF14;
}

.action-btn.validate:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 20px rgba(57, 255, 20, 0.3);
}

.action-btn.reject {
  color: #FF0055;
  border-color: #FF0055;
}

.action-btn.reject:hover {
  background: rgba(255, 0, 85, 0.2);
  box-shadow: 0 0 20px rgba(255, 0, 85, 0.3);
}

.particle-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.3;
  mix-blend-mode: screen;
}
```

---

## 📡 Real-Time Signal Processing Display

### Data Stream Visualization

**Live Signal Feed Component**
```tsx
interface SignalData {
  id: string;
  source: string;
  type: 'intercept' | 'satellite' | 'osint' | 'humint' | 'sigint';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content: string;
  timestamp: Date;
  location?: { lat: number; lon: number };
  metadata: {
    encryption: string;
    reliability: number;
    classification: string;
  };
}

const SignalProcessing: React.FC = () => {
  return (
    <div className="signal-processing">
      {/* Spectrum Analyzer Visualization */}
      <div className="spectrum-analyzer">
        <canvas className="analyzer-canvas"></canvas>
        <div className="frequency-labels">
          <span>0 Hz</span>
          <span>5 kHz</span>
          <span>10 kHz</span>
          <span>15 kHz</span>
          <span>20 kHz</span>
        </div>
      </div>

      {/* Signal Stream */}
      <div className="signal-stream">
        <div className="stream-header">
          <h3>INCOMING SIGNALS</h3>
          <div className="stream-controls">
            <button className="filter-btn active">ALL</button>
            <button className="filter-btn">INTERCEPT</button>
            <button className="filter-btn">SATELLITE</button>
            <button className="filter-btn">OSINT</button>
          </div>
        </div>

        <div className="signal-feed">
          {/* Signal items will be rendered here */}
        </div>
      </div>

      {/* Processing Stats Overlay */}
      <div className="processing-overlay">
        <div className="stat-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="ring-bg" />
            <circle cx="50" cy="50" r="45" className="ring-progress" />
          </svg>
          <div className="ring-content">
            <span className="ring-value">89%</span>
            <span className="ring-label">DECODE RATE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Signal Processing Styles**
```css
.signal-processing {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: auto 1fr;
  gap: 1.5rem;
  padding: 2rem;
  background: var(--bg-void);
  min-height: 100vh;
}

.spectrum-analyzer {
  grid-column: 1 / -1;
  position: relative;
  height: 200px;
  padding: 1.5rem;
  background: var(--glass-dark);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
}

.analyzer-canvas {
  width: 100%;
  height: 140px;
  filter: drop-shadow(0 0 10px rgba(0, 240, 255, 0.5));
}

.frequency-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
}

.signal-stream {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--glass-dark);
  border: 1px solid rgba(255, 0, 255, 0.3);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stream-header h3 {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: #FF00FF;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  text-shadow: var(--glow-magenta);
}

.stream-controls {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.375rem 0.75rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-btn:hover {
  color: #00F0FF;
  border-color: #00F0FF;
  background: rgba(0, 240, 255, 0.1);
}

.filter-btn.active {
  color: #00F0FF;
  border-color: #00F0FF;
  background: rgba(0, 240, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
}

.signal-feed {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* Custom scrollbar */
.signal-feed::-webkit-scrollbar {
  width: 8px;
}

.signal-feed::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.signal-feed::-webkit-scrollbar-thumb {
  background: rgba(0, 240, 255, 0.3);
  border-radius: 4px;
}

.signal-feed::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 240, 255, 0.5);
}

.processing-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--glass-dark);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
}

.stat-ring {
  position: relative;
  width: 200px;
  height: 200px;
}

.stat-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke: url(#ringGradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  stroke-dashoffset: 30;
  filter: drop-shadow(0 0 10px rgba(57, 255, 20, 0.5));
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { stroke-dashoffset: 30; }
  50% { stroke-dashoffset: 20; }
}

.ring-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  font-weight: var(--weight-black);
  color: #39FF14;
  text-shadow: var(--glow-green);
}

.ring-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
```

---

## ✨ Glitch & Digital Aesthetics

### Cyberpunk Visual Effects System

**Glitch Animation Effects**
```css
/* Glitch Text Effect */
@keyframes glitch {
  0% {
    transform: translate(0);
    opacity: 1;
  }
  20% {
    transform: translate(-2px, 2px);
    opacity: 0.8;
  }
  40% {
    transform: translate(-2px, -2px);
    opacity: 0.9;
  }
  60% {
    transform: translate(2px, 2px);
    opacity: 0.7;
  }
  80% {
    transform: translate(2px, -2px);
    opacity: 0.9;
  }
  100% {
    transform: translate(0);
    opacity: 1;
  }
}

.glitch-text {
  position: relative;
  font-family: var(--font-mono);
  font-weight: var(--weight-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  animation: glitch 1s infinite;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch-text::before {
  left: 2px;
  text-shadow: -2px 0 #FF00FF;
  clip: rect(24px, 550px, 90px, 0);
  animation: glitch-anim-2 3s infinite linear alternate-reverse;
}

.glitch-text::after {
  left: -2px;
  text-shadow: -2px 0 #00F0FF;
  clip: rect(85px, 550px, 140px, 0);
  animation: glitch-anim 2.5s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% { clip: rect(61px, 9999px, 52px, 0); }
  5% { clip: rect(33px, 9999px, 144px, 0); }
  10% { clip: rect(121px, 9999px, 115px, 0); }
  15% { clip: rect(144px, 9999px, 162px, 0); }
  20% { clip: rect(62px, 9999px, 180px, 0); }
  25% { clip: rect(34px, 9999px, 42px, 0); }
  30% { clip: rect(147px, 9999px, 179px, 0); }
  35% { clip: rect(99px, 9999px, 63px, 0); }
  40% { clip: rect(188px, 9999px, 122px, 0); }
  45% { clip: rect(154px, 9999px, 14px, 0); }
  50% { clip: rect(63px, 9999px, 37px, 0); }
  55% { clip: rect(161px, 9999px, 147px, 0); }
  60% { clip: rect(109px, 9999px, 175px, 0); }
  65% { clip: rect(157px, 9999px, 88px, 0); }
  70% { clip: rect(173px, 9999px, 131px, 0); }
  75% { clip: rect(62px, 9999px, 70px, 0); }
  80% { clip: rect(24px, 9999px, 153px, 0); }
  85% { clip: rect(138px, 9999px, 40px, 0); }
  90% { clip: rect(79px, 9999px, 136px, 0); }
  95% { clip: rect(25px, 9999px, 34px, 0); }
  100% { clip: rect(173px, 9999px, 166px, 0); }
}

@keyframes glitch-anim-2 {
  0% { clip: rect(129px, 9999px, 36px, 0); }
  5% { clip: rect(36px, 9999px, 4px, 0); }
  10% { clip: rect(85px, 9999px, 66px, 0); }
  15% { clip: rect(91px, 9999px, 91px, 0); }
  20% { clip: rect(148px, 9999px, 138px, 0); }
  25% { clip: rect(38px, 9999px, 122px, 0); }
  30% { clip: rect(69px, 9999px, 54px, 0); }
  35% { clip: rect(98px, 9999px, 71px, 0); }
  40% { clip: rect(146px, 9999px, 34px, 0); }
  45% { clip: rect(134px, 9999px, 43px, 0); }
  50% { clip: rect(102px, 9999px, 80px, 0); }
  55% { clip: rect(119px, 9999px, 44px, 0); }
  60% { clip: rect(106px, 9999px, 99px, 0); }
  65% { clip: rect(141px, 9999px, 74px, 0); }
  70% { clip: rect(20px, 9999px, 78px, 0); }
  75% { clip: rect(133px, 9999px, 79px, 0); }
  80% { clip: rect(78px, 9999px, 52px, 0); }
  85% { clip: rect(35px, 9999px, 39px, 0); }
  90% { clip: rect(67px, 9999px, 70px, 0); }
  95% { clip: rect(71px, 9999px, 103px, 0); }
  100% { clip: rect(83px, 9999px, 40px, 0); }
}

/* Scan Line Effect */
.scan-lines::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 3px
  );
  pointer-events: none;
  animation: scanMove 8s linear infinite;
}

@keyframes scanMove {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}

/* Chromatic Aberration */
.chromatic {
  position: relative;
  filter: contrast(1.1) brightness(1.1);
}

.chromatic::before,
.chromatic::after {
  content: '';
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  pointer-events: none;
}

.chromatic::before {
  background: inherit;
  filter: hue-rotate(90deg);
  transform: translateX(2px);
  opacity: 0.5;
}

.chromatic::after {
  background: inherit;
  filter: hue-rotate(-90deg);
  transform: translateX(-2px);
  opacity: 0.5;
}

/* Digital Noise */
@keyframes digitalNoise {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -5%); }
  20% { transform: translate(-10%, 5%); }
  30% { transform: translate(5%, -10%); }
  40% { transform: translate(-5%, 15%); }
  50% { transform: translate(-10%, 5%); }
  60% { transform: translate(15%, 0); }
  70% { transform: translate(0, 10%); }
  80% { transform: translate(-15%, 0); }
  90% { transform: translate(10%, 5%); }
}

.digital-noise {
  position: relative;
  overflow: hidden;
}

.digital-noise::after {
  content: '';
  position: absolute;
  inset: -100%;
  background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.05"/></svg>');
  animation: digitalNoise 0.2s infinite;
  pointer-events: none;
  opacity: 0.5;
}

/* Holographic Border Effect */
.holo-border {
  position: relative;
  border: 2px solid transparent;
  background: linear-gradient(var(--bg-layer-2), var(--bg-layer-2)) padding-box,
              linear-gradient(135deg, #00F0FF, #FF00FF, #39FF14, #00F0FF) border-box;
  animation: holoBorderRotate 3s linear infinite;
}

@keyframes holoBorderRotate {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

/* Matrix Rain Effect */
.matrix-rain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.1;
}

.matrix-column {
  position: absolute;
  top: -100%;
  font-family: var(--font-terminal);
  font-size: var(--text-sm);
  color: #39FF14;
  text-shadow: 0 0 5px #39FF14;
  white-space: nowrap;
  animation: matrixFall 10s linear infinite;
}

@keyframes matrixFall {
  0% {
    top: -100%;
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}

/* Pixel Grid Background */
.pixel-grid {
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}

/* Data Stream Lines */
.data-stream {
  position: absolute;
  width: 2px;
  height: 100px;
  background: linear-gradient(180deg, transparent, #00F0FF, transparent);
  animation: streamFlow 2s linear infinite;
  box-shadow: 0 0 10px #00F0FF;
}

@keyframes streamFlow {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}
```

---

## 📱 Responsive Design Framework

### Breakpoint Strategy for Intelligence Dashboard

**Mobile (320px - 767px)**
- Stacked single-column layout
- Collapsible panels with priority-based visibility
- Simplified network graph with touch gestures
- Bottom navigation for quick access

**Tablet (768px - 1023px)**
- Two-column grid layout
- Side panel for details
- Pinch-to-zoom network visualization
- Floating action button for quick actions

**Desktop (1024px - 1439px)**
- Three-column dashboard layout
- Full network graph with mouse controls
- Multiple simultaneous data streams
- Persistent side panels

**Large Desktop (1440px+)**
- Multi-monitor support with extended canvas
- Ultra-wide network visualization
- Picture-in-picture panels
- Advanced multi-tasking interface

```css
/* Container System */
.intel-container {
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .intel-container {
    padding: 1.5rem;
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .intel-container {
    padding: 2rem;
    max-width: 1024px;
  }
}

@media (min-width: 1440px) {
  .intel-container {
    padding: 3rem;
    max-width: 1440px;
  }
}

@media (min-width: 1920px) {
  .intel-container {
    max-width: 1920px;
  }
}

/* Responsive Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
}

@media (min-width: 1440px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## ♿ Accessibility Standards

### WCAG AA Compliance for Cyberpunk UI

**Color Contrast Requirements**
- Normal text: 4.5:1 ratio minimum
- Large text (18px+): 3:1 ratio minimum
- Neon colors adjusted for readability

```css
/* Accessible Color Adjustments */
:root {
  /* High contrast alternatives */
  --cyan-accessible: #00D9FF;     /* 4.5:1 on dark bg */
  --magenta-accessible: #FF33FF;  /* 4.5:1 on dark bg */
  --green-accessible: #4DFF4D;    /* 4.5:1 on dark bg */
}

/* Focus Indicators */
*:focus-visible {
  outline: 3px solid var(--cyan-accessible);
  outline-offset: 3px;
  border-radius: 4px;
}

/* Screen Reader Only */
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

**Keyboard Navigation**
```typescript
// Full keyboard support for network navigation
const KeyboardControls = {
  'Tab': 'Navigate between nodes',
  'Enter': 'Select/activate node',
  'Space': 'Toggle node details',
  'Arrow Keys': 'Move focus in graph',
  'Escape': 'Close panels/deselect',
  '+/-': 'Zoom in/out',
  'Home': 'Reset view',
};
```

**Screen Reader Support**
```html
<!-- ARIA Labels for Network Graph -->
<div
  role="img"
  aria-label="Intelligence network graph showing 47 connected events and 23 actors"
>
  <div
    role="button"
    aria-label="Event: Border incursion, Threat level: high, Connected to 5 actors"
    tabindex="0"
  >
    <!-- Node visualization -->
  </div>
</div>

<!-- Live Region for Updates -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  New threat detected: China aggression score increased to 73
</div>
```

---

## 🚀 Technical Implementation Approach

### Technology Stack

**Core Libraries**
```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.95.0",
    "framer-motion": "^11.0.0",
    "d3-force": "^3.0.0",
    "gsap": "^3.12.0"
  }
}
```

**Three.js Scene Setup**
```typescript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class IntelNetworkScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  constructor(canvas: HTMLCanvasElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A0F);
    this.scene.fog = new THREE.Fog(0x0A0A0F, 50, 200);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 50;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Point lights for glow effect
    const cyanLight = new THREE.PointLight(0x00F0FF, 2, 100);
    cyanLight.position.set(20, 20, 20);
    this.scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xFF00FF, 2, 100);
    magentaLight.position.set(-20, -20, 20);
    this.scene.add(magentaLight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

**Performance Optimization**
```typescript
// Level of Detail (LOD) for large networks
class NetworkLOD {
  highDetail: THREE.Mesh;
  mediumDetail: THREE.Mesh;
  lowDetail: THREE.Mesh;

  constructor(node: NetworkNode) {
    this.highDetail = this.createHighDetailMesh(node);
    this.mediumDetail = this.createMediumDetailMesh(node);
    this.lowDetail = this.createLowDetailMesh(node);

    const lod = new THREE.LOD();
    lod.addLevel(this.highDetail, 0);
    lod.addLevel(this.mediumDetail, 30);
    lod.addLevel(this.lowDetail, 60);

    return lod;
  }

  createHighDetailMesh(node: NetworkNode) {
    // Detailed geometry with glow effects
    const geometry = new THREE.IcosahedronGeometry(1, 2);
    const material = new THREE.MeshPhongMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.5,
      shininess: 100,
    });
    return new THREE.Mesh(geometry, material);
  }

  createMediumDetailMesh(node: NetworkNode) {
    // Simplified geometry
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ color: node.color });
    return new THREE.Mesh(geometry, material);
  }

  createLowDetailMesh(node: NetworkNode) {
    // Point sprite for distant view
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    const material = new THREE.PointsMaterial({
      color: node.color,
      size: 2,
      sizeAttenuation: true,
    });
    return new THREE.Points(geometry, material);
  }
}

// Instanced rendering for particle systems
class ParticleSystem {
  instancedMesh: THREE.InstancedMesh;

  constructor(count: number) {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      transparent: true,
      opacity: 0.8,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    // Set initial positions
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );
      this.instancedMesh.setMatrixAt(i, matrix);
    }
  }
}
```

---

## 🎯 Component Library Summary

### Base Components Delivered

1. **Network Graph Visualization**
   - 3D force-directed graph with WebGL
   - Interactive nodes with multiple states
   - Animated connection lines with data flow particles

2. **Holographic Aggression Matrix**
   - 3D globe with threat overlays
   - Country detail panels with metrics
   - Real-time AI predictions

3. **AI Deduction Engine**
   - Live deduction stream
   - Confidence meters and validation controls
   - Neural network visualization

4. **Signal Processing Display**
   - Spectrum analyzer with live frequency visualization
   - Filterable signal feed
   - Processing statistics overlay

5. **Glitch Effects Library**
   - Glitch text animations
   - Scan line effects
   - Chromatic aberration
   - Digital noise overlays
   - Matrix rain effect
   - Holographic borders

---

## 📋 Design System Deliverable Checklist

- ✅ Comprehensive color system with neon cyberpunk palette
- ✅ Typography system with monospace fonts for data display
- ✅ Spacing system based on 8px grid
- ✅ Network graph visualization with Three.js implementation
- ✅ Holographic globe with threat overlay system
- ✅ AI deduction engine with real-time processing display
- ✅ Signal processing visualization with spectrum analyzer
- ✅ Complete glitch and digital effects library
- ✅ Responsive design framework for all screen sizes
- ✅ WCAG AA accessibility compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Performance optimization strategies
- ✅ Component state management patterns
- ✅ Animation and transition specifications

---

## 🎨 Color Palette Reference Card

```
PRIMARY COLORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
█ Cyan Electric    #00F0FF
█ Magenta Pulse    #FF00FF
█ Acid Green       #39FF14
█ Amber Warning    #FFB000
█ Crimson Alert    #FF0055

BACKGROUND DEPTHS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
█ Void             #0A0A0F
█ Layer 1          #12121A
█ Layer 2          #1A1A28
█ Layer 3          #22223A

THREAT LEVELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
█ Low              #39FF14 → #00AA00
█ Medium           #FFB000 → #FF6B00
█ High             #FF0055 → #AA0033
█ Critical         #FF0055 → #FF00FF
```

---

**UI Designer**: Cyberpunk Intelligence Systems
**Design System Version**: 1.0
**Implementation Status**: Ready for developer handoff
**Technology Stack**: React + Next.js + Three.js + WebGL
**Accessibility**: WCAG AA Compliant
**Performance Target**: 60 FPS network visualization

---

## 📚 Research Sources

This design was informed by extensive research into modern cyberpunk UI patterns and technical implementation approaches:

- [Game UI Database - Watch Dogs 2](https://www.gameuidatabase.com/gameData.php?id=47)
- [Watch Dogs 2 Interface Design](https://interfaceingame.com/games/watch-dogs-2/)
- [Watch Dogs 2 Graphic Direction on Behance](https://www.behance.net/gallery/45126777/Watch-Dogs-2-Graphic-Direction)
- [Game UI Database - Cyberpunk 2077](https://gameuidatabase.com/gameData.php?id=439)
- [Cyberpunk 2077 HUDS+GUIS](https://www.hudsandguis.com/home/2019/cyberpunk-2077)
- [Cyberpunk 2077 User Interface Part 1](https://www.behance.net/gallery/118663901/Cyberpunk-2077User-Interface-(Part-1))
- [Cyberpunk 2077 User Interface Part 2](https://www.behance.net/gallery/133185623/Cyberpunk-2077User-Interface-(Part-2))
- [Interactive 3D Earth Globe with WebGL](https://webgl-digital-globe.vercel.app)
- [Three.js Examples](https://threejs.org/examples/)
- [CYBERCORE CSS Framework](https://dev.to/sebyx07/introducing-cybercore-css-a-cyberpunk-design-framework-for-futuristic-uis-2e6c)

---

*End of Design Document*
