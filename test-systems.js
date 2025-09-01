const { SYSTEM_IDS } = require('./src/utils/systemConstants');
const { SingleSystemAnalyzer } = require('./src/systems/single-system-analyzer');

console.log('✅ Testing updated route default systems:');
const defaultSystems = [
  SYSTEM_IDS.TRIPLE_SCREEN, 
  SYSTEM_IDS.MINERVINI_SEPA, 
  SYSTEM_IDS.RSI_MEAN_REVERSION, 
  SYSTEM_IDS.MINERVINI_TEMPLATE_ADVANCED, 
  SYSTEM_IDS.INSTITUTIONAL_MOMENTUM_CASCADE
];

console.log('Default systems for routes:', defaultSystems);

const analyzer = new SingleSystemAnalyzer();
console.log('\n🔍 Checking if all default systems are available:');
let allAvailable = true;
defaultSystems.forEach(systemId => {
  const config = analyzer.getSystemConfig(systemId);
  const available = config ? '✅ Available' : '❌ Missing';
  console.log(`  ${systemId}: ${available}`);
  if (!config) allAvailable = false;
});

console.log(`\n${allAvailable ? '✅ All systems available!' : '❌ Some systems missing'}`);
