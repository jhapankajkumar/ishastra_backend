/**
 * Proven Systems Integration Tests
 * Verifies that external proven trading systems integrate properly with the Expert Engine
 */

const { 
  collectAllSignalsDeterministicWithProven, 
  validateProvenSystemTier,
  PROVEN_SYSTEMS_CONFIG
} = require('../../src/controllers/ai/stock.expert.controller');

const { SYSTEM_IDS, normalizeSystemKey } = require('../../src/utils/systemConstants');

describe('Proven Systems Integration', () => {
  
  describe('System ID Normalization', () => {
    test('should normalize system aliases correctly', () => {
      expect(normalizeSystemKey('triple_screen')).toBe(SYSTEM_IDS.TRIPLE_SCREEN);
      expect(normalizeSystemKey('triplescreen')).toBe(SYSTEM_IDS.TRIPLE_SCREEN);
      expect(normalizeSystemKey('sepa')).toBe(SYSTEM_IDS.MINERVINI_SEPA);
      expect(normalizeSystemKey('sepa_method')).toBe(SYSTEM_IDS.MINERVINI_SEPA);
      expect(normalizeSystemKey('bb_squeeze')).toBe(SYSTEM_IDS.BB_SQUEEZE_BREAKOUT);
      expect(normalizeSystemKey('darvas')).toBe(SYSTEM_IDS.DARVAS_BREAKOUT);
    });
  });

  describe('Tier Validation Security', () => {
    test('should reject VETO tier for proven systems', () => {
      const result = validateProvenSystemTier('VETO', 'test_system', 0.8);
      expect(result).toBe('CONFIRMER');
    });

    test('should reject PRIMARY tier when feature flag disabled', () => {
      // Assuming ALLOW_PROVEN_PRIMARY is false by default
      const result = validateProvenSystemTier('PRIMARY', SYSTEM_IDS.MINERVINI_SEPA, 0.9);
      expect(result).toBe('CONFIRMER');
    });

    test('should allow CONFIRMER tier by default', () => {
      const result = validateProvenSystemTier('CONFIRMER', 'test_system', 0.5);
      expect(result).toBe('CONFIRMER');
    });

    test('should default to CONFIRMER for unknown tiers', () => {
      const result = validateProvenSystemTier('UNKNOWN_TIER', 'test_system', 0.5);
      expect(result).toBe('CONFIRMER');
    });
  });

  describe('Signal Collection Integration', () => {
    const mockTechnical = {
      currentPrice: 100,
      signals: { overall: 'BUY' },
      multiTimeframe: {
        recommendation: { action: 'BUY', confidence: 0.7 }
      }
    };

    const mockBacktest = {
      bestSystemWinRate: 65,
      recommendation: 'BUY',
      confidence: 0.6
    };

    const mockSentiment = {
      overallSentiment: 'BULLISH',
      sentimentScore: 0.3
    };

    test('should merge internal and proven signals deterministically', () => {
      const provenSignals = [
        {
          source: 'sepa_method',
          signal: 'BUY',
          confidence: 0.75,
          tier: 'CONFIRMER',
          reasoning: 'SEPA breakout pattern detected'
        },
        {
          source: 'darvas_breakout', 
          signal: 'BUY',
          confidence: 0.68,
          tier: 'CONFIRMER',
          reasoning: 'Darvas box breakout with volume'
        }
      ];

      const result = collectAllSignalsDeterministicWithProven(
        mockTechnical, 
        mockBacktest, 
        mockSentiment, 
        provenSignals
      );

      // Check that proven signals are included
      const provenSources = result.all
        .filter(s => s.metadata?.isProvenSystem)
        .map(s => s.source);
      
      expect(provenSources).toContain(SYSTEM_IDS.MINERVINI_SEPA);
      expect(provenSources).toContain(SYSTEM_IDS.DARVAS_BREAKOUT);

      // Check that all signals are properly ordered by priority
      const priorities = result.all.map(s => s.priority);
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sortedPriorities);

      // Check that proven signals are in CONFIRMER tier
      const provenSignalsInResult = result.all.filter(s => s.metadata?.isProvenSystem);
      provenSignalsInResult.forEach(signal => {
        expect(signal.tier).toBe('CONFIRMER');
        expect(signal.priority).toBeGreaterThanOrEqual(2.05);
        expect(signal.priority).toBeLessThanOrEqual(2.49);
      });
    });

    test('should handle empty proven signals gracefully', () => {
      const result = collectAllSignalsDeterministicWithProven(
        mockTechnical,
        mockBacktest, 
        mockSentiment,
        []
      );

      // Should work the same as internal signals only
      expect(result.all.length).toBeGreaterThan(0);
      expect(result.all.every(s => !s.metadata?.isProvenSystem)).toBe(true);
    });

    test('should clamp proven signal priorities to valid range', () => {
      const provenSignals = [
        {
          source: 'test_system',
          signal: 'BUY', 
          confidence: 0.6,
          priority: 1.0 // Too low - should be clamped to 2.05
        },
        {
          source: 'test_system2',
          signal: 'SELL',
          confidence: 0.5, 
          priority: 5.0 // Too high - should be clamped to 2.49
        }
      ];

      const result = collectAllSignalsDeterministicWithProven(
        mockTechnical,
        mockBacktest,
        mockSentiment, 
        provenSignals
      );

      const provenSignalsInResult = result.all.filter(s => s.metadata?.isProvenSystem);
      provenSignalsInResult.forEach(signal => {
        expect(signal.priority).toBeGreaterThanOrEqual(2.05);
        expect(signal.priority).toBeLessThanOrEqual(2.49);
      });
    });

    test('should preserve deterministic hash consistency', () => {
      const provenSignals = [
        { source: 'sepa_method', signal: 'BUY', confidence: 0.7 }
      ];

      // Run twice with same inputs
      const result1 = collectAllSignalsDeterministicWithProven(
        mockTechnical, mockBacktest, mockSentiment, provenSignals
      );
      const result2 = collectAllSignalsDeterministicWithProven(  
        mockTechnical, mockBacktest, mockSentiment, provenSignals
      );

      // Should have identical processing order
      const order1 = result1.all.map(s => `${s.source}:${s.priority}:${s.signal}`);
      const order2 = result2.all.map(s => `${s.source}:${s.priority}:${s.signal}`);
      expect(order1).toEqual(order2);
    });
  });
});

describe('System Requirements', () => {
  test('should identify systems requiring weekly data', () => {
    const { requiresWeeklyData } = require('../../src/utils/systemConstants');
    
    expect(requiresWeeklyData(SYSTEM_IDS.TRIPLE_SCREEN)).toBe(true);
    expect(requiresWeeklyData(SYSTEM_IDS.MINERVINI_SEPA)).toBe(false);
    expect(requiresWeeklyData(SYSTEM_IDS.BB_SQUEEZE_BREAKOUT)).toBe(false);
  });

  test('should identify systems requiring intraday data', () => {
    const { requiresIntradayData } = require('../../src/utils/systemConstants');
    
    expect(requiresIntradayData(SYSTEM_IDS.TRIPLE_SCREEN)).toBe(true);
    expect(requiresIntradayData(SYSTEM_IDS.DARVAS_BREAKOUT)).toBe(false);
  });
});
