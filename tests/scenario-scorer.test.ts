/**
 * Tests for Scenario Scorer
 * Validates scenario probability calculation and trend detection
 */

import {
  scoreScenario,
  scoreAllScenarios,
  detectSignificantChanges,
  getTopScenarios,
  normalizeProbabilities,
} from '../lib/scenarios/scenario-scorer';
import { Signal, ScenarioTemplate, ScenarioScore, DEFAULT_SCENARIOS } from '../types/scenario';

describe('Scenario Scorer', () => {
  const mockSignals: Signal[] = [
    {
      signal_id: 'SIG_STRIKE_US_IRAN',
      event_type: 'strike',
      actors: ['US', 'Iran'],
      weight: 0.8,
      reliability: 0.9,
      severity: 'high',
      timestamp: Date.now(),
      feed_item_ids: [1, 2],
      recency_factor: 1.0,
    },
    {
      signal_id: 'SIG_STRIKE_ISRAEL',
      event_type: 'strike',
      actors: ['Israel'],
      weight: 0.75,
      reliability: 0.85,
      severity: 'high',
      timestamp: Date.now(),
      feed_item_ids: [3],
      recency_factor: 0.95,
    },
    {
      signal_id: 'SIG_NEGOTIATION_UN',
      event_type: 'negotiation',
      actors: ['UN'],
      weight: 0.4,
      reliability: 0.8,
      severity: 'low',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      feed_item_ids: [4],
      recency_factor: 0.8,
    },
  ];

  const testTemplate: ScenarioTemplate = {
    id: 'test_escalation',
    name: 'Test Escalation',
    description: 'Test scenario for unit testing',
    required_signals: ['SIG_STRIKE*'],
    boost_signals: ['SIG_*_IRAN'],
    inhibit_signals: ['SIG_NEGOTIATION*'],
    baseline_probability: 0.3,
  };

  describe('scoreScenario', () => {
    test('should calculate probability score for scenario', () => {
      const score = scoreScenario(testTemplate, mockSignals);

      expect(score.scenario_id).toBe('test_escalation');
      expect(score.probability).toBeGreaterThan(0);
      expect(score.probability).toBeLessThanOrEqual(1);
      expect(score.raw_score).toBeGreaterThan(0);
      expect(score.confidence).toBeGreaterThan(0);
      expect(score.confidence).toBeLessThanOrEqual(1);
      expect(score.last_updated).toBeDefined();
    });

    test('should identify active signals', () => {
      const score = scoreScenario(testTemplate, mockSignals);

      expect(score.active_signals.length).toBeGreaterThan(0);
      // Should include strike signals and negotiation (inhibit)
      const signalTypes = score.active_signals.map(s => s.event_type);
      expect(signalTypes).toContain('strike');
    });

    test('should return zero probability when required signals missing', () => {
      const noMatchTemplate: ScenarioTemplate = {
        ...testTemplate,
        required_signals: ['SIG_CYBER_ATTACK*'],
      };

      const score = scoreScenario(noMatchTemplate, mockSignals);

      expect(score.probability).toBe(0);
      expect(score.raw_score).toBe(0);
    });

    test('should boost score with matching boost signals', () => {
      const withBoost: ScenarioTemplate = {
        ...testTemplate,
        boost_signals: ['SIG_STRIKE_US_IRAN'],
      };

      const withoutBoost: ScenarioTemplate = {
        ...testTemplate,
        boost_signals: [],
      };

      const score1 = scoreScenario(withBoost, mockSignals);
      const score2 = scoreScenario(withoutBoost, mockSignals);

      expect(score1.probability).toBeGreaterThan(score2.probability);
    });

    test('should reduce score with matching inhibit signals', () => {
      const withInhibit: ScenarioTemplate = {
        ...testTemplate,
        inhibit_signals: ['SIG_NEGOTIATION*'],
      };

      const withoutInhibit: ScenarioTemplate = {
        ...testTemplate,
        inhibit_signals: [],
      };

      const score1 = scoreScenario(withInhibit, mockSignals);
      const score2 = scoreScenario(withoutInhibit, mockSignals);

      expect(score1.probability).toBeLessThan(score2.probability);
    });

    test('should calculate confidence based on signal quality', () => {
      const highQualitySignals: Signal[] = [
        {
          ...mockSignals[0],
          reliability: 0.95,
          recency_factor: 1.0,
        },
        {
          ...mockSignals[1],
          reliability: 0.9,
          recency_factor: 1.0,
        },
      ];

      const lowQualitySignals: Signal[] = [
        {
          ...mockSignals[0],
          reliability: 0.5,
          recency_factor: 0.3,
        },
      ];

      const highScore = scoreScenario(testTemplate, highQualitySignals);
      const lowScore = scoreScenario(testTemplate, lowQualitySignals);

      expect(highScore.confidence).toBeGreaterThan(lowScore.confidence);
    });

    test('should detect rising trend', () => {
      const previousScore: ScenarioScore = {
        scenario_id: 'test_escalation',
        probability: 0.3,
        raw_score: 0.5,
        active_signals: [],
        confidence: 0.7,
        trend: 'stable',
        last_updated: Date.now() - 60000,
      };

      const currentScore = scoreScenario(testTemplate, mockSignals, previousScore);

      if (currentScore.probability > 0.35) {
        expect(currentScore.trend).toBe('rising');
      }
    });

    test('should detect falling trend', () => {
      const previousScore: ScenarioScore = {
        scenario_id: 'test_escalation',
        probability: 0.8,
        raw_score: 1.5,
        active_signals: [],
        confidence: 0.9,
        trend: 'stable',
        last_updated: Date.now() - 60000,
      };

      const currentScore = scoreScenario(testTemplate, []);

      expect(currentScore.trend).toBe('falling');
    });

    test('should handle wildcard signal patterns', () => {
      const wildcardTemplate: ScenarioTemplate = {
        ...testTemplate,
        required_signals: ['SIG_*_US*'],
      };

      const score = scoreScenario(wildcardTemplate, mockSignals);

      expect(score.probability).toBeGreaterThan(0);
      expect(score.active_signals.some(s => s.signal_id === 'SIG_STRIKE_US_IRAN')).toBe(true);
    });

    test('should handle empty signals array', () => {
      const score = scoreScenario(testTemplate, []);

      expect(score.probability).toBe(0);
      expect(score.active_signals).toEqual([]);
      expect(score.confidence).toBe(0);
    });
  });

  describe('scoreAllScenarios', () => {
    test('should score all default scenarios', () => {
      const scores = scoreAllScenarios(mockSignals);

      expect(scores.length).toBe(DEFAULT_SCENARIOS.length);

      // Each score should have valid probability
      scores.forEach(score => {
        expect(score.probability).toBeGreaterThanOrEqual(0);
        expect(score.probability).toBeLessThanOrEqual(1);
      });
    });

    test('should sort scenarios by probability', () => {
      const scores = scoreAllScenarios(mockSignals);

      // Verify descending order
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1].probability).toBeGreaterThanOrEqual(scores[i].probability);
      }
    });

    test('should use previous scores for trend detection', () => {
      const previousScores = new Map<string, ScenarioScore>();
      
      previousScores.set('limited_escalation', {
        scenario_id: 'limited_escalation',
        probability: 0.2,
        raw_score: 0.3,
        active_signals: [],
        confidence: 0.6,
        trend: 'stable',
        last_updated: Date.now() - 3600000,
      });

      const scores = scoreAllScenarios(mockSignals, previousScores);

      const limitedEscalation = scores.find(s => s.scenario_id === 'limited_escalation');

      expect(limitedEscalation).toBeDefined();
      expect(limitedEscalation?.trend).toBeDefined();
    });

    test('should handle scenarios with no matching signals', () => {
      const minimalSignals: Signal[] = [
        {
          signal_id: 'SIG_NEGOTIATION',
          event_type: 'negotiation',
          actors: [],
          weight: 0.3,
          reliability: 0.7,
          severity: 'low',
          timestamp: Date.now(),
          feed_item_ids: [1],
          recency_factor: 1.0,
        },
      ];

      const scores = scoreAllScenarios(minimalSignals);

      // Should still return all scenarios, even if probabilities are low
      expect(scores.length).toBe(DEFAULT_SCENARIOS.length);
    });
  });

  describe('detectSignificantChanges', () => {
    test('should detect probability increases', () => {
      const currentScores: ScenarioScore[] = [
        {
          scenario_id: 'limited_escalation',
          probability: 0.7,
          raw_score: 1.2,
          active_signals: [],
          confidence: 0.8,
          trend: 'rising',
          last_updated: Date.now(),
        },
      ];

      const previousScores = new Map<string, ScenarioScore>();
      previousScores.set('limited_escalation', {
        scenario_id: 'limited_escalation',
        probability: 0.4,
        raw_score: 0.6,
        active_signals: [],
        confidence: 0.7,
        trend: 'stable',
        last_updated: Date.now() - 3600000,
      });

      const changes = detectSignificantChanges(currentScores, previousScores, 0.1);

      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].direction).toBe('increase');
      expect(changes[0].change).toBeGreaterThan(0.1);
    });

    test('should detect probability decreases', () => {
      const currentScores: ScenarioScore[] = [
        {
          scenario_id: 'status_quo_unstable',
          probability: 0.2,
          raw_score: 0.3,
          active_signals: [],
          confidence: 0.5,
          trend: 'falling',
          last_updated: Date.now(),
        },
      ];

      const previousScores = new Map<string, ScenarioScore>();
      previousScores.set('status_quo_unstable', {
        scenario_id: 'status_quo_unstable',
        probability: 0.6,
        raw_score: 1.0,
        active_signals: [],
        confidence: 0.8,
        trend: 'stable',
        last_updated: Date.now() - 3600000,
      });

      const changes = detectSignificantChanges(currentScores, previousScores, 0.1);

      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].direction).toBe('decrease');
    });

    test('should filter changes below threshold', () => {
      const currentScores: ScenarioScore[] = [
        {
          scenario_id: 'test_scenario',
          probability: 0.52,
          raw_score: 0.8,
          active_signals: [],
          confidence: 0.7,
          trend: 'stable',
          last_updated: Date.now(),
        },
      ];

      const previousScores = new Map<string, ScenarioScore>();
      previousScores.set('test_scenario', {
        scenario_id: 'test_scenario',
        probability: 0.5,
        raw_score: 0.75,
        active_signals: [],
        confidence: 0.7,
        trend: 'stable',
        last_updated: Date.now() - 3600000,
      });

      const changes = detectSignificantChanges(currentScores, previousScores, 0.1);

      // Change of 0.02 should be filtered out with threshold 0.1
      expect(changes.length).toBe(0);
    });

    test('should sort changes by magnitude', () => {
      const currentScores: ScenarioScore[] = [
        {
          scenario_id: 'scenario_a',
          probability: 0.7,
          raw_score: 1.0,
          active_signals: [],
          confidence: 0.8,
          trend: 'rising',
          last_updated: Date.now(),
        },
        {
          scenario_id: 'scenario_b',
          probability: 0.8,
          raw_score: 1.2,
          active_signals: [],
          confidence: 0.9,
          trend: 'rising',
          last_updated: Date.now(),
        },
      ];

      const previousScores = new Map<string, ScenarioScore>();
      previousScores.set('scenario_a', {
        scenario_id: 'scenario_a',
        probability: 0.5,
        raw_score: 0.7,
        active_signals: [],
        confidence: 0.7,
        trend: 'stable',
        last_updated: Date.now() - 3600000,
      });

      previousScores.set('scenario_b', {
        scenario_id: 'scenario_b',
        probability: 0.4,
        raw_score: 0.5,
        active_signals: [],
        confidence: 0.6,
        trend: 'stable',
        last_updated: Date.now() - 3600000,
      });

      const changes = detectSignificantChanges(currentScores, previousScores, 0.1);

      // Scenario B has larger change (0.4 vs 0.2)
      expect(changes[0].scenario_id).toBe('scenario_b');
      expect(changes[0].change).toBeGreaterThan(changes[1].change);
    });
  });

  describe('getTopScenarios', () => {
    test('should return top N scenarios', () => {
      const scores = scoreAllScenarios(mockSignals);
      const topScenarios = getTopScenarios(scores, 3);

      expect(topScenarios.length).toBe(3);

      // Should be sorted by probability
      expect(topScenarios[0].probability).toBeGreaterThanOrEqual(topScenarios[1].probability);
      expect(topScenarios[1].probability).toBeGreaterThanOrEqual(topScenarios[2].probability);
    });

    test('should handle limit greater than array length', () => {
      const scores = scoreAllScenarios(mockSignals);
      const topScenarios = getTopScenarios(scores, 100);

      expect(topScenarios.length).toBe(scores.length);
    });
  });

  describe('normalizeProbabilities', () => {
    test('should normalize probabilities to sum to 1', () => {
      const scores: ScenarioScore[] = [
        {
          scenario_id: 'a',
          probability: 0.5,
          raw_score: 1.0,
          active_signals: [],
          confidence: 0.8,
          trend: 'stable',
          last_updated: Date.now(),
        },
        {
          scenario_id: 'b',
          probability: 0.3,
          raw_score: 0.6,
          active_signals: [],
          confidence: 0.7,
          trend: 'stable',
          last_updated: Date.now(),
        },
        {
          scenario_id: 'c',
          probability: 0.2,
          raw_score: 0.4,
          active_signals: [],
          confidence: 0.6,
          trend: 'stable',
          last_updated: Date.now(),
        },
      ];

      const normalized = normalizeProbabilities(scores);

      const sum = normalized.reduce((acc, s) => acc + s.probability, 0);

      expect(sum).toBeCloseTo(1.0, 5);
    });

    test('should preserve relative ratios', () => {
      const scores: ScenarioScore[] = [
        {
          scenario_id: 'a',
          probability: 0.6,
          raw_score: 1.0,
          active_signals: [],
          confidence: 0.8,
          trend: 'stable',
          last_updated: Date.now(),
        },
        {
          scenario_id: 'b',
          probability: 0.4,
          raw_score: 0.6,
          active_signals: [],
          confidence: 0.7,
          trend: 'stable',
          last_updated: Date.now(),
        },
      ];

      const normalized = normalizeProbabilities(scores);

      // Ratio should be preserved (0.6:0.4 = 1.5:1)
      const ratio = normalized[0].probability / normalized[1].probability;
      expect(ratio).toBeCloseTo(1.5, 1);
    });

    test('should handle zero total probability', () => {
      const scores: ScenarioScore[] = [
        {
          scenario_id: 'a',
          probability: 0,
          raw_score: 0,
          active_signals: [],
          confidence: 0,
          trend: 'stable',
          last_updated: Date.now(),
        },
      ];

      const normalized = normalizeProbabilities(scores);

      expect(normalized[0].probability).toBe(0);
    });
  });

  describe('Score Calculation Edge Cases', () => {
    test('should handle very high signal weights', () => {
      const highWeightSignals: Signal[] = [
        {
          signal_id: 'SIG_STRIKE',
          event_type: 'strike',
          actors: [],
          weight: 10.0,
          reliability: 1.0,
          severity: 'critical',
          timestamp: Date.now(),
          feed_item_ids: [1],
          recency_factor: 1.0,
        },
      ];

      const template: ScenarioTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        required_signals: ['SIG_STRIKE'],
        boost_signals: [],
        inhibit_signals: [],
        baseline_probability: 0.3,
      };

      const score = scoreScenario(template, highWeightSignals);

      // Should still cap probability at 1.0
      expect(score.probability).toBeLessThanOrEqual(1.0);
    });

    test('should handle negative raw scores from inhibit signals', () => {
      const deescalationSignals: Signal[] = [
        {
          signal_id: 'SIG_NEGOTIATION',
          event_type: 'negotiation',
          actors: [],
          weight: 1.0,
          reliability: 1.0,
          severity: 'low',
          timestamp: Date.now(),
          feed_item_ids: [1],
          recency_factor: 1.0,
        },
      ];

      const template: ScenarioTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        required_signals: [],
        boost_signals: [],
        inhibit_signals: ['SIG_NEGOTIATION'],
        baseline_probability: 0.3,
      };

      const score = scoreScenario(template, deescalationSignals);

      // Raw score should not go negative
      expect(score.raw_score).toBeGreaterThanOrEqual(0);
    });
  });
});

// Run with: npx tsx tests/scenario-scorer.test.ts
