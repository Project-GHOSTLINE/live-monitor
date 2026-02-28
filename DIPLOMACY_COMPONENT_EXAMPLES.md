# Diplomacy Screen - Component Implementation Examples

## Complete Component Examples with TypeScript

### 1. Diplomatic Network Graph Component

```typescript
// components/diplomacy/DiplomaticNetworkGraph.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface DiplomaticNode {
  id: string;
  name: string;
  flag: string;
  influence: number;
  militaryPower: number;
  economicPower: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface DiplomaticEdge {
  source: string;
  target: string;
  relationshipType: 'ally' | 'friendly' | 'neutral' | 'tense' | 'hostile' | 'war';
  strength: number;
}

interface DiplomaticNetworkGraphProps {
  countries: DiplomaticNode[];
  relationships: DiplomaticEdge[];
  dataLayer: 'military' | 'economic' | 'diplomatic';
  selectedCountries: string[];
  onSelectCountry: (countryId: string) => void;
}

export function DiplomaticNetworkGraph({
  countries,
  relationships,
  dataLayer,
  selectedCountries,
  onSelectCountry
}: DiplomaticNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Resize observer
  useEffect(() => {
    if (!svgRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    resizeObserver.observe(svgRef.current.parentElement!);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create groups for layers
    const g = svg.append('g');
    const edgesGroup = g.append('g').attr('class', 'edges');
    const nodesGroup = g.append('g').attr('class', 'nodes');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(countries as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(relationships)
        .id((d: any) => d.id)
        .distance(150)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Relationship color mapping
    const relationshipColors = {
      ally: '#22c55e',
      friendly: '#3b82f6',
      neutral: '#6b7280',
      tense: '#f59e0b',
      hostile: '#ef4444',
      war: '#991b1b'
    };

    // Draw edges
    const edges = edgesGroup.selectAll('line')
      .data(relationships)
      .join('line')
      .attr('stroke', d => relationshipColors[d.relationshipType])
      .attr('stroke-width', d => d.strength / 25 + 1)
      .attr('stroke-opacity', 0.6)
      .attr('class', d => {
        if (d.relationshipType === 'war') return 'edge-war';
        return '';
      });

    // Draw nodes
    const nodes = nodesGroup.selectAll('g')
      .data(countries)
      .join('g')
      .attr('class', 'country-node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, DiplomaticNode>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }))
      .on('click', (event, d) => {
        event.stopPropagation();
        onSelectCountry(d.id);
      });

    // Node circles
    nodes.append('circle')
      .attr('r', d => {
        // Size based on data layer
        let value = d.influence;
        if (dataLayer === 'military') value = d.militaryPower;
        if (dataLayer === 'economic') value = d.economicPower;
        return Math.max(20, value / 2);
      })
      .attr('fill', d => {
        if (selectedCountries.includes(d.id)) {
          return '#3b82f6';
        }
        return '#334155';
      })
      .attr('stroke', d => {
        if (selectedCountries.includes(d.id)) {
          return '#60a5fa';
        }
        return '#475569';
      })
      .attr('stroke-width', d => selectedCountries.includes(d.id) ? 4 : 2)
      .style('filter', d => {
        if (selectedCountries.includes(d.id)) {
          return 'drop-shadow(0 0 12px #3b82f6)';
        }
        return 'none';
      });

    // Node flags/icons
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', '20px')
      .style('pointer-events', 'none')
      .text(d => d.flag);

    // Node labels
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => {
        let value = d.influence;
        if (dataLayer === 'military') value = d.militaryPower;
        if (dataLayer === 'economic') value = d.economicPower;
        return Math.max(20, value / 2) + 15;
      })
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#f8fafc')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
      .style('pointer-events', 'none')
      .text(d => d.name);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      edges
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [countries, relationships, dimensions, dataLayer, selectedCountries, onSelectCountry]);

  return (
    <div className="diplomatic-network-container">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="network-canvas"
      />

      {/* Network Controls */}
      <div className="network-controls">
        <button
          className="network-control-button"
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(
              d3.zoom<SVGSVGElement, unknown>().transform,
              d3.zoomIdentity
            );
          }}
          aria-label="Reset zoom"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .diplomatic-network-container {
          position: relative;
          width: 100%;
          height: 600px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border: 2px solid #475569;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .network-canvas {
          cursor: grab;
        }

        .network-canvas:active {
          cursor: grabbing;
        }

        .network-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
          z-index: 20;
        }

        .network-control-button {
          width: 40px;
          height: 40px;
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid #475569;
          border-radius: 0.375rem;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }

        .network-control-button:hover {
          background: rgba(51, 65, 85, 0.9);
          border-color: #3b82f6;
        }

        :global(.edge-war) {
          animation: pulse-war 2s ease-in-out infinite;
        }

        @keyframes pulse-war {
          0%, 100% { stroke-opacity: 0.8; }
          50% { stroke-opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
```

---

### 2. Aggression Matrix Component

```typescript
// components/diplomacy/AggressionMatrix.tsx
'use client';

import { useState } from 'react';

interface AggressionCell {
  countryA: string;
  countryB: string;
  defconLevel: 1 | 2 | 3 | 4 | 5;
  aggressionScore: number;
  trend: 'escalating' | 'stable' | 'de-escalating';
  recentIncidents: number;
}

interface AggressionMatrixProps {
  countries: Array<{ id: string; name: string; flag: string }>;
  matrix: AggressionCell[][];
  onCellClick?: (cell: AggressionCell) => void;
}

export function AggressionMatrix({ countries, matrix, onCellClick }: AggressionMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const getDefconColor = (level: number) => {
    const colors = {
      1: '#dc2626',
      2: '#f97316',
      3: '#f59e0b',
      4: '#eab308',
      5: '#22c55e'
    };
    return colors[level as keyof typeof colors] || '#6b7280';
  };

  const getDefconLabel = (level: number) => {
    const labels = {
      1: 'IMMINENT',
      2: 'CRITICAL',
      3: 'ELEVATED',
      4: 'GUARDED',
      5: 'LOW'
    };
    return labels[level as keyof typeof labels] || 'UNKNOWN';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'escalating') return '▲';
    if (trend === 'de-escalating') return '▼';
    return '━';
  };

  return (
    <div className="aggression-matrix-container">
      <div className="matrix-header">
        <h2 className="matrix-title">Bilateral Threat Assessment</h2>
        <div className="matrix-legend">
          {[1, 2, 3, 4, 5].map(level => (
            <div key={level} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: getDefconColor(level) }}
              />
              <span className="legend-label">DEFCON {level}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="matrix-scroll-container">
        <table className="aggression-matrix-table">
          <thead>
            <tr>
              <th className="matrix-corner-cell"></th>
              {countries.map(country => (
                <th key={country.id} className="matrix-header-cell">
                  <div className="header-content">
                    <span className="header-flag">{country.flag}</span>
                    <span className="header-name">{country.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((rowCountry, rowIndex) => (
              <tr key={rowCountry.id}>
                <td className="matrix-row-header">
                  <div className="header-content">
                    <span className="header-flag">{rowCountry.flag}</span>
                    <span className="header-name">{rowCountry.name}</span>
                  </div>
                </td>
                {countries.map((colCountry, colIndex) => {
                  const cell = matrix[rowIndex]?.[colIndex];
                  const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
                  const isSameCountry = rowIndex === colIndex;

                  if (!cell || isSameCountry) {
                    return (
                      <td key={colCountry.id} className="matrix-data-cell diagonal-cell">
                        <div className="diagonal-indicator">━</div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={colCountry.id}
                      className={`matrix-data-cell defcon-${cell.defconLevel} ${isHovered ? 'hovered' : ''}`}
                      style={{ backgroundColor: `${getDefconColor(cell.defconLevel)}15` }}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => onCellClick?.(cell)}
                    >
                      <div className="cell-content">
                        <div
                          className="defcon-indicator"
                          style={{ color: getDefconColor(cell.defconLevel) }}
                        >
                          {cell.defconLevel}
                        </div>
                        <div className="defcon-label">{getDefconLabel(cell.defconLevel)}</div>
                        <div className={`trend-indicator trend-${cell.trend}`}>
                          {getTrendIcon(cell.trend)}
                        </div>
                        {cell.recentIncidents > 0 && (
                          <div className="incident-badge">
                            {cell.recentIncidents} incidents
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .aggression-matrix-container {
          background: #1e293b;
          border: 2px solid #475569;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .matrix-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #334155;
        }

        .matrix-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .matrix-legend {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 0.25rem;
          border: 1px solid #334155;
        }

        .legend-label {
          font-family: 'JetBrains Mono', monospace;
          color: #cbd5e1;
          font-weight: 500;
        }

        .matrix-scroll-container {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 600px;
        }

        .aggression-matrix-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 2px;
        }

        .matrix-corner-cell {
          background: #334155;
          min-width: 120px;
        }

        .matrix-header-cell,
        .matrix-row-header {
          background: #334155;
          padding: 0.75rem;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: #f8fafc;
          text-align: center;
          position: sticky;
        }

        .matrix-header-cell {
          top: 0;
          z-index: 10;
        }

        .matrix-row-header {
          left: 0;
          z-index: 5;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .header-flag {
          font-size: 1.5rem;
        }

        .header-name {
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .matrix-data-cell {
          background: #1e293b;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-width: 100px;
          min-height: 100px;
          text-align: center;
        }

        .matrix-data-cell:hover {
          transform: scale(1.05);
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .diagonal-cell {
          background: #0f172a !important;
          cursor: default;
        }

        .diagonal-cell:hover {
          transform: none;
          box-shadow: none;
        }

        .diagonal-indicator {
          color: #475569;
          font-size: 1.5rem;
        }

        .cell-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .defcon-indicator {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2rem;
          font-weight: 700;
          text-shadow: 0 0 10px currentColor;
        }

        .defcon-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.625rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .trend-indicator {
          font-size: 1rem;
          margin-top: 0.25rem;
        }

        .trend-escalating {
          color: #ef4444;
        }

        .trend-stable {
          color: #6b7280;
        }

        .trend-deescalating {
          color: #22c55e;
        }

        .incident-badge {
          font-size: 0.625rem;
          color: #f87171;
          font-family: 'JetBrains Mono', monospace;
          margin-top: 0.25rem;
          padding: 0.125rem 0.375rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  );
}
```

---

### 3. Alliance Visualization Component

```typescript
// components/diplomacy/AlliancePanel.tsx
'use client';

interface Alliance {
  id: string;
  name: string;
  type: 'military' | 'economic' | 'political' | 'hybrid';
  members: Array<{
    id: string;
    name: string;
    flag: string;
    role: 'leader' | 'core' | 'partner' | 'observer';
  }>;
  militaryStrength: number;
  economicPower: number;
  diplomaticInfluence: number;
  founded: string;
}

interface AlliancePanelProps {
  alliances: Alliance[];
}

export function AlliancePanel({ alliances }: AlliancePanelProps) {
  const getTypeColor = (type: string) => {
    const colors = {
      military: '#dc2626',
      economic: '#f59e0b',
      political: '#3b82f6',
      hybrid: '#8b5cf6'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      military: '⚔️',
      economic: '💰',
      political: '🏛️',
      hybrid: '🌐'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  return (
    <div className="alliance-panel-container">
      {alliances.map(alliance => (
        <div key={alliance.id} className="alliance-bloc">
          <div
            className="alliance-type-stripe"
            style={{ background: getTypeColor(alliance.type) }}
          />

          <div className="alliance-header">
            <div className="alliance-icon">{getTypeIcon(alliance.type)}</div>
            <div className="alliance-info">
              <h3 className="alliance-name">{alliance.name}</h3>
              <div className="alliance-type">
                {alliance.type.toUpperCase()} • EST. {alliance.founded}
              </div>
            </div>
          </div>

          <div className="alliance-members">
            {alliance.members.map(member => (
              <div key={member.id} className="member-item">
                <span className="member-flag">{member.flag}</span>
                <span className="member-name">{member.name}</span>
                <span className="member-role">{member.role}</span>
              </div>
            ))}
          </div>

          <div className="alliance-stats">
            <div className="stat-item">
              <span className="stat-value" style={{ color: '#dc2626' }}>
                {alliance.militaryStrength}
              </span>
              <span className="stat-label">Military</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ color: '#f59e0b' }}>
                {alliance.economicPower}
              </span>
              <span className="stat-label">Economic</span>
            </div>
            <div className="stat-item">
              <span className="stat-value" style={{ color: '#3b82f6' }}>
                {alliance.diplomaticInfluence}
              </span>
              <span className="stat-label">Diplomatic</span>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .alliance-panel-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .alliance-bloc {
          background: linear-gradient(135deg, #1e293b, #334155);
          border: 2px solid #475569;
          border-radius: 0.5rem;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .alliance-type-stripe {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .alliance-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-top: 0.5rem;
        }

        .alliance-icon {
          width: 48px;
          height: 48px;
          border-radius: 0.5rem;
          background: #0f172a;
          border: 2px solid #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .alliance-info {
          flex: 1;
        }

        .alliance-name {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 0.25rem;
        }

        .alliance-type {
          font-size: 0.875rem;
          color: #cbd5e1;
          font-family: 'JetBrains Mono', monospace;
        }

        .alliance-members {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.375rem;
          border: 1px solid #334155;
          transition: all 0.2s ease;
        }

        .member-item:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
        }

        .member-flag {
          font-size: 20px;
          width: 32px;
          text-align: center;
        }

        .member-name {
          flex: 1;
          font-size: 0.875rem;
          color: #f8fafc;
        }

        .member-role {
          font-size: 0.75rem;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
          padding: 0.25rem 0.5rem;
          background: #0f172a;
          border-radius: 0.25rem;
          text-transform: uppercase;
        }

        .alliance-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #334155;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.25rem;
          font-weight: 700;
          display: block;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
```

---

### 4. Data Layer Toggle Component

```typescript
// components/diplomacy/DataLayerControls.tsx
'use client';

interface DataLayerControlsProps {
  activeLayer: 'military' | 'economic' | 'diplomatic' | 'combined';
  onLayerChange: (layer: 'military' | 'economic' | 'diplomatic' | 'combined') => void;
}

export function DataLayerControls({ activeLayer, onLayerChange }: DataLayerControlsProps) {
  const layers = [
    { id: 'military', label: 'Military Power', icon: '⚔️', color: '#dc2626' },
    { id: 'economic', label: 'Economic Strength', icon: '💰', color: '#f59e0b' },
    { id: 'diplomatic', label: 'Diplomatic Influence', icon: '🤝', color: '#3b82f6' },
    { id: 'combined', label: 'Strategic Overview', icon: '🌍', color: '#8b5cf6' }
  ] as const;

  return (
    <div className="data-layer-controls">
      {layers.map(layer => (
        <button
          key={layer.id}
          className={`layer-button ${activeLayer === layer.id ? 'active' : ''}`}
          onClick={() => onLayerChange(layer.id as any)}
          style={{
            '--layer-color': layer.color
          } as React.CSSProperties}
        >
          <span className="layer-icon">{layer.icon}</span>
          <span className="layer-label">{layer.label}</span>
        </button>
      ))}

      <style jsx>{`
        .data-layer-controls {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: #1e293b;
          border-radius: 0.5rem;
          border: 1px solid #475569;
          margin-bottom: 1.5rem;
        }

        .layer-button {
          flex: 1;
          padding: 0.75rem 1rem;
          background: #334155;
          border: 2px solid transparent;
          border-radius: 0.375rem;
          color: #cbd5e1;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .layer-button:hover {
          background: #0f172a;
          border-color: #475569;
        }

        .layer-button.active {
          background: var(--layer-color);
          color: #ffffff;
          border-color: var(--layer-color);
          box-shadow: 0 0 20px var(--layer-color);
        }

        .layer-icon {
          font-size: 18px;
        }

        .layer-label {
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .data-layer-controls {
            flex-direction: column;
          }

          .layer-button {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
```

---

### 5. Relationship Timeline Component

```typescript
// components/diplomacy/RelationshipTimeline.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TimelineEvent {
  timestamp: number;
  eventType: 'alliance_formed' | 'treaty_signed' | 'sanctions_imposed' |
             'diplomatic_break' | 'war_declared' | 'peace_treaty';
  description: string;
  relationshipScore: number; // -100 to +100
}

interface RelationshipTimelineProps {
  countryA: string;
  countryB: string;
  events: TimelineEvent[];
  timeRange: '1y' | '5y' | '10y' | 'all';
  onTimeRangeChange: (range: '1y' | '5y' | '10y' | 'all') => void;
}

export function RelationshipTimeline({
  countryA,
  countryB,
  events,
  timeRange,
  onTimeRangeChange
}: RelationshipTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 });

  useEffect(() => {
    if (!svgRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: 300 });
    });

    resizeObserver.observe(svgRef.current.parentElement!);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 40, bottom: 40, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(events, d => d.timestamp) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([-100, 100])
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height / 2})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .attr('class', 'axis');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .attr('class', 'axis');

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#475569')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Area under curve
    const area = d3.area<TimelineEvent>()
      .x(d => xScale(d.timestamp))
      .y0(yScale(0))
      .y1(d => yScale(d.relationshipScore))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(events)
      .attr('fill', 'url(#gradient)')
      .attr('d', area)
      .attr('opacity', 0.3);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#22c55e')
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#6b7280')
      .attr('stop-opacity', 1);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ef4444')
      .attr('stop-opacity', 1);

    // Line
    const line = d3.line<TimelineEvent>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.relationshipScore))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(events)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', line)
      .style('filter', 'drop-shadow(0 0 4px #3b82f6)');

    // Event markers
    const eventGroup = g.append('g');

    eventGroup.selectAll('circle')
      .data(events)
      .join('circle')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.relationshipScore))
      .attr('r', 6)
      .attr('fill', d => d.relationshipScore >= 0 ? '#22c55e' : '#ef4444')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', d => `drop-shadow(0 0 4px ${d.relationshipScore >= 0 ? '#22c55e' : '#ef4444'})`)
      .on('mouseenter', function() {
        d3.select(this).attr('r', 9);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('r', 6);
      });

  }, [events, dimensions]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      alliance_formed: '🤝 Alliance Formed',
      treaty_signed: '📜 Treaty Signed',
      sanctions_imposed: '⚠️ Sanctions Imposed',
      diplomatic_break: '💔 Diplomatic Break',
      war_declared: '⚔️ War Declared',
      peace_treaty: '🕊️ Peace Treaty'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <div className="timeline-countries">
          <span>{countryA}</span>
          <span className="timeline-separator">↔</span>
          <span>{countryB}</span>
        </div>

        <div className="timeline-zoom-controls">
          {(['1y', '5y', '10y', 'all'] as const).map(range => (
            <button
              key={range}
              className={`zoom-button ${timeRange === range ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(range)}
            >
              {range === 'all' ? 'ALL TIME' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-graph-container">
        <svg ref={svgRef} width="100%" height={dimensions.height} />
      </div>

      <div className="timeline-events-list">
        {events.slice().reverse().map((event, index) => (
          <div
            key={index}
            className={`timeline-event-item ${event.relationshipScore >= 0 ? 'positive' : 'negative'}`}
          >
            <div className="timeline-event-date">
              {formatDate(event.timestamp)}
            </div>
            <div className="timeline-event-content">
              <div className="timeline-event-type">
                {getEventTypeLabel(event.eventType)}
              </div>
              <div className="timeline-event-description">
                {event.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .timeline-container {
          background: #1e293b;
          border: 2px solid #475569;
          border-radius: 0.5rem;
          padding: 1.5rem;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .timeline-countries {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .timeline-separator {
          color: #64748b;
        }

        .timeline-zoom-controls {
          display: flex;
          gap: 0.5rem;
        }

        .zoom-button {
          padding: 0.5rem 0.75rem;
          background: #334155;
          border: 1px solid #334155;
          border-radius: 0.25rem;
          color: #cbd5e1;
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .zoom-button:hover {
          background: #0f172a;
          border-color: #475569;
        }

        .zoom-button.active {
          background: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;
        }

        .timeline-graph-container {
          margin-bottom: 1rem;
          border-radius: 0.375rem;
          overflow: hidden;
        }

        :global(.axis) {
          color: #64748b;
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }

        :global(.axis path),
        :global(.axis line) {
          stroke: #475569;
        }

        .timeline-events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .timeline-event-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #334155;
          border-left: 4px solid #475569;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }

        .timeline-event-item:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .timeline-event-item.positive {
          border-left-color: #22c55e;
        }

        .timeline-event-item.negative {
          border-left-color: #ef4444;
        }

        .timeline-event-date {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #64748b;
          min-width: 80px;
          padding-top: 0.25rem;
        }

        .timeline-event-content {
          flex: 1;
        }

        .timeline-event-type {
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          color: #cbd5e1;
          margin-bottom: 0.25rem;
        }

        .timeline-event-description {
          font-size: 0.875rem;
          color: #f8fafc;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
```

---

## Sample Page Integration

```typescript
// app/diplomacy/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/shared/Navigation';
import { DiplomaticNetworkGraph } from '@/components/diplomacy/DiplomaticNetworkGraph';
import { AggressionMatrix } from '@/components/diplomacy/AggressionMatrix';
import { AlliancePanel } from '@/components/diplomacy/AlliancePanel';
import { DataLayerControls } from '@/components/diplomacy/DataLayerControls';
import { RelationshipTimeline } from '@/components/diplomacy/RelationshipTimeline';

export default function DiplomacyPage() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [dataLayer, setDataLayer] = useState<'military' | 'economic' | 'diplomatic' | 'combined'>('diplomatic');
  const [timelineRange, setTimelineRange] = useState<'1y' | '5y' | '10y' | 'all'>('5y');

  const { data: diplomaticData, isLoading } = useQuery({
    queryKey: ['diplomatic-relations'],
    queryFn: async () => {
      const response = await fetch('/api/diplomacy');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const handleSelectCountry = (countryId: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(countryId)) {
        return prev.filter(id => id !== countryId);
      }
      if (prev.length >= 2) {
        return [prev[1], countryId];
      }
      return [...prev, countryId];
    });
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
          <div className="text-green-400 font-mono text-2xl animate-pulse">
            INITIALIZING DIPLOMATIC INTELLIGENCE...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-display text-green-400 mb-2">
              DIPLOMATIC INTELLIGENCE MATRIX
            </h1>
            <p className="text-green-500/80 font-mono text-sm">
              Real-time relationship analysis and strategic forecasting
            </p>
          </div>

          {/* Data Layer Controls */}
          <DataLayerControls
            activeLayer={dataLayer}
            onLayerChange={setDataLayer}
          />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Network Graph - Takes 2 columns */}
            <div className="lg:col-span-2">
              <DiplomaticNetworkGraph
                countries={diplomaticData?.countries || []}
                relationships={diplomaticData?.relationships || []}
                dataLayer={dataLayer}
                selectedCountries={selectedCountries}
                onSelectCountry={handleSelectCountry}
              />
            </div>

            {/* Aggression Matrix */}
            <div>
              <AggressionMatrix
                countries={diplomaticData?.countries || []}
                matrix={diplomaticData?.aggressionMatrix || []}
              />
            </div>
          </div>

          {/* Alliance Panel */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-green-400 mb-4">
              ACTIVE ALLIANCES & COALITIONS
            </h2>
            <AlliancePanel
              alliances={diplomaticData?.alliances || []}
            />
          </div>

          {/* Timeline - Shows when 2 countries selected */}
          {selectedCountries.length === 2 && (
            <RelationshipTimeline
              countryA={selectedCountries[0]}
              countryB={selectedCountries[1]}
              events={diplomaticData?.timeline || []}
              timeRange={timelineRange}
              onTimeRangeChange={setTimelineRange}
            />
          )}
        </div>
      </div>
    </>
  );
}
```

---

## Mock API Response Structure

```typescript
// Example API response for /api/diplomacy
{
  "countries": [
    {
      "id": "US",
      "name": "United States",
      "flag": "🇺🇸",
      "influence": 95,
      "militaryPower": 98,
      "economicPower": 92,
      "diplomaticWeight": 90,
      "alliances": ["NATO", "AUKUS"],
      "coalitions": ["Five Eyes"]
    },
    {
      "id": "CHN",
      "name": "China",
      "flag": "🇨🇳",
      "influence": 88,
      "militaryPower": 85,
      "economicPower": 95,
      "diplomaticWeight": 82,
      "alliances": ["SCO"],
      "coalitions": ["BRICS"]
    }
  ],
  "relationships": [
    {
      "source": "US",
      "target": "CHN",
      "relationshipType": "tense",
      "strength": 45,
      "tradeVolume": 650000000000,
      "sanctions": true
    }
  ],
  "aggressionMatrix": [
    [
      { "countryA": "US", "countryB": "CHN", "defconLevel": 3, "aggressionScore": 65, "trend": "escalating", "recentIncidents": 12 }
    ]
  ],
  "alliances": [
    {
      "id": "NATO",
      "name": "North Atlantic Treaty Organization",
      "type": "military",
      "members": [
        { "id": "US", "name": "United States", "flag": "🇺🇸", "role": "leader" },
        { "id": "UK", "name": "United Kingdom", "flag": "🇬🇧", "role": "core" }
      ],
      "militaryStrength": 95,
      "economicPower": 88,
      "diplomaticInfluence": 92,
      "founded": "1949"
    }
  ],
  "timeline": [
    {
      "timestamp": 1704067200000,
      "eventType": "sanctions_imposed",
      "description": "New technology export restrictions announced",
      "relationshipScore": -45
    }
  ]
}
```

This comprehensive component library provides production-ready implementations for the Civilization/Grand Strategy diplomacy screen with full TypeScript support, D3.js visualizations, and modern React patterns.
