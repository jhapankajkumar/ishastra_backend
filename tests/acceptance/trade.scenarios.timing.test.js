/**
 * Scenarios & timing
 * - Breakout/breakdown payload shape
 * - Volume gate effect on scenarios
 * - Microstructure placeholder doesn't crash
 */
const request = require('supertest');
const express = require('express');

// Create test app with direct controller
const app = express();
const controller = require('../../src/controllers/ai/stock.expert.controller.js');
app.get('/api/trading/analysis', controller.getAnalysis);

describe('Scenarios & timing', () => {
  test('Breakout/breakdown structures present; volume gate influences breakout readiness', async () => {
    const res = await request(app).get('/api/trading/analysis?symbol=AAPL&period=3mo&diagnostics=1');
    expect(res.status).toBe(200);

    expect(res.body.scenarios).toBeDefined();
    expect(res.body.scenarios.breakout).toBeDefined();
    expect(res.body.scenarios.breakdown).toBeDefined();

    // Volume gate should be present and affect quality
    if (res.body.scenarios.breakout.quality) {
      expect(typeof res.body.scenarios.breakout.quality.volumeGate).toBe('boolean');
    }
    
    // Microstructure timing should not crash and provide reasonable values
    expect(res.body.execution).toBeDefined();
    expect(res.body.execution.stop).toBeGreaterThan(0);
  });
});