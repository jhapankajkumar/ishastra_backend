#!/usr/bin/env node

/**
 * RULE 11 VALIDATION TEST - Scenario Planning Consistency
 * 
 * Tests:
 * 1. BUY signals → Breakout confidence > Breakdown confidence
 * 2. SELL signals → Breakdown confidence > Breakout confidence
 * 3. All scenarios include required elements: triggerPrice, entryPrice, stopLoss, targets, riskReward, volumeRule, holdTimeTest, invalidationTriggers
 * 4. Validity definition is about setup re-evaluation, not holding period
 */

require('dotenv').config();
const { getAnalysis } = require('./src/controllers/ai/stock.expert.controller');

console.log('\n🎯 RULE 11: SCENARIO PLANNING CONSISTENCY VALIDATION');
console.log('='.repeat(80));

async function testRule11Scenarios() {
  const testSymbol = 'RELIANCE';
  
  console.log(`\n📊 Testing RULE 11 compliance for ${testSymbol}...`);
  
  try {
    // Create mock request/response objects
    const req = {
      query: { symbol: testSymbol },
      body: { symbol: testSymbol }
    };
    
    const res = {
      json: (data) => {
        console.log('\n🎯 RULE 11 Analysis Results:');
        console.log('-'.repeat(50));
        
        // Handle nested data structure
        const analysisData = data.data || data;
        const expert = analysisData.recommendations || analysisData.expertAIDecision;
        
        if (!expert) {
          console.log('❌ No recommendations found');
          console.log('Available keys:', Object.keys(analysisData));
          return;
        }
        
        // Check if scenarioPlanning exists with breakout/breakdown plans
        let breakout, breakdown, finalDecision;
        
        if (expert.scenarioPlanning) {
          breakout = expert.scenarioPlanning.breakoutPlan;
          breakdown = expert.scenarioPlanning.breakdownPlan;
          finalDecision = { 
            action: expert.action,
            confidence: expert.confidence / 100 // Convert back from percentage
          };
        } else {
          console.log('❌ Scenario planning not found');
          console.log('Expert keys:', Object.keys(expert));
          return;
        }
        
        if (!breakout || !breakdown || !finalDecision) {
          console.log('❌ Scenario plans or decision missing');
          console.log('Breakout exists:', !!breakout);
          console.log('Breakdown exists:', !!breakdown);
          console.log('Decision exists:', !!finalDecision);
          return;
        }
        
        console.log(`📋 Primary Action: ${finalDecision.action || 'Unknown'}`);
        console.log(`📊 Confidence: ${((finalDecision.confidence || 0) * 100).toFixed(1)}%`);
        
        console.log('\n🎯 RULE 11: DIRECTIONAL CONSISTENCY CHECK');
        console.log('-'.repeat(40));
        
        console.log(`🔼 Breakout Plan:`);
        console.log(`   Type: ${breakout.scenarioType || 'Not specified'}`);
        console.log(`   Confidence: ${(breakout.confidence * 100).toFixed(1)}%`);
        console.log(`   Entry: ${breakout.entryPrice}`);
        console.log(`   Stop: ${breakout.stopLoss}`);
        console.log(`   R/R: ${breakout.riskReward?.toFixed(2) || 'Not calculated'}`);
        
        console.log(`🔽 Breakdown Plan:`);
        console.log(`   Type: ${breakdown.scenarioType || 'Not specified'}`);
        console.log(`   Confidence: ${(breakdown.confidence * 100).toFixed(1)}%`);
        console.log(`   Entry: ${breakdown.entryPrice}`);
        console.log(`   Stop: ${breakdown.stopLoss}`);
        console.log(`   R/R: ${breakdown.riskReward?.toFixed(2) || 'Not calculated'}`);
        
        // RULE 11 COMPLIANCE CHECKS
        console.log('\n📋 RULE 11: COMPLIANCE VERIFICATION');
        console.log('-'.repeat(40));
        
        // Check 1: Directional consistency
        const action = finalDecision.action;
        let directionalConsistencyPass = false;
        
        if (action === 'BUY') {
          directionalConsistencyPass = breakout.confidence > breakdown.confidence;
          console.log(`✅ BUY Signal Test: ${breakout.confidence > breakdown.confidence ? '✅ PASS' : '❌ FAIL'} - Breakout confidence (${(breakout.confidence * 100).toFixed(1)}%) ${breakout.confidence > breakdown.confidence ? '>' : '≤'} Breakdown confidence (${(breakdown.confidence * 100).toFixed(1)}%)`);
        } else if (action === 'SELL') {
          directionalConsistencyPass = breakdown.confidence > breakout.confidence;
          console.log(`✅ SELL Signal Test: ${breakdown.confidence > breakout.confidence ? '✅ PASS' : '❌ FAIL'} - Breakdown confidence (${(breakdown.confidence * 100).toFixed(1)}%) ${breakdown.confidence > breakout.confidence ? '>' : '≤'} Breakout confidence (${(breakout.confidence * 100).toFixed(1)}%)`);
        } else {
          directionalConsistencyPass = Math.abs(breakout.confidence - breakdown.confidence) <= 0.1; // Equal within 10%
          console.log(`✅ HOLD/NEUTRAL Test: ${directionalConsistencyPass ? '✅ PASS' : '❌ FAIL'} - Confidence difference ${Math.abs(breakout.confidence - breakdown.confidence).toFixed(2)} (should be ≤0.1 for neutral)`);
        }
        
        // Check 2: Required scenario elements
        const requiredElements = [
          'triggerPrice', 'entryPrice', 'stopLoss', 'targets', 'riskReward', 
          'volumeRule', 'holdTimeTest', 'invalidationTriggers', 'validity'
        ];
        
        console.log('\n📋 Required Scenario Elements Check:');
        let elementsPass = true;
        
        [
          { name: 'Breakout', plan: breakout },
          { name: 'Breakdown', plan: breakdown }
        ].forEach(scenario => {
          console.log(`\n   ${scenario.name} Plan Elements:`);
          requiredElements.forEach(element => {
            const hasElement = scenario.plan[element] !== undefined && scenario.plan[element] !== null;
            let displayValue = hasElement ? scenario.plan[element] : 'Missing';
            if (element === 'targets' && hasElement) {
              displayValue = `Primary: ${scenario.plan[element].primary}, Secondary: ${scenario.plan[element].secondary}`;
            }
            if (element === 'invalidationTriggers' && hasElement) {
              displayValue = `${scenario.plan[element].length} triggers defined`;
            }
            console.log(`     ${element}: ${hasElement ? '✅' : '❌'} ${displayValue}`);
            if (!hasElement) elementsPass = false;
          });
        });
        
        // Check 3: Volume rule compliance (≥150%)
        const volumeRulePass = (
          (breakout.volumeRule && breakout.volumeRule.includes('≥150%')) &&
          (breakdown.volumeRule && breakdown.volumeRule.includes('≥150%'))
        );
        console.log(`\n📊 Volume Rule (≥150%): ${volumeRulePass ? '✅ PASS' : '❌ FAIL'}`);
        
        // Check 4: Hold time test (≥15min)
        const holdTimePass = (
          (breakout.holdTimeTest && breakout.holdTimeTest.includes('≥15')) &&
          (breakdown.holdTimeTest && breakdown.holdTimeTest.includes('≥15'))
        );
        console.log(`⏱️ Hold Time Test (≥15min): ${holdTimePass ? '✅ PASS' : '❌ FAIL'}`);
        
        // Check 5: Validity is about setup re-evaluation
        const validityPass = (
          breakout.validity && breakdown.validity &&
          (breakout.validity.includes('2-3 days') || breakout.validity.includes('Re-evaluate'))
        );
        console.log(`📅 Validity Definition: ${validityPass ? '✅ PASS' : '❌ FAIL'} - Setup re-evaluation timeframe`);
        
        // Final RULE 11 compliance summary
        const overallPass = directionalConsistencyPass && elementsPass && volumeRulePass && holdTimePass && validityPass;
        
        console.log('\n🎯 RULE 11: FINAL COMPLIANCE SUMMARY');
        console.log('='.repeat(50));
        console.log(`📊 Directional Consistency: ${directionalConsistencyPass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📋 Required Elements: ${elementsPass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📊 Volume Rule (≥150%): ${volumeRulePass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`⏱️ Hold Time (≥15min): ${holdTimePass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`📅 Validity Definition: ${validityPass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`\n🎯 RULE 11 OVERALL: ${overallPass ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
        
        if (overallPass) {
          console.log('\n🎉 RULE 11: Scenario Planning Consistency successfully implemented!');
        } else {
          console.log('\n⚠️ RULE 11: Some compliance issues detected - review implementation');
        }
        
        return data;
      },
      status: (statusCode) => ({ json: (data) => data })
    };
    
    // Execute analysis
    await getAnalysis(req, res);
    
  } catch (error) {
    console.error('❌ RULE 11 Test Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRule11Scenarios().then(() => {
  console.log('\n✅ RULE 11 validation test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ RULE 11 test failed:', error);
  process.exit(1);
});
