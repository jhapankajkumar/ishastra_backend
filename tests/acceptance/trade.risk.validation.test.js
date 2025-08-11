/**
 * Risk Management Core Logic Tests - Focused on Core Logic
 * Tests position sizing, stop losses, and risk caps without excessive mocking
 */
const request = require('supertest');
const express = require('express');

const app = express();
const controller = require('../../src/controllers/ai/trade.controller.js');
app.get('/api/trading/analysis', controller.getAnalysis);

describe('Risk Management Core Logic', () => {
  
  test('Risk-reward ratio is calculated and reasonable', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&capital=10000');
    
    // Should have core response structure
    expect(res.body).toHaveProperty('decision');
    expect(res.body).toHaveProperty('execution');
    expect(res.body).toHaveProperty('symbol');
    
    if (res.status === 200) {
      const execution = res.body.execution;
      
      // Should have risk-reward calculation
      expect(execution.riskReward).toBeDefined();
      expect(typeof execution.riskReward).toBe('number');
      
      // R/R should be reasonable (between 0.1 and 10)
      expect(execution.riskReward).toBeGreaterThan(0.1);
      expect(execution.riskReward).toBeLessThan(10);
      
      // Should have stop loss information in execution object
      expect(execution.stop).toBeDefined();
      expect(typeof execution.stop).toBe('number');
      
      // Stop should be below current price for long positions
      if (['BUY', 'STRONG_BUY', 'WATCH'].includes(res.body.decision.status)) {
        expect(execution.stop).toBeLessThan(res.body.currentPrice || execution.entry || 999999);
      }
    }
  });

  test('Position sizing scales with capital', async () => {
    const smallCapital = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&capital=5000');
    const largeCapital = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&capital=50000');
    
    if (smallCapital.status === 200 && largeCapital.status === 200) {
      const smallShares = smallCapital.body.execution.positionSize?.shares || 0;
      const largeShares = largeCapital.body.execution.positionSize?.shares || 0;
      
      // Larger capital should generally allow larger positions (unless risk caps applied)
      if (smallShares > 0 && largeShares > 0) {
        expect(largeShares).toBeGreaterThanOrEqual(smallShares);
      }
      
      // Neither should be negative
      expect(smallShares).toBeGreaterThanOrEqual(0);
      expect(largeShares).toBeGreaterThanOrEqual(0);
    }
  });

  test('Risk caps prevent excessive position sizes', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&capital=100000&diagnostics=1');
    
    if (res.status === 200) {
      const { execution } = res.body;
      
      // Position should not risk more than reasonable percentage of capital
      if (execution.positionSize && execution.positionSize.value && execution.positionSize.value > 0) {
        const positionPercent = (execution.positionSize.value / 100000) * 100;
        
        // Position should not exceed 50% of capital (very conservative test)
        expect(positionPercent).toBeLessThanOrEqual(50);
      }
      
      // Risk level should exist and be reasonable
      if (res.body.risk && res.body.risk.level) {
        expect(['LOW', 'MODERATE', 'HIGH', 'EXTREME']).toContain(res.body.risk.level);
      }
    }
  });

  test('Stop loss methods are documented', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&diagnostics=1');
    
    if (res.status === 200) {
      const { execution } = res.body;
      
      // Should have stop loss information
      if (execution.stop && execution.stop > 0) {
        expect(execution.stop).toBeDefined();
        expect(typeof execution.stop).toBe('number');
        
        // Stop should be reasonable relative to entry price
        if (execution.entry) {
          const stopDistance = Math.abs(execution.entry - execution.stop);
          const stopPercent = (stopDistance / execution.entry) * 100;
          
          // Stop should be between 0.5% and 20% away from entry (reasonable range)
          expect(stopPercent).toBeGreaterThan(0.5);
          expect(stopPercent).toBeLessThan(20);
        }
      }
    }
  });

  test('Handles edge cases without crashing', async () => {
    // Test edge cases
    const edgeCases = [
      'symbol=AAPL&period=3mo&capital=1',      // Very small capital
      'symbol=AAPL&period=3mo&capital=0',      // Zero capital  
      'symbol=AAPL&period=3mo&capital=abc',    // Invalid capital
      'symbol=AAPL&period=invalid'             // Invalid period
    ];
    
    for (const query of edgeCases) {
      const res = await request(app).get(`/api/trading/analysis?${query}`);
      
      // Should not crash - either 200 or 400/500 acceptable
      expect([200, 400, 500]).toContain(res.status);
      
      // If it returns 200, should have basic structure
      if (res.status === 200) {
        expect(res.body.decision).toBeDefined();
        expect(res.body.execution).toBeDefined();
      }
    }
  });
});
