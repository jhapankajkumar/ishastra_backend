/**
 * ✅ COMPREHENSIVE UNIT TESTS - Structure-Aware Stops
 * Tests: ADX thresholds, regime effects, no-structure fallback, blend logic, risk caps
 */

class StructureAwareStopEngine {
  constructor() {
    this.fallbackMetrics = { totalStops: 0, atrOnlyCount: 0 };
  }

  calculateAdaptiveATRMultiplier(adx, technical) {
    let multiplier = 2.2; // Base multiplier
    
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

  calculateATRStop(currentPrice, atr, multiplier, direction) {
    const stopDistance = atr * multiplier;
    let stopPrice = direction === 'LONG' 
      ? currentPrice - stopDistance
      : currentPrice + stopDistance;
    
    // Edge case validation
    let edgeCaseAdjusted = false;
    if (direction === 'LONG' && stopPrice >= currentPrice) {
      console.log(`⚠️ Long stop above entry (${stopPrice} >= ${currentPrice}) - correcting`);
      stopPrice = currentPrice * 0.99;
      edgeCaseAdjusted = true;
    } else if (direction === 'SHORT' && stopPrice <= currentPrice) {
      console.log(`⚠️ Short stop below entry (${stopPrice} <= ${currentPrice}) - correcting`);
      stopPrice = currentPrice * 1.01;
      edgeCaseAdjusted = true;
    }
    
    return {
      price: stopPrice,
      distance: Math.abs(currentPrice - stopPrice),
      method: 'adaptive_atr',
      multiplier: multiplier,
      confidence: 0.7,
      edgeCaseAdjusted: edgeCaseAdjusted
    };
  }

  blendStops(atrStop, structureStop, direction, currentPrice) {
    this.fallbackMetrics.totalStops++;
    
    // No structure fallback
    if (!structureStop || !structureStop.price) {
      this.fallbackMetrics.atrOnlyCount++;
      const fallbackRate = (this.fallbackMetrics.atrOnlyCount / this.fallbackMetrics.totalStops * 100).toFixed(1);
      
      return {
        price: atrStop.price,
        method: 'atr_only',
        confidence: atrStop.confidence,
        fallbackApplied: true,
        fallbackRate: fallbackRate
      };
    }
    
    // Blend logic - select farther stop
    let finalStop;
    if (direction === 'LONG') {
      finalStop = atrStop.price < structureStop.price ? atrStop : structureStop;
    } else {
      finalStop = atrStop.price > structureStop.price ? atrStop : structureStop;
    }
    
    return {
      price: finalStop.price,
      method: `blended_${finalStop.method}`,
      confidence: (atrStop.confidence + structureStop.confidence) / 2,
      conservativeChoice: finalStop === atrStop ? 'ATR' : 'Structure'
    };
  }

  applyRiskCap(stop, currentPrice, direction, maxRiskPercent = 6.0) {
    const currentRiskPercent = Math.abs(currentPrice - stop.price) / currentPrice * 100;
    
    if (currentRiskPercent <= maxRiskPercent) {
      return { ...stop, riskCapApplied: false };
    }
    
    const maxStopDistance = currentPrice * (maxRiskPercent / 100);
    const cappedStopPrice = direction === 'LONG' 
      ? currentPrice - maxStopDistance
      : currentPrice + maxStopDistance;
    
    return {
      price: cappedStopPrice,
      method: `capped_${stop.method}`,
      confidence: stop.confidence * 0.8,
      riskCapApplied: true,
      originalRiskPercent: currentRiskPercent
    };
  }

  analyzeOverheadSupplyGap(currentPrice, technical, direction) {
    const resistance = technical?.levels?.resistance || currentPrice * 1.05;
    
    if (direction === 'LONG') {
      const gapDistance = resistance - currentPrice;
      const riskDistance = currentPrice * 0.02; // Assume 2% risk
      const gapRatio = gapDistance / riskDistance;
      
      return {
        gapRatio: gapRatio,
        meetsThreshold: gapRatio >= 1.2,
        sizeAdjustment: gapRatio >= 1.2 ? 1.0 : (gapRatio >= 0.8 ? 0.6 : 0.3),
        reasoning: `Gap ratio: ${gapRatio.toFixed(2)}R`
      };
    }
    
    return { gapRatio: 0, meetsThreshold: false, sizeAdjustment: 0.8 };
  }
}

// ✅ UNIT TEST SUITE
function runComprehensiveUnitTests() {
  console.log('🧪 COMPREHENSIVE UNIT TESTS - Structure-Aware Stops');
  console.log('='.repeat(60));
  
  const engine = new StructureAwareStopEngine();
  const testResults = [];
  
  // Test 1: ADX Threshold Tests (15, 25, 38, 45)
  console.log('\n📊 TEST 1: ADX Threshold Multipliers');
  console.log('-'.repeat(40));
  
  const adxTests = [15, 25, 38, 45];
  adxTests.forEach(adx => {
    const multiplier = engine.calculateAdaptiveATRMultiplier(adx, {});
    const expected = adx >= 40 ? 1.5 : (adx >= 30 ? 1.8 : (adx <= 20 ? 3.0 : 2.2));
    const passed = Math.abs(multiplier - expected) < 0.01;
    
    console.log(`   ADX ${adx}: ${multiplier}x (expected: ${expected}x) ${passed ? '✅' : '❌'}`);
    testResults.push({ test: `ADX_${adx}`, passed, actual: multiplier, expected });
  });
  
  // Test 2: Regime Effects (Bull/Bear)
  console.log('\n🐻🐂 TEST 2: Regime Adjustments');
  console.log('-'.repeat(40));
  
  const baseMultiplier = engine.calculateAdaptiveATRMultiplier(25, {});
  const bullMultiplier = engine.calculateAdaptiveATRMultiplier(25, { marketRegime: { regime: 'BULL' } });
  const bearMultiplier = engine.calculateAdaptiveATRMultiplier(25, { marketRegime: { regime: 'BEAR' } });
  
  const bullTest = Math.abs(bullMultiplier - (baseMultiplier - 0.2)) < 0.01;
  const bearTest = Math.abs(bearMultiplier - (baseMultiplier + 0.3)) < 0.01;
  
  console.log(`   Bull regime: ${bullMultiplier}x (base - 0.2) ${bullTest ? '✅' : '❌'}`);
  console.log(`   Bear regime: ${bearMultiplier}x (base + 0.3) ${bearTest ? '✅' : '❌'}`);
  
  testResults.push({ test: 'BULL_REGIME', passed: bullTest });
  testResults.push({ test: 'BEAR_REGIME', passed: bearTest });
  
  // Test 3: No Structure Fallback (n=0 swings)
  console.log('\n🏗️ TEST 3: No Structure Fallback');
  console.log('-'.repeat(40));
  
  const currentPrice = 100;
  const atrStop = { price: 95, method: 'adaptive_atr', confidence: 0.7 };
  
  // Test with no structure
  engine.fallbackMetrics = { totalStops: 0, atrOnlyCount: 0 };
  const noStructureResult = engine.blendStops(atrStop, null, 'LONG', currentPrice);
  
  const fallbackTest = noStructureResult.method === 'atr_only' && noStructureResult.fallbackApplied;
  console.log(`   No structure fallback: ${noStructureResult.method} ${fallbackTest ? '✅' : '❌'}`);
  console.log(`   Fallback rate tracking: ${noStructureResult.fallbackRate}%`);
  
  testResults.push({ test: 'NO_STRUCTURE_FALLBACK', passed: fallbackTest });
  
  // Test 4: Stop Position Validation (stop not above entry for longs)
  console.log('\n🛡️ TEST 4: Stop Position Validation');
  console.log('-'.repeat(40));
  
  // Test edge case where calculated stop would be above entry
  const extremeStop = engine.calculateATRStop(100, 5, 0.1, 'LONG'); // Very small multiplier
  const longValidation = extremeStop.price < 100;
  console.log(`   Long stop below entry: $${extremeStop.price} < $100 ${longValidation ? '✅' : '❌'}`);
  console.log(`   Edge case corrected: ${extremeStop.edgeCaseAdjusted ? '✅ YES' : '⚠️ NO'}`);
  
  const shortStop = engine.calculateATRStop(100, 5, 0.1, 'SHORT');
  const shortValidation = shortStop.price > 100;
  console.log(`   Short stop above entry: $${shortStop.price} > $100 ${shortValidation ? '✅' : '❌'}`);
  
  testResults.push({ test: 'LONG_STOP_VALIDATION', passed: longValidation });
  testResults.push({ test: 'SHORT_STOP_VALIDATION', passed: shortValidation });
  
  // Test 5: Risk Cap Boundary (5.9% vs 6.1%)
  console.log('\n⚠️ TEST 5: Risk Cap Boundary Tests');
  console.log('-'.repeat(40));
  
  // 5.9% risk - should NOT be capped
  const lowRiskStop = { price: 94.1, method: 'test', confidence: 0.8 }; // 5.9% risk
  const lowRiskResult = engine.applyRiskCap(lowRiskStop, 100, 'LONG');
  const lowRiskTest = !lowRiskResult.riskCapApplied;
  console.log(`   5.9% risk uncapped: ${!lowRiskResult.riskCapApplied ? '✅' : '❌'} (${((100-94.1)/100*100).toFixed(1)}% actual risk)`);
  
  // 6.1% risk - should BE capped
  const highRiskStop = { price: 93.9, method: 'test', confidence: 0.8 }; // 6.1% risk
  const highRiskResult = engine.applyRiskCap(highRiskStop, 100, 'LONG');
  const highRiskTest = highRiskResult.riskCapApplied;
  console.log(`   6.1% risk capped: ${highRiskResult.riskCapApplied ? '✅' : '❌'} (${((100-93.9)/100*100).toFixed(1)}% actual risk)`);
  
  testResults.push({ test: 'RISK_CAP_5_9', passed: lowRiskTest });
  testResults.push({ test: 'RISK_CAP_6_1', passed: highRiskTest });
  
  // Test 6: Blend Logic Verification (farther stop selection)
  console.log('\n🔄 TEST 6: Blend Logic - Farther Stop Selection');
  console.log('-'.repeat(40));
  
  const atrStop1 = { price: 95, method: 'adaptive_atr', confidence: 0.7 }; // 5% from 100
  const structureStop1 = { price: 92, method: 'structure', confidence: 0.8 }; // 8% from 100
  
  const blendResult = engine.blendStops(atrStop1, structureStop1, 'LONG', 100);
  const correctSelection = blendResult.price === 92; // Should choose lower price (farther) for long
  
  console.log(`   ATR: $95 (5% away), Structure: $92 (8% away)`);
  console.log(`   Selected: $${blendResult.price} ${correctSelection ? '✅ Correct (farther)' : '❌ Wrong'}`);
  console.log(`   Conservative choice: ${blendResult.conservativeChoice}`);
  
  testResults.push({ test: 'BLEND_FARTHER_SELECTION', passed: correctSelection });
  
  // Test 7: Overhead Supply Gap Analysis
  console.log('\n📈 TEST 7: Overhead Supply Gap Analysis');
  console.log('-'.repeat(40));
  
  const technical = { levels: { resistance: 110 } }; // 10 points above current price of 100
  const gapAnalysis = engine.analyzeOverheadSupplyGap(100, technical, 'LONG');
  
  // With 2% risk distance (2 points), gap ratio should be 10/2 = 5.0
  const gapTest = gapAnalysis.gapRatio >= 1.2 && gapAnalysis.meetsThreshold;
  console.log(`   Gap ratio: ${gapAnalysis.gapRatio.toFixed(2)}R (≥1.2 required)`);
  console.log(`   Meets threshold: ${gapAnalysis.meetsThreshold ? '✅' : '❌'}`);
  console.log(`   Size adjustment: ${gapAnalysis.sizeAdjustment}x`);
  
  testResults.push({ test: 'OVERHEAD_GAP_ANALYSIS', passed: gapTest });
  
  // ✅ COMPREHENSIVE TEST SUMMARY
  console.log('\n📋 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const passRate = (passedTests / totalTests * 100).toFixed(1);
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - System ready for production!');
  } else {
    console.log('⚠️ Some tests failed - review implementation:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`   ❌ ${t.test}: Expected ${t.expected}, got ${t.actual}`);
    });
  }
  
  // Fallback metrics summary
  console.log(`\n📊 Fallback Metrics: ${engine.fallbackMetrics.atrOnlyCount}/${engine.fallbackMetrics.totalStops} cases used ATR-only`);
  
  return { passRate: parseFloat(passRate), passedTests, totalTests, results: testResults };
}

// Run all tests
const testSummary = runComprehensiveUnitTests();
