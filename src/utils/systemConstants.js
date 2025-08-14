/**
 * Trading System Constants
 * Canonical system identifiers and aliases for consistency across the application
 */

const SYSTEM_IDS = {
  TRIPLE_SCREEN: 'triple_screen',
  MINERVINI_SEPA: 'sepa_method',
  CAN_SLIM_CUP_HANDLE: 'cup_handle',
  BB_SQUEEZE_BREAKOUT: 'bb_squeeze_breakout',
  KELTNER_BREAKOUT: 'keltner_breakout',
  DARVAS_BREAKOUT: 'darvas_breakout',
  DONCHIAN_BREAKOUT: 'donchian_breakout',
  RSI_MEAN_REVERSION: 'rsi_mean',
  MACD_DIVERGENCE: 'divergence',
  ELDER_IMPULSE: 'impulse',
};

/**
 * Normalize system key aliases to canonical IDs
 * @param {string} key - Raw system identifier 
 * @returns {string} Canonical system ID
 */
function normalizeSystemKey(key) {
  const normalized = (key || '').toLowerCase().replace(/[_-]/g, '');
  
  // Triple Screen aliases (check both with and without underscore removal)
  if (['triplescreen', 'triplescreen', 'eldertriple', 'eldertriplescreen', 'elder_triple_screen'].includes(normalized) ||
      key === 'elder_triple_screen') {
    return SYSTEM_IDS.TRIPLE_SCREEN;
  }
  
  // SEPA aliases (check both with and without underscore removal) 
  if (['sepa', 'sepamethod', 'sepamethod', 'minervini', 'minervnisepa', 'sepa_method'].includes(normalized) ||
      key === 'sepa_method') {
    return SYSTEM_IDS.MINERVINI_SEPA;
  }
  
  // Bollinger Squeeze aliases
  if (['bollinger_squeeze', 'bb_squeeze', 'bb_squeeze_breakout', 'bollingersqueeze', 'squeeze'].includes(normalized)) {
    return SYSTEM_IDS.BB_SQUEEZE_BREAKOUT;
  }
  
  // Darvas aliases
  if (['darvas', 'darvas_breakout', 'darvasbreakout', 'darvasbox'].includes(normalized)) {
    return SYSTEM_IDS.DARVAS_BREAKOUT;
  }
  
  // Donchian aliases
  if (['donchian', 'donchian_breakout', 'donchianbreakout', 'turtle', 'turtletrading'].includes(normalized)) {
    return SYSTEM_IDS.DONCHIAN_BREAKOUT;
  }
  
  // RSI Mean Reversion aliases
  if (['rsi_mean', 'rsi_mean_reversion', 'mean_reversion', 'rsimean', 'meanreversion'].includes(normalized)) {
    return SYSTEM_IDS.RSI_MEAN_REVERSION;
  }
  
  // Divergence aliases
  // MACD Divergence aliases
  if (['divergence', 'macd_divergence', 'macddivergence', 'bull_bear_divergence', 'bullbeardivergence'].includes(normalized)) {
    return SYSTEM_IDS.MACD_DIVERGENCE;
  }
  
  // Keltner aliases
  if (['keltner', 'keltner_breakout', 'keltnerbreakout', 'kc'].includes(normalized)) {
    return SYSTEM_IDS.KELTNER_BREAKOUT;
  }
  
  // Elder Impulse aliases
  if (['impulse', 'elder_impulse', 'elderimpulse', 'impulse_system'].includes(normalized)) {
    return SYSTEM_IDS.ELDER_IMPULSE;
  }
  
  // CAN SLIM aliases
  if (['cup_handle', 'can_slim_cup_handle', 'canslim', 'cuphandle', 'cup_and_handle'].includes(normalized)) {
    return SYSTEM_IDS.CAN_SLIM_CUP_HANDLE;
  }
  
  // Return original if no match found
  return key;
}

/**
 * Check if a system requires weekly data
 * @param {string} systemId - System identifier
 * @returns {boolean} Whether weekly data is required
 */
function requiresWeeklyData(systemId) {
  return systemId === SYSTEM_IDS.TRIPLE_SCREEN;
}

/**
 * Check if a system requires intraday data
 * @param {string} systemId - System identifier  
 * @returns {boolean} Whether intraday data is required
 */
function requiresIntradayData(systemId) {
  return systemId === SYSTEM_IDS.TRIPLE_SCREEN;
}

/**
 * Get data requirements for a system
 * @param {string} systemId - System identifier
 * @returns {Object} Data requirements
 */
function getSystemRequirements(systemId) {
  return {
    needsWeekly: requiresWeeklyData(systemId),
    needsIntraday: requiresIntradayData(systemId),
    allowsDailyOnly: !requiresWeeklyData(systemId)
  };
}
const defaultLookBackPeriod = "2y"; // Use string format for consistency with API requests

module.exports = {
  SYSTEM_IDS,
  normalizeSystemKey,
  requiresWeeklyData,
  requiresIntradayData,
  getSystemRequirements,
  defaultLookBackPeriod
};
