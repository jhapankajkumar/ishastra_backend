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
const ACTIVE_CONFIG = 'ULTRA_SELECTIVE';  // Testing SELECTIVE for BUY signals

const THRESHOLD_CONFIGS = {
  
  // 🔥 ULTRA-SELECTIVE: Maximum discipline (0 signals from 25 stocks)
  ULTRA_SELECTIVE: {
    name: 'Ultra-Selective',
    description: 'Maximum discipline, minimal signals',
    
    minervini_template_advanced: {
      // ULTRA-STRICT Criteria thresholds (100% - most restrictive)
      criterion4_high_proximity_threshold: 0.25,  // 25% from 52-week high (ultra-strict)
      criterion5_low_distance_threshold: 0.40,    // 40% above 52-week low (ultra-strict)
      criterion6_relative_strength: 80,           // 80 RS (ultra-elite)
      criterion7_volume_multiplier: 2.0,          // 2.0x volume (exceptional)
      criterion8_fundamental_score: 75,           // 75 score (top-tier)
      
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
  
  // 📊 SELECTIVE: Balanced approach (target: 5-15 signals from 25 stocks)
  SELECTIVE: {
    name: 'Selective',
    description: 'Balanced approach, moderate signals',
    
    minervini_template_advanced: {
      // MODERATE Criteria thresholds (75% of ULTRA - balanced)
      criterion4_high_proximity_threshold: 0.20,  // 20% from 52-week high (75% of 15% = relaxed to 20%)
      criterion5_low_distance_threshold: 0.30,    // 30% above 52-week low (75% of 40% = 30%)
      criterion6_relative_strength: 65,           // 65 RS (75% of 80 = 60, rounded to 65)
      criterion7_volume_multiplier: 1.6,          // 1.6x volume (75% of 2.0 = 1.5, rounded to 1.6)
      criterion8_fundamental_score: 60,           // 60 score (75% of 75 = 56, rounded to 60)
      
      // MODERATE Decision thresholds
      buy_min_score: 0.75,                        // 75%+ required for BUY (75% of 85% = 64%, rounded to 75%)
      watch_min_score: 0.60,                      // 60%+ required for WATCH (75% of 70% = 53%, rounded to 60%)
      
      // MODERATE Grade boundaries
      grade_A_plus: 0.85,                         // 85%+ = A+ (75% of 90% = 68%, but keep reasonable at 85%)
      grade_A: 0.75,                              // 75%+ = A (75% of 85% = 64%, rounded to 75%)
      grade_B_plus: 0.65,                         // 65%+ = B+ (75% of 75% = 56%, rounded to 65%)
      grade_B: 0.55,                              // 55%+ = B (75% of 65% = 49%, rounded to 55%)
      grade_C: 0.45,                              // 45%+ = C (75% of 55% = 41%, rounded to 45%)
      
      // A+ and A grades can BUY
      buy_allowed_grades: ['A+', 'A', 'B+']
    }
  },
  
  // 🌊 RELAXED: More opportunities (target: 15-25 signals from 25 stocks)
  RELAXED: {
    name: 'Relaxed',
    description: 'More opportunities, higher signal count',
    
    minervini_template_advanced: {
      // TIGHTENED RELAXED Criteria thresholds (85% of SELECTIVE instead of 60%)
      criterion4_high_proximity_threshold: 0.30,  // 30% from 52-week high (reasonable relaxed value)
      criterion5_low_distance_threshold: 0.25,    // 25% above 52-week low (85% of 30% = 25.5%, rounded to 25%)
      criterion6_relative_strength: 55,           // 55 RS (85% of 65 = 55)
      criterion7_volume_multiplier: 1.4,          // 1.4x volume (85% of 1.6 = 1.36, rounded to 1.4)
      criterion8_fundamental_score: 50,           // 50 score (85% of 60 = 51, rounded to 50)
      
      // TIGHTENED RELAXED Decision thresholds
      buy_min_score: 0.65,                        // 65%+ required for BUY (TIGHTENED from 60%)
      watch_min_score: 0.50,                      // 50%+ required for WATCH (TIGHTENED from 45%)
      
      // TIGHTENED RELAXED Grade boundaries
      grade_A_plus: 0.80,                         // 80%+ = A+ (TIGHTENED from 75%)
      grade_A: 0.70,                              // 70%+ = A (TIGHTENED from 65%)
      grade_B_plus: 0.60,                         // 60%+ = B+ (TIGHTENED from 55%)
      grade_B: 0.50,                              // 50%+ = B (TIGHTENED from 45%)
      grade_C: 0.40,                              // 40%+ = C (TIGHTENED from 35%)
      
      // A+, A, and B+ grades can BUY (for more opportunities in RELAXED)
      buy_allowed_grades: ['A+', 'A', 'B+']
    }
  }
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
