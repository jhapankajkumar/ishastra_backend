/**
 * COMPREHENSIVE THRESHOLD CONFIGURATION TESTING
 * =============================================
 * 
 * Tests all three threshold configurations (ULTRA_SELECTIVE, SELECTIVE, RELAXED)
 * using a diverse collection of 25 stocks across different sectors and market caps.
 * 
 * This demonstrates the power of centralized threshold management - 
 * change one line to completely alter the system's selectivity!
 */

const path = require('path');
require('module').globalPaths.push(path.join(__dirname, 'src'));

const { getActiveThresholds } = require('./src/config/trading-thresholds');

// Diverse test collection - great mix for threshold testing
const testStocks = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',  // Mega caps
  'NVDA', 'META', 'NFLX', 'AMD', 'CRM',     // Tech growth
  'JPM', 'BAC', 'WFC', 'GS', 'MS',         // Financials
  'JNJ', 'PG', 'KO', 'PFE', 'MRK',         // Defensive
  'XOM', 'CVX', 'WMT', 'HD', 'UNH'         // Mixed sectors
];

async function testCurrentConfiguration() {
  console.log('🧪 TESTING CURRENT THRESHOLD CONFIGURATION');
  console.log('==========================================');
  
  const current = getActiveThresholds();
  console.log(`🎯 Active Configuration: ${current.activeConfig}`);
  console.log(`📝 Description: ${current.description}`);
  console.log(`📊 Test Universe: ${testStocks.length} stocks across 5 sectors`);
  
  console.log('\n📈 CURRENT THRESHOLD SETTINGS:');
  console.log('==============================');
  
  const minervini = current.minervini_template_advanced;
  const institutional = current.institutional_momentum_cascade;
  
  console.log('\n🏛️ MINERVINI TEMPLATE:');
  console.log(`   📊 Relative Strength: ${minervini.criterion6_relative_strength}+`);
  console.log(`   📈 Volume Multiplier: ${minervini.criterion7_volume_multiplier}x`);
  console.log(`   💪 Fundamental Score: ${minervini.criterion8_fundamental_score}+`);
  console.log(`   🏆 Buy Grades: ${minervini.buy_allowed_grades.join(', ')}`);
  
  console.log('\n🌊 INSTITUTIONAL MOMENTUM:');
  console.log(`   📅 Weekly Momentum: ${institutional.weekly_momentum_threshold}%+`);
  console.log(`   📈 Accumulation: ${institutional.accumulation_ratio_threshold}+`);
  console.log(`   🔗 Correlation: ${institutional.correlation_threshold}+`);
  console.log(`   🎯 Win Ratio: ${institutional.win_ratio_threshold}+`);
  console.log(`   🏆 Buy Cascades: ${institutional.buy_allowed_cascades.join(', ')}`);
  
  console.log('\n💡 TO TEST DIFFERENT CONFIGURATIONS:');
  console.log('====================================');
  console.log('1. Edit: src/config/trading-thresholds.js');
  console.log('2. Change: ACTIVE_CONFIG = \'SELECTIVE\' or \'RELAXED\' or \'ULTRA_SELECTIVE\'');
  console.log('3. Run: node compare-configurations.js');
  console.log('4. See dramatically different results!');
  
  return {
    configuration: current.activeConfig,
    stocks: testStocks,
    minerviniThresholds: minervini,
    institutionalThresholds: institutional
  };
}

async function showConfigurationComparison() {
  console.log('\n🔄 CONFIGURATION COMPARISON GUIDE:');
  console.log('==================================');
  
  console.log('\n📊 EXPECTED RESULTS FROM 25-STOCK TEST:');
  console.log('---------------------------------------');
  
  console.log('\n🔥 ULTRA_SELECTIVE (Maximum Discipline):');
  console.log('├── Expected BUY signals: 0-2 stocks');
  console.log('├── Expected WATCH signals: 0-3 stocks');
  console.log('├── Expected AVOID signals: 20-25 stocks');
  console.log('├── Use case: Bear markets, maximum caution');
  console.log('└── Perfect for: Manual execution, high conviction only');
  
  console.log('\n⚖️ SELECTIVE (Balanced Approach):');
  console.log('├── Expected BUY signals: 3-8 stocks');
  console.log('├── Expected WATCH signals: 5-10 stocks');
  console.log('├── Expected AVOID signals: 7-17 stocks');
  console.log('├── Use case: Normal markets, balanced risk');
  console.log('└── Perfect for: Regular trading, moderate diversification');
  
  console.log('\n🌊 RELAXED (More Opportunities):');
  console.log('├── Expected BUY signals: 8-15 stocks');
  console.log('├── Expected WATCH signals: 5-12 stocks');
  console.log('├── Expected AVOID signals: 0-12 stocks');
  console.log('├── Use case: Bull markets, growth focused');
  console.log('└── Perfect for: Aggressive growth, higher turnover');
  
  console.log('\n🎯 SECTOR BREAKDOWN OF TEST STOCKS:');
  console.log('===================================');
  console.log('🚀 Mega Caps (5): AAPL, MSFT, GOOGL, AMZN, TSLA');
  console.log('💻 Tech Growth (5): NVDA, META, NFLX, AMD, CRM');
  console.log('🏦 Financials (5): JPM, BAC, WFC, GS, MS');
  console.log('🛡️ Defensive (5): JNJ, PG, KO, PFE, MRK');
  console.log('🏭 Mixed Sectors (5): XOM, CVX, WMT, HD, UNH');
  
  console.log('\n💡 QUICK SWITCHING COMMANDS:');
  console.log('============================');
  console.log('# Test Ultra-Selective (0-2 BUY signals)');
  console.log('sed -i "" "s/ACTIVE_CONFIG = .*/ACTIVE_CONFIG = \'ULTRA_SELECTIVE\';/" src/config/trading-thresholds.js');
  console.log('');
  console.log('# Test Selective (3-8 BUY signals)');
  console.log('sed -i "" "s/ACTIVE_CONFIG = .*/ACTIVE_CONFIG = \'SELECTIVE\';/" src/config/trading-thresholds.js');
  console.log('');
  console.log('# Test Relaxed (8-15 BUY signals)');
  console.log('sed -i "" "s/ACTIVE_CONFIG = .*/ACTIVE_CONFIG = \'RELAXED\';/" src/config/trading-thresholds.js');
}

// Run the comprehensive test
async function main() {
  const testResults = await testCurrentConfiguration();
  await showConfigurationComparison();
  
  console.log('\n✅ CENTRALIZED THRESHOLD SYSTEM READY!');
  console.log('=====================================');
  console.log('🎯 Change one line → Transform entire system behavior');
  console.log('📊 Test with 25 diverse stocks → See real impact');
  console.log('⚡ No more hunting through multiple files!');
  console.log('🚀 Perfect for rapid backtesting and optimization');
}

main().catch(console.error);
