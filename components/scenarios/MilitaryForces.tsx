import { ScenarioScore } from '@/types/scenario';

interface MilitaryForcesProps {
  scenario: ScenarioScore;
}

// Military asset icons based on scenario type and threat level
function getMilitaryAssets(scenarioId: string, signalCount: number, probability: number) {
  const intensity = Math.ceil(probability * 5); // 1-5 intensity level

  const assets: Record<string, { icon: string; label: string; count: number }[]> = {
    limited_escalation: [
      { icon: '🛩️', label: 'Airstrike', count: Math.min(intensity * 2, 8) },
      { icon: '🎯', label: 'Missile', count: Math.min(intensity, 5) },
      { icon: '🚁', label: 'Helicopter', count: Math.min(intensity, 4) },
    ],
    multi_actor_escalation: [
      { icon: '🚢', label: 'Naval Fleet', count: Math.min(intensity, 3) },
      { icon: '🛩️', label: 'Air Superiority', count: Math.min(intensity * 3, 12) },
      { icon: '🎯', label: 'Cruise Missile', count: Math.min(intensity * 2, 10) },
      { icon: '👥', label: 'Task Force', count: Math.min(intensity, 5) },
    ],
    regional_war: [
      { icon: '🛡️', label: 'Defense Grid', count: Math.min(intensity, 4) },
      { icon: '🚢', label: 'Carrier Group', count: Math.min(intensity, 2) },
      { icon: '🛩️', label: 'Fighter Wing', count: Math.min(intensity * 4, 16) },
      { icon: '⚓', label: 'Submarine', count: Math.min(intensity, 3) },
    ],
    cyber_attack: [
      { icon: '💻', label: 'Cyber Unit', count: Math.min(intensity * 2, 8) },
      { icon: '🛡️', label: 'Firewall', count: Math.min(intensity, 5) },
      { icon: '📡', label: 'Comm Hub', count: Math.min(intensity, 4) },
    ],
    protest_wave: [
      { icon: '👥', label: 'Riot Police', count: Math.min(intensity, 5) },
      { icon: '🚁', label: 'Surveillance', count: Math.min(intensity, 3) },
    ],
    economic_energy_shock: [
      { icon: '⚡', label: 'Power Grid', count: Math.min(intensity, 4) },
      { icon: '🚢', label: 'Tanker', count: Math.min(intensity, 3) },
      { icon: '🛢️', label: 'Reserve', count: Math.min(intensity, 5) },
    ],
    infrastructure_attacks: [
      { icon: '🎯', label: 'Strike Package', count: Math.min(intensity * 2, 8) },
      { icon: '🛩️', label: 'Bomber', count: Math.min(intensity, 4) },
      { icon: '🚁', label: 'Attack Heli', count: Math.min(intensity, 3) },
    ],
    default: [
      { icon: '🛡️', label: 'Defense', count: Math.min(intensity, 3) },
      { icon: '🛩️', label: 'Air Patrol', count: Math.min(intensity, 4) },
      { icon: '👥', label: 'Ground Force', count: Math.min(signalCount, 5) },
    ],
  };

  return assets[scenarioId] || assets.default;
}

export function MilitaryForces({ scenario }: MilitaryForcesProps) {
  const assets = getMilitaryAssets(
    scenario.scenario_id,
    scenario.active_signals.length,
    scenario.probability
  );

  return (
    <div className="mt-4 pt-4 border-t border-green-900/40">
      <div className="text-xs font-mono text-green-500/60 mb-3 tracking-wider">MILITARY ASSETS DEPLOYED</div>
      <div className="grid grid-cols-2 gap-3">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="bg-black/40 border border-green-900/40 p-3 hover:border-green-500/60 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{asset.icon}</span>
                <div>
                  <div className="text-xs font-mono text-green-400 font-bold">
                    {asset.label}
                  </div>
                  <div className="text-xs font-mono text-green-500/60">
                    x{asset.count}
                  </div>
                </div>
              </div>
              {/* Status indicator */}
              <div className="flex flex-col gap-1">
                {Array.from({ length: Math.min(asset.count, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-1 ${
                      i < Math.ceil(scenario.probability * 5)
                        ? 'bg-gradient-to-r from-green-600 to-green-400'
                        : 'bg-gray-700'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Force Strength */}
      <div className="mt-3 bg-gradient-to-r from-green-900/20 to-transparent border-l-2 border-green-500 p-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-green-500/80">TOTAL FORCE STRENGTH:</span>
          <span className="text-green-400 font-bold">
            {assets.reduce((sum, a) => sum + a.count, 0)} UNITS
          </span>
        </div>
      </div>
    </div>
  );
}
