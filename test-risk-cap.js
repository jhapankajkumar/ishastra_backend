/**
 * Test Structure-Aware Stops with Risk Cap
 */

class StructureAwareStopEngine {
  constructor() {
    this.config = {
      maxRiskPercent: 6.0,  // Maximum risk allowed
      baseATRMultiplier: 2.2
    };
  }

  calculateAdaptiveATRMultiplier(adx, technical) {
    let multiplier = this.config.baseATRMultiplier;
    
    if (adx >= 40) {
      multiplier = 1.5;
    } else if (adx >= 30) {
      multiplier = 1.8;
    } else if (adx <= 20) {
      multiplier = 3.0;
    }
    
    const regime = technical?.marketRegime?.regime;
    if (regime === 'BEAR') {
      multiplier += 0.3;
    } else if (regime === 'BULL') {
      multiplier -= 0.2;
    }
    
    return Math.max(1.0, Math.min(4.0, multiplier));
  }

  applyRiskCap(stop, currentPrice, direction, maxRiskPercent = 6.0) {
    const currentRiskPercent = Math.abs(currentPrice - stop.price) / currentPrice * 100;
    
    if (currentRiskPercent <= maxRiskPercent) {
      return stop;
    }
    
    const maxStopDistance = currentPrice * (maxRiskPercent / 100);
    const cappedStopPrice = direction === 'LONG' 
      ? currentPrice - maxStopDistance
      : currentPrice + maxStopDistance;
    
    return {
      price: cappedStopPrice,
      method: `capped_${stop.method}`,
      confidence: stop.confidence * 0.8,
      reason: `Risk capped at ${maxRiskPercent}% (was ${currentRiskPercent.toFixed(1)}%)`,
      riskCapApplied: true,
      originalStop: stop.price,
      originalRiskPercent: currentRiskPercent
    };
  }

  testMarketScenario(name, data) {
    console.log(`\n📊 ${name.toUpperCase()} - Testing Risk Cap`);
    console.log('═'.repeat(50));
    
    const multiplier = this.calculateAdaptiveATRMultiplier(data.adx, data);
    const atrStopDistance = data.atr * multiplier;
    
    // Simulate original stop (before risk cap)
    const originalStop = {
      price: data.currentPrice - atrStopDistance,
      method: 'adaptive_atr',
      confidence: 0.7
    };
    
    // Apply risk cap
    const cappedStop = this.applyRiskCap(originalStop, data.currentPrice, 'LONG');
    
    const originalRisk = Math.abs(data.currentPrice - originalStop.price) / data.currentPrice * 100;
    const cappedRisk = Math.abs(data.currentPrice - cappedStop.price) / data.currentPrice * 100;
    
    console.log(`Current Price: $${data.currentPrice}`);
    console.log(`ATR: ${data.atr}, ADX: ${data.adx}, Multiplier: ${multiplier.toFixed(1)}x`);
    console.log(`Original Stop: $${originalStop.price.toFixed(2)} (${originalRisk.toFixed(1)}% risk)`);
    console.log(`Capped Stop: $${cappedStop.price.toFixed(2)} (${cappedRisk.toFixed(1)}% risk)`);
    console.log(`Risk Cap Applied: ${cappedStop.riskCapApplied ? '✅ YES' : '❌ NO'}`);
    
    return {
      originalRisk,
      cappedRisk,
      riskCapApplied: cappedStop.riskCapApplied
    };
  }
}

// Test scenarios 
const testData = [
  {
    name: 'Normal Market',
    currentPrice: 100,
    atr: 2.5,
    adx: 25,
    marketRegime: { regime: 'BULL' }
  },
  {
    name: 'Choppy Volatile Market',
    currentPrice: 185.40,
    atr: 15.20,
    adx: 14.2,
    marketRegime: { regime: 'NEUTRAL' }
  },
  {
    name: 'Crypto Bear Market',
    currentPrice: 42500,
    atr: 2850.0,
    adx: 32.8,
    marketRegime: { regime: 'BEAR' }
  }
];

const engine = new StructureAwareStopEngine();

console.log('🛡️ Testing Risk Cap Implementation');
console.log('==================================');

testData.forEach(data => {
  const results = engine.testMarketScenario(data.name, data);
  
  if (results.originalRisk > 6 && results.riskCapApplied) {
    console.log('✅ Risk cap working correctly');
  } else if (results.originalRisk <= 6 && !results.riskCapApplied) {
    console.log('✅ No cap needed - risk acceptable');
  } else {
    console.log('❌ Risk cap logic error');
  }
});

console.log('\n🎯 Risk Cap Testing Complete!');
