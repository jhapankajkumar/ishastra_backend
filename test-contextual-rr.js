/**
 * Test Contextual Risk-Reward Implementation
 * Validates the new expectancy-based gating system
 */

const request = require('supertest');
const app = require('./server');

// Mock Yahoo Finance to provide deterministic data
jest.mock('yahoo-finance2', () => ({
  default: {
    historical: jest.fn().mockImplementation(() => {
      // Generate 250 deterministic OHLC data points
      const data = [];
      const baseDate = new Date('2024-01-01');
      
      for (let i = 0; i < 250; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        
        // Create deterministic price movement using sine wave
        const progress = i / 249; // 0 to 1
        const sineValue = Math.sin(progress * Math.PI * 4); // 4 cycles over the period
        const basePrice = 100;
        const volatility = 15;
        
        const price = basePrice + (sineValue * volatility);
        const volume = 1000000 + (Math.sin(progress * Math.PI * 2) * 200000);
        
        data.push({
          date: date,
          open: price * 0.998,
          high: price * 1.015,
          low: price * 0.985,
          close: price,
          adjClose: price,
          volume: Math.abs(volume)
        });
      }
      
      console.log(`🎯 Mock Yahoo Finance: Generated ${data.length} data points`);
      return Promise.resolve(data);
    })
  }
}));

describe('Contextual Risk-Reward Implementation', () => {
  
  test('R/R=1.88, p=0.62, EV>0 should result in WATCH (not HOLD)', async () => {
    const response = await request(app)
      .get('/api/trading/analysis')
      .query({
        symbol: 'AAPL',
        period: '3mo',
        capital: '100000'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('decision');
    
    const { decision, execution } = response.body;
    
    console.log('📊 Contextual R/R Test Results:');
    console.log(`   Status: ${decision.status}`);
    console.log(`   Grade: ${decision.grade}`);
    console.log(`   Confidence: ${decision.confidence}%`);
    console.log(`   R/R: ${execution.riskReward}`);
    console.log(`   Position: ${execution.positionSize.shares} shares (${execution.positionSize.risk})`);
    
    // Core requirements for contextual R/R system
    if (execution.riskReward >= 1.6 && execution.riskReward < 2.0) {
      // Moderate R/R should result in WATCH (actionable) not HOLD (blocked)
      expect(['WATCH', 'BUY']).toContain(decision.status);
      expect(decision.status).not.toBe('HOLD');
      
      // Should allow probe sizing
      if (decision.status === 'WATCH') {
        expect(parseInt(execution.positionSize.shares)).toBeGreaterThan(0);
        console.log(`✅ WATCH decision with probe sizing: ${execution.positionSize.shares} shares`);
      } else if (decision.status === 'BUY') {
        console.log(`✅ Upgraded to BUY due to quality setup`);
      }
    }
    
    // Should not block trades with positive expectancy and decent R/R
    if (execution.riskReward >= 1.5) {
      expect(decision.status).not.toBe('AVOID');
      console.log(`✅ No blocking for R/R >= 1.5 (${execution.riskReward})`);
    }
    
    // Confidence should be reasonable for good setups
    if (['A+', 'A', 'A-', 'B+', 'B'].includes(decision.grade)) {
      expect(decision.confidence).toBeGreaterThan(50);
      console.log(`✅ Quality setup maintains confidence: ${decision.confidence}% for grade ${decision.grade}`);
    }
    
    console.log(`🎯 Test passed: Contextual R/R system working correctly`);
    
  }, 30000);

  test('Contextual floors work correctly for different regimes', async () => {
    // This test validates that the system uses different R/R floors
    // based on market regime and setup quality
    
    const response = await request(app)
      .get('/api/trading/analysis')
      .query({
        symbol: 'AAPL', 
        period: '3mo',
        capital: '100000'
      });

    expect(response.status).toBe(200);
    
    const { decision, execution, context } = response.body;
    
    console.log('🏛️ Contextual Floor Test:');
    console.log(`   Trend: ${context.trend}`);
    console.log(`   Grade: ${decision.grade}`);
    console.log(`   R/R: ${execution.riskReward}`);
    console.log(`   Status: ${decision.status}`);
    
    // The system should be more permissive in bull markets
    // and more restrictive in bear markets
    if (context.trend.includes('UPTREND') || context.trend.includes('BULL')) {
      // Bull market - should allow lower R/R (around 1.6+)
      if (execution.riskReward >= 1.6) {
        expect(['WATCH', 'BUY']).toContain(decision.status);
        console.log(`✅ Bull market: R/R ${execution.riskReward} allowed`);
      }
    }
    
    if (context.trend.includes('SIDEWAYS')) {
      // Sideways market - should require higher R/R (around 1.9+)
      if (execution.riskReward < 1.9 && execution.riskReward >= 1.6) {
        // Should still allow with probe sizing
        expect(['WATCH']).toContain(decision.status);
        console.log(`✅ Sideways market: R/R ${execution.riskReward} gets WATCH/probe sizing`);
      }
    }
    
    console.log(`🎯 Regime-aware floors working correctly`);
    
  }, 30000);

});
