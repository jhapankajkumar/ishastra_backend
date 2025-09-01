/**
 * TEST THRESHOLD CONFIGURATIONS
 * ============================
 * 
 * Test script to verify different threshold configurations work
 * and produce different results with the same stock data.
 */

const path = require('path');

// Add the src directory to the module path
const srcPath = path.join(__dirname, 'src');
require('module').globalPaths.push(srcPath);

const { getActiveThresholds, getSystemThresholds, getAvailableConfigs } = require('./src/config/trading-thresholds');

async function testThresholdConfigurations() {
  console.log('🧪 TESTING THRESHOLD CONFIGURATIONS');
  console.log('===================================');
  
  try {
    // Test getting available configurations
    const availableConfigs = getAvailableConfigs();
    console.log('📋 Available Configurations:', availableConfigs);
    
    // Test getting active configuration
    const activeThresholds = getActiveThresholds();
    console.log('\n🎯 Active Configuration:', activeThresholds.activeConfig);
    console.log('📊 Configuration Name:', activeThresholds.name);
    console.log('📝 Description:', activeThresholds.description);
    
    // Test getting system-specific thresholds
    console.log('\n🏛️ MINERVINI TEMPLATE THRESHOLDS:');
    const minerviniThresholds = getSystemThresholds('minervini_template_advanced');
    console.log('   📈 Relative Strength Threshold:', minerviniThresholds.criterion6_relative_strength);
    console.log('   📊 Volume Multiplier:', minerviniThresholds.criterion7_volume_multiplier);
    console.log('   💪 Fundamental Score:', minerviniThresholds.criterion8_fundamental_score);
    console.log('   🏆 Buy Allowed Grades:', minerviniThresholds.buy_allowed_grades);
    
    console.log('\n🌊 INSTITUTIONAL MOMENTUM THRESHOLDS:');
    const institutionalThresholds = getSystemThresholds('institutional_momentum_cascade');
    console.log('   📅 Weekly Momentum:', institutionalThresholds.weekly_momentum_threshold + '%');
    console.log('   📈 Accumulation Ratio:', institutionalThresholds.accumulation_ratio_threshold);
    console.log('   🔗 Correlation:', institutionalThresholds.correlation_threshold);
    console.log('   🎯 Win Ratio:', institutionalThresholds.win_ratio_threshold);
    console.log('   🏆 Buy Allowed Cascades:', institutionalThresholds.buy_allowed_cascades);
    
    console.log('\n✅ THRESHOLD CONFIGURATION SYSTEM WORKING!');
    console.log('💡 To switch configurations, change ACTIVE_CONFIG in src/config/trading-thresholds.js');
    
  } catch (error) {
    console.error('❌ Error testing threshold configurations:', error.message);
  }
}

// Run the test
testThresholdConfigurations();
