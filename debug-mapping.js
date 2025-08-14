#!/usr/bin/env node

/**
 * Debug system mapping
 */

const { SYSTEM_IDS, normalizeSystemKey } = require('./src/utils/systemConstants');

console.log('🔍 DEBUGGING SYSTEM MAPPING');
console.log('='.repeat(60));

console.log('\n📊 SYSTEM_IDS:');
Object.entries(SYSTEM_IDS).forEach(([key, value]) => {
  console.log(`  ${key}: "${value}"`);
});

console.log('\n🧪 Testing system name normalization:');
const testSystems = ['cup_handle', 'rsi_mean', 'macd_divergence'];

testSystems.forEach(sys => {
  const normalized = normalizeSystemKey(sys);
  console.log(`  "${sys}" -> "${normalized}"`);
  
  // Check if it matches any SYSTEM_IDS values
  const found = Object.values(SYSTEM_IDS).includes(normalized);
  console.log(`    Found in SYSTEM_IDS: ${found ? '✅' : '❌'}`);
  
  if (found) {
    const key = Object.keys(SYSTEM_IDS).find(k => SYSTEM_IDS[k] === normalized);
    console.log(`    Matches: SYSTEM_IDS.${key}`);
  }
});

console.log('\n🔧 Testing systems initialization...');
const ElderTripleScreen = require('./src/systems/elder-triple-screen').ElderTripleScreen;
const MinerviniSEPA = require('./src/systems/minervini-sepa');
const CupWithHandle = require('./src/systems/cup-with-handle');
const RSIMeanReversion = require('./src/systems/rsi-mean-reversion');
const MACDDivergence = require('./src/systems/macd-divergence');

const systems = {
  [SYSTEM_IDS.TRIPLE_SCREEN]: new ElderTripleScreen(),
  [SYSTEM_IDS.MINERVINI_SEPA]: new MinerviniSEPA(),
  [SYSTEM_IDS.CAN_SLIM_CUP_HANDLE]: new CupWithHandle(),
  [SYSTEM_IDS.RSI_MEAN_REVERSION]: new RSIMeanReversion(),
  [SYSTEM_IDS.MACD_DIVERGENCE]: new MACDDivergence()
};

console.log('Available systems in controller:');
Object.entries(systems).forEach(([key, system]) => {
  console.log(`  "${key}": ${system.constructor.name}`);
});

console.log('\n✅ Debug complete');
