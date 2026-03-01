/**
 * Event Frame Extraction Module
 *
 * Extracts structured EventFrame data from FeedItems using rule-based analysis.
 * Third stage of the orchestrator pipeline.
 *
 * Pipeline: feed_items → extractEventFrame → event_frames table
 */

import { DatabaseAdapter } from '@/lib/db/adapter';
import { resolveLocation, getBestLocation, type GeoLocation } from '@/lib/geo/resolveLocation';
import type { FeedItem } from '@/types/feed';
import type { EventType } from '@/types/map/EventFrame';

export interface ExtractedEventFrame {
  feed_item_id: number;
  event_type: EventType;
  severity: number; // 1-10 scale
  confidence: number; // 0-1
  occurred_at: number; // Unix timestamp SECONDS
  reported_at: number; // Unix timestamp SECONDS
  location: string; // JSON string: {lat, lng, precision, display_name}
  actors: string; // JSON string: {attacker, target, affected_parties}
  casualties?: string; // JSON string: {killed, wounded, civilians}
  weapon_system?: string;
  target_type?: string;
  tags: string; // JSON string array
  evidence: string; // Extracted text snippet
  source_reliability: number; // 1-5
  verified: number; // 0 or 1 (boolean as integer)
  created_at: number;
}

export interface ExtractionResult {
  success: boolean;
  event_frame_id?: number;
  event_frame?: ExtractedEventFrame;
  error?: string;
  skipped?: boolean; // True if item is not an event
}

/**
 * Event type classification keywords
 */
const EVENT_TYPE_PATTERNS: Record<EventType, RegExp[]> = {
  missile_strike: [
    /\bmissile\b.*\b(strike|attack|hit|launch)/i,
    /\b(ballistic|cruise|hypersonic)\b.*\bmissile/i,
    /\bATACMS\b/i,
    /\bPatriot\b.*\bmissile/i,
  ],
  drone_strike: [
    /\b(drone|UAV|kamikaze)\b.*\b(strike|attack|hit)/i,
    /\bShahed\b/i,
    /\bunmanned.*\battack/i,
  ],
  airstrike: [
    /\b(airstrike|air strike|aerial\s+attack)/i,
    /\b(fighter|bomber|jet)\b.*\b(strike|bomb)/i,
    /\baircraft\b.*\battack/i,
  ],
  artillery_shelling: [
    /\bartillery\b.*\b(shell|fire|strike)/i,
    /\b(howitzer|mortar|MLRS)\b/i,
    /\bshelling\b/i,
  ],
  naval_strike: [
    /\bnaval\b.*\b(strike|attack|bombardment)/i,
    /\b(ship|submarine|destroyer)\b.*\b(fire|attack|launch)/i,
    /\bship-to-shore\b/i,
  ],
  ground_assault: [
    /\bground\b.*\b(assault|offensive|attack)/i,
    /\b(infantry|troops|forces)\b.*\b(advance|attack|assault)/i,
    /\btank\b.*\battack/i,
  ],
  rocket_attack: [
    /\brocket\b.*\b(attack|fire|strike)/i,
    /\b(Grad|Katyusha)\b/i,
    /\bunguided.*\brocket/i,
  ],
  air_defense: [
    /\bair\s+defense\b/i,
    /\b(SAM|interceptor)\b.*\b(launch|fire)/i,
    /\bIron\s+Dome\b/i,
    /\bshoot\s+down\b/i,
  ],
  protest: [
    /\bprotest\b/i,
    /\bdemonstration\b/i,
    /\bmarch.*\bagainst\b/i,
    /\brally\b/i,
  ],
  sanction: [
    /\bsanction/i,
    /\bembargo\b/i,
    /\beconomic.*\bpressure\b/i,
    /\btrade.*\brestriction/i,
  ],
  cyberattack: [
    /\bcyber\b.*\battack/i,
    /\bhack\b/i,
    /\bransomware\b/i,
    /\bDDoS\b/i,
  ],
  diplomatic_action: [
    /\b(diplomatic|diplomacy)\b/i,
    /\b(treaty|agreement|accord)\b/i,
    /\bnegotiation/i,
    /\bambassador\b/i,
  ],
  intelligence_ops: [
    /\b(intelligence|espionage|spy)\b/i,
    /\breconnaissance\b/i,
    /\bsurveillance\b/i,
  ],
  information_warfare: [
    /\bpropaganda\b/i,
    /\bdisinformation\b/i,
    /\bfake\s+news\b/i,
    /\bpsyops\b/i,
  ],
  explosion: [
    /\bexplosion\b/i,
    /\bblast\b/i,
    /\bdetonation\b/i,
  ],
  accident: [
    /\baccident\b/i,
    /\bcrash\b/i,
    /\bfriendly\s+fire\b/i,
  ],
  sabotage: [
    /\bsabotage\b/i,
    /\bcovert.*\battack\b/i,
    /\bundermined\b/i,
  ],
  unknown: [],
};

/**
 * Classify event type from text
 */
function classifyEventType(text: string): { type: EventType; confidence: number } {
  const scores: Partial<Record<EventType, number>> = {};

  for (const [eventType, patterns] of Object.entries(EVENT_TYPE_PATTERNS) as [
    EventType,
    RegExp[]
  ][]) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[eventType] = matchCount;
    }
  }

  // Find highest scoring type
  let bestType: EventType = 'unknown';
  let bestScore = 0;

  for (const [type, score] of Object.entries(scores) as [EventType, number][]) {
    if (score > bestScore) {
      bestType = type;
      bestScore = score;
    }
  }

  // Calculate confidence based on match count
  const confidence = bestScore > 0 ? Math.min(1.0, 0.4 + bestScore * 0.2) : 0.3;

  return { type: bestType, confidence };
}

/**
 * Calculate severity from event type and text
 */
function calculateSeverity(eventType: EventType, text: string): number {
  // Base severity by event type (1-10 scale)
  const baseSeverity: Record<EventType, number> = {
    missile_strike: 8,
    drone_strike: 7,
    airstrike: 8,
    artillery_shelling: 7,
    naval_strike: 7,
    ground_assault: 8,
    rocket_attack: 7,
    air_defense: 5,
    protest: 3,
    sanction: 4,
    cyberattack: 6,
    diplomatic_action: 2,
    intelligence_ops: 4,
    information_warfare: 3,
    explosion: 7,
    accident: 5,
    sabotage: 6,
    unknown: 5,
  };

  let severity = baseSeverity[eventType];

  // Adjust based on casualty indicators
  if (/\b(killed|dead|death|casualties)\b/i.test(text)) {
    severity = Math.min(10, severity + 2);
  }

  if (/\b(mass|major|significant|heavy)\b/i.test(text)) {
    severity = Math.min(10, severity + 1);
  }

  if (/\bcivilian/i.test(text)) {
    severity = Math.min(10, severity + 1);
  }

  return Math.max(1, Math.min(10, severity));
}

/**
 * Extract actors from text
 */
function extractActors(text: string): { attacker?: string; target?: string } | null {
  const actors: { attacker?: string; target?: string } = {};

  // Common country/organization patterns
  const entities = [
    'Russia',
    'Ukraine',
    'Israel',
    'Hamas',
    'Hezbollah',
    'Iran',
    'USA',
    'NATO',
    'China',
    'Taiwan',
    'Syria',
    'Yemen',
    'Houthis',
    'Lebanon',
  ];

  // Try to find attacker/target patterns
  const attackPatterns = [
    /(\w+)\s+(attack|strike|fire|launch|bomb)/i,
    /(\w+)\s+forces\s+(attack|strike)/i,
  ];

  const targetPatterns = [
    /(attack|strike|fire|bomb)\s+(?:on|against|in)\s+(\w+)/i,
    /(\w+)\s+(?:under|targeted by)\s+attack/i,
  ];

  for (const entity of entities) {
    if (new RegExp(`\\b${entity}\\b`, 'i').test(text)) {
      // Check if entity is attacker
      for (const pattern of attackPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && new RegExp(entity, 'i').test(match[1])) {
          actors.attacker = entity;
          break;
        }
      }

      // Check if entity is target
      for (const pattern of targetPatterns) {
        const match = text.match(pattern);
        if (match && match[match.length - 1] && new RegExp(entity, 'i').test(match[match.length - 1])) {
          actors.target = entity;
          break;
        }
      }
    }
  }

  return Object.keys(actors).length > 0 ? actors : null;
}

/**
 * Extract casualties from text
 */
function extractCasualties(text: string): { killed?: number; wounded?: number; civilians?: boolean } | null {
  const casualties: { killed?: number; wounded?: number; civilians?: boolean } = {};

  // Pattern for killed/dead
  const killedMatch = text.match(/(\d+)\s*(killed|dead|death)/i);
  if (killedMatch) {
    casualties.killed = parseInt(killedMatch[1], 10);
  }

  // Pattern for wounded/injured
  const woundedMatch = text.match(/(\d+)\s*(wounded|injured|hurt)/i);
  if (woundedMatch) {
    casualties.wounded = parseInt(woundedMatch[1], 10);
  }

  // Check for civilian casualties
  if (/\bcivilian\b/i.test(text)) {
    casualties.civilians = true;
  }

  return Object.keys(casualties).length > 0 ? casualties : null;
}

/**
 * Extract event frame from feed item
 */
export async function extractEventFrame(feed_item_id: number): Promise<ExtractionResult> {
  const db = new DatabaseAdapter();

  try {
    // Fetch feed item
    const feedItem: FeedItem = await db.get('feed_items', feed_item_id);

    if (!feedItem) {
      return {
        success: false,
        error: 'Feed item not found',
      };
    }

    // Combine text for analysis
    const text = [
      feedItem.title_en || feedItem.title_original,
      feedItem.summary_en || feedItem.content_original || '',
    ]
      .filter(Boolean)
      .join(' ');

    // Classify event type
    const { type: event_type, confidence: typeConfidence } = classifyEventType(text);

    // Skip non-events (very low confidence)
    if (typeConfidence < 0.35) {
      return {
        success: true,
        skipped: true,
      };
    }

    // Resolve location
    const locations = feedItem.entity_places
      ? feedItem.entity_places.map(place => resolveLocation(place)).filter((loc): loc is GeoLocation => loc !== null)
      : [];

    const bestLocation = getBestLocation(locations);

    if (!bestLocation) {
      // Skip events without location
      return {
        success: true,
        skipped: true,
      };
    }

    // Calculate severity
    const severity = calculateSeverity(event_type, text);

    // Extract actors
    const actors = extractActors(text);

    // Extract casualties
    const casualties = extractCasualties(text);

    // Create event frame
    const now = Math.floor(Date.now() / 1000);
    const eventFrame: ExtractedEventFrame = {
      feed_item_id,
      event_type,
      severity,
      confidence: typeConfidence,
      occurred_at: feedItem.published_at,
      reported_at: now,
      location: JSON.stringify({
        lat: bestLocation.lat,
        lng: bestLocation.lon,
        precision: bestLocation.precision,
        display_name: bestLocation.name,
        country_code: bestLocation.iso2,
      }),
      actors: JSON.stringify(actors || {}),
      casualties: casualties ? JSON.stringify(casualties) : undefined,
      weapon_system: undefined, // TODO: Extract weapon systems
      target_type: undefined, // TODO: Extract target types
      tags: JSON.stringify(feedItem.tags || []),
      evidence: text.substring(0, 500), // First 500 chars as evidence
      source_reliability: feedItem.reliability,
      verified: 0, // Not verified by default
      created_at: now,
    };

    // Insert into event_frames table
    const event_frame_id = await db.insert('event_frames', eventFrame);

    return {
      success: true,
      event_frame_id,
      event_frame: eventFrame,
    };
  } catch (error) {
    console.error('Event frame extraction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch extract event frames
 */
export async function extractEventFramesBatch(feed_item_ids: number[]): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];

  for (const id of feed_item_ids) {
    const result = await extractEventFrame(id);
    results.push(result);
  }

  return results;
}
