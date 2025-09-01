/**
 * QUICK THRESHOLD SWITCHING TEST
 * =============================
 * 
 * Shows how to easily test different selectivity levels
 * by just changing one line in the configuration file.
 */

const { getActiveThresholds } = require('./src/config/trading-thresholds');

console.log('🔧 HOW TO SWITCH CONFIGURATIONS:');
console.log('================================');
console.log('');
console.log('1️⃣ Open: src/config/trading-thresholds.js');
console.log('2️⃣ Find: const ACTIVE_CONFIG = \'ULTRA_SELECTIVE\';');
console.log('3️⃣ Change to one of:');
console.log('   • \'ULTRA_SELECTIVE\' - Maximum discipline (0 signals from 25 stocks)');
console.log('   • \'SELECTIVE\'       - Balanced approach (target: 5-15 signals)');
console.log('   • \'RELAXED\'         - More opportunities (target: 15-25 signals)');
console.log('4️⃣ Save file and run your test again');
console.log('');

const current = getActiveThresholds();
console.log(`🎯 Currently using: ${current.activeConfig} (${current.description})`);
console.log('');
console.log('📊 COMPARISON OF CONFIGURATIONS:');
console.log('===============================');
console.log('');
console.log('ULTRA_SELECTIVE (Current):');
console.log('├── Minervini Relative Strength: 75+ (ultra-elite)');
console.log('├── Minervini Volume: 1.8x+ (exceptional)');
console.log('├── Minervini Fundamentals: 70+ (top-tier)');
console.log('├── Institutional Momentum: 12%+ (explosive)');
console.log('├── Accumulation Ratio: 0.75+ (heavy accumulation)');
console.log('└── Buy Grades: A+, A only');
console.log('');
console.log('SELECTIVE (Balanced):');
console.log('├── Minervini Relative Strength: 65+ (relaxed from 75)');
console.log('├── Minervini Volume: 1.5x+ (relaxed from 1.8x)');
console.log('├── Minervini Fundamentals: 60+ (relaxed from 70)');
console.log('├── Institutional Momentum: 8%+ (relaxed from 12%)');
console.log('├── Accumulation Ratio: 0.65+ (relaxed from 0.75)');
console.log('└── Buy Grades: A+, A, B+ allowed');
console.log('');
console.log('RELAXED (More Opportunities):');
console.log('├── Minervini Relative Strength: 50+ (original relaxed)');
console.log('├── Minervini Volume: 1.1x+ (original relaxed)');
console.log('├── Minervini Fundamentals: 40+ (original relaxed)');
console.log('├── Institutional Momentum: 4%+ (original relaxed)');
console.log('├── Accumulation Ratio: 0.55+ (original relaxed)');
console.log('└── Buy Grades: A+, A, B+, B allowed');
console.log('');
console.log('💡 TIP: Start with SELECTIVE to get some signals, then adjust from there!');
