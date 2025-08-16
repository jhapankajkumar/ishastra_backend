/**
 * Test Contextual Risk-Reward Implementation  
 * Validates the new expectancy-based gating system
 */

// Import the AI trade controller directly for unit testing
const tradeController = require('../../src/controllers/ai/stock.expert.controller');
const { 
  applyContextualRiskRewardGating,
  calculateBayesianWinRate,
  calculateExpectancy,
  getContextualRRFloor 
} = tradeController;

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
      
      //console.log(`🎯 Mock Yahoo Finance: Generated ${data.length} data points`);
      return Promise.resolve(data);
    })
  }
}));

describe('Contextual Risk-Reward Implementation', () => {
  
  test('Expectancy calculation works correctly', () => {
    // Test basic expectancy formula: EV = p(win) * R - (1 - p(win))
    
    // Good setup: R/R=1.88, p(win)=0.62
    const expectancy1 = calculateExpectancy(1.88, 0.62);
    expect(expectancy1).toBeCloseTo(0.7856, 3); // 0.62*1.88 - 0.38 = 1.1656 - 0.38 = 0.7856
    expect(expectancy1).toBeGreaterThan(0); // Positive expectancy
    
    // Marginal setup: R/R=1.5, p(win)=0.45
    const expectancy2 = calculateExpectancy(1.5, 0.45);
    expect(expectancy2).toBeCloseTo(0.125, 3); // 0.45*1.5 - 0.55 = 0.675 - 0.55 = 0.125
    expect(expectancy2).toBeGreaterThan(0); // Positive expectancy
    
    // Break-even: R/R=2.0, p(win)=0.5
    const expectancy3 = calculateExpectancy(2.0, 0.5);
    expect(expectancy3).toBeCloseTo(0.5, 3); // 0.5*2.0 - 0.5 = 1.0 - 0.5 = 0.5
    
    //console.log('✅ Expectancy calculations working correctly');
  });
  
  test('Contextual R/R floors adapt to market regime', () => {
    // Test that floors change based on regime and grade
    
    // Bull market with A-grade setup should have lower floor  
    const bullFloorA = getContextualRRFloor('BULL', 'UPTREND', 'A');
    expect(bullFloorA.value).toBeLessThan(1.8); // Should be around 1.5-1.6
    expect(bullFloorA.regime).toBe('BULL');
    
    // Bear market should have higher floor
    const bearFloorA = getContextualRRFloor('BEAR', 'DOWNTREND', 'A');
    expect(bearFloorA.value).toBeGreaterThan(2.0); // Should be around 2.1-2.2
    expect(bearFloorA.regime).toBe('BEAR');
    
    // Sideways market - middle ground
    const sidewaysFloorA = getContextualRRFloor('SIDEWAYS', 'SIDEWAYS', 'A');
    expect(sidewaysFloorA.value).toBeGreaterThan(1.7);
    expect(sidewaysFloorA.value).toBeLessThan(2.0);
    expect(sidewaysFloorA.regime).toBe('SIDEWAYS');
    
    // Poor grade should increase floor across all regimes
    const bullFloorD = getContextualRRFloor('BULL', 'UPTREND', 'D');
    expect(bullFloorD.value).toBeGreaterThan(bullFloorA.value);
    
    //console.log('✅ Contextual R/R floors working correctly');
    //console.log(`   Bull/A: ${bullFloorA.value}, Bear/A: ${bearFloorA.value}, Sideways/A: ${sidewaysFloorA.value}`);
    //console.log(`   Bull/D: ${bullFloorD.value} (higher than Bull/A: ${bullFloorA.value})`);
  });
  
  test('Contextual gating allows WATCH for moderate R/R with positive expectancy', () => {
    // This is the core test case: R/R=1.65, positive expectancy should get WATCH not BLOCK
    
    const mockRiskReward = { riskReward: 1.65 }; // Below SIDEWAYS floor of ~1.8 but above compensated floor
    const mockRegime = { regime: 'SIDEWAYS' };
    const mockSignalQuality = { grade: 'B+', confidence: 0.75 };
    const mockTrendAnalysis = { trendState: 'SIDEWAYS' };
    
    const result = applyContextualRiskRewardGating(
      mockRiskReward, 
      mockRegime, 
      mockSignalQuality, 
      mockTrendAnalysis
    );
    
    expect(result.gateResult).toBe('WATCH'); // Should be WATCH, not BLOCK
    expect(result.expectancy).toBeGreaterThan(0); // Should have positive expectancy
    expect(result.rrQuality).not.toBe('POOR'); // Should not be considered poor quality
    
    //console.log('✅ Core test case passed:');
    //console.log(`   R/R: ${mockRiskReward.riskReward}`);
    //console.log(`   Result: ${result.gateResult} (expected: WATCH)`);
    //console.log(`   Expectancy: ${result.expectancy.toFixed(3)} (positive)`);
    //console.log(`   Reason: ${result.reason}`);
  });
  
  test('System blocks truly poor setups with negative expectancy', () => {
    // Very poor R/R should still get blocked
    
    const mockRiskReward = { riskReward: 1.2 }; // Below 1.4 minimum
    const mockRegime = { regime: 'BEAR' };
    const mockSignalQuality = { grade: 'D', confidence: 0.35 };
    const mockTrendAnalysis = { trendState: 'DOWNTREND' };
    
    const result = applyContextualRiskRewardGating(
      mockRiskReward,
      mockRegime,
      mockSignalQuality, 
      mockTrendAnalysis
    );
    
    expect(result.gateResult).toBe('BLOCK'); // Should be blocked
    expect(result.rrQuality).toBe('POOR'); // Should be marked as poor
    
    // Test negative expectancy scenario
    const mockRiskReward2 = { riskReward: 1.6 };
    const mockSignalQuality2 = { grade: 'F', confidence: 0.25 }; // Very low win rate
    
    const result2 = applyContextualRiskRewardGating(
      mockRiskReward2,
      mockRegime,
      mockSignalQuality2,
      mockTrendAnalysis
    );
    
    // Should block due to negative expectancy even with decent R/R
    expect(result2.expectancy).toBeLessThanOrEqual(0);
    
    //console.log('✅ Poor setups correctly blocked:');
    //console.log(`   Very low R/R: ${result.gateResult}`);
    //console.log(`   Negative expectancy: EV=${result2.expectancy.toFixed(3)}`);
  });

});
