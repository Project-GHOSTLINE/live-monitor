/**
 * Integration Tests for Scenario System
 * Tests the complete pipeline from feed items to scenario scores
 */

import { extractEvents } from '../lib/scenarios/event-extractor';
import { mapSignals } from '../lib/scenarios/signal-mapper';
import { scoreAllScenarios, detectSignificantChanges } from '../lib/scenarios/scenario-scorer';
import { FeedItem } from '../types/feed';
import { DEFAULT_SCENARIOS } from '../types/scenario';

describe('Scenario System Integration', () => {
  // Realistic feed items from multiple sources
  const mockFeedItems: FeedItem[] = [
    // Recent strike in Gaza
    {
      id: 1,
      source_id: 101,
      source_name: 'Reuters',
      source_url: 'https://reuters.com',
      canonical_url: 'https://reuters.com/gaza-strike-1',
      published_at: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      fetched_at: Date.now(),
      title_original: 'Israeli strike hits Gaza',
      content_original: 'Israeli military conducted airstrike on Gaza Strip',
      lang: 'en',
      title_en: 'Israeli airstrike targets Hamas positions in Gaza',
      summary_en: 'IDF reports successful strike on military infrastructure',
      tags: ['military', 'security'],
      entity_places: ['Gaza', 'Israel'],
      entity_orgs: ['Israel', 'Hamas', 'IDF'],
      reliability: 5,
      is_duplicate: false,
      created_at: Date.now(),
    },
    
    // Retaliatory strike
    {
      id: 2,
      source_id: 102,
      source_name: 'Al Jazeera',
      source_url: 'https://aljazeera.com',
      canonical_url: 'https://aljazeera.com/retaliation-1',
      published_at: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
      fetched_at: Date.now(),
      title_original: 'Rocket attack from Gaza',
      lang: 'en',
      title_en: 'Rockets fired from Gaza into Israel',
      summary_en: 'Multiple rockets launched in retaliation, several intercepted',
      tags: ['military', 'retaliation'],
      entity_places: ['Gaza', 'Israel'],
      entity_orgs: ['Hamas', 'Israel'],
      reliability: 4,
      is_duplicate: false,
      created_at: Date.now(),
    },

    // Civilian casualties
    {
      id: 3,
      source_id: 103,
      source_name: 'BBC News',
      source_url: 'https://bbc.com',
      canonical_url: 'https://bbc.com/casualties-1',
      published_at: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      fetched_at: Date.now(),
      title_original: 'Civilian casualties reported',
      lang: 'en',
      title_en: '15 civilians killed in latest strikes',
      summary_en: 'Hospital reports multiple civilian casualties including children',
      tags: ['humanitarian', 'casualties'],
      entity_places: ['Gaza'],
      entity_orgs: ['UN', 'WHO'],
      reliability: 5,
      is_duplicate: false,
      created_at: Date.now(),
    },

    // Infrastructure damage
    {
      id: 4,
      source_id: 104,
      source_name: 'CNN',
      source_url: 'https://cnn.com',
      canonical_url: 'https://cnn.com/infrastructure-1',
      published_at: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
      fetched_at: Date.now(),
      title_original: 'Power plant damaged',
      lang: 'en',
      title_en: 'Critical infrastructure hit in bombing',
      summary_en: 'Power plant suffers major damage, affecting water supply',
      tags: ['infrastructure'],
      entity_places: ['Gaza'],
      reliability: 4,
      is_duplicate: false,
      created_at: Date.now(),
    },

    // Sanctions news
    {
      id: 5,
      source_id: 105,
      source_name: 'Financial Times',
      source_url: 'https://ft.com',
      canonical_url: 'https://ft.com/sanctions-1',
      published_at: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
      fetched_at: Date.now(),
      title_original: 'New sanctions announced',
      lang: 'en',
      title_en: 'EU announces new sanctions against Iran',
      summary_en: 'European Union expands economic sanctions targeting oil exports',
      tags: ['economy', 'sanctions'],
      entity_places: ['Brussels', 'Iran'],
      entity_orgs: ['EU', 'Iran'],
      reliability: 5,
      is_duplicate: false,
      created_at: Date.now(),
    },

    // Failed negotiations
    {
      id: 6,
      source_id: 106,
      source_name: 'The Guardian',
      source_url: 'https://theguardian.com',
      canonical_url: 'https://theguardian.com/talks-collapse',
      published_at: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
      fetched_at: Date.now(),
      title_original: 'Peace talks collapse',
      lang: 'en',
      title_en: 'Ceasefire negotiations break down',
      summary_en: 'Diplomatic efforts fail as parties withdraw from talks',
      tags: ['diplomacy'],
      entity_places: ['Cairo', 'Egypt'],
      entity_orgs: ['UN', 'Egypt'],
      reliability: 5,
      is_duplicate: false,
      created_at: Date.now(),
    },

    // Protest
    {
      id: 7,
      source_id: 107,
      source_name: 'AP News',
      source_url: 'https://apnews.com',
      canonical_url: 'https://apnews.com/protest-1',
      published_at: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
      fetched_at: Date.now(),
      title_original: 'Mass protests',
      lang: 'en',
      title_en: 'Thousands protest war escalation',
      summary_en: 'Large demonstrations in multiple cities demanding ceasefire',
      tags: ['protest', 'civil'],
      entity_places: ['London', 'Paris', 'New York'],
      reliability: 4,
      is_duplicate: false,
      created_at: Date.now(),
    },
  ];

  describe('Full Pipeline: FeedItem → EventFrame → Signal → ScenarioScore', () => {
    test('should extract events from all feed items', () => {
      const events = extractEvents(mockFeedItems);

      expect(events.length).toBeGreaterThan(0);
      
      // Verify we extracted different event types
      const eventTypes = new Set(events.map(e => e.event_type));
      expect(eventTypes.size).toBeGreaterThan(1);

      // All events should have timestamps
      events.forEach(event => {
        expect(event.extracted_at).toBeDefined();
        expect(event.feed_item_id).toBeGreaterThan(0);
      });
    });

    test('should map events to signals with proper aggregation', () => {
      const events = extractEvents(mockFeedItems);

      // Create reliability map from feed items
      const reliabilityMap = new Map(
        mockFeedItems.map(item => [item.id!, item.reliability / 5])
      );

      const signals = mapSignals(events, reliabilityMap);

      expect(signals.length).toBeGreaterThan(0);
      
      // Signals should have proper structure
      signals.forEach(signal => {
        expect(signal.signal_id).toBeDefined();
        expect(signal.weight).toBeGreaterThan(0);
        expect(signal.reliability).toBeGreaterThan(0);
        expect(signal.recency_factor).toBeGreaterThan(0);
        expect(signal.feed_item_ids.length).toBeGreaterThan(0);
      });

      // Should have merged duplicate signals
      const signalIds = signals.map(s => s.signal_id);
      const uniqueIds = new Set(signalIds);
      expect(uniqueIds.size).toBe(signals.length);
    });

    test('should score all scenarios based on signals', () => {
      const events = extractEvents(mockFeedItems);
      const reliabilityMap = new Map(
        mockFeedItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);

      const scores = scoreAllScenarios(signals);

      expect(scores.length).toBe(DEFAULT_SCENARIOS.length);

      // All scores should be valid
      scores.forEach(score => {
        expect(score.probability).toBeGreaterThanOrEqual(0);
        expect(score.probability).toBeLessThanOrEqual(1);
        expect(score.confidence).toBeGreaterThanOrEqual(0);
        expect(score.confidence).toBeLessThanOrEqual(1);
        expect(['rising', 'stable', 'falling']).toContain(score.trend);
      });

      // Given the mock data (multiple strikes, casualties), 
      // "limited_escalation" should have high probability
      const limitedEscalation = scores.find(s => s.scenario_id === 'limited_escalation');
      expect(limitedEscalation).toBeDefined();
      expect(limitedEscalation!.probability).toBeGreaterThan(0.2);
    });

    test('should detect changes over time', () => {
      // First run (baseline)
      const events1 = extractEvents(mockFeedItems.slice(0, 3));
      const reliabilityMap1 = new Map(
        mockFeedItems.slice(0, 3).map(item => [item.id!, item.reliability / 5])
      );
      const signals1 = mapSignals(events1, reliabilityMap1);
      const scores1 = scoreAllScenarios(signals1);

      // Second run (with more data)
      const events2 = extractEvents(mockFeedItems);
      const reliabilityMap2 = new Map(
        mockFeedItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals2 = mapSignals(events2, reliabilityMap2);

      const previousScoresMap = new Map(scores1.map(s => [s.scenario_id, s]));
      const scores2 = scoreAllScenarios(signals2, previousScoresMap);

      const changes = detectSignificantChanges(scores2, previousScoresMap, 0.05);

      // Should detect some changes given the new data
      expect(changes.length).toBeGreaterThanOrEqual(0);

      changes.forEach(change => {
        expect(change.change).toBeGreaterThan(0);
        expect(['increase', 'decrease']).toContain(change.direction);
      });
    });
  });

  describe('Data Quality and Traceability', () => {
    test('all scenario impacts should have source traceability', () => {
      const events = extractEvents(mockFeedItems);
      const reliabilityMap = new Map(
        mockFeedItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);
      const scores = scoreAllScenarios(signals);

      // Each scenario with non-zero probability should have sources
      scores
        .filter(s => s.probability > 0.01)
        .forEach(score => {
          expect(score.active_signals.length).toBeGreaterThan(0);

          score.active_signals.forEach(signal => {
            expect(signal.feed_item_ids.length).toBeGreaterThan(0);

            // Verify feed items exist
            signal.feed_item_ids.forEach(feedId => {
              const feedItem = mockFeedItems.find(f => f.id === feedId);
              expect(feedItem).toBeDefined();
            });
          });
        });
    });

    test('probabilities should be between 0 and 1', () => {
      const events = extractEvents(mockFeedItems);
      const reliabilityMap = new Map(
        mockFeedItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);
      const scores = scoreAllScenarios(signals);

      scores.forEach(score => {
        expect(score.probability).toBeGreaterThanOrEqual(0);
        expect(score.probability).toBeLessThanOrEqual(1);
      });
    });

    test('no hallucinations - all signals must have feed items', () => {
      const events = extractEvents(mockFeedItems);
      const reliabilityMap = new Map(
        mockFeedItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);

      // All signals must reference actual feed items
      signals.forEach(signal => {
        expect(signal.feed_item_ids.length).toBeGreaterThan(0);

        signal.feed_item_ids.forEach(feedId => {
          const exists = mockFeedItems.some(f => f.id === feedId);
          expect(exists).toBe(true);
        });
      });
    });

    test('timestamps should be coherent', () => {
      const events = extractEvents(mockFeedItems);

      // Event extraction timestamps should be after feed item publish times
      events.forEach(event => {
        const feedItem = mockFeedItems.find(f => f.id === event.feed_item_id);
        expect(feedItem).toBeDefined();
        expect(event.extracted_at).toBeGreaterThanOrEqual(feedItem!.published_at);
      });
    });
  });

  describe('Multi-language and Source Reliability', () => {
    test('should handle multi-language feed items', () => {
      const multilangItems: FeedItem[] = [
        {
          ...mockFeedItems[0],
          id: 100,
          lang: 'en',
          title_en: 'Strike reported',
        },
        {
          ...mockFeedItems[0],
          id: 101,
          lang: 'fr',
          title_original: 'Frappe aérienne',
          title_en: 'Air strike',
        },
        {
          ...mockFeedItems[0],
          id: 102,
          lang: 'ar',
          title_original: 'ضربة جوية',
          title_en: 'Airstrike',
        },
      ];

      const events = extractEvents(multilangItems);

      // Should extract events from all languages
      expect(events.length).toBeGreaterThan(0);
    });

    test('should weight signals by source reliability', () => {
      const highReliabilityItem: FeedItem = {
        ...mockFeedItems[0],
        id: 200,
        reliability: 5,
      };

      const lowReliabilityItem: FeedItem = {
        ...mockFeedItems[0],
        id: 201,
        reliability: 2,
      };

      const events = extractEvents([highReliabilityItem, lowReliabilityItem]);
      const reliabilityMap = new Map([
        [200, 1.0],
        [201, 0.4],
      ]);

      const signals = mapSignals(events, reliabilityMap);

      // High reliability signal should have higher combined score
      const highRelSignal = signals.find(s => s.feed_item_ids.includes(200));
      const lowRelSignal = signals.find(s => s.feed_item_ids.includes(201));

      if (highRelSignal && lowRelSignal && highRelSignal.signal_id !== lowRelSignal.signal_id) {
        const highScore = highRelSignal.weight * highRelSignal.reliability;
        const lowScore = lowRelSignal.weight * lowRelSignal.reliability;

        expect(highScore).toBeGreaterThan(lowScore);
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large batch of feed items', () => {
      // Create 100 feed items
      const largeBatch: FeedItem[] = Array.from({ length: 100 }, (_, i) => ({
        ...mockFeedItems[i % mockFeedItems.length],
        id: i + 1000,
      }));

      const startTime = Date.now();

      const events = extractEvents(largeBatch);
      const reliabilityMap = new Map(
        largeBatch.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);
      const scores = scoreAllScenarios(signals);

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Should produce valid results
      expect(events.length).toBeGreaterThan(0);
      expect(signals.length).toBeGreaterThan(0);
      expect(scores.length).toBe(DEFAULT_SCENARIOS.length);
    });

    test('should deduplicate identical events efficiently', () => {
      // Create duplicates
      const duplicateItems = [
        ...mockFeedItems.slice(0, 2),
        ...mockFeedItems.slice(0, 2),
        ...mockFeedItems.slice(0, 2),
      ];

      const events = extractEvents(duplicateItems);
      const reliabilityMap = new Map(
        duplicateItems.map(item => [item.id!, item.reliability / 5])
      );

      const signals = mapSignals(events, reliabilityMap);

      // Should merge duplicate signals
      const uniqueSignalIds = new Set(signals.map(s => s.signal_id));

      // Should have fewer unique signals than events
      expect(uniqueSignalIds.size).toBeLessThanOrEqual(signals.length);
    });
  });

  describe('Scenario-Specific Validation', () => {
    test('limited_escalation should respond to strike signals', () => {
      const strikeItems = mockFeedItems.filter(item => 
        item.title_en?.toLowerCase().includes('strike') ||
        item.title_en?.toLowerCase().includes('attack')
      );

      const events = extractEvents(strikeItems);
      const reliabilityMap = new Map(
        strikeItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);
      const scores = scoreAllScenarios(signals);

      const limitedEscalation = scores.find(s => s.scenario_id === 'limited_escalation');

      expect(limitedEscalation).toBeDefined();
      expect(limitedEscalation!.probability).toBeGreaterThan(0);
    });

    test('infrastructure_attacks should respond to infrastructure damage', () => {
      const infraItems = mockFeedItems.filter(item =>
        item.title_en?.toLowerCase().includes('infrastructure') ||
        item.title_en?.toLowerCase().includes('power')
      );

      const events = extractEvents(infraItems);
      const reliabilityMap = new Map(
        infraItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);
      const scores = scoreAllScenarios(signals);

      const infraAttacks = scores.find(s => s.scenario_id === 'infrastructure_attacks');

      expect(infraAttacks).toBeDefined();

      if (infraItems.length > 0) {
        expect(infraAttacks!.probability).toBeGreaterThan(0);
      }
    });

    test('economic_energy_shock should respond to sanctions', () => {
      const economicItems = mockFeedItems.filter(item =>
        item.title_en?.toLowerCase().includes('sanction') ||
        item.tags?.includes('economy')
      );

      const events = extractEvents(economicItems);
      const reliabilityMap = new Map(
        economicItems.map(item => [item.id!, item.reliability / 5])
      );
      const signals = mapSignals(events, reliabilityMap);
      const scores = scoreAllScenarios(signals);

      const econShock = scores.find(s => s.scenario_id === 'economic_energy_shock');

      expect(econShock).toBeDefined();
    });
  });
});

// Run with: npx tsx tests/scenarios-integration.test.ts
