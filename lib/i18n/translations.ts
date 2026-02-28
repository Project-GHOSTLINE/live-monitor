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

    // Faction Selection
    'faction.protocol': 'FACTION SELECTION PROTOCOL',
    'faction.choose': 'CHOOSE YOUR COMMANDER',
    'faction.quote': '"The fate of nations rests in your selection..."',
    'faction.hotkeys': 'HOTKEYS: 1-8',

    // Stance
    'stance.label': 'STANCE:',
    'stance.aggressive': 'Aggressive',
    'stance.defensive': 'Defensive',
    'stance.neutral': 'Neutral',

    // Readiness
    'readiness.label': 'READINESS:',
    'readiness.maximum': 'MAXIMUM',
    'readiness.high': 'HIGH',
    'readiness.moderate': 'MODERATE',

    // Relations
    'relations.label': 'RELATIONS:',
    'relations.allied': 'Allied',
    'relations.friendly': 'Friendly',
    'relations.tense': 'Tense',
    'relations.hostile': 'Hostile',

    // Intel Card
    'intel.power': 'POWER',
    'intel.now': 'NOW',
    'intel.heat': 'HEAT',
    'intel.relations': 'RELATIONS',
    'intel.why': 'WHY',
    'intel.rank': 'GFP RANK',
    'intel.budget': 'BUDGET',
    'intel.personnel': 'PERSONNEL',
    'intel.air': 'AIR',
    'intel.sea': 'SEA',
    'intel.land': 'LAND',
    'intel.fighters': 'Fighters',
    'intel.bombers': 'Bombers',
    'intel.ships': 'Ships',
    'intel.subs': 'Subs',
    'intel.carriers': 'Carriers',
    'intel.tanks': 'Tanks',
    'intel.artillery': 'Artillery',
    'intel.events_6h': 'Events (6h)',
    'intel.events_24h': 'Events (24h)',
    'intel.trending': 'TRENDING',
    'intel.latest': 'LATEST',
    'intel.velocity': 'Velocity',
    'intel.severity': 'Severity',
    'intel.confidence': 'Confidence',
    'intel.high': 'HIGH',
    'intel.med': 'MED',
    'intel.low': 'LOW',
    'intel.readiness_breakdown': 'READINESS BREAKDOWN',
    'intel.intensity': 'Intensity',
    'intel.proximity': 'Proximity',
    'intel.mobilization': 'Mobilization',
    'intel.top_signals': 'TOP SIGNALS',
    'intel.no_data': 'NO DATA AVAILABLE',
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

    // Faction Selection
    'faction.protocol': 'PROTOCOLE DE SÉLECTION DE FACTION',
    'faction.choose': 'CHOISISSEZ VOTRE COMMANDANT',
    'faction.quote': '"Le destin des nations repose sur votre choix..."',
    'faction.hotkeys': 'RACCOURCIS: 1-8',

    // Stance
    'stance.label': 'POSITION:',
    'stance.aggressive': 'Agressif',
    'stance.defensive': 'Défensif',
    'stance.neutral': 'Neutre',

    // Readiness
    'readiness.label': 'PRÉPARATION:',
    'readiness.maximum': 'MAXIMUM',
    'readiness.high': 'ÉLEVÉ',
    'readiness.moderate': 'MODÉRÉ',

    // Relations
    'relations.label': 'RELATIONS:',
    'relations.allied': 'Allié',
    'relations.friendly': 'Amical',
    'relations.tense': 'Tendu',
    'relations.hostile': 'Hostile',

    // Intel Card
    'intel.power': 'PUISSANCE',
    'intel.now': 'MAINTENANT',
    'intel.heat': 'CHALEUR',
    'intel.relations': 'RELATIONS',
    'intel.why': 'POURQUOI',
    'intel.rank': 'RANG GFP',
    'intel.budget': 'BUDGET',
    'intel.personnel': 'PERSONNEL',
    'intel.air': 'AIR',
    'intel.sea': 'MER',
    'intel.land': 'TERRE',
    'intel.fighters': 'Chasseurs',
    'intel.bombers': 'Bombardiers',
    'intel.ships': 'Navires',
    'intel.subs': 'Sous-marins',
    'intel.carriers': 'Porte-avions',
    'intel.tanks': 'Chars',
    'intel.artillery': 'Artillerie',
    'intel.events_6h': 'Événements (6h)',
    'intel.events_24h': 'Événements (24h)',
    'intel.trending': 'TENDANCES',
    'intel.latest': 'RÉCENT',
    'intel.velocity': 'Vélocité',
    'intel.severity': 'Sévérité',
    'intel.confidence': 'Confiance',
    'intel.high': 'ÉLEVÉ',
    'intel.med': 'MOYEN',
    'intel.low': 'BAS',
    'intel.readiness_breakdown': 'DÉTAIL DE PRÉPARATION',
    'intel.intensity': 'Intensité',
    'intel.proximity': 'Proximité',
    'intel.mobilization': 'Mobilisation',
    'intel.top_signals': 'SIGNAUX PRINCIPAUX',
    'intel.no_data': 'AUCUNE DONNÉE DISPONIBLE',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
