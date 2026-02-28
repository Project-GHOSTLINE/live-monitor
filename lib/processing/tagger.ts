import { NewsTag } from '@/types/feed';

interface TagRule {
  tag: NewsTag;
  keywords: string[];
  weight: number;
}

const TAG_RULES: TagRule[] = [
  {
    tag: NewsTag.SECURITY,
    keywords: ['security', 'defense', 'border', 'threat', 'terror', 'attack', 'strike', 'raid', 'operation'],
    weight: 1.0,
  },
  {
    tag: NewsTag.MILITARY,
    keywords: ['military', 'army', 'forces', 'troops', 'soldiers', 'offensive', 'idf', 'hamas', 'hezbollah', 'bombing', 'airstrike'],
    weight: 1.0,
  },
  {
    tag: NewsTag.POLITICS,
    keywords: ['government', 'minister', 'parliament', 'knesset', 'election', 'coalition', 'policy', 'netanyahu', 'biden', 'trump'],
    weight: 1.0,
  },
  {
    tag: NewsTag.DIPLOMACY,
    keywords: ['diplomat', 'negotiation', 'talks', 'agreement', 'treaty', 'summit', 'envoy', 'mediator', 'peace', 'resolution'],
    weight: 1.0,
  },
  {
    tag: NewsTag.HUMANITARIAN,
    keywords: ['humanitarian', 'aid', 'relief', 'crisis', 'casualties', 'wounded', 'victims', 'survivors', 'medical', 'hospital'],
    weight: 1.0,
  },
  {
    tag: NewsTag.CIVILIAN_IMPACT,
    keywords: ['civilian', 'deaths', 'killed', 'injured', 'displaced', 'evacuated', 'shelter', 'homes', 'infrastructure'],
    weight: 1.2,
  },
  {
    tag: NewsTag.CEASEFIRE,
    keywords: ['ceasefire', 'truce', 'pause', 'halt', 'cessation', 'stop'],
    weight: 1.5,
  },
  {
    tag: NewsTag.HOSTAGES,
    keywords: ['hostage', 'captive', 'prisoner', 'detainee', 'abducted', 'kidnapped', 'held'],
    weight: 1.3,
  },
  {
    tag: NewsTag.REFUGEES,
    keywords: ['refugee', 'displaced', 'fled', 'asylum', 'migration', 'exodus', 'camp'],
    weight: 1.1,
  },
  {
    tag: NewsTag.PROTESTS,
    keywords: ['protest', 'demonstration', 'rally', 'march', 'unrest', 'riot', 'clash'],
    weight: 1.0,
  },
  {
    tag: NewsTag.ECONOMY,
    keywords: ['economy', 'economic', 'trade', 'sanctions', 'inflation', 'market', 'gdp', 'oil', 'gas'],
    weight: 0.9,
  },
  {
    tag: NewsTag.INTERNATIONAL,
    keywords: ['un', 'united nations', 'international court', 'icj', 'icc', 'global', 'world', 'nato', 'eu'],
    weight: 1.0,
  },
];

/**
 * Extract tags from title and content using keyword matching
 */
export function extractTags(title: string, content?: string): NewsTag[] {
  const text = `${title} ${content || ''}`.toLowerCase();
  const tagScores = new Map<NewsTag, number>();

  for (const rule of TAG_RULES) {
    let score = 0;

    for (const keyword of rule.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        score += matches.length * rule.weight;
      }
    }

    if (score > 0) {
      tagScores.set(rule.tag, score);
    }
  }

  // Sort by score and return top 5 tags
  const sortedTags = Array.from(tagScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // Always include at least one tag
  return sortedTags.length > 0 ? sortedTags : [NewsTag.INTERNATIONAL];
}

/**
 * Extract entities (places and organizations) from text
 * Simple keyword-based extraction for MVP
 */
export function extractEntities(text: string): {
  places: string[];
  orgs: string[];
} {
  const lowerText = text.toLowerCase();

  const places = [
    'Gaza',
    'West Bank',
    'Jerusalem',
    'Tel Aviv',
    'Rafah',
    'Khan Younis',
    'Jenin',
    'Nablus',
    'Ramallah',
    'Hebron',
    'Israel',
    'Palestine',
    'Iran',
    'Lebanon',
    'Syria',
    'Jordan',
    'Egypt',
    'Iraq',
    'Yemen',
    'Saudi Arabia',
    'UAE',
  ].filter(place => lowerText.includes(place.toLowerCase()));

  const orgs = [
    'UN',
    'United Nations',
    'UNRWA',
    'WHO',
    'Red Cross',
    'Red Crescent',
    'IDF',
    'Hamas',
    'Hezbollah',
    'PLO',
    'PA',
    'Palestinian Authority',
    'NATO',
    'EU',
    'ICC',
    'ICJ',
  ].filter(org => {
    const regex = new RegExp(`\\b${org}\\b`, 'i');
    return regex.test(text);
  });

  return {
    places: [...new Set(places)],
    orgs: [...new Set(orgs)],
  };
}
