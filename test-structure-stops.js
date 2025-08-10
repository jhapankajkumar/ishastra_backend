/**
 * Structure-Aware Stops Testing Suite
 * Tests for edge cases and validation scenarios
 */

// Mock the structure-aware stop engine
class StructureAwareStopEngine {
  constructor() {
    this.config = {
      lookbackPeriod: 20,
      minSwingSize: 0.5,
      structureBuffer: 0.3,
      baseATRMultiplier: 2.0,
      maxATRMultiplier: 4.0,
      minATRMultiplier: 1.0,
      adxThresholds: {
        strongTrend: 30,
        weakTrend: 20,
        veryStrong: 40
      }
    };
  }

  calculateAdaptiveATRMultiplier(adx, technical) {
    let multiplier = this.config.baseATRMultiplier;
    
    if (adx >= this.config.adxThresholds.veryStrong) {
      multiplier = 1.5; // Very strong trend (ADX≥40) - tight stops
    } else if (adx >= this.config.adxThresholds.strongTrend) {
      multiplier = 1.8; // Strong trend (ADX≥30) - tighter stops  
    } else if (adx <= this.config.adxThresholds.weakTrend) {
      multiplier = 3.0; // Weak/choppy (ADX≤20) - wider stops
    } else {
      multiplier = 2.2; // Normal conditions (ADX 20-30)
    }
    
    const regime = technical?.marketRegime?.regime;
    if (regime === 'BEAR') {
      multiplier += 0.3; // Bear +0.3 buffer
    } else if (regime === 'BULL') {
      multiplier -= 0.2; // Bull -0.2 buffer
    }
    
    return Math.max(
      this.config.minATRMultiplier,
      Math.min(this.config.maxATRMultiplier, multiplier)
    );
  }

  calculateATRStop(currentPrice, atr, multiplier, direction) {
    const stopDistance = atr * multiplier;
    let stopPrice = direction === 'LONG' 
      ? currentPrice - stopDistance
      : currentPrice + stopDistance;
    
    // Edge case validation
    if (direction === 'LONG' && stopPrice >= currentPrice) {
      console.log(`⚠️ Long stop above entry (${stopPrice} > ${currentPrice}) - correcting to 1% below`);
      stopPrice = currentPrice * 0.99;
    } else if (direction === 'SHORT' && stopPrice <= currentPrice) {
      console.log(`⚠️ Short stop below entry (${stopPrice} < ${currentPrice}) - correcting to 1% above`);
      stopPrice = currentPrice * 1.01;
    }
    
    return {
      price: stopPrice,
      distance: Math.abs(currentPrice - stopPrice),
      method: 'adaptive_atr',
      multiplier: multiplier,
      confidence: 0.7,
      edgeCaseAdjusted: Math.abs(stopPrice - (direction === 'LONG' ? currentPrice - stopDistance : currentPrice + stopDistance)) > 0.001
    };
  }

  blendStops(atrStop, structureStop, direction) {
    // If no structure found, use ATR only
    if (!structureStop.price) {
      return {
        price: atrStop.price,
        method: 'atr_only',
        confidence: atrStop.confidence,
        reason: 'No valid swing levels found - using adaptive ATR stop only'
      };
    }
    
    // Use the MORE CONSERVATIVE stop (farther from current price)
    let finalStop;
    if (direction === 'LONG') {
      // For longs: lower price = farther from current = more conservative
      finalStop = atrStop.price < structureStop.price ? atrStop : structureStop;
    } else {
      // For shorts: higher price = farther from current = more conservative  
      finalStop = atrStop.price > structureStop.price ? atrStop : structureStop;
    }
    
    const confidence = (atrStop.confidence + structureStop.confidence) / 2;
    
    return {
      price: finalStop.price,
      method: `blended_${finalStop.method}`,
      confidence: confidence,
      reason: `Used ${finalStop.method} stop`,
      conservativeChoice: finalStop === atrStop ? 'ATR was more conservative' : 'Structure was more conservative'
    };
  }
}

// Test scenarios
function runStructureStopTests() {
  console.log('🧪 Testing Structure-Aware Stops with Edge Cases');
  console.log('==================================================');
  
  const engine = new StructureAwareStopEngine();
  const currentPrice = 1000;
  const atr = 20;
  
  // Test 1: Strong trend (ADX > 35)
  console.log('\n📊 Test 1: Strong Trend (ADX = 45)');
  const strongTrendMultiplier = engine.calculateAdaptiveATRMultiplier(45, {});
  console.log(`   Multiplier: ${strongTrendMultiplier}x (should be 1.5x for very strong trend)`);
  
  const strongTrendStop = engine.calculateATRStop(currentPrice, atr, strongTrendMultiplier, 'LONG');
  console.log(`   Long stop: ${strongTrendStop.price} (distance: ${strongTrendStop.distance})`);
  
  const riskReward = (currentPrice * 0.02) / strongTrendStop.distance; // Assume 2% target
  console.log(`   R/R check: ${riskReward.toFixed(2)} (should be ≥2 when structure is far)`);
  
  // Test 2: Choppy market (ADX < 18)
  console.log('\n📊 Test 2: Choppy Market (ADX = 15)');
  const choppyMultiplier = engine.calculateAdaptiveATRMultiplier(15, {});
  console.log(`   Multiplier: ${choppyMultiplier}x (should be 3.0x for choppy market)`);
  
  const choppyStop = engine.calculateATRStop(currentPrice, atr, choppyMultiplier, 'LONG');
  console.log(`   Long stop: ${choppyStop.price} (should be well below entry ${currentPrice})`);
  console.log(`   Stop above entry? ${choppyStop.price >= currentPrice ? '❌ ERROR' : '✅ CORRECT'}`);
  
  // Test 3: Bear regime adjustment
  console.log('\n📊 Test 3: Bear vs Bull Regime Adjustment');
  const bearMultiplier = engine.calculateAdaptiveATRMultiplier(25, { marketRegime: { regime: 'BEAR' } });
  const bullMultiplier = engine.calculateAdaptiveATRMultiplier(25, { marketRegime: { regime: 'BULL' } });
  
  console.log(`   Bear multiplier: ${bearMultiplier}x`);
  console.log(`   Bull multiplier: ${bullMultiplier}x`);
  console.log(`   Bear has +0.3 buffer? ${bearMultiplier > bullMultiplier ? '✅ CORRECT' : '❌ ERROR'}`);
  
  const bearStop = engine.calculateATRStop(currentPrice, atr, bearMultiplier, 'LONG');
  const bullStop = engine.calculateATRStop(currentPrice, atr, bullMultiplier, 'LONG');
  
  console.log(`   Bear stop distance: ${bearStop.distance}`);
  console.log(`   Bull stop distance: ${bullStop.distance}`);
  console.log(`   Bear stop wider? ${bearStop.distance > bullStop.distance ? '✅ CORRECT' : '❌ ERROR'}`);
  
  // Test 4: Blend logic validation
  console.log('\n📊 Test 4: Blend Logic Validation');
  
  const atrStop = { price: 950, confidence: 0.7, method: 'adaptive_atr' };
  const structureStop = { price: 940, confidence: 0.8, method: 'structure' }; // More conservative (lower)
  
  const blendedLong = engine.blendStops(atrStop, structureStop, 'LONG');
  console.log(`   ATR stop: ${atrStop.price}, Structure stop: ${structureStop.price}`);
  console.log(`   Blended result: ${blendedLong.price} (${blendedLong.conservativeChoice})`);
  console.log(`   Chose lower (more conservative)? ${blendedLong.price === 940 ? '✅ CORRECT' : '❌ ERROR'}`);
  
  // Test 5: No structure fallback
  console.log('\n📊 Test 5: No Structure Fallback');
  const noStructureStop = { price: null, confidence: 0.3, method: 'no_structure' };
  const fallbackResult = engine.blendStops(atrStop, noStructureStop, 'LONG');
  console.log(`   Result method: ${fallbackResult.method}`);
  console.log(`   Correct fallback? ${fallbackResult.method === 'atr_only' ? '✅ CORRECT' : '❌ ERROR'}`);
  
  // Test 6: Edge case - extreme ATR
  console.log('\n📊 Test 6: Edge Case - Extreme Multiplier');
  const extremeMultiplier = 0.5; // Very small multiplier
  const extremeStop = engine.calculateATRStop(currentPrice, atr, extremeMultiplier, 'LONG');
  console.log(`   Extreme stop: ${extremeStop.price} (multiplier: ${extremeMultiplier}x)`);
  console.log(`   Stop distance: ${extremeStop.distance}`);
  console.log(`   Edge case adjusted? ${extremeStop.edgeCaseAdjusted ? '⚠️ ADJUSTED' : '✅ NORMAL'}`);
  
  console.log('\n🎯 All Structure-Aware Stop Tests Complete!');
}

// Run the tests
runStructureStopTests();
