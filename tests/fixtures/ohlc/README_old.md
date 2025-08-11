/**
 * Example usage of OHLC fixtures and buildTechnicalFromOHLC helper
 * 
 * This file demonstrates how to use the fixture data and technical indicator builder
 * in your tests or development scenarios.
 */

import { buildTechnicalFromOHLC, FixtureData, TechnicalIndicators } from './buildTechnicalFromOHLC';

// Example: Loading and processing fixture data
export function loadAndProcessFixture(fixtureName: string): TechnicalIndicators {
  // Load fixture data (in actual tests, use require() or import)
  const fixtureData: FixtureData = require(`./${fixtureName}.json`);
  
  // Build technical indicators
  const technical = buildTechnicalFromOHLC(fixtureData);
  
  console.log(`📊 Processed ${fixtureName}:`);
  console.log(`   Scenario: ${fixtureData.meta.scenario}`);
  console.log(`   Bars: ${fixtureData.data.length}`);
  console.log(`   Latest Price: $${technical.latest.price.toFixed(2)}`);
  console.log(`   200 EMA: $${technical.latest.ema200.toFixed(2)}`);
  console.log(`   RSI: ${technical.latest.rsi.toFixed(1)}`);
  console.log(`   ATR: ${technical.latest.atr.toFixed(2)}`);
  console.log(`   ADX: ${technical.latest.adx.toFixed(1)}`);
  
  return technical;
}

// Example: Test scenario validation
export function validateScenario(fixtureName: string, expectedConditions: any) {
  const technical = loadAndProcessFixture(fixtureName);
  const results = {
    aboveEMA200: technical.latest.price > technical.latest.ema200,
    rsiOverbought: technical.latest.rsi > 70,
    rsiOversold: technical.latest.rsi < 30,
    highVolatility: technical.latest.atr > 5.0,
    strongTrend: technical.latest.adx > 25,
    scenario: fixtureName
  };
  
  console.log(`✅ Validation for ${fixtureName}:`, results);
  return results;
}

// Example usage in tests:
export const exampleUsage = {
  // Test uptrend scenario
  uptrendTest: () => {
    const uptrend = loadAndProcessFixture('uptrend_highvol');
    return uptrend.latest.price > uptrend.latest.ema200; // Should be true
  },
  
  // Test downtrend scenario  
  downtrendTest: () => {
    const downtrend = loadAndProcessFixture('downtrend_below200');
    return downtrend.latest.price < downtrend.latest.ema200; // Should be true
  },
  
  // Test high volatility scenario
  volatilityTest: () => {
    const highVol = loadAndProcessFixture('high_volatility');
    return highVol.latest.atr > 5.0; // Should be true
  },
  
  // Test pre-earnings elevated volatility
  preEarningsTest: () => {
    const preEarnings = loadAndProcessFixture('pre_earnings');
    return preEarnings.latest.atr > 3.0; // Should be true
  }
};

/**
 * Available fixtures and their scenarios:
 * 
 * 1. uptrend_highvol.json - Strong uptrend with high volume confirmation
 * 2. pullback_weakmom.json - Pullback in uptrend with weakening momentum  
 * 3. downtrend_below200.json - Strong downtrend trading below 200EMA
 * 4. sideways_chop.json - Sideways choppy market with no clear direction
 * 5. pre_earnings.json - Pre-earnings period with elevated volatility
 * 6. high_volatility.json - High volatility market conditions
 * 7. bear_regime.json - Strong bear market regime
 * 8. bull_regime.json - Strong bull market regime
 */

export default {
  loadAndProcessFixture,
  validateScenario,
  exampleUsage
};
