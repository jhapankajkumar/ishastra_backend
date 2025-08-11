/**
 * OHLC Test Fixtures Index
 * 
 * Central import point for all OHLC fixtures and technical indicator helpers
 */

// Import all fixtures
const uptrendHighvol = require('./uptrend_highvol.json');
const pullbackWeekmom = require('./pullback_weakmom.json');
const downtrendBelow200 = require('./downtrend_below200.json');
const sidewaysChop = require('./sideways_chop.json');
const preEarnings = require('./pre_earnings.json');
const highVolatility = require('./high_volatility.json');
const bearRegime = require('./bear_regime.json');
const bullRegime = require('./bull_regime.json');

// Import technical indicator helper
const { 
  buildTechnicalFromOHLC, 
  createMockTechnicalData,
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateATR,
  calculateADX,
  calculateMACD,
  calculateBollingerBands,
  calculateSupportResistance
} = require('./buildTechnicalFromOHLC');

// Fixture collection
const fixtures = {
  uptrendHighvol,
  pullbackWeekmom,
  downtrendBelow200,
  sidewaysChop,
  preEarnings,
  highVolatility,
  bearRegime,
  bullRegime
};

// Helper functions
const helpers = {
  buildTechnicalFromOHLC,
  createMockTechnicalData,
  calculateEMA,
  calculateSMA,
  calculateRSI,
  calculateATR,
  calculateADX,
  calculateMACD,
  calculateBollingerBands,
  calculateSupportResistance
};

/**
 * Get a specific fixture by name
 */
function getFixture(name) {
  return fixtures[name];
}

/**
 * Get all available fixture names
 */
function getFixtureNames() {
  return Object.keys(fixtures);
}

/**
 * Get fixture with calculated technical indicators
 */
function getFixtureWithTechnicals(name) {
  const fixture = fixtures[name];
  if (!fixture) {
    throw new Error(`Fixture '${name}' not found`);
  }
  
  const technicals = buildTechnicalFromOHLC(fixture);
  
  return {
    fixture,
    technicals,
    scenario: fixture.scenario,
    bars: fixture.data.length
  };
}

module.exports = {
  fixtures,
  helpers,
  getFixture,
  getFixtureNames,
  getFixtureWithTechnicals,
  
  // Direct exports for convenience
  uptrendHighvol,
  pullbackWeekmom,
  downtrendBelow200,
  sidewaysChop,
  preEarnings,
  highVolatility,
  bearRegime,
  bullRegime,
  buildTechnicalFromOHLC,
  createMockTechnicalData
};
