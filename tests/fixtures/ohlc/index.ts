/**
 * OHLC Fixtures Index
 * 
 * Centralized exports for all OHLC fixtures and utilities
 */

export { 
  buildTechnicalFromOHLC,
  loadFixture,
  createMockTechnicalData,
  type OHLCBar,
  type FixtureData,
  type TechnicalIndicators
} from './buildTechnicalFromOHLC';

// Example usage functions (implement these in your test files)
// See README.md for usage examples

// Fixture names for easy reference
export const FIXTURE_NAMES = {
  UPTREND_HIGH_VOL: 'uptrend_highvol',
  PULLBACK_WEAK_MOM: 'pullback_weakmom',
  DOWNTREND_BELOW_200: 'downtrend_below200',
  SIDEWAYS_CHOP: 'sideways_chop',
  PRE_EARNINGS: 'pre_earnings',
  HIGH_VOLATILITY: 'high_volatility',
  BEAR_REGIME: 'bear_regime',
  BULL_REGIME: 'bull_regime'
} as const;

// Scenario descriptions
export const SCENARIOS = {
  [FIXTURE_NAMES.UPTREND_HIGH_VOL]: 'Strong uptrend with high volume confirmation - price well above 200EMA',
  [FIXTURE_NAMES.PULLBACK_WEAK_MOM]: 'Pullback in uptrend with weakening momentum - RSI declining but not oversold',
  [FIXTURE_NAMES.DOWNTREND_BELOW_200]: 'Strong downtrend trading below 200EMA - consistent selling pressure',
  [FIXTURE_NAMES.SIDEWAYS_CHOP]: 'Sideways choppy market with no clear direction - tight range trading',
  [FIXTURE_NAMES.PRE_EARNINGS]: 'Pre-earnings period with elevated volatility - earnings announcement in 2 days',
  [FIXTURE_NAMES.HIGH_VOLATILITY]: 'High volatility market conditions with extreme price swings',
  [FIXTURE_NAMES.BEAR_REGIME]: 'Strong bear market regime with consistent selling and lower highs',
  [FIXTURE_NAMES.BULL_REGIME]: 'Strong bull market regime with consistent buying and higher highs'
} as const;

/**
 * Quick access function to load any fixture by name
 */
export function getFixture(name: keyof typeof FIXTURE_NAMES): any {
  const fixtureName = FIXTURE_NAMES[name];
  try {
    return require(`./${fixtureName}.json`);
  } catch (error) {
    throw new Error(`Failed to load fixture ${fixtureName}: ${error}`);
  }
}

export default {
  FIXTURE_NAMES,
  SCENARIOS,
  getFixture
};
