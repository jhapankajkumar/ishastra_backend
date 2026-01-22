/**
 * CENTRALIZED TRADING SYSTEM THRESHOLDS
 * ====================================
 * 
 * All threshold configurations for trading systems in one place.
 * Change values here to test different selectivity levels.
 * 
 * SELECTIVITY LEVELS:
 * - ULTRA_SELECTIVE: Maximum discipline, minimal signals
 * - SELECTIVE: Balanced approach, moderate signals  
 * - RELAXED: More opportunities, higher signal count
 */

// Current active configuration
// 🎯 ACTIVE CONFIGURATION - Change this one line to transform the entire system!
const ACTIVE_CONFIG = 'ULTRA_SELECTIVE';  // Testing ULTRA_SELECTIVE for BUY signals

const THRESHOLD_CONFIGS = {
  
  // 🔥 ULTRA-SELECTIVE: Maximum discipline (0 signals from 25 stocks)
  ULTRA_SELECTIVE: {
    name: 'Ultra-Selective',
    description: 'Maximum discipline, minimal signals',
    
    minervini_template_advanced: {
      // ULTRA-STRICT Criteria thresholds (100% - most restrictive)
      high_proximity_threshold: 0.25,  // 25% from 52-week high (ultra-strict)
      low_distance_threshold: 0.40,    // 40% above 52-week low (ultra-strict)
      relative_strength: 80,           // 80 RS (ultra-elite)
      volume_multiplier: 1.6,          // 2.0x volume (exceptional)
      fundamental_score: 75,           // 75 score (top-tier)

      // ULTRA-STRICT Decision thresholds
      buy_min_score: 0.85,                        // 85%+ required for BUY
      watch_min_score: 0.70,                      // 70%+ required for WATCH
      
      // ULTRA-STRICT Grade boundaries
      grade_A_plus: 0.90,                         // 90%+ = A+
      grade_A: 0.85,                              // 85%+ = A
      grade_B_plus: 0.75,                         // 75%+ = B+
      grade_B: 0.65,                              // 65%+ = B
      grade_C: 0.55,                              // 55%+ = C
      
      // Only A+ grades can BUY
      buy_allowed_cascades: ['A+', 'A']
    }
  },
};

/**
 * Get the current active threshold configuration
 */
function getActiveThresholds() {
  const config = THRESHOLD_CONFIGS[ACTIVE_CONFIG];
  if (!config) {
    throw new Error(`Invalid threshold configuration: ${ACTIVE_CONFIG}`);
  }
  
  return {
    ...config,
    activeConfig: ACTIVE_CONFIG
  };
}

/**
 * Get thresholds for a specific system
 */
function getSystemThresholds(systemName) {
  const activeConfig = getActiveThresholds();
  const systemConfig = activeConfig[systemName];
  
  if (!systemConfig) {
    throw new Error(`No threshold configuration found for system: ${systemName}`);
  }
  
  return systemConfig;
}

/**
 * Get all available configuration names
 */
function getAvailableConfigs() {
  return Object.keys(THRESHOLD_CONFIGS);
}

/**
 * Switch to a different configuration (for testing)
 */
function switchConfiguration(configName) {
  if (!THRESHOLD_CONFIGS[configName]) {
    throw new Error(`Configuration not found: ${configName}`);
  }
  
  // Note: This would require file modification in practice
  console.log(`🔄 Would switch to configuration: ${configName}`);
  console.log(`📝 To activate, change ACTIVE_CONFIG to '${configName}' in trading-thresholds.js`);
  
  return THRESHOLD_CONFIGS[configName];
}

module.exports = {
  getActiveThresholds,
  getSystemThresholds,
  getAvailableConfigs,
  switchConfiguration,
  THRESHOLD_CONFIGS
};
