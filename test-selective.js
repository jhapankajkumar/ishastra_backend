/**
 * DIRECT THRESHOLD TESTING
 * ========================
 * 
 * Test the threshold system directly without server dependency
 */

const path = require('path');

// Add the src directory to the module path
const srcPath = path.join(__dirname, 'src');
require('module').globalPaths.push(srcPath);

const { getActiveThresholds } = require('./src/config/trading-thresholds');

async function testThresholdSwitching() {
  console.log('🎯 TESTING THRESHOLD SWITCHING');
  console.log('==============================');
  
  const current = getActiveThresholds();
  console.log(`📊 Current Configuration: ${current.activeConfig}`);
  console.log(`📝 Description: ${current.description}`);
  
  const minervini = current.minervini_template_advanced;
  const institutional = current.institutional_momentum_cascade;
  
  console.log('\n🏛️ MINERVINI TEMPLATE SETTINGS:');
  console.log(`   🎯 Relative Strength: ${minervini.criterion6_relative_strength}+ (was 75 in ULTRA_SELECTIVE)`);
  console.log(`   📊 Volume Multiplier: ${minervini.criterion7_volume_multiplier}x+ (was 1.8x in ULTRA_SELECTIVE)`);
  console.log(`   💪 Fundamental Score: ${minervini.criterion8_fundamental_score}+ (was 70 in ULTRA_SELECTIVE)`);
  console.log(`   🏆 Buy Grades: ${minervini.buy_allowed_grades.join(', ')} (was A+,A in ULTRA_SELECTIVE)`);
  
  console.log('\n🌊 INSTITUTIONAL MOMENTUM SETTINGS:');
  console.log(`   📅 Weekly Momentum: ${institutional.weekly_momentum_threshold}%+ (was 12% in ULTRA_SELECTIVE)`);
  console.log(`   📈 Accumulation Ratio: ${institutional.accumulation_ratio_threshold}+ (was 0.75 in ULTRA_SELECTIVE)`);
  console.log(`   🔗 Correlation: ${institutional.correlation_threshold}+ (was 0.5 in ULTRA_SELECTIVE)`);
  console.log(`   🎯 Win Ratio: ${institutional.win_ratio_threshold}+ (was 0.75 in ULTRA_SELECTIVE)`);
  console.log(`   🏆 Buy Cascades: ${institutional.buy_allowed_cascades.join(', ')} (was A+,A in ULTRA_SELECTIVE)`);
  
  if (current.activeConfig === 'SELECTIVE') {
    console.log('\n✅ SUCCESS! Switched to SELECTIVE configuration');
    console.log('📈 Expected Result: More signals than ULTRA_SELECTIVE');
    console.log('🎯 Targets: 5-15 BUY signals from 25 stocks (vs 0 from ULTRA_SELECTIVE)');
  } else {
    console.log(`\n⚠️  Still using ${current.activeConfig} configuration`);
    console.log('💡 To switch: Change ACTIVE_CONFIG in src/config/trading-thresholds.js');
  }
}

testThresholdSwitching();
