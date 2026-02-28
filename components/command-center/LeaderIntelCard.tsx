'use client';

import { CountryPower, formatPowerMetric } from '@/lib/power/getCountryPower';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LeaderIntelCardProps {
  leader: {
    code: string;
    name: string;
    faction: string;
    stance: string;
    readiness: number;
  };
  power: CountryPower | null;
  pulse?: {
    events_6h_count: number;
    events_24h_count: number;
    severity_breakdown: { high: number; med: number; low: number };
    latest_items: Array<{ title: string; source: string; time: number; url: string }>;
    trending_topics: string[];
    top_signals: Array<{ code: string; count: number; evidence: Array<{ title: string; url: string; source: string; time: number }> }>;
    confidence_score: number;
  };
  readiness?: {
    readiness_score: number;
    breakdown: {
      intensity: number;
      severity: number;
      proximity: number;
      mobilization: number;
      confidence: number;
    };
  };
}

export function LeaderIntelCard({ leader, power, pulse, readiness }: LeaderIntelCardProps) {
  const { t } = useLanguage();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = Date.now();
    const diff = now - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ${t('time.ago')}`;
    if (hours < 24) return `${hours}h ${t('time.ago')}`;
    return `${Math.floor(hours / 24)}d ${t('time.ago')}`;
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return { label: t('intel.high'), color: 'bg-green-600' };
    if (score >= 0.5) return { label: t('intel.med'), color: 'bg-yellow-600' };
    return { label: t('intel.low'), color: 'bg-red-600' };
  };

  return (
    <div className="absolute z-50 w-[480px] bg-black/95 border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/40 font-mono text-xs backdrop-blur-sm">
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 rounded-lg"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.1) 3px)',
        }}
      />

      {/* Header */}
      <div className="relative border-b border-green-500/30 p-3 bg-green-950/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-green-500/60 text-[9px] tracking-widest">FACTION INTEL</div>
            <h3 className="text-green-400 text-base font-bold tracking-wide">{leader.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-green-500/60 text-[9px]">READINESS</div>
            <div className="text-2xl font-bold text-green-400">{leader.readiness}%</div>
          </div>
        </div>
      </div>

      <div className="relative p-3 space-y-3 max-h-[600px] overflow-y-auto">
        {/* POWER SECTION */}
        {power && (
          <section className="border border-green-500/30 rounded p-2 bg-green-950/10">
            <h4 className="text-green-400 font-bold mb-2 text-[10px] tracking-wider">▸ {t('intel.power')}</h4>
            <div className="grid grid-cols-2 gap-2 text-green-300/80">
              <div>
                <span className="text-green-500/60">{t('intel.rank')}:</span>{' '}
                <span className="text-green-400 font-bold">
                  {power.gfp_rank ? `#${power.gfp_rank}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-green-500/60">{t('intel.budget')}:</span>{' '}
                <span className="text-green-400 font-bold">
                  {power.budget_usd_b ? `$${power.budget_usd_b}B` : '—'}
                </span>
              </div>
              <div>
                <span className="text-green-500/60">{t('intel.personnel')}:</span>{' '}
                <span className="text-green-400 font-bold">
                  {formatPowerMetric(power.personnel_active_k, 'k')}
                </span>
              </div>
            </div>

            {/* AIR/SEA/LAND Grid */}
            <div className="grid grid-cols-3 gap-1 mt-2 text-[9px]">
              <div className="bg-green-950/30 p-1.5 rounded border border-green-500/20">
                <div className="text-green-500/60 mb-1">{t('intel.air')}</div>
                <div className="text-green-400">
                  {formatPowerMetric(power.air.fighters)} {t('intel.fighters').substring(0, 3).toUpperCase()}
                </div>
                <div className="text-green-400/60">
                  {formatPowerMetric(power.air.bombers)} {t('intel.bombers').substring(0, 3).toUpperCase()}
                </div>
              </div>
              <div className="bg-green-950/30 p-1.5 rounded border border-green-500/20">
                <div className="text-green-500/60 mb-1">{t('intel.sea')}</div>
                <div className="text-green-400">
                  {formatPowerMetric(power.sea.ships)} {t('intel.ships')}
                </div>
                <div className="text-green-400/60">
                  {formatPowerMetric(power.sea.subs)} {t('intel.subs')}
                </div>
              </div>
              <div className="bg-green-950/30 p-1.5 rounded border border-green-500/20">
                <div className="text-green-500/60 mb-1">{t('intel.land')}</div>
                <div className="text-green-400">
                  {formatPowerMetric(power.land.tanks)} {t('intel.tanks')}
                </div>
                <div className="text-green-400/60">
                  {formatPowerMetric(power.land.artillery)} Arty
                </div>
              </div>
            </div>
          </section>
        )}

        {/* NOW SECTION */}
        <section className="border border-green-500/30 rounded p-2 bg-green-950/10">
          <h4 className="text-green-400 font-bold mb-2 text-[10px] tracking-wider">▸ {t('intel.now')} (LAST 6H)</h4>
          {pulse ? (
            <>
              <div className="flex items-center gap-3 mb-2 text-[10px]">
                <div>
                  <span className="text-green-500/60">{t('intel.events_6h')}:</span>{' '}
                  <span className="text-green-400 font-bold">{pulse.events_6h_count}</span>
                </div>
                <div>
                  <span className="text-red-400">{t('intel.high')}:</span>{' '}
                  <span className="text-red-400 font-bold">{pulse.severity_breakdown.high}</span>
                </div>
              </div>

              {/* Latest Headlines */}
              <div className="space-y-1.5">
                {pulse.latest_items.slice(0, 3).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-1.5 bg-black/40 rounded border border-green-500/20 hover:border-green-500/60 hover:bg-green-950/20 transition-colors"
                  >
                    <div className="text-green-400 line-clamp-1">{item.title}</div>
                    <div className="text-green-500/60 text-[9px] mt-0.5">
                      {item.source} • {formatTime(item.time)}
                    </div>
                  </a>
                ))}
              </div>

              {/* Trending Topics */}
              {pulse.trending_topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {pulse.trending_topics.slice(0, 5).map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] border border-green-500/30"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-green-500/40 text-center py-2">Aggregating intel...</div>
          )}
        </section>

        {/* HEAT SECTION */}
        <section className="border border-green-500/30 rounded p-2 bg-green-950/10">
          <h4 className="text-green-400 font-bold mb-2 text-[10px] tracking-wider">▸ {t('intel.heat')}</h4>
          {pulse ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-green-500/60">{t('intel.velocity')}:</span>{' '}
                  <span className="text-green-400 font-bold">
                    {pulse.events_6h_count} / {pulse.events_24h_count}
                  </span>
                </div>
                <div>
                  <span className="text-green-500/60">{t('intel.confidence')}:</span>{' '}
                  <span
                    className={`px-1.5 py-0.5 rounded text-black font-bold ${
                      getConfidenceBadge(pulse.confidence_score).color
                    }`}
                  >
                    {getConfidenceBadge(pulse.confidence_score).label}
                  </span>
                </div>
              </div>

              {/* Severity Bar */}
              <div>
                <div className="text-green-500/60 text-[9px] mb-1">{t('intel.severity')} Mix</div>
                <div className="flex gap-1 h-2">
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(pulse.severity_breakdown.high / (pulse.events_6h_count || 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{
                      width: `${(pulse.severity_breakdown.med / (pulse.events_6h_count || 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(pulse.severity_breakdown.low / (pulse.events_6h_count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-green-500/40 text-center py-2">—</div>
          )}
        </section>

        {/* RELATIONS SECTION */}
        <section className="border border-green-500/30 rounded p-2 bg-green-950/10">
          <h4 className="text-green-400 font-bold mb-2 text-[10px] tracking-wider">▸ {t('intel.relations')}</h4>
          <div className="text-green-500/40 text-center py-2 text-[10px]">
            {t('intel.no_data')}
          </div>
        </section>

        {/* WHY THIS SCORE SECTION */}
        {readiness && (
          <section className="border border-green-500/30 rounded p-2 bg-green-950/10">
            <h4 className="text-green-400 font-bold mb-2 text-[10px] tracking-wider">
              ▸ {t('intel.why')} ({readiness.readiness_score}%)
            </h4>

            {/* Breakdown Bars */}
            <div className="space-y-1.5 mb-2">
              {Object.entries(readiness.breakdown).map(([key, value]) => {
                const translationKey = `intel.${key}` as any;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="text-green-500/60 uppercase">{t(translationKey)}</span>
                      <span className="text-green-400 font-bold">{value}</span>
                    </div>
                    <div className="h-1.5 bg-black/60 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(value / 25) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Signals */}
            {pulse?.top_signals && pulse.top_signals.length > 0 && (
              <div className="space-y-1.5 mt-2">
                <div className="text-green-500/60 text-[9px]">{t('intel.top_signals')}:</div>
                {pulse.top_signals.slice(0, 3).map((signal, idx) => (
                  <div key={idx} className="bg-black/40 p-1.5 rounded border border-green-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-green-400 font-bold text-[10px]">{signal.code}</span>
                      <span className="text-green-500/60 text-[9px]">×{signal.count}</span>
                    </div>
                    {signal.evidence.slice(0, 2).map((ev, evIdx) => (
                      <a
                        key={evIdx}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-green-500/60 hover:text-green-400 text-[9px] line-clamp-1 transition-colors"
                      >
                        → {ev.title} ({ev.source})
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Source Attribution */}
        {power?.sources && (
          <div className="text-[8px] text-green-500/40 pt-2 border-t border-green-500/20">
            Sources: {power.sources.map(s => s.name).join(', ')} • Updated {power.updated_at}
          </div>
        )}
      </div>
    </div>
  );
}
