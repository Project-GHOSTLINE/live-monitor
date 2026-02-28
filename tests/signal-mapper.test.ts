/**
 * Tests for Signal Mapper
 * Validates conversion of EventFrames to Signals with proper weighting and decay
 */

import {
  mapEventToSignal,
  mergeSignals,
  mapSignals,
  filterSignalsByConfidence,
  getTopSignals,
  detectSignalTrend,
} from '../lib/scenarios/signal-mapper';
import { EventFrame, Signal, EventType } from '../types/scenario';

describe('Signal Mapper', () => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const mockEventFrame: EventFrame = {
    event_type: 'strike',
    actors: ['US', 'Iran'],
    location: 'Middle East',
    severity: 'high',
    confidence: 0.85,
    feed_item_id: 1,
    extracted_at: now,
  };

  describe('mapEventToSignal', () => {
    test('should convert event frame to signal with correct structure', () => {
      const signal = mapEventToSignal(mockEventFrame, 0.9);

      expect(signal.signal_id).toBeDefined();
      expect(signal.event_type).toBe('strike');
      expect(signal.actors).toEqual(['US', 'Iran']);
      expect(signal.weight).toBeGreaterThan(0);
      expect(signal.reliability).toBe(0.9);
      expect(signal.severity).toBe('high');
      expect(signal.timestamp).toBe(now);
      expect(signal.feed_item_ids).toEqual([1]);
      expect(signal.recency_factor).toBeGreaterThan(0);
    });

    test('should generate consistent signal IDs for same event characteristics', () => {
      const event1: EventFrame = {
        ...mockEventFrame,
        feed_item_id: 1,
      };

      const event2: EventFrame = {
        ...mockEventFrame,
        feed_item_id: 2,
      };

      const signal1 = mapEventToSignal(event1, 0.9);
      const signal2 = mapEventToSignal(event2, 0.9);

      expect(signal1.signal_id).toBe(signal2.signal_id);
    });

    test('should normalize actor order in signal ID', () => {
      const event1: EventFrame = {
        ...mockEventFrame,
        actors: ['US', 'Iran'],
      };

      const event2: EventFrame = {
        ...mockEventFrame,
        actors: ['Iran', 'US'],
      };

      const signal1 = mapEventToSignal(event1, 0.9);
      const signal2 = mapEventToSignal(event2, 0.9);

      expect(signal1.signal_id).toBe(signal2.signal_id);
    });

    test('should calculate higher weight for critical severity', () => {
      const highSeverity: EventFrame = {
        ...mockEventFrame,
        severity: 'high',
      };

      const criticalSeverity: EventFrame = {
        ...mockEventFrame,
        severity: 'critical',
      };

      const signal1 = mapEventToSignal(highSeverity, 0.9);
      const signal2 = mapEventToSignal(criticalSeverity, 0.9);

      expect(signal2.weight).toBeGreaterThan(signal1.weight);
    });

    test('should apply recency decay for old events', () => {
      const recentEvent: EventFrame = {
        ...mockEventFrame,
        extracted_at: now,
      };

      const oldEvent: EventFrame = {
        ...mockEventFrame,
        extracted_at: twoWeeksAgo,
      };

      const recentSignal = mapEventToSignal(recentEvent, 0.9);
      const oldSignal = mapEventToSignal(oldEvent, 0.9);

      expect(recentSignal.recency_factor).toBeGreaterThan(oldSignal.recency_factor);
    });

    test('should handle events with no actors', () => {
      const noActorsEvent: EventFrame = {
        ...mockEventFrame,
        actors: [],
      };

      const signal = mapEventToSignal(noActorsEvent, 0.9);

      expect(signal.signal_id).toContain('SIG_STRIKE');
      expect(signal.actors).toEqual([]);
    });

    test('should calculate weight based on event type', () => {
      const strikeEvent: EventFrame = {
        ...mockEventFrame,
        event_type: 'strike',
        severity: 'medium',
      };

      const warningEvent: EventFrame = {
        ...mockEventFrame,
        event_type: 'warning',
        severity: 'medium',
      };

      const strikeSignal = mapEventToSignal(strikeEvent, 0.9);
      const warningSignal = mapEventToSignal(warningEvent, 0.9);

      // Strikes should have higher weight than warnings
      expect(strikeSignal.weight).toBeGreaterThan(warningSignal.weight);
    });
  });

  describe('mergeSignals', () => {
    test('should merge signals with same ID', () => {
      const event1: EventFrame = {
        ...mockEventFrame,
        feed_item_id: 1,
        extracted_at: oneDayAgo,
      };

      const event2: EventFrame = {
        ...mockEventFrame,
        feed_item_id: 2,
        extracted_at: now,
      };

      const signal1 = mapEventToSignal(event1, 0.8);
      const signal2 = mapEventToSignal(event2, 0.9);

      const merged = mergeSignals([signal1, signal2]);

      expect(merged.length).toBe(1);
      expect(merged[0].feed_item_ids).toEqual([1, 2]);
      expect(merged[0].timestamp).toBe(now); // Should use most recent
    });

    test('should preserve highest severity when merging', () => {
      const lowSeverityEvent: EventFrame = {
        ...mockEventFrame,
        severity: 'low',
        feed_item_id: 1,
      };

      const criticalSeverityEvent: EventFrame = {
        ...mockEventFrame,
        severity: 'critical',
        feed_item_id: 2,
      };

      const signal1 = mapEventToSignal(lowSeverityEvent, 0.8);
      const signal2 = mapEventToSignal(criticalSeverityEvent, 0.8);

      const merged = mergeSignals([signal1, signal2]);

      expect(merged[0].severity).toBe('critical');
    });

    test('should combine actors when merging', () => {
      const event1: EventFrame = {
        ...mockEventFrame,
        actors: ['US'],
        event_type: 'strike',
        feed_item_id: 1,
      };

      const event2: EventFrame = {
        ...mockEventFrame,
        actors: ['US', 'UK'],
        event_type: 'strike',
        feed_item_id: 2,
      };

      // These will have different signal IDs due to different actors
      const signal1 = mapEventToSignal(event1, 0.8);
      const signal2 = mapEventToSignal(event2, 0.8);

      const merged = mergeSignals([signal1, signal2]);

      // Should remain as separate signals due to different actor sets
      expect(merged.length).toBe(2);
    });

    test('should not merge signals with different event types', () => {
      const strikeEvent: EventFrame = {
        ...mockEventFrame,
        event_type: 'strike',
        feed_item_id: 1,
      };

      const protestEvent: EventFrame = {
        ...mockEventFrame,
        event_type: 'protest',
        feed_item_id: 2,
      };

      const signal1 = mapEventToSignal(strikeEvent, 0.8);
      const signal2 = mapEventToSignal(protestEvent, 0.8);

      const merged = mergeSignals([signal1, signal2]);

      expect(merged.length).toBe(2);
    });

    test('should handle empty signal array', () => {
      const merged = mergeSignals([]);
      expect(merged).toEqual([]);
    });

    test('should update reliability when merging', () => {
      const event1: EventFrame = {
        ...mockEventFrame,
        feed_item_id: 1,
      };

      const event2: EventFrame = {
        ...mockEventFrame,
        feed_item_id: 2,
      };

      const signal1 = mapEventToSignal(event1, 0.6);
      const signal2 = mapEventToSignal(event2, 0.9);

      const merged = mergeSignals([signal1, signal2]);

      // Should average reliability
      expect(merged[0].reliability).toBeCloseTo(0.75, 1);
    });
  });

  describe('mapSignals (batch processing)', () => {
    test('should map multiple event frames to signals', () => {
      const events: EventFrame[] = [
        { ...mockEventFrame, feed_item_id: 1 },
        { ...mockEventFrame, feed_item_id: 2, event_type: 'protest' },
        { ...mockEventFrame, feed_item_id: 3, actors: ['Russia'] },
      ];

      const reliabilityMap = new Map([
        [1, 0.9],
        [2, 0.8],
        [3, 0.85],
      ]);

      const signals = mapSignals(events, reliabilityMap);

      expect(signals.length).toBeGreaterThan(0);
      expect(signals.length).toBeLessThanOrEqual(events.length);
    });

    test('should use default reliability when not provided', () => {
      const events: EventFrame[] = [
        { ...mockEventFrame, feed_item_id: 1 },
      ];

      const reliabilityMap = new Map<number, number>();

      const signals = mapSignals(events, reliabilityMap);

      expect(signals.length).toBe(1);
      expect(signals[0].reliability).toBe(0.5); // Default
    });

    test('should automatically merge duplicate signals', () => {
      const events: EventFrame[] = [
        { ...mockEventFrame, feed_item_id: 1 },
        { ...mockEventFrame, feed_item_id: 2 },
        { ...mockEventFrame, feed_item_id: 3 },
      ];

      const reliabilityMap = new Map([
        [1, 0.9],
        [2, 0.9],
        [3, 0.9],
      ]);

      const signals = mapSignals(events, reliabilityMap);

      expect(signals.length).toBe(1);
      expect(signals[0].feed_item_ids).toEqual([1, 2, 3]);
    });
  });

  describe('filterSignalsByConfidence', () => {
    test('should filter out low confidence signals', () => {
      const highConfidenceEvent: EventFrame = {
        ...mockEventFrame,
        confidence: 0.9,
        severity: 'critical',
        extracted_at: now,
      };

      const lowConfidenceEvent: EventFrame = {
        ...mockEventFrame,
        confidence: 0.3,
        severity: 'low',
        extracted_at: twoWeeksAgo,
      };

      const signal1 = mapEventToSignal(highConfidenceEvent, 0.9);
      const signal2 = mapEventToSignal(lowConfidenceEvent, 0.5);

      const filtered = filterSignalsByConfidence([signal1, signal2], 0.4);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered).toContain(signal1);
    });

    test('should return empty array when no signals meet threshold', () => {
      const lowEvent: EventFrame = {
        ...mockEventFrame,
        confidence: 0.1,
        severity: 'low',
      };

      const signal = mapEventToSignal(lowEvent, 0.3);
      const filtered = filterSignalsByConfidence([signal], 0.9);

      expect(filtered).toEqual([]);
    });
  });

  describe('getTopSignals', () => {
    test('should return top N signals by score', () => {
      const events: EventFrame[] = [
        { ...mockEventFrame, feed_item_id: 1, confidence: 0.9, severity: 'critical' },
        { ...mockEventFrame, feed_item_id: 2, confidence: 0.7, severity: 'high' },
        { ...mockEventFrame, feed_item_id: 3, confidence: 0.5, severity: 'medium' },
        { ...mockEventFrame, feed_item_id: 4, confidence: 0.3, severity: 'low' },
      ];

      const signals = events.map(e => mapEventToSignal(e, 0.9));
      const topSignals = getTopSignals(signals, 2);

      expect(topSignals.length).toBe(2);
      // First signal should have highest combined score
      expect(topSignals[0].feed_item_ids[0]).toBe(1);
    });

    test('should handle limit greater than array length', () => {
      const events: EventFrame[] = [
        { ...mockEventFrame, feed_item_id: 1 },
      ];

      const signals = events.map(e => mapEventToSignal(e, 0.9));
      const topSignals = getTopSignals(signals, 10);

      expect(topSignals.length).toBe(1);
    });
  });

  describe('detectSignalTrend', () => {
    test('should detect rising trend', () => {
      const oldSignal: Signal = {
        ...mapEventToSignal(mockEventFrame, 0.8),
        timestamp: oneWeekAgo,
        weight: 0.5,
        signal_id: 'TEST_SIGNAL',
      };

      const recentSignal: Signal = {
        ...mapEventToSignal(mockEventFrame, 0.8),
        timestamp: now,
        weight: 0.9,
        signal_id: 'TEST_SIGNAL',
      };

      const trend = detectSignalTrend([oldSignal, recentSignal], 'TEST_SIGNAL', 168);

      expect(trend).toBe('rising');
    });

    test('should detect falling trend', () => {
      const oldSignal: Signal = {
        ...mapEventToSignal(mockEventFrame, 0.8),
        timestamp: oneWeekAgo,
        weight: 0.9,
        signal_id: 'TEST_SIGNAL',
      };

      const recentSignal: Signal = {
        ...mapEventToSignal(mockEventFrame, 0.8),
        timestamp: now,
        weight: 0.4,
        signal_id: 'TEST_SIGNAL',
      };

      const trend = detectSignalTrend([oldSignal, recentSignal], 'TEST_SIGNAL', 168);

      expect(trend).toBe('falling');
    });

    test('should detect stable trend', () => {
      const signal1: Signal = {
        ...mapEventToSignal(mockEventFrame, 0.8),
        timestamp: oneWeekAgo,
        weight: 0.7,
        signal_id: 'TEST_SIGNAL',
      };

      const signal2: Signal = {
        ...mapEventToSignal(mockEventFrame, 0.8),
        timestamp: now,
        weight: 0.72,
        signal_id: 'TEST_SIGNAL',
      };

      const trend = detectSignalTrend([signal1, signal2], 'TEST_SIGNAL', 168);

      expect(trend).toBe('stable');
    });

    test('should return stable for single signal', () => {
      const signal: Signal = mapEventToSignal(mockEventFrame, 0.8);

      const trend = detectSignalTrend([signal], signal.signal_id);

      expect(trend).toBe('stable');
    });
  });

  describe('Recency Decay', () => {
    test('should apply proper exponential decay', () => {
      const timestamps = [
        now,
        oneDayAgo,
        oneWeekAgo,
        twoWeeksAgo,
      ];

      const signals = timestamps.map(ts => 
        mapEventToSignal({ ...mockEventFrame, extracted_at: ts }, 0.9)
      );

      // Each signal should have lower recency factor than previous
      for (let i = 1; i < signals.length; i++) {
        expect(signals[i].recency_factor).toBeLessThan(signals[i - 1].recency_factor);
      }

      // Most recent should be close to 1.0
      expect(signals[0].recency_factor).toBeGreaterThan(0.95);

      // Two weeks old should still have some weight (> 0.1)
      expect(signals[3].recency_factor).toBeGreaterThan(0.1);
    });

    test('should maintain minimum recency factor', () => {
      const veryOldEvent: EventFrame = {
        ...mockEventFrame,
        extracted_at: now - 100 * 24 * 60 * 60 * 1000, // 100 days ago
      };

      const signal = mapEventToSignal(veryOldEvent, 0.9);

      expect(signal.recency_factor).toBeGreaterThan(0);
    });
  });

  describe('Weight Calculation', () => {
    test('should apply correct event type weights', () => {
      const eventTypes: EventType[] = [
        'strike',
        'negotiation',
        'civilian_casualties',
        'warning',
      ];

      const signals = eventTypes.map(type =>
        mapEventToSignal({ ...mockEventFrame, event_type: type, severity: 'medium' }, 0.9)
      );

      // Civilian casualties should have highest weight
      const casualtySignal = signals.find(s => s.event_type === 'civilian_casualties');
      expect(casualtySignal?.weight).toBeGreaterThan(signals[0].weight);

      // Negotiation should have lowest weight (de-escalation)
      const negotiationSignal = signals.find(s => s.event_type === 'negotiation');
      expect(negotiationSignal?.weight).toBeLessThan(signals[0].weight);
    });

    test('should not exceed maximum weight', () => {
      const maxEvent: EventFrame = {
        ...mockEventFrame,
        event_type: 'civilian_casualties',
        severity: 'critical',
        confidence: 1.0,
        actors: ['US', 'Russia', 'China'],
      };

      const signal = mapEventToSignal(maxEvent, 1.0);

      expect(signal.weight).toBeLessThanOrEqual(1.0);
    });
  });
});

// Run with: npx tsx tests/signal-mapper.test.ts
