/**
 * Real Market Structure Test
 * Testing with actual market scenarios
 */

const fs = require('fs');
const path = require('path');

// Mock realistic OHLC data for different market conditions
const mockMarketData = {
  strongTrend: {
    // Strong uptrend - NVIDIA type scenario
    adx: 48.5,
    atr: 8.50,
    currentPrice: 425.60,
    ohlcData: [
      { high: 420, low: 410, close: 418 },
      { high: 425, low: 415, close: 422 },
      { high: 430, low: 420, close: 428 },
      { high: 428, low: 420, close: 425 },
      { high: 427, low: 418, close: 425.60 }
    ],
    marketRegime: { regime: 'BULL', confidence: 0.85 }
  },
  
  choppyMarket: {
    // Sideways choppy - post-earnings consolidation
    adx: 14.2,
    atr: 15.20,
    currentPrice: 185.40,
    ohlcData: [
      { high: 190, low: 180, close: 185 },
      { high: 188, low: 182, close: 186 },
      { high: 189, low: 183, close: 184 },
      { high: 187, low: 181, close: 185 },
      { high: 186, low: 184, close: 185.40 }
    ],
    marketRegime: { regime: 'NEUTRAL', confidence: 0.65 }
  },
  
  bearMarket: {
    // Bear market correction - crypto type scenario
    adx: 32.8,
    atr: 2850.0,
    currentPrice: 42500,
    ohlcData: [
      { high: 48000, low: 45000, close: 46500 },
      { high: 46800, low: 43200, close: 44100 },
      { high: 44500, low: 41800, close: 42900 },
      { high: 43200, low: 40500, close: 42800 },
      { high: 43000, low: 41800, close: 42500 }
    ],
    marketRegime: { regime: 'BEAR', confidence: 0.90 }
  }
};

class StructureAwareStopEngine {
  calculateAdaptiveATRMultiplier(adx, technical) {
    let multiplier = 2.2; // Normal base
    
    if (adx >= 40) {
      multiplier = 1.5; // Very strong trend
    } else if (adx >= 30) {
      multiplier = 1.8; // Strong trend
    } else if (adx <= 20) {
      multiplier = 3.0; // Choppy market
    }
    
    const regime = technical?.marketRegime?.regime;
    if (regime === 'BEAR') {
      multiplier += 0.3;
    } else if (regime === 'BULL') {
      multiplier -= 0.2;
    }
    
    return Math.max(1.0, Math.min(4.0, multiplier));
  }

  findStructureLevel(ohlcData, direction, currentPrice) {
    // Simple swing detection (in real system this would be more sophisticated)
    const lookback = Math.min(ohlcData.length, 20);
    const relevantData = ohlcData.slice(-lookback);
    
    if (direction === 'LONG') {
      // Find swing low
      let swingLow = Math.min(...relevantData.map(d => d.low));
      
      // Add buffer
      swingLow = swingLow * 0.997; // 0.3% buffer
      
      return {
        price: swingLow,
        confidence: swingLow < currentPrice * 0.95 ? 0.8 : 0.6,
        method: 'swing_low',
        buffer: currentPrice - swingLow
      };
    } else {
      // Find swing high
      let swingHigh = Math.max(...relevantData.map(d => d.high));
      
      // Add buffer  
      swingHigh = swingHigh * 1.003; // 0.3% buffer
      
      return {
        price: swingHigh,
        confidence: swingHigh > currentPrice * 1.05 ? 0.8 : 0.6,
        method: 'swing_high',
        buffer: swingHigh - currentPrice
      };
    }
  }

  calculateStructureAwareStop(currentPrice, ohlcData, atr, adx, technical, direction = 'LONG') {
    console.log(`\n🎯 Analyzing ${direction} position at $${currentPrice}`);
    console.log(`   ADX: ${adx}, ATR: ${atr}, Regime: ${technical.marketRegime?.regime}`);
    
    // 1. Calculate adaptive ATR multiplier
    const multiplier = this.calculateAdaptiveATRMultiplier(adx, technical);
    console.log(`   📊 ATR multiplier: ${multiplier}x (${this.getMultiplierReason(adx, technical)})`);
    
    // 2. Calculate ATR stop
    const atrStopDistance = atr * multiplier;
    const atrStopPrice = direction === 'LONG' 
      ? currentPrice - atrStopDistance
      : currentPrice + atrStopDistance;
    
    const atrStop = {
      price: atrStopPrice,
      distance: atrStopDistance,
      confidence: 0.7,
      method: 'adaptive_atr'
    };
    
    console.log(`   🛡️  ATR stop: $${atrStop.price.toFixed(2)} (${atrStop.distance.toFixed(2)} distance)`);
    
    // 3. Find structure level
    const structureStop = this.findStructureLevel(ohlcData, direction, currentPrice);
    console.log(`   🏗️  Structure level: $${structureStop.price.toFixed(2)} (confidence: ${structureStop.confidence})`);
    
    // 4. Blend stops (use more conservative)
    let finalStop;
    if (direction === 'LONG') {
      finalStop = atrStop.price < structureStop.price ? atrStop : structureStop;
    } else {
      finalStop = atrStop.price > structureStop.price ? atrStop : structureStop;
    }
    
    const riskPercent = (Math.abs(currentPrice - finalStop.price) / currentPrice * 100);
    
    console.log(`   ✅ Final stop: $${finalStop.price.toFixed(2)} (${finalStop.method})`);
    console.log(`   📈 Risk: ${riskPercent.toFixed(2)}% of position`);
    
    return {
      stopPrice: finalStop.price,
      riskPercent: riskPercent,
      method: `blended_${finalStop.method}`,
      confidence: finalStop.confidence,
      atrStop: atrStop,
      structureStop: structureStop,
      chosenStop: finalStop === atrStop ? 'ATR' : 'Structure'
    };
  }
  
  getMultiplierReason(adx, technical) {
    const regime = technical?.marketRegime?.regime;
    let reason = '';
    
    if (adx >= 40) {
      reason = 'Very strong trend';
    } else if (adx >= 30) {
      reason = 'Strong trend';  
    } else if (adx <= 20) {
      reason = 'Choppy market';
    } else {
      reason = 'Normal conditions';
    }
    
    if (regime === 'BEAR') {
      reason += ' + Bear regime buffer';
    } else if (regime === 'BULL') {
      reason += ' + Bull regime tighter';
    }
    
    return reason;
  }
}

function testRealMarketScenarios() {
  console.log('🚀 Testing Real Market Structure Scenarios');
  console.log('==========================================');
  
  const engine = new StructureAwareStopEngine();
  
  // Test each scenario
  Object.keys(mockMarketData).forEach(scenarioName => {
    const data = mockMarketData[scenarioName];
    
    console.log(`\n📊 SCENARIO: ${scenarioName.toUpperCase()}`);
    console.log('----------------------------------------');
    
    // Test long position
    const longResult = engine.calculateStructureAwareStop(
      data.currentPrice,
      data.ohlcData,
      data.atr,
      data.adx,
      data,
      'LONG'
    );
    
    // Test short position  
    const shortResult = engine.calculateStructureAwareStop(
      data.currentPrice,
      data.ohlcData,
      data.atr,
      data.adx,
      data,
      'SHORT'
    );
    
    // Analysis
    console.log(`\n   📋 SUMMARY:`);
    console.log(`      Long risk: ${longResult.riskPercent.toFixed(2)}% (${longResult.chosenStop} method)`);
    console.log(`      Short risk: ${shortResult.riskPercent.toFixed(2)}% (${shortResult.chosenStop} method)`);
    
    // Validate sensible risk levels
    const longSensible = longResult.riskPercent >= 0.5 && longResult.riskPercent <= 8.0;
    const shortSensible = shortResult.riskPercent >= 0.5 && shortResult.riskPercent <= 8.0;
    
    console.log(`      Risk levels sensible? Long: ${longSensible ? '✅' : '❌'}, Short: ${shortSensible ? '✅' : '❌'}`);
  });
  
  console.log('\n🎉 Real Market Structure Testing Complete!');
}

// Run the realistic tests
testRealMarketScenarios();
