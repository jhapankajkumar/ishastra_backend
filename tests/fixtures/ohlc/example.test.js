/**
 * Example test demonstrating OHLC fixture usage
 * 
 * Run with: npx jest tests/fixtures/ohlc/example.test.js
 */

const { buildTechnicalFromOHLC } = require('./buildTechnicalFromOHLC');
const uptrendFixture = require('./uptrend_highvol.json');
const downtrendFixture = require('./downtrend_below200.json');
const bearRegimeFixture = require('./bear_regime.json');

describe('OHLC Fixtures and Technical Indicators', () => {
  
  test('should load uptrend fixture and calculate indicators', () => {
    const technical = buildTechnicalFromOHLC(uptrendFixture);
    
    // Verify fixture loaded correctly
    expect(uptrendFixture.meta.scenario).toContain('uptrend');
    expect(uptrendFixture.data.length).toBeGreaterThan(70);
    
    // Verify technical indicators calculated
    expect(technical.latest.price).toBeGreaterThan(300); // Strong uptrend
    expect(technical.latest.price).toBeGreaterThan(technical.latest.ema200); // Above 200EMA
    expect(technical.latest.rsi).toBeGreaterThan(50); // Bullish momentum
    expect(technical.ema200).toHaveLength(uptrendFixture.data.length);
  });
  
  test('should load downtrend fixture with bearish characteristics', () => {
    const technical = buildTechnicalFromOHLC(downtrendFixture);
    
    // Verify bearish scenario
    expect(downtrendFixture.meta.scenario).toContain('downtrend');
    expect(technical.latest.price).toBeLessThan(technical.latest.ema200); // Below 200EMA
    expect(technical.latest.price).toBeLessThan(100); // Strong decline
  });
  
  test('should handle bear regime with consistent selling', () => {
    const technical = buildTechnicalFromOHLC(bearRegimeFixture);
    
    // Bear regime characteristics
    expect(bearRegimeFixture.meta.scenario).toContain('bear');
    expect(technical.latest.price).toBeLessThan(technical.latest.ema200);
    expect(technical.latest.rsi).toBeLessThan(50); // Bearish momentum
  });
  
  test('should calculate all required technical indicators', () => {
    const technical = buildTechnicalFromOHLC(uptrendFixture);
    
    // Verify all indicators are present
    expect(technical.ema200).toBeDefined();
    expect(technical.sma50).toBeDefined();
    expect(technical.sma20).toBeDefined();
    expect(technical.rsi14).toBeDefined();
    expect(technical.atr14).toBeDefined();
    expect(technical.adx14).toBeDefined();
    expect(technical.vol20dma).toBeDefined();
    expect(technical.macd).toBeDefined();
    expect(technical.bollingerBands).toBeDefined();
    expect(technical.support).toBeDefined();
    expect(technical.resistance).toBeDefined();
    
    // Verify latest values
    expect(typeof technical.latest.price).toBe('number');
    expect(typeof technical.latest.ema200).toBe('number');
    expect(typeof technical.latest.rsi).toBe('number');
    expect(typeof technical.latest.atr).toBe('number');
    expect(typeof technical.latest.adx).toBe('number');
  });
  
  test('should provide realistic technical values', () => {
    const technical = buildTechnicalFromOHLC(uptrendFixture);
    
    // RSI should be within valid range
    expect(technical.latest.rsi).toBeGreaterThanOrEqual(0);
    expect(technical.latest.rsi).toBeLessThanOrEqual(100);
    
    // ATR should be positive
    expect(technical.latest.atr).toBeGreaterThan(0);
    
    // ADX should be within valid range
    expect(technical.latest.adx).toBeGreaterThanOrEqual(0);
    expect(technical.latest.adx).toBeLessThanOrEqual(100);
    
    // Support should be below current price
    expect(technical.latest.support).toBeLessThan(technical.latest.price);
    
    // Resistance should be above current price
    expect(technical.latest.resistance).toBeGreaterThan(technical.latest.price);
  });
  
  describe('Scenario-specific validations', () => {
    
    test('uptrend should have bullish characteristics', () => {
      const technical = buildTechnicalFromOHLC(uptrendFixture);
      
      expect(technical.latest.price).toBeGreaterThan(technical.latest.ema200);
      expect(technical.latest.rsi).toBeGreaterThan(45); // Generally bullish
    });
    
    test('downtrend should have bearish characteristics', () => {
      const technical = buildTechnicalFromOHLC(downtrendFixture);
      
      expect(technical.latest.price).toBeLessThan(technical.latest.ema200);
      expect(technical.latest.rsi).toBeLessThan(55); // Generally bearish
    });
    
    test('all fixtures should have consistent data structure', () => {
      const fixtures = [
        uptrendFixture,
        downtrendFixture,
        bearRegimeFixture
      ];
      
      fixtures.forEach(fixture => {
        expect(fixture.meta).toBeDefined();
        expect(fixture.meta.scenario).toBeDefined();
        expect(fixture.meta.symbol).toBe('TEST');
        expect(fixture.meta.period).toBe('1d');
        expect(fixture.data).toBeInstanceOf(Array);
        expect(fixture.data.length).toBeGreaterThan(50);
        
        // Verify OHLC structure
        fixture.data.forEach(bar => {
          expect(bar).toHaveProperty('t');
          expect(bar).toHaveProperty('o');
          expect(bar).toHaveProperty('h');
          expect(bar).toHaveProperty('l');
          expect(bar).toHaveProperty('c');
          expect(bar).toHaveProperty('v');
          
          // Basic price validation
          expect(bar.h).toBeGreaterThanOrEqual(bar.l);
          expect(bar.h).toBeGreaterThanOrEqual(bar.o);
          expect(bar.h).toBeGreaterThanOrEqual(bar.c);
          expect(bar.l).toBeLessThanOrEqual(bar.o);
          expect(bar.l).toBeLessThanOrEqual(bar.c);
        });
      });
    });
  });
});

module.exports = {
  // Export for use in other test files
  testFixtures: {
    uptrendFixture,
    downtrendFixture,
    bearRegimeFixture
  }
};
