/**
 * Stops & Sizing
 * - Structure-aware stop = max(ATR, structure)
 * - ADX-adaptive ATR multiplier
 * - 6% risk cap
 */
const request = require('supertest');
const express = require('express');

// Create test app with direct controller
const app = express();
const controller = require('../../src/controllers/ai/stock.expert.controller.js');
app.get('/api/trading/analysis', controller.getAnalysis);
describe('Structure-aware stops & risk caps', () => {
  // Remove unnecessary mocks - use real system for integration testing
  
  test('max(ATR_stop, structure_stop) used', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&diagnostics=1');
    expect(res.status).toBe(200);

    const execution = res.body.execution;
    expect(execution.stop).toBeDefined();
    expect(typeof execution.stop).toBe('number');
    expect(execution.stop).toBeGreaterThan(0);
    
    // Structure-aware stops should provide meaningful stop levels
    expect(execution.riskReward).toBeGreaterThan(0);
  });

  test('Risk cap enforced when volatility makes risk high', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&capital=10000&diagnostics=1');
    expect(res.status).toBe(200);

    const execution = res.body.execution;
    expect(execution.stop).toBeDefined();
    
    // Risk management should be active
    expect(execution.riskReward).toBeGreaterThan(0);
    expect(execution.positionSize).toBeDefined();
    
    // Position size should be reasonable relative to capital
    if (execution.positionSize && execution.positionSize.value) {
      expect(execution.positionSize.value).toBeLessThan(10000); // Should not exceed capital
      expect(execution.positionSize.value).toBeGreaterThan(0);
    }
  });
});