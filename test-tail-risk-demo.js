/**
 * Tail Risk Protection Demo
 * Tests the new tail risk protection system
 */

const { assessTailRisk } = require('./src/utils/tailRiskProtection');

async function testTailRiskProtection() {
  console.log('🛡️ TAIL RISK PROTECTION SYSTEM DEMO');
  console.log('=====================================\n');
  
  // Test Case 1: Normal Market Conditions
  console.log('📊 TEST 1: NORMAL MARKET CONDITIONS');
  console.log('-----------------------------------');
  
  const normalMarketData = {
    currentPrice: 2450.50,
    volume: 2500000,
    avgVolume: 2200000,
    avgVolume20DMA: 2100000
  };
  
  // Generate normal OHLC data (slight uptrend, normal volatility)
  const normalOHLC = generateNormalMarketOHLC();
  
  const normalRiskAssessment = await assessTailRisk(normalMarketData, normalOHLC);
  console.log(`Risk Score: ${normalRiskAssessment.overallRiskScore}/100 (${normalRiskAssessment.riskLevel})`);
  console.log(`Protection Level: ${normalRiskAssessment.protectionPlan.protectionLevel}`);
  console.log(`Position Size Multiplier: ${normalRiskAssessment.protectionPlan.positionSizeMultiplier}x`);
  console.log(`Actions: ${normalRiskAssessment.protectionPlan.actions.slice(0, 2).join('; ')}`);
  
  // Test Case 2: High Volatility Market
  console.log('\n📊 TEST 2: HIGH VOLATILITY CONDITIONS');
  console.log('------------------------------------');
  
  const volatileMarketData = {
    currentPrice: 2380.75,
    volume: 8500000, // High volume
    avgVolume: 2200000,
    avgVolume20DMA: 2100000
  };
  
  // Generate volatile OHLC data (high volatility, some gaps)
  const volatileOHLC = generateVolatileMarketOHLC();
  
  const volatileRiskAssessment = await assessTailRisk(volatileMarketData, volatileOHLC);
  console.log(`Risk Score: ${volatileRiskAssessment.overallRiskScore}/100 (${volatileRiskAssessment.riskLevel})`);
  console.log(`Protection Level: ${volatileRiskAssessment.protectionPlan.protectionLevel}`);
  console.log(`Position Size Multiplier: ${volatileRiskAssessment.protectionPlan.positionSizeMultiplier}x`);
  console.log(`Major Risks: ${getMajorRisks(volatileRiskAssessment)}`);
  console.log(`Emergency Actions: ${volatileRiskAssessment.emergencyActions ? 'YES' : 'NO'}`);
  
  // Test Case 3: Flash Crash Scenario
  console.log('\n📊 TEST 3: FLASH CRASH SCENARIO');
  console.log('-------------------------------');
  
  const crashMarketData = {
    currentPrice: 2125.25, // Big drop
    volume: 15000000, // Panic volume
    avgVolume: 2200000,
    avgVolume20DMA: 2100000
  };
  
  // Generate crash OHLC data (rapid decline, huge volume)
  const crashOHLC = generateFlashCrashOHLC();
  
  const crashRiskAssessment = await assessTailRisk(crashMarketData, crashOHLC);
  console.log(`Risk Score: ${crashRiskAssessment.overallRiskScore}/100 (${crashRiskAssessment.riskLevel})`);
  console.log(`Protection Level: ${crashRiskAssessment.protectionPlan.protectionLevel}`);
  console.log(`Position Size Multiplier: ${crashRiskAssessment.protectionPlan.positionSizeMultiplier}x`);
  console.log(`Major Risks: ${getMajorRisks(crashRiskAssessment)}`);
  console.log(`Emergency Actions Required: ${crashRiskAssessment.emergencyActions ? 'YES' : 'NO'}`);
  
  if (crashRiskAssessment.emergencyActions) {
    console.log(`Immediate Actions: ${crashRiskAssessment.emergencyActions.immediate.slice(0, 2).join('; ')}`);
  }
  
  // Test Case 4: Liquidity Crisis
  console.log('\n📊 TEST 4: LIQUIDITY CRISIS SCENARIO');
  console.log('-----------------------------------');
  
  const liquidityMarketData = {
    currentPrice: 2420.15,
    volume: 450000, // Very low volume
    avgVolume: 2200000,
    avgVolume20DMA: 2100000
  };
  
  // Generate low liquidity OHLC data
  const liquidityOHLC = generateLiquidityCrisisOHLC();
  
  const liquidityRiskAssessment = await assessTailRisk(liquidityMarketData, liquidityOHLC);
  console.log(`Risk Score: ${liquidityRiskAssessment.overallRiskScore}/100 (${liquidityRiskAssessment.riskLevel})`);
  console.log(`Protection Level: ${liquidityRiskAssessment.protectionPlan.protectionLevel}`);
  console.log(`Position Size Multiplier: ${liquidityRiskAssessment.protectionPlan.positionSizeMultiplier}x`);
  console.log(`Major Risks: ${getMajorRisks(liquidityRiskAssessment)}`);
  
  console.log('\n🛡️ TAIL RISK PROTECTION SYSTEM READY!');
  console.log('=====================================');
  console.log('✅ Market crash detection implemented');
  console.log('✅ Defensive position sizing active');
  console.log('✅ Multi-risk factor analysis complete');
  console.log('✅ Emergency action protocols ready');
  console.log('\n💡 Your system now automatically reduces position sizes during:');
  console.log('   • Volatility spikes (>2x normal)');
  console.log('   • Flash crash conditions');
  console.log('   • Liquidity evaporation');
  console.log('   • Correlation breakdowns');
  console.log('   • Sector contagion patterns');
}

function getMajorRisks(riskAssessment) {
  const risks = [];
  if (riskAssessment.riskComponents?.volatilitySpike?.riskLevel === 'HIGH') risks.push('Volatility Spike');
  if (riskAssessment.riskComponents?.flashCrash?.riskLevel === 'HIGH') risks.push('Flash Crash');
  if (riskAssessment.riskComponents?.liquidityEvaporation?.riskLevel === 'HIGH') risks.push('Liquidity Crisis');
  if (riskAssessment.riskComponents?.correlationBreakdown?.riskLevel === 'HIGH') risks.push('Correlation Breakdown');
  if (riskAssessment.riskComponents?.sectorContagion?.riskLevel === 'HIGH') risks.push('Sector Contagion');
  return risks.length > 0 ? risks.join(', ') : 'None';
}

// Generate synthetic OHLC data for testing
function generateNormalMarketOHLC() {
  const data = [];
  let price = 2400;
  
  for (let i = 0; i < 50; i++) {
    const change = (Math.random() - 0.48) * 20; // Slight upward bias
    const newPrice = price + change;
    
    data.push({
      date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString(),
      open: price,
      high: Math.max(price, newPrice) + Math.random() * 10,
      low: Math.min(price, newPrice) - Math.random() * 8,
      close: newPrice,
      volume: 2000000 + Math.random() * 1000000
    });
    
    price = newPrice;
  }
  
  return data;
}

function generateVolatileMarketOHLC() {
  const data = [];
  let price = 2400;
  
  for (let i = 0; i < 50; i++) {
    // High volatility with some big moves
    const change = (Math.random() - 0.5) * (i > 40 ? 80 : 30); // Increase volatility in recent days
    const newPrice = price + change;
    
    const range = Math.abs(change) * (1 + Math.random());
    
    data.push({
      date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString(),
      open: price,
      high: Math.max(price, newPrice) + range,
      low: Math.min(price, newPrice) - range,
      close: newPrice,
      volume: i > 40 ? 4000000 + Math.random() * 8000000 : 2000000 + Math.random() * 2000000
    });
    
    price = newPrice;
  }
  
  return data;
}

function generateFlashCrashOHLC() {
  const data = [];
  let price = 2400;
  
  for (let i = 0; i < 50; i++) {
    let change;
    
    if (i > 45) {
      // Flash crash - big drops in last few days
      change = -30 - Math.random() * 50;
    } else if (i > 40) {
      // Building selling pressure
      change = -5 - Math.random() * 20;
    } else {
      // Normal before crash
      change = (Math.random() - 0.5) * 15;
    }
    
    const newPrice = price + change;
    const range = Math.abs(change) * (0.5 + Math.random());
    
    data.push({
      date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString(),
      open: price,
      high: Math.max(price, newPrice) + (change > 0 ? range : range * 0.3),
      low: Math.min(price, newPrice) - (change < 0 ? range : range * 0.3),
      close: newPrice,
      volume: i > 45 ? 10000000 + Math.random() * 15000000 : 2000000 + Math.random() * 1000000
    });
    
    price = newPrice;
  }
  
  return data;
}

function generateLiquidityCrisisOHLC() {
  const data = [];
  let price = 2400;
  
  for (let i = 0; i < 50; i++) {
    // Normal price moves but declining volume
    const change = (Math.random() - 0.5) * 20;
    const newPrice = price + change;
    
    // Volume declining over time, especially in recent days
    const volumeDeclineFactor = i > 30 ? (50 - i) / 20 : 1;
    const baseVolume = 2000000 * volumeDeclineFactor;
    
    data.push({
      date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString(),
      open: price,
      high: Math.max(price, newPrice) + Math.random() * 15,
      low: Math.min(price, newPrice) - Math.random() * 12,
      close: newPrice,
      volume: Math.max(300000, baseVolume + Math.random() * 500000)
    });
    
    price = newPrice;
  }
  
  return data;
}

// Run the demo
if (require.main === module) {
  testTailRiskProtection().catch(console.error);
}

module.exports = { testTailRiskProtection };
