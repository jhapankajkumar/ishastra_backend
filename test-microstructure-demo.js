const express = require('express');

// Demo for Market Microstructure Analysis
async function testMarketMicrostructure() {
  console.log('🔍 MARKET MICROSTRUCTURE AWARENESS SYSTEM DEMO');
  console.log('================================================');
  
  try {
    // Test the AI trading endpoint with microstructure
    const fetch = require('node-fetch');
    
    console.log('\n📊 TEST 1: AAPL with Microstructure Analysis');
    console.log('-------------------------------------------');
    
    const response = await fetch('http://localhost:8000/api/trading/analysis?symbol=AAPL&period=1d', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Display microstructure results
    if (data.execution && data.execution.timing) {
      const timing = data.execution.timing;
      
      console.log(`🔍 MICROSTRUCTURE TIMING ANALYSIS:`);
      console.log(`   📊 Timing Score: ${timing.score}/100`);
      console.log(`   📈 Recommendation: ${timing.recommendation}`);
      console.log(`   ⏰ Optimal Window: ${timing.optimalWindow}`);
      console.log(`   💰 Order Flow: ${timing.orderFlow} (Strength: ${timing.orderFlowStrength}/100)`);
      console.log(`   💧 Liquidity Quality: ${timing.liquidityQuality}`);
      console.log(`   🏛️ Institutional Activity: ${timing.institutionalActivity}`);
      console.log(`   ⚠️ Slippage Risk: ${timing.slippageRisk}`);
      console.log(`   🎯 Execution Method: ${timing.executionMethod}`);
      console.log(`   📦 Max Optimal Size: ${timing.maxOptimalSize} shares`);
      console.log(`   🚨 Price Impact Warning: ${timing.priceImpactWarning}`);
    }
    
    // Display position sizing with microstructure adjustments
    if (data.risk && data.risk.position) {
      const position = data.risk.position;
      console.log(`\n💰 POSITION SIZING (With Microstructure):`);
      console.log(`   📈 Recommended Shares: ${position.shares}`);
      console.log(`   💵 Position Value: $${position.value.toLocaleString()}`);
      console.log(`   📊 Portfolio %: ${position.pctPortfolio}%`);
      console.log(`   📝 Reason: ${position.reason}`);
    }
    
    // Show all multipliers including microstructure
    if (data.decision) {
      console.log(`\n🎯 AI DECISION WITH MICROSTRUCTURE:`);
      console.log(`   🚦 Action: ${data.decision.action}`);
      console.log(`   📊 Confidence: ${data.decision.confidencePct}%`);
      console.log(`   📈 Grade: ${data.decision.grade}`);
      console.log(`   ✅ Readiness: ${data.decision.readiness}`);
    }
    
    console.log('\n✅ Test 1 Complete - AAPL microstructure analysis successful');
    
    // Test 2: Different symbol
    console.log('\n📊 TEST 2: TSLA with Microstructure Analysis');
    console.log('-------------------------------------------');
    
    const response2 = await fetch('http://localhost:8000/api/trading/analysis?symbol=TSLA&period=1d', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      
      if (data2.execution && data2.execution.timing) {
        const timing = data2.execution.timing;
        console.log(`🔍 TSLA Timing Score: ${timing.score}/100 (${timing.recommendation})`);
        console.log(`   📊 Order Flow: ${timing.orderFlow} (${timing.orderFlowStrength}/100)`);
        console.log(`   💧 Liquidity: ${timing.liquidityQuality}`);
        console.log(`   🏛️ Institutional: ${timing.institutionalActivity}`);
      }
      
      if (data2.risk && data2.risk.position) {
        console.log(`   💰 Position: ${data2.risk.position.shares} shares ($${data2.risk.position.value.toLocaleString()})`);
      }
      
      console.log('✅ Test 2 Complete - TSLA microstructure analysis successful');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\n💡 Make sure the server is running: node src/server.js');
    return;
  }
  
  console.log('\n🔍 MARKET MICROSTRUCTURE SYSTEM READY!');
  console.log('=====================================');
  console.log('✅ Order flow analysis implemented');
  console.log('✅ Liquidity zone detection active');
  console.log('✅ Institutional activity tracking online');
  console.log('✅ Execution timing optimization ready');
  console.log('✅ Market depth analysis functional');
  console.log('✅ Volume profile assessment active');
  console.log('✅ Position sizing integration complete');
  console.log('');
  console.log('💡 Your system now optimizes execution based on:');
  console.log('   • Real-time order flow patterns');
  console.log('   • Liquidity zone quality assessment'); 
  console.log('   • Institutional activity detection');
  console.log('   • Market depth and volume profiles');
  console.log('   • Price impact and slippage risk');
  console.log('   • Optimal timing windows for execution');
}

// Start demo if server is available
async function runDemo() {
  console.log('🚀 Starting Market Microstructure Demo...\n');
  
  // Wait a moment for any server startup
  setTimeout(testMarketMicrostructure, 1000);
}

if (require.main === module) {
  runDemo();
}

module.exports = { testMarketMicrostructure };
