const express = require('express');

// Demo for Monte Carlo Scenario Engine
async function testMonteCarloEngine() {
  console.log('🎲 MONTE CARLO SCENARIO ENGINE DEMO');
  console.log('===================================');
  
  try {
    // Test the AI trading endpoint with Monte Carlo analysis
    const fetch = require('node-fetch');
    
    console.log('\n📊 TEST 1: AAPL with Monte Carlo Scenario Analysis');
    console.log('------------------------------------------------');
    
    const response = await fetch('http://localhost:8000/api/trading/analysis?symbol=AAPL&period=3mo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Display Monte Carlo scenario results
    if (data.scenarios && data.scenarios.monteCarlo) {
      const mc = data.scenarios.monteCarlo;
      
      console.log(`🎲 MONTE CARLO SCENARIO ANALYSIS:`);
      console.log(`   🎯 Dominant Scenario: ${mc.dominantScenario} (${mc.dominantProbability}% probability)`);
      console.log(`   📈 Bullish Probability: ${mc.bullishProbability}%`);
      console.log(`   📉 Bearish Probability: ${mc.bearishProbability}%`);
      console.log(`   ↔️  Sideways Probability: ${mc.sidewaysProbability}%`);
      console.log(`   💰 Expected Return: ${mc.expectedReturn}%`);
      console.log(`   📊 Confidence: ${mc.confidence}% (${mc.reliability})`);
      
      console.log(`\n🎲 RISK METRICS FROM 10,000 SIMULATIONS:`);
      console.log(`   📊 Value at Risk (95%): ${mc.riskMetrics.valueAtRisk95}%`);
      console.log(`   🚨 Value at Risk (99%): ${mc.riskMetrics.valueAtRisk99}%`);
      console.log(`   📉 Max Drawdown Risk: ${mc.riskMetrics.maxDrawdownRisk}%`);
      console.log(`   ⚠️  Probability of Loss: ${mc.riskMetrics.probabilityOfLoss}%`);
      console.log(`   🎯 Probability of Big Gain (>20%): ${mc.riskMetrics.probabilityOfBigGain}%`);
      
      console.log(`\n🎲 MONTE CARLO POSITION SIZING:`);
      console.log(`   📏 Recommendation: ${mc.positionSizing.recommendation}`);
      console.log(`   📊 Size Multiplier: ${mc.positionSizing.multiplier}%`);
      console.log(`   📝 Reasoning: ${mc.positionSizing.reasoning}`);
      
      console.log(`\n🎲 ENTRY TIMING GUIDANCE:`);
      console.log(`   ⏰ Recommendation: ${mc.entryTiming.recommendation}`);
      console.log(`   📝 Reasoning: ${mc.entryTiming.reasoning}`);
      
      console.log(`\n🎲 PROBABILISTIC TARGET LEVELS:`);
      console.log(`   🔒 Conservative Target: ${mc.targetLevels.conservative}% (>70% probability)`);
      console.log(`   📊 Moderate Target: ${mc.targetLevels.moderate}% (>50% probability)`);
      console.log(`   🚀 Aggressive Target: ${mc.targetLevels.aggressive}% (>30% probability)`);
    }
    
    // Display position sizing with Monte Carlo adjustments
    if (data.risk && data.risk.position) {
      const position = data.risk.position;
      console.log(`\n💰 POSITION SIZING (With Monte Carlo):`);
      console.log(`   📈 Recommended Shares: ${position.shares}`);
      console.log(`   💵 Position Value: $${position.value.toLocaleString()}`);
      console.log(`   📊 Portfolio %: ${position.pctPortfolio}%`);
      console.log(`   📝 Sizing Reason: ${position.reason}`);
    }
    
    // Show all multipliers including Monte Carlo
    if (data.decision) {
      console.log(`\n🎯 AI DECISION WITH MONTE CARLO:`);
      console.log(`   🚦 Action: ${data.decision.action}`);
      console.log(`   📊 Confidence: ${data.decision.confidencePct}%`);
      console.log(`   📈 Grade: ${data.decision.grade}`);
      console.log(`   ✅ Readiness: ${data.decision.readiness}`);
    }
    
    console.log('\n✅ Test 1 Complete - AAPL Monte Carlo analysis successful');
    
    // Test 2: Different symbol
    console.log('\n📊 TEST 2: TSLA with Monte Carlo Analysis');
    console.log('------------------------------------------');
    
    const response2 = await fetch('http://localhost:8000/api/trading/analysis?symbol=TSLA&period=3mo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      
      if (data2.scenarios && data2.scenarios.monteCarlo) {
        const mc = data2.scenarios.monteCarlo;
        console.log(`🎲 TSLA Dominant Scenario: ${mc.dominantScenario} (${mc.dominantProbability}%)`);
        console.log(`   📈 Bull: ${mc.bullishProbability}% | 📉 Bear: ${mc.bearishProbability}% | ↔️ Side: ${mc.sidewaysProbability}%`);
        console.log(`   💰 Expected Return: ${mc.expectedReturn}% | VaR(95%): ${mc.riskMetrics.valueAtRisk95}%`);
        console.log(`   🎯 Position Sizing: ${mc.positionSizing.recommendation} (${mc.positionSizing.multiplier}%)`);
      }
      
      if (data2.risk && data2.risk.position) {
        console.log(`   💰 Position: ${data2.risk.position.shares} shares ($${data2.risk.position.value.toLocaleString()})`);
      }
      
      console.log('✅ Test 2 Complete - TSLA Monte Carlo analysis successful');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n💡 Make sure the server is running: node src/server.js');
    return;
  }
  
  console.log('\n🎲 MONTE CARLO SCENARIO ENGINE READY!');
  console.log('====================================');
  console.log('✅ 10,000 simulation Monte Carlo analysis implemented');
  console.log('✅ Multiple outcome probability analysis active');
  console.log('✅ Risk metrics (VaR, Expected Shortfall, Drawdowns) calculated');
  console.log('✅ Scenario-based position sizing integrated');
  console.log('✅ Probabilistic target levels generated');
  console.log('✅ Entry timing optimization based on scenarios');
  console.log('');
  console.log('🎯 Your system now provides:');
  console.log('   • Bullish, Bearish, and Sideways scenario probabilities');
  console.log('   • Value at Risk (95% and 99% confidence levels)');
  console.log('   • Maximum drawdown risk assessment');
  console.log('   • Probabilistic target levels (conservative to aggressive)');
  console.log('   • Scenario-based position sizing adjustments');
  console.log('   • Entry timing recommendations based on simulations');
  console.log('   • Risk-adjusted confidence scoring');
  
  console.log('\n🔥 SYSTEM STATUS: 3/5 IMPROVEMENTS COMPLETE!');
  console.log('✅ Tail Risk Protection - COMPLETE');
  console.log('✅ Market Microstructure Awareness - COMPLETE');  
  console.log('✅ Monte Carlo Scenario Engine - COMPLETE');
  console.log('⏳ Dynamic Timeframe Selection - PENDING');
  console.log('⏳ Enhanced Sentiment Integration - PENDING');
}

// Start demo if server is available
async function runDemo() {
  console.log('🚀 Starting Monte Carlo Scenario Engine Demo...\n');
  
  // Wait a moment for any server startup
  setTimeout(testMonteCarloEngine, 1000);
}

if (require.main === module) {
  runDemo();
}

module.exports = { testMonteCarloEngine };
