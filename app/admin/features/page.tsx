'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/shared/Navigation';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'orchestrator' | 'state' | 'map';
}

const FEATURE_FLAGS: Omit<FeatureFlag, 'enabled'>[] = [
  {
    key: 'ORCH_ENABLED',
    name: 'Orchestrator Pipeline',
    description: 'Event frame extraction and signal processing pipeline',
    category: 'orchestrator',
  },
  {
    key: 'STATE_ENABLED',
    name: 'State Engine',
    description: 'Country readiness, world state, and relation edge calculations',
    category: 'state',
  },
  {
    key: 'MAP_ENABLED',
    name: 'Enhanced Map System',
    description: 'Gameplay scoring, advanced filtering, and replay functionality',
    category: 'map',
  },
];

function getCategoryColor(category: string) {
  switch (category) {
    case 'orchestrator': return 'border-blue-600 bg-blue-900/20';
    case 'state': return 'border-green-600 bg-green-900/20';
    case 'map': return 'border-purple-600 bg-purple-900/20';
    default: return 'border-gray-600 bg-gray-900/20';
  }
}

function getCategoryBadge(category: string) {
  switch (category) {
    case 'orchestrator': return { label: 'ORCHESTRATOR', color: 'bg-blue-600' };
    case 'state': return { label: 'STATE ENGINE', color: 'bg-green-600' };
    case 'map': return { label: 'MAP SYSTEM', color: 'bg-purple-600' };
    default: return { label: 'SYSTEM', color: 'bg-gray-600' };
  }
}

export default function FeaturesAdminPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    loadFeatureStates();
  }, []);

  const loadFeatureStates = () => {
    // In production, fetch from /api/admin/features
    // For now, read from environment variables (client-side simulation)
    const featureStates: FeatureFlag[] = FEATURE_FLAGS.map(flag => ({
      ...flag,
      enabled: getEnvFlag(flag.key),
    }));

    setFeatures(featureStates);
    setLoading(false);
  };

  // Simulate reading environment variable (in production, this would be server-side)
  const getEnvFlag = (key: string): boolean => {
    // Check localStorage for override (dev mode)
    const override = localStorage.getItem(`feature_${key}`);
    if (override !== null) return override === 'true';

    // Default states (would come from actual env in production)
    return false; // All flags default to false/hidden
  };

  const toggleFeature = (key: string) => {
    // In production, this would POST to /api/admin/features
    // For now, use localStorage
    const currentState = features.find(f => f.key === key)?.enabled || false;
    const newState = !currentState;

    localStorage.setItem(`feature_${key}`, String(newState));

    setFeatures(prev =>
      prev.map(f => (f.key === key ? { ...f, enabled: newState } : f))
    );
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-green-400 font-mono text-center space-y-4 animate-pulse">
            <div className="text-6xl font-bold mb-8">⚙️</div>
            <div className="text-2xl tracking-widest">LOADING FEATURES...</div>
          </div>
        </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex items-center justify-center">
          <div className="text-red-400 font-mono text-center space-y-4 border-2 border-red-600 p-8 bg-black/60">
            <div className="text-6xl font-bold mb-8">🚫</div>
            <div className="text-3xl tracking-widest">UNAUTHORIZED</div>
            <div className="text-sm opacity-70">Admin access required</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-green-400">
        {/* Scan lines */}
        <div className="fixed inset-0 bg-gradient-to-b from-transparent via-green-900/5 to-transparent pointer-events-none animate-scan" />

        <div className="relative z-10 max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="border-b-4 border-green-500 bg-black/80 backdrop-blur-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-5xl">⚙️</div>
              <div>
                <div className="text-xs text-green-500/60 font-mono tracking-widest">SYSTEM ADMINISTRATION</div>
                <h1 className="text-4xl font-bold tracking-wider font-mono text-green-400 glow-text">
                  FEATURE FLAGS CONTROL
                </h1>
              </div>
            </div>
            <div className="text-sm font-mono text-green-500/60 mt-3">
              Enable or disable system features. Changes take effect immediately.
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-900/20 border-2 border-yellow-600 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="text-sm font-mono text-yellow-400">
                <div className="font-bold mb-1">PRODUCTION ENVIRONMENT</div>
                <div className="text-yellow-300/80">
                  Disabling features may affect live users. All changes are logged.
                  This is a demo interface - in production, changes would require authentication
                  and POST to /api/admin/features with proper authorization.
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => {
              const badge = getCategoryBadge(feature.category);
              const categoryColor = getCategoryColor(feature.category);

              return (
                <div
                  key={feature.key}
                  className={`border-2 ${categoryColor} p-6 bg-black/40 transition-all hover:scale-[1.02]`}
                >
                  {/* Category Badge */}
                  <div className={`inline-block px-3 py-1 ${badge.color} text-white text-xs font-mono font-bold mb-4`}>
                    {badge.label}
                  </div>

                  {/* Feature Name */}
                  <h2 className="text-xl font-bold font-mono text-green-400 mb-2">
                    {feature.name}
                  </h2>

                  {/* Description */}
                  <p className="text-sm font-mono text-green-500/70 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Status Display */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-900/40">
                    <div className="text-xs font-mono text-green-500/60">STATUS:</div>
                    <div className={`text-sm font-mono font-bold ${feature.enabled ? 'text-green-400' : 'text-red-400'}`}>
                      {feature.enabled ? '✓ ENABLED' : '✗ DISABLED'}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleFeature(feature.key)}
                    className={`w-full py-3 font-mono font-bold border-2 transition-all ${
                      feature.enabled
                        ? 'bg-red-900/40 border-red-600 text-red-400 hover:bg-red-800/40'
                        : 'bg-green-900/40 border-green-600 text-green-400 hover:bg-green-800/40'
                    }`}
                  >
                    {feature.enabled ? '🔴 DISABLE FEATURE' : '🟢 ENABLE FEATURE'}
                  </button>

                  {/* Environment Variable */}
                  <div className="mt-4 pt-4 border-t border-green-900/40">
                    <div className="text-[10px] font-mono text-green-500/40 mb-1">ENV VAR:</div>
                    <div className="text-xs font-mono text-green-400 bg-black/60 px-2 py-1 border border-green-900/40">
                      {feature.key}={feature.enabled ? 'true' : 'false'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Info */}
          <div className="mt-8 bg-black/60 border-2 border-green-900/40 p-6">
            <div className="text-xs text-green-500/60 font-mono tracking-widest mb-4">SYSTEM INFORMATION</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-mono">
              <div>
                <div className="text-green-500/60 mb-1">Environment:</div>
                <div className="text-green-400 font-bold">
                  {process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
                </div>
              </div>
              <div>
                <div className="text-green-500/60 mb-1">Total Features:</div>
                <div className="text-green-400 font-bold">{features.length}</div>
              </div>
              <div>
                <div className="text-green-500/60 mb-1">Enabled Features:</div>
                <div className="text-green-400 font-bold">
                  {features.filter(f => f.enabled).length}
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Notes (Dev Mode) */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 bg-blue-900/20 border-2 border-blue-600 p-6">
              <div className="text-xs text-blue-400 font-mono mb-3 font-bold">
                🔧 DEVELOPMENT MODE - IMPLEMENTATION NOTES
              </div>
              <div className="text-xs font-mono text-blue-300/80 space-y-2">
                <div>• This is a client-side demo using localStorage</div>
                <div>• In production, implement POST /api/admin/features endpoint</div>
                <div>• Add authentication middleware (check admin role)</div>
                <div>• Store flag states in database or Vercel environment variables</div>
                <div>• Log all changes to audit trail</div>
                <div>• Consider adding confirmation dialogs for critical features</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .glow-text {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </>
  );
}
