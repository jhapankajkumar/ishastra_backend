/**
 * API Contract & Error Paths - Fixed for Current Architecture
 * Tests essential API contract compliance, error handling, and graceful degradation
 */
const request = require('supertest');
const express = require('express');
jest.mock('../../src/utils/advancedTechnicalAnalysis');
jest.mock('../../src/utils/leakFreeBacktestingEngine');

// Create test app matching your architecture
const app = express();
const controller = require('../../src/controllers/ai/stock.expert.controller.js');
app.get('/api/trading/analysis', controller.getAnalysis); // Fixed route path

const TA = require('../../src/utils/advancedTechnicalAnalysis');
const Backtest = require('../../src/utils/leakFreeBacktestingEngine');

describe('API Contract & Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Backtest.run = jest.fn().mockResolvedValue({ 
      leakFree: true, 
      totalTrades: 0,
      systemHealth: 50 
    });
  });

  test('400 when symbol missing', async () => {
    const res = await request(app).get('/api/trading/analysis?period=3mo');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Stock symbol is required/i);
    expect(res.body.success).toBe(false);
  });

  test('diagnostics disabled → minimal diagnostic data', async () => {
    TA.analyzeStock = jest.fn().mockResolvedValue({
      currentPrice: 100,
      latestPrice: 100,
      technicalIndicators: { 
        latest: { 
          ema200: 95, 
          rsi: 55, 
          adx: 25, 
          atr: 2, 
          volume: 1_400_000, 
          vol20dma: 1_000_000 
        }
      },
      levels: { support: 96, resistance: 110 },
      multiTimeframe: { 
        recommendation: { action: 'BUY', confidence: 0.7 }, 
        overallConfluence: { score: 75, agreement: 'BULL' } 
      },
      dualTimeframeAnalysis: { 
        unifiedSignal: 'BUY', 
        conflictResolution: { type: 'ALIGNMENT' } 
      },
      signals: { overall: 'BUY', systems: {} },
      ohlcData: new Array(200).fill(0).map((_,i) => ({ 
        c: 90 + i * 0.08,
        date: new Date(Date.now() - (200-i) * 24 * 60 * 60 * 1000) 
      })),
    });

    const res = await request(app).get('/api/trading/analysis?symbol=TEST1&period=3mo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // When diagnostics disabled, should have minimal diagnostic data
    expect(res.body.diagnostics).toBeUndefined();
  });

  test('Missing critical data handled gracefully', async () => {
    TA.analyzeStock = jest.fn().mockResolvedValue({
      currentPrice: 100,
      latestPrice: 100,
      technicalIndicators: { 
        latest: { 
          // Intentionally missing volume and ema200
          adx: 25, 
          atr: 2,
          rsi: 50
        }
      },
      levels: {},
      signals: { overall: 'HOLD', systems: {} },
      ohlcData: [{ c: 100, date: new Date() }]
    });

    const res = await request(app).get('/api/trading/analysis?symbol=MISSING1&period=3mo&diagnostics=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Should not crash and should handle missing data gracefully
    expect(res.body.decision).toBeDefined();
    expect(res.body.execution).toBeDefined();
    
    // Should have some diagnostic information about missing data
    if (res.body.diagnostics) {
      // The system should note data quality issues
      const hasDataQualityNotes = 
        res.body.diagnostics.gates ||
        res.body.diagnostics.dataQuality ||
        res.body.execution.riskAssessment;
      expect(hasDataQualityNotes).toBeDefined();
    }
  });

  test('Handles invalid period parameter gracefully', async () => {
    TA.analyzeStock = jest.fn().mockResolvedValue({
      currentPrice: 100,
      latestPrice: 100,
      technicalIndicators: { latest: { ema200: 95, rsi: 55, adx: 25, atr: 2 }},
      levels: { support: 96, resistance: 110 },
      signals: { overall: 'BUY', systems: {} },
      ohlcData: new Array(50).fill(0).map((_, i) => ({ 
        c: 95 + i * 0.1,
        date: new Date(Date.now() - (50-i) * 24 * 60 * 60 * 1000)
      })),
    });

    const res = await request(app).get('/api/trading/analysis?symbol=TEST2&period=invalid');
    expect(res.status).toBe(200); // Should handle gracefully, not crash
    expect(res.body.success).toBe(true);
  });

  test('Returns proper response structure', async () => {
    TA.analyzeStock = jest.fn().mockResolvedValue({
      currentPrice: 100,
      latestPrice: 100,
      technicalIndicators: { 
        latest: { 
          ema200: 95, 
          rsi: 55, 
          adx: 25, 
          atr: 2, 
          volume: 1_500_000, 
          vol20dma: 1_200_000 
        }
      },
      levels: { support: 96, resistance: 110 },
      multiTimeframe: { 
        recommendation: { action: 'BUY', confidence: 0.75 }, 
        overallConfluence: { score: 80, agreement: 'BULL' } 
      },
      dualTimeframeAnalysis: { 
        unifiedSignal: 'BUY', 
        conflictResolution: { type: 'ALIGNMENT' } 
      },
      signals: { overall: 'BUY', systems: {} },
      ohlcData: new Array(100).fill(0).map((_, i) => ({ 
        c: 90 + i * 0.1,
        date: new Date(Date.now() - (100-i) * 24 * 60 * 60 * 1000)
      })),
    });

    const res = await request(app).get('/api/trading/analysis?symbol=STRUCT1&period=3mo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify required response structure
    expect(res.body.decision).toBeDefined();
    expect(res.body.decision.status).toBeDefined();
    expect(res.body.execution).toBeDefined();
    expect(res.body.metadata).toBeDefined();
    expect(res.body.symbol).toBe('STRUCT1');
  });
});
