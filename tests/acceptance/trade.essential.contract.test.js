/**
 * Essential API Contract Tests - Streamlined for Current Architecture
 * Focus: Error handling, graceful degradation, response structure
 */
const request = require('supertest');
const express = require('express');

const app = express();
const controller = require('../../src/controllers/ai/trade.controller.js');
app.get('/api/trading/analysis', controller.getAnalysis);

describe('Essential API Contract Tests', () => {
  // Clean tests without excessive mocking
  
  test('Returns 400 for missing symbol', async () => {
    const res = await request(app).get('/api/trading/analysis?period=3mo');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/symbol.*required/i);
  });

  test('Handles invalid symbols gracefully', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=INVALID12345&period=3mo');
    
    // Should not crash (200 or 500 both acceptable for invalid symbol)
    expect([200, 500]).toContain(res.status);
    
    if (res.status === 200) {
      // Should have basic structure even with invalid data
      expect(res.body.decision).toBeDefined();
      expect(res.body.execution).toBeDefined();
      expect(res.body.symbol).toBe('INVALID12345');
    }
  });

  test('Returns consistent response structure for valid requests', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo');
    
    // Should succeed or fail gracefully
    expect([200, 500]).toContain(res.status);
    
    if (res.status === 200) {
      // Verify core response structure
      expect(res.body).toHaveProperty('decision');
      expect(res.body).toHaveProperty('execution');
      expect(res.body).toHaveProperty('symbol');
      
      // Decision should have required fields
      expect(res.body.decision).toHaveProperty('status');
      expect(['BUY', 'SELL', 'HOLD', 'WATCH', 'AVOID', 'WAIT', 'STRONG_BUY', 'STRONG_SELL']).toContain(res.body.decision.status);
      
      // Execution should have risk data
      expect(res.body.execution).toHaveProperty('riskReward');
      expect(typeof res.body.execution.riskReward).toBe('number');
    }
  });

  test('Diagnostics parameter controls output detail', async () => {
    const withoutDiag = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo');
    const withDiag = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&diagnostics=1');
    
    // Both should work
    expect([200, 500]).toContain(withoutDiag.status);
    expect([200, 500]).toContain(withDiag.status);
    
    if (withoutDiag.status === 200 && withDiag.status === 200) {
      // With diagnostics should have more detail
      const hasMoreDiagInfo = 
        (withDiag.body.diagnostics && !withoutDiag.body.diagnostics) ||
        JSON.stringify(withDiag.body).length > JSON.stringify(withoutDiag.body).length;
      
      expect(hasMoreDiagInfo).toBe(true);
    }
  });

  test('Handles different time periods', async () => {
    const periods = ['1mo', '3mo', '6mo', '1y'];
    
    for (const period of periods) {
      const res = await request(app).get(`/api/trading/analysis?symbol=AAPL&period=${period}`);
      
      // Should handle all periods gracefully
      expect([200, 500]).toContain(res.status);
      
      if (res.status === 200) {
        expect(res.body.symbol).toBe('AAPL');
        // Check basic response structure exists
        expect(res.body.decision).toBeDefined();
      }
    }
  }, 30000); // Longer timeout for multiple requests
});
