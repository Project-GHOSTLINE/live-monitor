/**
 * Tests for Event Extractor
 * Validates event extraction from feed items across different languages and sources
 */

import { extractEventFrame, extractEvents } from '../lib/scenarios/event-extractor';
import { FeedItem } from '../types/feed';
import { EventType, SeverityLevel } from '../types/scenario';

describe('Event Extractor', () => {
  // Test data: Sample feed items
  const mockFeedItem: FeedItem = {
    id: 1,
    source_id: 101,
    source_name: 'Reuters',
    source_url: 'https://reuters.com',
    canonical_url: 'https://reuters.com/article/1',
    published_at: Date.now(),
    fetched_at: Date.now(),
    title_original: 'Strike reported in Gaza',
    content_original: 'Israeli forces conducted an airstrike in northern Gaza',
    lang: 'en',
    title_en: 'Israeli airstrike hits Gaza',
    summary_en: 'Military officials report airstrike in northern Gaza region',
    tags: ['military', 'security'],
    entity_places: ['Gaza'],
    entity_orgs: ['Israel', 'Hamas'],
    reliability: 5,
    is_duplicate: false,
    created_at: Date.now(),
  };

  const frenchFeedItem: FeedItem = {
    id: 2,
    source_id: 102,
    source_name: 'Le Monde',
    source_url: 'https://lemonde.fr',
    canonical_url: 'https://lemonde.fr/article/2',
    published_at: Date.now(),
    fetched_at: Date.now(),
    title_original: 'Frappe aérienne en Ukraine',
    content_original: 'Les forces russes ont bombardé plusieurs villes',
    lang: 'fr',
    title_en: 'Air strike in Ukraine',
    summary_en: 'Russian forces bombed several cities',
    entity_places: ['Ukraine', 'Kyiv'],
    entity_orgs: ['Russia'],
    reliability: 4,
    is_duplicate: false,
    created_at: Date.now(),
  };

  const lowReliabilityItem: FeedItem = {
    id: 3,
    source_id: 103,
    source_name: 'Unknown Blog',
    source_url: 'https://blog.example',
    canonical_url: 'https://blog.example/post',
    published_at: Date.now(),
    fetched_at: Date.now(),
    title_original: 'Protest in city center',
    lang: 'en',
    reliability: 2,
    is_duplicate: false,
    created_at: Date.now(),
  };

  describe('extractEventFrame', () => {
    test('should extract strike event with actors and location', () => {
      const event = extractEventFrame(mockFeedItem);

      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('strike');
      expect(event?.actors).toContain('Israel');
      expect(event?.location).toBe('Gaza');
      expect(event?.severity).toMatch(/high|critical/);
      expect(event?.confidence).toBeGreaterThan(0.5);
      expect(event?.feed_item_id).toBe(1);
    });

    test('should handle French language content', () => {
      const event = extractEventFrame(frenchFeedItem);

      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('strike');
      expect(event?.actors).toContain('Russia');
      expect(event?.location).toBeDefined();
    });

    test('should adjust confidence based on source reliability', () => {
      const highReliabilityEvent = extractEventFrame(mockFeedItem);
      const lowReliabilityEvent = extractEventFrame(lowReliabilityItem);

      if (highReliabilityEvent && lowReliabilityEvent) {
        expect(highReliabilityEvent.confidence).toBeGreaterThan(lowReliabilityEvent.confidence);
      }
    });

    test('should return null for items without clear events', () => {
      const nonEventItem: FeedItem = {
        ...mockFeedItem,
        id: 999,
        title_original: 'Weather forecast for tomorrow',
        title_en: 'Weather forecast',
        summary_en: 'Sunny with mild temperatures',
      };

      const event = extractEventFrame(nonEventItem);
      expect(event).toBeNull();
    });

    test('should detect multiple event types in single article', () => {
      const complexItem: FeedItem = {
        ...mockFeedItem,
        id: 4,
        title_en: 'Strike follows failed negotiations',
        summary_en: 'After peace talks collapsed, military strike was launched',
      };

      const event = extractEventFrame(complexItem);

      // Should prioritize more severe event (strike over negotiation)
      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('strike');
    });

    test('should extract civilian casualties with critical severity', () => {
      const casualtyItem: FeedItem = {
        ...mockFeedItem,
        id: 5,
        title_en: 'Civilian casualties reported in bombing',
        summary_en: '20 civilians killed and 50 wounded in airstrike',
      };

      const event = extractEventFrame(casualtyItem);

      expect(event).not.toBeNull();
      expect(event?.severity).toBe('critical');
    });

    test('should handle items without translation', () => {
      const noTranslationItem: FeedItem = {
        ...mockFeedItem,
        id: 6,
        title_en: undefined,
        summary_en: undefined,
        title_original: 'strike missile attack',
        content_original: 'military strike with missiles',
      };

      const event = extractEventFrame(noTranslationItem);

      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('strike');
    });

    test('should detect actors from entity_orgs', () => {
      const event = extractEventFrame(mockFeedItem);

      expect(event).not.toBeNull();
      expect(event?.actors.length).toBeGreaterThan(0);
    });

    test('should assign appropriate severity levels', () => {
      const scenarios: Array<{ title: string; expectedSeverity: SeverityLevel }> = [
        { title: 'Minor protest in city', expectedSeverity: 'low' },
        { title: 'Major strike on military base', expectedSeverity: 'high' },
        { title: 'Massive civilian casualties reported', expectedSeverity: 'critical' },
      ];

      scenarios.forEach(({ title, expectedSeverity }) => {
        const item: FeedItem = {
          ...mockFeedItem,
          title_en: title,
          summary_en: title,
        };

        const event = extractEventFrame(item);

        if (event) {
          expect(event.severity).toBe(expectedSeverity);
        }
      });
    });
  });

  describe('extractEvents (batch)', () => {
    test('should extract events from multiple items', () => {
      const items = [mockFeedItem, frenchFeedItem, lowReliabilityItem];
      const events = extractEvents(items);

      expect(events.length).toBeGreaterThan(0);
      expect(events.length).toBeLessThanOrEqual(items.length);
    });

    test('should filter out non-event items', () => {
      const nonEventItem: FeedItem = {
        ...mockFeedItem,
        id: 99,
        title_original: 'Stock market update',
        title_en: 'Market news',
        summary_en: undefined,
      };

      const items = [mockFeedItem, nonEventItem];
      const events = extractEvents(items);

      // Should only extract from mockFeedItem
      expect(events.length).toBe(1);
    });

    test('should handle empty input', () => {
      const events = extractEvents([]);
      expect(events).toEqual([]);
    });

    test('should extract multiple events of different types', () => {
      const strikeItem: FeedItem = {
        ...mockFeedItem,
        id: 10,
        title_en: 'Military strike reported',
      };

      const protestItem: FeedItem = {
        ...mockFeedItem,
        id: 11,
        title_en: 'Protest breaks out in capital',
      };

      const items = [strikeItem, protestItem];
      const events = extractEvents(items);

      expect(events.length).toBe(2);

      const eventTypes = events.map(e => e.event_type);
      expect(eventTypes).toContain('strike');
      expect(eventTypes).toContain('protest');
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed entity data', () => {
      const malformedItem: FeedItem = {
        ...mockFeedItem,
        id: 20,
        entity_places: null as any,
        entity_orgs: undefined,
      };

      const event = extractEventFrame(malformedItem);

      expect(event).not.toBeNull();
      expect(event?.location).toBeUndefined();
    });

    test('should handle very short content', () => {
      const shortItem: FeedItem = {
        ...mockFeedItem,
        id: 21,
        title_original: 'Strike',
        content_original: undefined,
        summary_en: undefined,
      };

      const event = extractEventFrame(shortItem);

      // Too short, should return null
      expect(event).toBeNull();
    });

    test('should handle missing timestamps', () => {
      const item: FeedItem = {
        ...mockFeedItem,
        id: 22,
        published_at: 0,
        fetched_at: 0,
      };

      const event = extractEventFrame(item);

      expect(event).not.toBeNull();
      expect(event?.extracted_at).toBeGreaterThan(0);
    });
  });

  describe('Multi-language Support', () => {
    test('should detect events in English', () => {
      const enItem: FeedItem = {
        ...mockFeedItem,
        id: 30,
        title_en: 'Cyberattack on government systems',
        lang: 'en',
      };

      const event = extractEventFrame(enItem);

      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('cyber_attack');
    });

    test('should detect events in French', () => {
      const frItem: FeedItem = {
        ...mockFeedItem,
        id: 31,
        title_original: 'Manifestation massive dans la capitale',
        lang: 'fr',
      };

      const event = extractEventFrame(frItem);

      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('protest');
    });

    test('should detect events in mixed language content', () => {
      const mixedItem: FeedItem = {
        ...mockFeedItem,
        id: 32,
        title_original: 'Frappe militaire',
        title_en: 'Military strike',
        lang: 'fr',
      };

      const event = extractEventFrame(mixedItem);

      expect(event).not.toBeNull();
      expect(event?.event_type).toBe('strike');
    });
  });

  describe('Confidence Calculation', () => {
    test('should increase confidence with identified actors', () => {
      const withActors: FeedItem = {
        ...mockFeedItem,
        id: 40,
        entity_orgs: ['US', 'Russia', 'China'],
      };

      const withoutActors: FeedItem = {
        ...mockFeedItem,
        id: 41,
        entity_orgs: [],
      };

      const event1 = extractEventFrame(withActors);
      const event2 = extractEventFrame(withoutActors);

      if (event1 && event2) {
        expect(event1.confidence).toBeGreaterThan(event2.confidence);
      }
    });

    test('should cap confidence at 1.0', () => {
      const perfectItem: FeedItem = {
        ...mockFeedItem,
        id: 42,
        title_en: 'Major airstrike bombing missile attack',
        summary_en: 'Multiple strikes reported with heavy casualties',
        entity_orgs: ['US', 'Israel'],
        entity_places: ['Gaza'],
        reliability: 5,
      };

      const event = extractEventFrame(perfectItem);

      expect(event).not.toBeNull();
      expect(event?.confidence).toBeLessThanOrEqual(1.0);
    });
  });
});

// Run with: npx tsx tests/event-extractor.test.ts
// or: npm test tests/event-extractor.test.ts
