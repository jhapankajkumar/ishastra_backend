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
const ACTIVE_CONFIG = 'SELECTIVE';  // Switched back from ULTRA_SELECTIVE - better for current market

const THRESHOLD_CONFIGS = {
  
  // 🔥 ULTRA-SELECTIVE: Maximum discipline (0 signals from 25 stocks)
  ULTRA_SELECTIVE: {
    name: 'Ultra-Selective',
    description: 'Maximum discipline, minimal signals',
    
    minervini_template_advanced: {
      // Criteria thresholds
      criterion6_relative_strength: 75,     // Was 50 (relaxed), now 75 (ultra-elite)
      criterion7_volume_multiplier: 1.8,    // Was 1.1 (relaxed), now 1.8 (exceptional)
      criterion8_fundamental_score: 70,     // Was 40 (relaxed), now 70 (top-tier)
      
      // Decision thresholds
      buy_min_score: 0.80,                  // 80%+ required for BUY
      watch_min_score: 0.60,                // 60%+ required for WATCH
      
      // Grade boundaries
      grade_A_plus: 0.85,                   // 85%+ = A+
      grade_A: 0.80,                        // 80%+ = A
      grade_B_plus: 0.70,                   // 70%+ = B+
      grade_B: 0.60,                        // 60%+ = B
      grade_C: 0.50,                        // 50%+ = C
      
      // Only A+ and A grades can BUY
      buy_allowed_grades: ['A+', 'A']
    },
    
    institutional_momentum_cascade: {
      // Rule thresholds
      weekly_momentum_threshold: 12.0,      // Was 4.0 (relaxed), now 12.0 (explosive)
      accumulation_ratio_threshold: 0.75,   // Was 0.55 (relaxed), now 0.75 (heavy)
      correlation_threshold: 0.5,           // Was 0.2 (relaxed), now 0.5 (strong)
      win_ratio_threshold: 0.75,            // Was 0.5 (relaxed), now 0.75 (consistent)
      
      // Decision thresholds
      buy_min_score: 0.80,                  // 80%+ required for BUY
      watch_min_score: 0.60,                // 60%+ required for WATCH
      
      // Cascade boundaries
      cascade_A_plus: 0.85,                 // 85%+ = A+
      cascade_A: 0.80,                      // 80%+ = A
      cascade_B_plus: 0.70,                 // 70%+ = B+
      cascade_B: 0.60,                      // 60%+ = B
      cascade_C: 0.50,                      // 50%+ = C
      
      // Only A+ and A cascades can BUY
      buy_allowed_cascades: ['A+', 'A']
    }
  },
  
  // 📊 SELECTIVE: Balanced approach (target: 5-15 signals from 25 stocks)
  SELECTIVE: {
    name: 'Selective',
    description: 'Balanced approach, moderate signals',
    
    minervini_template_advanced: {
      // Slightly relaxed from ultra-selective
      criterion6_relative_strength: 65,     // Relaxed from 75 to 65
      criterion7_volume_multiplier: 1.5,    // Relaxed from 1.8 to 1.5
      criterion8_fundamental_score: 60,     // Relaxed from 70 to 60
      
      // More permissive decision thresholds
      buy_min_score: 0.70,                  // 70%+ required for BUY
      watch_min_score: 0.50,                // 50%+ required for WATCH
      
      // Grade boundaries
      grade_A_plus: 0.80,                   // 80%+ = A+
      grade_A: 0.70,                        // 70%+ = A
      grade_B_plus: 0.60,                   // 60%+ = B+
      grade_B: 0.50,                        // 50%+ = B
      grade_C: 0.40,                        // 40%+ = C
      
      // A+, A, and B+ grades can BUY
      buy_allowed_grades: ['A+', 'A', 'B+']
    },
    
    institutional_momentum_cascade: {
      // Moderately relaxed thresholds
      weekly_momentum_threshold: 8.0,       // Relaxed from 12.0 to 8.0
      accumulation_ratio_threshold: 0.65,   // Relaxed from 0.75 to 0.65
      correlation_threshold: 0.35,          // Relaxed from 0.5 to 0.35
      win_ratio_threshold: 0.65,            // Relaxed from 0.75 to 0.65
      
      // More permissive decision thresholds
      buy_min_score: 0.70,                  // 70%+ required for BUY
      watch_min_score: 0.50,                // 50%+ required for WATCH
      
      // Cascade boundaries
      cascade_A_plus: 0.80,                 // 80%+ = A+
      cascade_A: 0.70,                      // 70%+ = A
      cascade_B_plus: 0.60,                 // 60%+ = B+
      cascade_B: 0.50,                      // 50%+ = B
      cascade_C: 0.40,                      // 40%+ = C
      
      // A+, A, and B+ cascades can BUY
      buy_allowed_cascades: ['A+', 'A', 'B+']
    }
  },
  
  // 🌊 RELAXED: More opportunities (target: 15-25 signals from 25 stocks)
  RELAXED: {
    name: 'Relaxed',
    description: 'More opportunities, higher signal count',
    
    minervini_template_advanced: {
      // Original relaxed thresholds
      criterion6_relative_strength: 50,     // Original relaxed value
      criterion7_volume_multiplier: 1.1,    // Original relaxed value
      criterion8_fundamental_score: 40,     // Original relaxed value
      
      // Permissive decision thresholds
      buy_min_score: 0.60,                  // 60%+ required for BUY
      watch_min_score: 0.40,                // 40%+ required for WATCH
      
      // Grade boundaries
      grade_A_plus: 0.75,                   // 75%+ = A+
      grade_A: 0.65,                        // 65%+ = A
      grade_B_plus: 0.55,                   // 55%+ = B+
      grade_B: 0.45,                        // 45%+ = B
      grade_C: 0.35,                        // 35%+ = C
      
      // A+, A, B+, and B grades can BUY
      buy_allowed_grades: ['A+', 'A', 'B+', 'B']
    },
    
    institutional_momentum_cascade: {
      // Original relaxed thresholds
      weekly_momentum_threshold: 4.0,       // Original relaxed value
      accumulation_ratio_threshold: 0.55,   // Original relaxed value
      correlation_threshold: 0.2,           // Original relaxed value
      win_ratio_threshold: 0.5,             // Original relaxed value
      
      // Permissive decision thresholds
      buy_min_score: 0.60,                  // 60%+ required for BUY
      watch_min_score: 0.40,                // 40%+ required for WATCH
      
      // Cascade boundaries
      cascade_A_plus: 0.75,                 // 75%+ = A+
      cascade_A: 0.65,                      // 65%+ = A
      cascade_B_plus: 0.55,                 // 55%+ = B+
      cascade_B: 0.45,                      // 45%+ = B
      cascade_C: 0.35,                      // 35%+ = C
      
      // A+, A, B+, and B cascades can BUY
      buy_allowed_cascades: ['A+', 'A', 'B+', 'B']
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
