import { SignalRule, SignalCode } from './signalTypes';

/**
 * 30 Standardized Signal Rules
 *
 * Keywords include English, French, and common phrases
 * Weights: 1 (low) to 5 (critical)
 * Severity Boost: 0 (none) to 3 (maximum)
 */

export const SIGNAL_RULES: SignalRule[] = [
  // ===== MILITARY ACTION (Hard Signals) =====
  {
    code: 'SIG_AIRSTRIKE',
    keywords: [
      'airstrike', 'air strike', 'bombed', 'bombing', 'precision strike',
      'frappe aérienne', 'bombardement', 'strike aircraft', 'fighter jets struck',
      'aerial bombardment', 'bombers hit'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 3,
      tension: 5,
      hostility: 4,
    }
  },
  {
    code: 'SIG_MISSILE_LAUNCH',
    keywords: [
      'missile launch', 'ballistic missile', 'rocket fire', 'missile attack',
      'lancement de missile', 'tir de missile', 'cruise missile', 'rocket barrage',
      'fired missiles', 'missile strike'
    ],
    weight: 5,
    severityBoost: 3,
    category: 'military',
    impacts: {
      readiness: 5,
      tension: 6,
      hostility: 5,
    }
  },
  {
    code: 'SIG_DRONE_STRIKE',
    keywords: [
      'drone attack', 'drone strike', 'UAV strike', 'unmanned aerial',
      'attaque de drone', 'frappe par drone', 'kamikaze drone', 'loitering munition',
      'suicide drone'
    ],
    weight: 3,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 2,
      tension: 4,
      hostility: 3,
    }
  },
  {
    code: 'SIG_GROUND_INCIDENT',
    keywords: [
      'clashes', 'ground operation', 'troops entered', 'ground offensive',
      'incursion', 'affrontements', 'opération terrestre', 'infantry assault',
      'ground forces', 'border incursion'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 4,
      tension: 5,
      hostility: 4,
    }
  },
  {
    code: 'SIG_NAVAL_INCIDENT',
    keywords: [
      'warship', 'naval confrontation', 'Red Sea attack', 'shipping incident',
      'naval vessel', 'incident naval', 'destroyer', 'frigate intercept',
      'maritime clash', 'naval blockade'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 3,
      tension: 4,
      hostility: 3,
    }
  },
  {
    code: 'SIG_AIRSPACE_CLOSED',
    keywords: [
      'airspace closed', 'flights suspended', 'no-fly zone', 'aviation halt',
      'espace aérien fermé', 'vols suspendus', 'airspace restriction',
      'flight ban'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'military',
    impacts: {
      readiness: 2,
      tension: 3,
    }
  },
  {
    code: 'SIG_MOBILIZATION',
    keywords: [
      'mobilization', 'reserve call-up', 'troop buildup', 'military mobilization',
      'mobilisation', 'rappel des réserves', 'deployment orders', 'troops massing',
      'reservists called'
    ],
    weight: 5,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 6,
      tension: 5,
      hostility: 3,
    }
  },
  {
    code: 'SIG_MILITARY_DRILL',
    keywords: [
      'military exercise', 'drills near border', 'war games', 'training exercise',
      'exercice militaire', 'manœuvres', 'joint drills', 'tactical exercise'
    ],
    weight: 2,
    severityBoost: 1,
    category: 'military',
    impacts: {
      readiness: 2,
      tension: 2,
    }
  },
  {
    code: 'SIG_CYBER_ATTACK',
    keywords: [
      'cyberattack', 'infrastructure hacked', 'cyber operation', 'hacking campaign',
      'cyberattaque', 'piratage', 'DDoS attack', 'data breach', 'systems compromised'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'military',
    impacts: {
      readiness: 2,
      tension: 3,
      hostility: 2,
    }
  },
  {
    code: 'SIG_INFRASTRUCTURE_STRIKE',
    keywords: [
      'power plant hit', 'oil facility damaged', 'infrastructure attack',
      'centrale frappée', 'installation pétrolière', 'refinery struck',
      'pipeline damaged', 'electrical grid targeted'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 3,
      tension: 5,
      hostility: 4,
    }
  },

  // ===== POLITICAL SIGNALS =====
  {
    code: 'SIG_SANCTIONS_NEW',
    keywords: [
      'new sanctions', 'sanctions imposed', 'economic sanctions', 'trade restrictions',
      'nouvelles sanctions', 'sanctions économiques', 'embargo', 'sanctioned entities'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'political',
    impacts: {
      tension: 3,
      hostility: 2,
    }
  },
  {
    code: 'SIG_THREAT_STATEMENT',
    keywords: [
      'warned that', 'threatened retaliation', 'vowed to respond', 'threatening',
      'a menacé', 'avertissement', 'warned of consequences', 'promised retaliation',
      'strong warning'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'political',
    impacts: {
      tension: 4,
      hostility: 3,
    }
  },
  {
    code: 'SIG_NEGOTIATION',
    keywords: [
      'talks begin', 'negotiations', 'diplomatic meeting', 'ceasefire talks',
      'négociations', 'pourparlers', 'dialogue', 'peace talks', 'mediation'
    ],
    weight: 2,
    severityBoost: 0,
    category: 'political',
    impacts: {
      tension: -3,
      hostility: -2,
      stability: 2,
    }
  },
  {
    code: 'SIG_CEASEFIRE',
    keywords: [
      'ceasefire', 'truce agreed', 'cessez-le-feu', 'trêve', 'halt in fighting',
      'ceasefire declared', 'temporary truce'
    ],
    weight: 4,
    severityBoost: 0,
    category: 'political',
    impacts: {
      readiness: -4,
      tension: -5,
      hostility: -4,
      stability: 4,
    }
  },
  {
    code: 'SIG_PARLIAMENT_ACTION',
    keywords: [
      'approved military action', 'parliament authorized', 'declared emergency',
      'parlement approuve', 'autorisation militaire', 'legislative approval',
      'war authorization'
    ],
    weight: 4,
    severityBoost: 1,
    category: 'political',
    impacts: {
      readiness: 3,
      tension: 3,
    }
  },

  // ===== SOCIAL / INSTABILITY SIGNALS =====
  {
    code: 'SIG_PROTESTS_SPIKE',
    keywords: [
      'mass protests', 'thousands gathered', 'demonstrations', 'protest movement',
      'manifestations', 'protestations', 'rally', 'uprising'
    ],
    weight: 2,
    severityBoost: 1,
    category: 'social',
    impacts: {
      stability: -3,
    }
  },
  {
    code: 'SIG_RIOTS',
    keywords: [
      'riots', 'violence erupted', 'clashes with police', 'civil unrest',
      'émeutes', 'violences', 'looting', 'vandalism', 'street violence'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'social',
    impacts: {
      stability: -4,
      tension: 2,
    }
  },
  {
    code: 'SIG_BORDER_TENSION',
    keywords: [
      'border skirmish', 'troops at border', 'border confrontation',
      'tension frontalière', 'affrontement frontalier', 'border standoff'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'social',
    impacts: {
      readiness: 2,
      tension: 3,
    }
  },
  {
    code: 'SIG_REFUGEE_SURGE',
    keywords: [
      'refugees fleeing', 'displacement', 'mass exodus', 'refugee crisis',
      'réfugiés', 'déplacés', 'humanitarian crisis', 'people fleeing'
    ],
    weight: 2,
    severityBoost: 1,
    category: 'social',
    impacts: {
      stability: -2,
    }
  },

  // ===== ENERGY / ECONOMIC SIGNALS =====
  {
    code: 'SIG_OIL_PRICE_SPIKE',
    keywords: [
      'oil surged', 'Brent jumped', 'crude prices soar', 'oil spike',
      'pétrole en hausse', 'prix du pétrole', 'energy prices rise'
    ],
    weight: 2,
    severityBoost: 1,
    category: 'economic',
    impacts: {
      tension: 2,
    }
  },
  {
    code: 'SIG_SHIPPING_DISRUPTION',
    keywords: [
      'shipping suspended', 'trade disrupted', 'maritime trade halt',
      'transport maritime', 'commerce perturbé', 'shipping lanes blocked',
      'Red Sea shipping'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'economic',
    impacts: {
      tension: 3,
    }
  },

  // ===== RELATIONS GRAPH SIGNALS =====
  {
    code: 'SIG_ALLIANCE_SUPPORT',
    keywords: [
      'pledged support', 'military aid package', 'alliance backing',
      'soutien', 'aide militaire', 'support announced', 'backing pledge'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'political',
    impacts: {
      tension: 2,
      hostility: 1,
    }
  },
  {
    code: 'SIG_WEAPONS_TRANSFER',
    keywords: [
      'sent weapons', 'arms delivery', 'military equipment shipped',
      'livraison d\'armes', 'envoi d\'armes', 'weapons shipment', 'arms transfer'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 3,
      tension: 4,
    }
  },
  {
    code: 'SIG_PROXY_ACTIVITY',
    keywords: [
      'militia linked to', 'Iran-backed group', 'proxy forces', 'armed group',
      'milice liée', 'groupe armé', 'Hezbollah', 'Houthi', 'proxy attack'
    ],
    weight: 3,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 2,
      tension: 4,
      hostility: 3,
    }
  },

  // ===== HIGH LEVEL STRATEGIC =====
  {
    code: 'SIG_NUCLEAR_ACTIVITY',
    keywords: [
      'nuclear enrichment', 'IAEA concern', 'uranium enrichment', 'nuclear program',
      'enrichissement nucléaire', 'programme nucléaire', 'nuclear facility',
      'centrifuges', 'nuclear threat'
    ],
    weight: 5,
    severityBoost: 3,
    category: 'strategic',
    impacts: {
      readiness: 4,
      tension: 6,
      hostility: 3,
    }
  },
  {
    code: 'SIG_LEADER_SPEECH_ESCALATORY',
    keywords: [
      'will respond strongly', 'vowed to strike', 'promised retaliation',
      'a promis de répondre', 'discours belliqueux', 'warned of severe response',
      'threatened military action'
    ],
    weight: 3,
    severityBoost: 1,
    category: 'political',
    impacts: {
      tension: 3,
      hostility: 3,
    }
  },
  {
    code: 'SIG_LEADER_SPEECH_DEESCALATE',
    keywords: [
      'seek peace', 'avoid escalation', 'diplomatic solution', 'peace efforts',
      'cherche la paix', 'éviter l\'escalade', 'called for restraint',
      'urged calm'
    ],
    weight: 2,
    severityBoost: 0,
    category: 'political',
    impacts: {
      tension: -3,
      hostility: -2,
      stability: 2,
    }
  },
  {
    code: 'SIG_STATE_OF_EMERGENCY',
    keywords: [
      'state of emergency declared', 'emergency measures', 'martial law',
      'état d\'urgence', 'mesures d\'urgence', 'curfew imposed'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'political',
    impacts: {
      readiness: 3,
      tension: 4,
      stability: -3,
    }
  },
  {
    code: 'SIG_INTEL_WARNING',
    keywords: [
      'intelligence indicates', 'security warning issued', 'intel suggests',
      'renseignement', 'alerte sécurité', 'threat assessment',
      'intelligence reports'
    ],
    weight: 2,
    severityBoost: 1,
    category: 'strategic',
    impacts: {
      readiness: 2,
      tension: 2,
    }
  },
  {
    code: 'SIG_MILITARY_CASUALTIES_HIGH',
    keywords: [
      'dozens killed', 'heavy casualties', 'many dead', 'high death toll',
      'dizaines de morts', 'lourdes pertes', 'casualties mount',
      'soldiers killed'
    ],
    weight: 4,
    severityBoost: 2,
    category: 'military',
    impacts: {
      readiness: 3,
      tension: 5,
      hostility: 4,
    }
  },
];

/**
 * Get signal rule by code
 */
export function getSignalRule(code: SignalCode): SignalRule | undefined {
  return SIGNAL_RULES.find(r => r.code === code);
}

/**
 * Get all signal codes by category
 */
export function getSignalsByCategory(category: SignalRule['category']): SignalRule[] {
  return SIGNAL_RULES.filter(r => r.category === category);
}
