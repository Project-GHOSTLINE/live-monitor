export type Locale = 'en' | 'fr';

export const translations = {
  en: {
    // Header
    'header.title': 'WW3 MONITOR',
    'header.subtitle': 'GLOBAL THREAT ASSESSMENT SYSTEM',
    'header.status': 'SYSTEM ONLINE',

    // Command Center
    'cc.title': 'COMMAND CENTER',
    'cc.threat_level': 'GLOBAL THREAT LEVEL',
    'cc.live_feed': 'LIVE INTELLIGENCE FEED',
    'cc.theater_map': 'TACTICAL THEATER',
    'cc.middle_east_ops': 'MIDDLE EAST OPERATIONS MAP',
    'cc.active_events': 'ACTIVE EVENTS',
    'cc.leader_status': 'LEADER STATUS',
    'cc.scenarios': 'ACTIVE SCENARIOS',
    'cc.loading': 'LOADING COMMAND CENTER...',
    'cc.initializing': 'INITIALIZING TACTICAL SYSTEMS...',

    // Threat Levels
    'defcon.1': 'NUCLEAR WAR IMMINENT',
    'defcon.2': 'WAR IMMINENT',
    'defcon.3': 'INCREASED READINESS',
    'defcon.4': 'HEIGHTENED ALERT',
    'defcon.5': 'NORMAL READINESS',

    // Map Legend
    'map.missile': 'MISSILE',
    'map.drone': 'DRONE',
    'map.airstrike': 'AIRSTRIKE',
    'map.naval': 'NAVAL',

    // Leaders
    'leader.iran': 'Iran',
    'leader.israel': 'Israel',
    'leader.usa': 'United States',
    'leader.russia': 'Russia',
    'leader.china': 'China',
    'leader.turkey': 'Turkey',

    // Stats
    'stats.sources': 'SOURCES',
    'stats.items': 'INTEL ITEMS',
    'stats.last_updated': 'LAST UPDATED',
    'stats.reliability': 'RELIABILITY',

    // Time
    'time.ago': 'ago',
    'time.hour': 'hour',
    'time.hours': 'hours',
    'time.day': 'day',
    'time.days': 'days',
    'time.minute': 'minute',
    'time.minutes': 'minutes',

    // Common
    'common.loading': 'LOADING',
    'common.error': 'ERROR',
    'common.retry': 'RETRY',
    'common.close': 'CLOSE',
  },

  fr: {
    // Header
    'header.title': 'MONITEUR WW3',
    'header.subtitle': 'SYSTÈME D\'ÉVALUATION DES MENACES GLOBALES',
    'header.status': 'SYSTÈME EN LIGNE',

    // Command Center
    'cc.title': 'CENTRE DE COMMANDEMENT',
    'cc.threat_level': 'NIVEAU DE MENACE GLOBAL',
    'cc.live_feed': 'FLUX DE RENSEIGNEMENTS EN DIRECT',
    'cc.theater_map': 'THÉÂTRE TACTIQUE',
    'cc.middle_east_ops': 'CARTE DES OPÉRATIONS MOYEN-ORIENT',
    'cc.active_events': 'ÉVÉNEMENTS ACTIFS',
    'cc.leader_status': 'STATUT DES DIRIGEANTS',
    'cc.scenarios': 'SCÉNARIOS ACTIFS',
    'cc.loading': 'CHARGEMENT DU CENTRE DE COMMANDEMENT...',
    'cc.initializing': 'INITIALISATION DES SYSTÈMES TACTIQUES...',

    // Threat Levels
    'defcon.1': 'GUERRE NUCLÉAIRE IMMINENTE',
    'defcon.2': 'GUERRE IMMINENTE',
    'defcon.3': 'PRÉPARATION ACCRUE',
    'defcon.4': 'ALERTE ÉLEVÉE',
    'defcon.5': 'PRÉPARATION NORMALE',

    // Map Legend
    'map.missile': 'MISSILE',
    'map.drone': 'DRONE',
    'map.airstrike': 'FRAPPE AÉRIENNE',
    'map.naval': 'NAVAL',

    // Leaders
    'leader.iran': 'Iran',
    'leader.israel': 'Israël',
    'leader.usa': 'États-Unis',
    'leader.russia': 'Russie',
    'leader.china': 'Chine',
    'leader.turkey': 'Turquie',

    // Stats
    'stats.sources': 'SOURCES',
    'stats.items': 'ÉLÉMENTS DE RENSEIGNEMENT',
    'stats.last_updated': 'DERNIÈRE MISE À JOUR',
    'stats.reliability': 'FIABILITÉ',

    // Time
    'time.ago': 'il y a',
    'time.hour': 'heure',
    'time.hours': 'heures',
    'time.day': 'jour',
    'time.days': 'jours',
    'time.minute': 'minute',
    'time.minutes': 'minutes',

    // Common
    'common.loading': 'CHARGEMENT',
    'common.error': 'ERREUR',
    'common.retry': 'RÉESSAYER',
    'common.close': 'FERMER',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
