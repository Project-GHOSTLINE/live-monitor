'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { IntelPopover } from './IntelPopover';
import { LeaderModal } from './LeaderModal';
import { LeaderIntelCinematic } from './LeaderIntelCinematic';
import { LeaderIntelDrawer } from './LeaderIntelDrawer';
import { LeaderDetailSplit } from './LeaderDetailSplit';
import { useLeaderIntelPopup } from './useLeaderIntelPopup';
import { getCountryPower } from '@/lib/power/getCountryPower';
import { getFactionPulse, FactionPulse } from '@/lib/pulse/getFactionPulse';
import { computeReadiness, ReadinessScore } from '@/lib/readiness/computeReadiness';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface MilitaryAssets {
  ships: number;
  aircraft_carriers: number;
  submarines: number;
  fighter_jets: number;
  bombers: number;
  tanks: number;
  artillery: number;
  troops: number; // in thousands
  nuclear_warheads: number;
}

interface Economy {
  gdp_billions: number; // in billions USD
  military_budget_billions: number;
  defense_spending_percent: number;
}

interface Leader {
  country: string;
  countryCode: string;
  flag: string;
  avatar?: string; // Path to caricature image
  leader: string;
  title: string;
  tagline: string; // C&C style tagline
  stance: 'aggressive' | 'defensive' | 'neutral';
  readiness: number; // 0-100
  relations: { [key: string]: number }; // -100 to 100
  military: MilitaryAssets;
  economy: Economy;
  allies: string[]; // Country codes
  conflicts: string[]; // Active conflicts with these countries
}

const WORLD_LEADERS: Leader[] = [
  {
    country: 'Israel',
    countryCode: 'IL',
    flag: '🇮🇱',
    avatar: '/leaders/netanyahu.png',
    leader: 'Netanyahu',
    title: 'Prime Minister',
    tagline: '"Iron Dome? Iron WILL."',
    stance: 'aggressive',
    readiness: 92,
    relations: { IR: -95, US: 85, LB: -70, SY: -80 },
    military: {
      ships: 65,
      aircraft_carriers: 0,
      submarines: 5,
      fighter_jets: 340,
      bombers: 0,
      tanks: 2760,
      artillery: 1500,
      troops: 170,
      nuclear_warheads: 90,
    },
    economy: {
      gdp_billions: 525,
      military_budget_billions: 24,
      defense_spending_percent: 4.5,
    },
    allies: ['US'],
    conflicts: ['IR', 'LB', 'SY'],
  },
  {
    country: 'Iran',
    countryCode: 'IR',
    flag: '🇮🇷',
    avatar: '/leaders/khamenei.png',
    leader: 'Khamenei',
    title: 'Supreme Leader',
    tagline: '"The Revolution Never Sleeps"',
    stance: 'aggressive',
    readiness: 88,
    relations: { IL: -95, US: -85, RU: 65 },
    military: {
      ships: 398,
      aircraft_carriers: 0,
      submarines: 34,
      fighter_jets: 550,
      bombers: 68,
      tanks: 4071,
      artillery: 2500,
      troops: 610,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 388,
      military_budget_billions: 25,
      defense_spending_percent: 6.4,
    },
    allies: ['RU', 'CN', 'LB', 'SY'],
    conflicts: ['IL', 'US'],
  },
  {
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    avatar: '/leaders/trump.png',
    leader: 'Trump',
    title: 'Commander',
    tagline: '"Make America Great Again!"',
    stance: 'defensive',
    readiness: 75,
    relations: { IL: 85, IR: -85, RU: -60, CN: -45 },
    military: {
      ships: 490,
      aircraft_carriers: 11,
      submarines: 68,
      fighter_jets: 2740,
      bombers: 157,
      tanks: 6612,
      artillery: 1500,
      troops: 1390,
      nuclear_warheads: 5428,
    },
    economy: {
      gdp_billions: 27360,
      military_budget_billions: 877,
      defense_spending_percent: 3.2,
    },
    allies: ['IL', 'UA', 'NATO'],
    conflicts: [],
  },
  {
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    avatar: '/leaders/putin.png',
    leader: 'Putin',
    title: 'President',
    tagline: '"Special Military Excellence"',
    stance: 'aggressive',
    readiness: 85,
    relations: { UA: -90, US: -60, CN: 70, IR: 65 },
    military: {
      ships: 603,
      aircraft_carriers: 1,
      submarines: 70,
      fighter_jets: 1900,
      bombers: 200,
      tanks: 12420,
      artillery: 6500,
      troops: 1150,
      nuclear_warheads: 5977,
    },
    economy: {
      gdp_billions: 2240,
      military_budget_billions: 86,
      defense_spending_percent: 3.9,
    },
    allies: ['CN', 'IR'],
    conflicts: ['UA'],
  },
  {
    country: 'Ukraine',
    countryCode: 'UA',
    flag: '🇺🇦',
    avatar: '/leaders/zelenskyy.png',
    leader: 'Zelenskyy',
    title: 'President',
    tagline: '"I Need Ammo, Not a Ride"',
    stance: 'defensive',
    readiness: 95,
    relations: { RU: -90, US: 80, EU: 75 },
    military: {
      ships: 25,
      aircraft_carriers: 0,
      submarines: 0,
      fighter_jets: 125,
      bombers: 0,
      tanks: 2596,
      artillery: 1500,
      troops: 900,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 160,
      military_budget_billions: 44,
      defense_spending_percent: 27.5,
    },
    allies: ['US', 'NATO', 'EU'],
    conflicts: ['RU'],
  },
  {
    country: 'China',
    countryCode: 'CN',
    flag: '🇨🇳',
    avatar: '/leaders/xi.png',
    leader: 'Xi Jinping',
    title: 'President',
    tagline: '"One China. Many Options."',
    stance: 'neutral',
    readiness: 70,
    relations: { TW: -75, US: -45, RU: 70 },
    military: {
      ships: 730,
      aircraft_carriers: 3,
      submarines: 79,
      fighter_jets: 2250,
      bombers: 222,
      tanks: 5800,
      artillery: 3100,
      troops: 2035,
      nuclear_warheads: 410,
    },
    economy: {
      gdp_billions: 17963,
      military_budget_billions: 296,
      defense_spending_percent: 1.6,
    },
    allies: ['RU', 'IR', 'KP'],
    conflicts: [],
  },
  {
    country: 'Turkey',
    countryCode: 'TR',
    flag: '🇹🇷',
    avatar: '/leaders/erdogan.png',
    leader: 'Erdoğan',
    title: 'President',
    tagline: '"Bridge Between East & West"',
    stance: 'neutral',
    readiness: 76,
    relations: { US: 40, RU: 30, IL: -20, SY: -60 },
    military: {
      ships: 194,
      aircraft_carriers: 0,
      submarines: 12,
      fighter_jets: 1067,
      bombers: 0,
      tanks: 2231,
      artillery: 2500,
      troops: 355,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 906,
      military_budget_billions: 10.6,
      defense_spending_percent: 1.2,
    },
    allies: ['NATO'],
    conflicts: [],
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    flag: '🇨🇦',
    avatar: '/leaders/canada-leader.png',
    leader: 'Justin Trudeau',
    title: 'Prime Minister',
    tagline: '"Strong and Free"',
    stance: 'defensive',
    readiness: 68,
    relations: { US: 95, RU: -55, CN: -35, UK: 90 },
    military: {
      ships: 33,
      aircraft_carriers: 0,
      submarines: 4,
      fighter_jets: 76,
      bombers: 0,
      tanks: 82,
      artillery: 37,
      troops: 68,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 2140,
      military_budget_billions: 27,
      defense_spending_percent: 1.3,
    },
    allies: ['US', 'NATO', 'UK', 'UA'],
    conflicts: [],
  },
  {
    country: 'Lebanon',
    countryCode: 'LB',
    flag: '🇱🇧',
    leader: 'Hezbollah',
    title: 'Faction',
    tagline: '"Resistance is NOT Futile"',
    stance: 'aggressive',
    readiness: 80,
    relations: { IL: -70, IR: 85, SY: 60 },
    military: {
      ships: 0,
      aircraft_carriers: 0,
      submarines: 0,
      fighter_jets: 0,
      bombers: 0,
      tanks: 340,
      artillery: 800,
      troops: 50,
      nuclear_warheads: 0,
    },
    economy: {
      gdp_billions: 18,
      military_budget_billions: 2.5,
      defense_spending_percent: 14,
    },
    allies: ['IR', 'SY'],
    conflicts: ['IL'],
  },
  {
    country: 'North Korea',
    countryCode: 'KP',
    flag: '🇰🇵',
    avatar: '/leaders/kim.png',
    leader: 'Kim Jong Un',
    title: 'Supreme Leader',
    tagline: '"Supreme Everything"',
    stance: 'aggressive',
    readiness: 65,
    relations: { US: -90, SK: -85, CN: 50 },
    military: {
      ships: 505,
      aircraft_carriers: 0,
      submarines: 83,
      fighter_jets: 810,
      bombers: 80,
      tanks: 6750,
      artillery: 5500,
      troops: 1280,
      nuclear_warheads: 50,
    },
    economy: {
      gdp_billions: 40,
      military_budget_billions: 10,
      defense_spending_percent: 25,
    },
    allies: ['CN'],
    conflicts: [],
  },
];

function getStanceColor(stance: string) {
  if (stance === 'aggressive') return 'from-red-600 to-red-800';
  if (stance === 'defensive') return 'from-blue-600 to-blue-800';
  return 'from-gray-600 to-gray-800';
}

function getReadinessColor(readiness: number) {
  if (readiness >= 90) return 'text-red-400';
  if (readiness >= 75) return 'text-orange-400';
  if (readiness >= 60) return 'text-yellow-400';
  return 'text-green-400';
}

export function LeaderBubbles() {
  const { t } = useLanguage();
  const [selectedLeader, setSelectedLeader] = useState<string | null>(null);
  const [selectedLeaderForDetail, setSelectedLeaderForDetail] = useState<string | null>(null);
  const [pulseData, setPulseData] = useState<Record<string, FactionPulse | null>>({});
  const [readinessData, setReadinessData] = useState<Record<string, ReadinessScore | null>>({});
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileDrawerLeader, setMobileDrawerLeader] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Popup state management
  const {
    hoveredLeaderId,
    placement,
    isOpen,
    handleHoverStart,
    handleHoverEnd,
  } = useLeaderIntelPopup();

  // Handle SSR - only render portal on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track loading state for pulse data
  const [loadingPulseData, setLoadingPulseData] = useState<Record<string, boolean>>({});

  // Load pulse data when leader is hovered OR selected for detail
  useEffect(() => {
    const targetLeaderId = selectedLeaderForDetail || hoveredLeaderId;
    if (targetLeaderId && !pulseData[targetLeaderId] && !loadingPulseData[targetLeaderId]) {
      setLoadingPulseData(prev => ({ ...prev, [targetLeaderId]: true }));
      getFactionPulse(targetLeaderId).then(pulse => {
        setPulseData(prev => ({ ...prev, [targetLeaderId]: pulse }));
        if (pulse) {
          const readiness = computeReadiness(pulse);
          setReadinessData(prev => ({ ...prev, [targetLeaderId]: readiness }));
        }
        setLoadingPulseData(prev => ({ ...prev, [targetLeaderId]: false }));
      }).catch(error => {
        console.error('Error loading pulse data:', error);
        setLoadingPulseData(prev => ({ ...prev, [targetLeaderId]: false }));
      });
    }
  }, [hoveredLeaderId, selectedLeaderForDetail, pulseData, loadingPulseData]);

  const selected = WORLD_LEADERS.find(l => l.countryCode === selectedLeader);

  // Keyboard hotkeys: 1-8 for leader selection + ESC to close split-view
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;

      // ESC closes split-view
      if (key === 'Escape' && selectedLeaderForDetail) {
        setSelectedLeaderForDetail(null);
        return;
      }

      // Number keys select leader
      const index = parseInt(key) - 1;
      if (index >= 0 && index < WORLD_LEADERS.length) {
        const leader = WORLD_LEADERS[index];
        setSelectedLeader(leader.countryCode === selectedLeader ? null : leader.countryCode);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedLeader, selectedLeaderForDetail]);

  return (
    <div className="bg-black/60 border-2 border-green-900/40 p-6">
      {/* Hide grid when split-view is active */}
      {selectedLeaderForDetail ? null : (
        <>
      {/* Header - C&C Style */}
      <div className="mb-6 pb-4 border-b-2 border-green-900/40">
        <div className="text-xs text-green-500/60 font-mono tracking-widest mb-2">█ {t('faction.protocol')}</div>
        <div className="text-2xl font-mono font-bold text-green-400 tracking-wider glow-text mb-2">
          ▰▰▰ {t('faction.choose')} ▰▰▰
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-green-500/70 font-mono italic">
            {t('faction.quote')}
          </div>
          <div className="text-xs text-green-500/60 font-mono bg-black/40 border border-green-900/40 px-3 py-1">
            {t('faction.hotkeys')}
          </div>
        </div>
      </div>

      {/* Leader Bubbles Grid - C&C Faction Selection Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {WORLD_LEADERS.map((leader) => (
          <button
            key={leader.countryCode}
            data-leader-id={leader.countryCode}
            onClick={(e) => {
              // Mobile: Open drawer
              if (window.innerWidth < 768) {
                setMobileDrawerLeader(leader.countryCode);
                setIsMobileDrawerOpen(true);
                return;
              }

              // Desktop: Open split-view detail
              setSelectedLeaderForDetail(leader.countryCode);
            }}
            onMouseEnter={(e) => handleHoverStart(leader.countryCode, e.currentTarget)}
            onMouseLeave={handleHoverEnd}
            className={`relative group transition-all transform hover:scale-105 ${
              selectedLeader === leader.countryCode
                ? 'ring-4 ring-yellow-400 scale-105 z-10'
                : ''
            }`}
          >
            {/* Bubble Container */}
            <div className="relative flex flex-col items-center">
              {/* Glow effect for aggressive leaders */}
              {leader.stance === 'aggressive' && (
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl animate-pulse" />
              )}

              {/* Commander Portrait - 3D Emerging Effect */}
              <div className={`relative w-32 h-40 md:w-36 md:h-44 overflow-visible ${
                selectedLeader === leader.countryCode
                  ? 'scale-110'
                  : ''
              }`}>
                {/* 3D Shadow layers for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-60 blur-xl transform translate-y-4"></div>

                {/* Main portrait container */}
                <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-gray-900 via-black to-black shadow-2xl" style={{
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
                }}>
                  {/* Leader caricature or flag fallback */}
                  {leader.avatar ? (
                    <Image
                      src={leader.avatar}
                      alt={leader.leader}
                      fill
                      className="object-cover object-top scale-125 hover:scale-135 transition-transform duration-300"
                      sizes="(max-width: 768px) 128px, 144px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-90">
                      {leader.flag}
                    </div>
                  )}

                  {/* Dramatic edge glow */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${
                    selectedLeader === leader.countryCode ? 'from-yellow-500/30' : 'from-green-500/20'
                  } via-transparent to-transparent pointer-events-none`}></div>
                </div>
              </div>

              {/* Readiness percentage badge - Corner stamp */}
              <div className={`absolute -top-2 -right-2 w-12 h-12 flex items-center justify-center text-sm font-bold font-mono bg-black border-3 transform rotate-12 shadow-lg ${
                leader.readiness >= 90 ? 'border-red-600 text-red-400 animate-pulse bg-red-950' :
                leader.readiness >= 75 ? 'border-orange-600 text-orange-400 bg-orange-950' :
                'border-yellow-600 text-yellow-400 bg-yellow-950'
              }`}>
                {leader.readiness}
              </div>

              {/* Stance indicator - Bottom banner */}
              <div className="absolute -bottom-2 left-0 right-0 px-2 py-1 bg-gradient-to-r from-black via-gray-900 to-black border-t-2 border-green-700 text-sm font-mono font-bold text-center shadow-lg">
                {leader.stance === 'aggressive' && <span className="text-red-400">⚔️ {t('stance.aggressive').substring(0, 3).toUpperCase()}</span>}
                {leader.stance === 'defensive' && <span className="text-blue-400">🛡️ {t('stance.defensive').substring(0, 3).toUpperCase()}</span>}
                {leader.stance === 'neutral' && <span className="text-gray-400">⚖️ {t('stance.neutral').substring(0, 3).toUpperCase()}</span>}
              </div>

              {/* COUNTRY NAME - BIG C&C STYLE */}
              <div className="mt-4 text-center space-y-1">
                <div className="text-2xl md:text-3xl font-mono font-black text-green-400 tracking-wider glow-text uppercase">
                  {leader.country}
                </div>
                <div className="text-xs font-mono text-green-500/70 italic px-2">
                  {leader.tagline}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      </>
      )}

      {/* Cinematic Intel Popup - Rendered to body via portal (hidden when split-view active) */}
      {!selectedLeaderForDetail && isMounted && isOpen && hoveredLeaderId && placement && createPortal(
        <div
          onMouseEnter={() => {
            // Cancel any pending hover end when entering popup
            const anchorEl = document.querySelector(`[data-leader-id="${hoveredLeaderId}"]`) as HTMLElement;
            if (anchorEl) {
              handleHoverStart(hoveredLeaderId, anchorEl);
            }
          }}
          onMouseLeave={handleHoverEnd}
          style={{
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
        >
          {loadingPulseData[hoveredLeaderId] ? (
            // Loading state popup
            <div
              className="fixed w-[380px] h-[520px] bg-black/98 border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/50 font-mono text-xs overflow-hidden flex items-center justify-center"
              style={{
                left: placement.x,
                top: placement.y,
              }}
            >
              <div className="text-center space-y-4">
                <div className="text-green-400 text-2xl font-bold animate-pulse glow-text">
                  LOADING INTEL...
                </div>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="text-green-500/60 text-xs tracking-wider uppercase">
                  Analyzing {WORLD_LEADERS.find(l => l.countryCode === hoveredLeaderId)?.country}...
                </div>
              </div>
            </div>
          ) : (
            <LeaderIntelCinematic
              leaderId={hoveredLeaderId}
              leaderName={WORLD_LEADERS.find(l => l.countryCode === hoveredLeaderId)?.country || hoveredLeaderId}
              readinessScore={
                readinessData[hoveredLeaderId]?.readiness_score ||
                WORLD_LEADERS.find(l => l.countryCode === hoveredLeaderId)?.readiness ||
                0
              }
              readinessDelta={0} // TODO: calculate delta from previous value
              anchorRect={placement}
              isLocked={false}
              onClose={() => {}} // No close handler needed for hover-only mode
              onIncidentClick={(incidentId) => {
                // TODO: Open incident details modal
                if (process.env.NODE_ENV === 'development') {
                  console.log('Incident clicked:', incidentId);
                }
              }}
              power={getCountryPower(hoveredLeaderId)}
              pulse={pulseData[hoveredLeaderId] || null}
              readiness={readinessData[hoveredLeaderId] || null}
            />
          )}
        </div>,
        document.body
      )}

      {/* Mobile Drawer Variant (Mobile Only) */}
      {mobileDrawerLeader && (
        <LeaderIntelDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => {
            setIsMobileDrawerOpen(false);
            setMobileDrawerLeader(null);
          }}
          leader={{
            code: mobileDrawerLeader,
            name: WORLD_LEADERS.find(l => l.countryCode === mobileDrawerLeader)?.country || mobileDrawerLeader,
            faction: WORLD_LEADERS.find(l => l.countryCode === mobileDrawerLeader)?.title || '',
            stance: WORLD_LEADERS.find(l => l.countryCode === mobileDrawerLeader)?.stance || 'neutral',
            readiness: readinessData[mobileDrawerLeader]?.readiness_score ||
              WORLD_LEADERS.find(l => l.countryCode === mobileDrawerLeader)?.readiness ||
              0,
          }}
          power={getCountryPower(mobileDrawerLeader)}
          pulse={pulseData[mobileDrawerLeader] || undefined}
          readiness={readinessData[mobileDrawerLeader] || undefined}
        />
      )}

      {/* Leader Detail Split-View (Desktop) */}
      {selectedLeaderForDetail && (() => {
        const leaderForDetail = WORLD_LEADERS.find(l => l.countryCode === selectedLeaderForDetail);
        return leaderForDetail ? (
          <LeaderDetailSplit
            leader={leaderForDetail}
            power={getCountryPower(selectedLeaderForDetail)}
            pulse={pulseData[selectedLeaderForDetail] || null}
            readiness={readinessData[selectedLeaderForDetail] || null}
            onClose={() => setSelectedLeaderForDetail(null)}
            onIncidentClick={(incidentId) => {
              if (process.env.NODE_ENV === 'development') {
                console.log('Incident clicked:', incidentId);
              }
            }}
          />
        ) : null;
      })()}

      {/* Leader Modal - AAA 2026 Gamer UI */}
      <LeaderModal
        leader={selected || null}
        isOpen={!!selected}
        onClose={() => setSelectedLeader(null)}
      />

      {/* Legend - Hidden when split-view is active */}
      {!selectedLeaderForDetail && (
      <div className="mt-4 pt-4 border-t border-green-900/40 grid grid-cols-3 gap-4 text-xs font-mono">
        <div>
          <span className="text-green-500/60">{t('stance.label')}</span>
          <div className="mt-1 space-y-1">
            <div className="text-red-400">⚔️ {t('stance.aggressive')}</div>
            <div className="text-blue-400">🛡️ {t('stance.defensive')}</div>
            <div className="text-gray-400">⚖️ {t('stance.neutral')}</div>
          </div>
        </div>
        <div>
          <span className="text-green-500/60">{t('readiness.label')}</span>
          <div className="mt-1 space-y-1">
            <div className="text-red-400">90-100% {t('readiness.maximum')}</div>
            <div className="text-orange-400">75-89% {t('readiness.high')}</div>
            <div className="text-yellow-400">60-74% {t('readiness.moderate')}</div>
          </div>
        </div>
        <div>
          <span className="text-green-500/60">{t('relations.label')}</span>
          <div className="mt-1 space-y-1">
            <div className="text-green-400">+50 to +100 {t('relations.allied')}</div>
            <div className="text-blue-400">0 to +49 {t('relations.friendly')}</div>
            <div className="text-orange-400">-49 to -1 {t('relations.tense')}</div>
            <div className="text-red-400">-50 to -100 {t('relations.hostile')}</div>
          </div>
        </div>
      </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
