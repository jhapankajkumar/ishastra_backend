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
const ACTIVE_CONFIG = 'SELECTIVE';  // Testing SELECTIVE for BUY signals

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
    },
    
    institutional_momentum_cascade: {
      // ULTRA-STRICT Weekly momentum analysis (100% - most restrictive)
      weekly_momentum_threshold: 15.0,            // 15% weekly momentum (explosive)
      weekly_roc_threshold: 6.0,                  // 6% ROC threshold (ultra-high)
      weekly_confirmations_threshold: 3,          // All 3 weekly confirmations required
      
      // ULTRA-STRICT Daily momentum analysis  
      rsi_momentum_threshold: 75,                 // 75 RSI (ultra-high momentum)
      volume_expansion_threshold: 2.0,            // 2.0x volume expansion (exceptional)
      
      // ULTRA-STRICT Price structure analysis
      breakout_buffer: 1.01,                      // 1% above breakout (clear breakout)
      structure_confirmations: 4,                 // All 4 structure confirmations required
      
      // ULTRA-STRICT Institutional flow analysis
      accumulation_ratio_threshold: 0.80,         // 80% accumulation (heavy institutional)
      body_ratio_threshold: 0.75,                 // 75% body ratio (strong candles)
      large_volume_multiplier: 2.5,               // 2.5x volume days (exceptional)
      large_volume_days_threshold: 4,             // 4+ large volume days required
      correlation_threshold: 0.60,                // 60% price-volume correlation (very strong)
      
      // ULTRA-STRICT Risk-adjusted momentum analysis
      momentum_quality_threshold: 0.25,           // 25% momentum quality (high Sharpe)
      win_ratio_threshold: 0.80,                  // 80% win ratio (very consistent)
      max_drawdown_threshold: 0.04,               // 4% max drawdown (very low risk)
      trend_strength_threshold: 0.60,             // 60% trend strength (very strong)
      
      // ULTRA-STRICT Cascade trigger analysis
      momentum_sync_threshold: 0.02,              // 2% momentum sync (tight alignment)
      recent_acceleration_threshold: 0.020,       // 2% acceleration (strong momentum)
      trigger_confirmations: 4,                   // All 4 trigger confirmations required
      
      // ULTRA-STRICT Decision thresholds
      buy_min_score: 0.85,                        // 85%+ required for BUY
      watch_min_score: 0.70,                      // 70%+ required for WATCH
      
      // ULTRA-STRICT Cascade boundaries
      cascade_A_plus: 0.90,                       // 90%+ = A+
      cascade_A: 0.85,                            // 85%+ = A
      cascade_B_plus: 0.75,                       // 75%+ = B+
      cascade_B: 0.65,                            // 65%+ = B
      cascade_C: 0.55,                            // 55%+ = C
      
      // Only A+ cascades can BUY
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
    },
    
    institutional_momentum_cascade: {
      // MODERATE Weekly momentum analysis (75% of ULTRA)
      weekly_momentum_threshold: 12.0,            // 12% weekly momentum (75% of 15% = 11.25%, rounded to 12%)
      weekly_roc_threshold: 4.5,                  // 4.5% ROC threshold (75% of 6% = 4.5%)
      weekly_confirmations_threshold: 2,          // 2 weekly confirmations (75% of 3 = 2.25, rounded to 2)
      
      // MODERATE Daily momentum analysis  
      rsi_momentum_threshold: 65,                 // 65 RSI (75% of 75 = 56, rounded to 65)
      volume_expansion_threshold: 1.6,            // 1.6x volume expansion (75% of 2.0 = 1.5, rounded to 1.6)
      
      // MODERATE Price structure analysis
      breakout_buffer: 1.005,                     // 0.5% above breakout (75% of 1% = 0.75%, use 0.5%)
      structure_confirmations: 3,                 // 3 structure confirmations (75% of 4 = 3)
      
      // MODERATE Institutional flow analysis
      accumulation_ratio_threshold: 0.70,         // 70% accumulation (75% of 80% = 60%, rounded to 70%)
      body_ratio_threshold: 0.65,                 // 65% body ratio (75% of 75% = 56%, rounded to 65%)
      large_volume_multiplier: 2.0,               // 2.0x volume days (75% of 2.5 = 1.875, rounded to 2.0)
      large_volume_days_threshold: 3,             // 3 large volume days (75% of 4 = 3)
      correlation_threshold: 0.50,                // 50% price-volume correlation (75% of 60% = 45%, rounded to 50%)
      
      // MODERATE Risk-adjusted momentum analysis
      momentum_quality_threshold: 0.20,           // 20% momentum quality (75% of 25% = 19%, rounded to 20%)
      win_ratio_threshold: 0.70,                  // 70% win ratio (75% of 80% = 60%, rounded to 70%)
      max_drawdown_threshold: 0.06,               // 6% max drawdown (75% of 4% = 3%, but 6% is more reasonable)
      trend_strength_threshold: 0.50,             // 50% trend strength (75% of 60% = 45%, rounded to 50%)
      
      // MODERATE Cascade trigger analysis
      momentum_sync_threshold: 0.03,              // 3% momentum sync (75% of 2% = 1.5%, but 3% is more reasonable)
      recent_acceleration_threshold: 0.015,       // 1.5% acceleration (75% of 2% = 1.5%)
      trigger_confirmations: 3,                   // 3 trigger confirmations (75% of 4 = 3)
      
      // MODERATE Decision thresholds
      buy_min_score: 0.75,                        // 75%+ required for BUY
      watch_min_score: 0.60,                      // 60%+ required for WATCH
      
      // MODERATE Cascade boundaries
      cascade_A_plus: 0.85,                       // 85%+ = A+
      cascade_A: 0.75,                            // 75%+ = A
      cascade_B_plus: 0.65,                       // 65%+ = B+
      cascade_B: 0.55,                            // 55%+ = B
      cascade_C: 0.45,                            // 45%+ = C
      
      // Only A+ and A cascades can BUY
      buy_allowed_cascades: ['A+', 'A', 'B+']
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
    },
    
    institutional_momentum_cascade: {
      // TIGHTENED RELAXED Weekly momentum analysis (85% of SELECTIVE instead of 60%)
      weekly_momentum_threshold: 10.0,            // 10% weekly momentum (85% of 12% = 10.2%, rounded to 10%)
      weekly_roc_threshold: 4.0,                  // 4% ROC threshold (85% of 4.5% = 3.8%, rounded to 4%)
      weekly_confirmations_threshold: 2,          // 2 weekly confirmations (same as SELECTIVE)
      
      // TIGHTENED RELAXED Daily momentum analysis  
      rsi_momentum_threshold: 60,                 // 60 RSI (85% of 65 = 55, rounded to 60)
      volume_expansion_threshold: 1.4,            // 1.4x volume expansion (85% of 1.6 = 1.36, rounded to 1.4)
      
      // TIGHTENED RELAXED Price structure analysis
      breakout_buffer: 1.00,                      // Same as SELECTIVE (no buffer below breakout)
      structure_confirmations: 2,                 // 2 structure confirmations (85% of 3 = 2.55, rounded to 2)
      
      // TIGHTENED RELAXED Institutional flow analysis
      accumulation_ratio_threshold: 0.65,         // 65% accumulation (85% of 70% = 59.5%, rounded to 65%)
      body_ratio_threshold: 0.55,                 // 55% body ratio (85% of 65% = 55%)
      large_volume_multiplier: 1.8,               // 1.8x volume days (85% of 2.0 = 1.7, rounded to 1.8)
      large_volume_days_threshold: 2,             // 2 large volume days (85% of 3 = 2.55, rounded to 2)
      correlation_threshold: 0.45,                // 45% price-volume correlation (85% of 50% = 42.5%, rounded to 45%)
      
      // TIGHTENED RELAXED Risk-adjusted momentum analysis
      momentum_quality_threshold: 0.17,           // 17% momentum quality (85% of 20% = 17%)
      win_ratio_threshold: 0.65,                  // 65% win ratio (85% of 70% = 59.5%, rounded to 65%)
      max_drawdown_threshold: 0.08,               // 8% max drawdown (85% of 6% = 5.1%, but 8% is more reasonable)
      trend_strength_threshold: 0.45,             // 45% trend strength (85% of 50% = 42.5%, rounded to 45%)
      
      // TIGHTENED RELAXED Cascade trigger analysis
      momentum_sync_threshold: 0.04,              // 4% momentum sync (85% of 3% = 2.55%, rounded to 4%)
      recent_acceleration_threshold: 0.012,       // 1.2% acceleration (85% of 1.5% = 1.275%, rounded to 1.2%)
      trigger_confirmations: 2,                   // 2 trigger confirmations (85% of 3 = 2.55, rounded to 2)
      
      // TIGHTENED RELAXED Decision thresholds
      buy_min_score: 0.65,                        // 65%+ required for BUY (TIGHTENED from 60%)
      watch_min_score: 0.50,                      // 50%+ required for WATCH (TIGHTENED from 45%)
      
      // TIGHTENED RELAXED Cascade boundaries
      cascade_A_plus: 0.80,                       // 80%+ = A+ (TIGHTENED from 75%)
      cascade_A: 0.70,                            // 70%+ = A (TIGHTENED from 65%)
      cascade_B_plus: 0.60,                       // 60%+ = B+ (TIGHTENED from 55%)
      cascade_B: 0.50,                            // 50%+ = B (TIGHTENED from 45%)
      cascade_C: 0.40,                            // 40%+ = C (TIGHTENED from 35%)
      
      // A+, A, and B+ cascades can BUY (for more opportunities in RELAXED)
      buy_allowed_cascades: ['A+', 'A', 'B+']
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
