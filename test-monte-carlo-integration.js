/**
 * Test Monte Carlo Integration - Verify live probabilistic analysis
 * Tests the API endpoint with Monte Carlo scenario analysis
 */

const axios = require('axios');

async function testMonteCarloIntegration() {
  console.log('🎲 Testing Monte Carlo Integration...\n');
  
  const baseUrl = 'http://localhost:8000';
  const testSymbol = 'AAPL'; // Use a reliable symbol for testing
  const testPeriod = '6mo';
  const testCapital = '100000';
  
  try {
    console.log(`📊 Testing API endpoint: ${baseUrl}/api/trading/analysis`);
    console.log(`   Symbol: ${testSymbol}`);
    console.log(`   Period: ${testPeriod}`);
    console.log(`   Capital: $${testCapital}\n`);
    
    const startTime = Date.now();
    
    const response = await axios.get(`${baseUrl}/api/trading/analysis`, {
      params: {
        symbol: testSymbol,
        period: testPeriod,
        capital: testCapital
      },
      timeout: 60000 // 60 second timeout
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ API Response received in ${duration.toFixed(1)} seconds\n`);
    
    // Validate Monte Carlo section
    const monteCarlo = response.data.scenarios?.monteCarlo;
    
    if (!monteCarlo) {
      console.log('❌ Monte Carlo section missing from response');
      return false;
    }
    
    console.log('🎲 Monte Carlo Analysis Results:');
    console.log('================================');
    console.log(`Enabled: ${monteCarlo.enabled ? '✅' : '❌'}`);
    console.log(`Dominant Scenario: ${monteCarlo.dominantScenario}`);
    console.log(`Dominant Probability: ${monteCarlo.dominantProbability}%`);
    console.log(`Bullish Probability: ${monteCarlo.bullishProbability}%`);
    console.log(`Bearish Probability: ${monteCarlo.bearishProbability}%`);
    console.log(`Sideways Probability: ${monteCarlo.sidewaysProbability}%`);
    console.log(`Expected Return: ${monteCarlo.expectedReturn}%`);
    console.log(`Confidence: ${monteCarlo.confidence}%`);
    console.log(`Reliability: ${monteCarlo.reliability}`);
    
    console.log('\n📊 Risk Metrics:');
    console.log(`Value at Risk (95%): ${monteCarlo.riskMetrics.valueAtRisk95}%`);
    console.log(`Value at Risk (99%): ${monteCarlo.riskMetrics.valueAtRisk99}%`);
    console.log(`Max Drawdown Risk: ${monteCarlo.riskMetrics.maxDrawdownRisk}%`);
    console.log(`Probability of Loss: ${monteCarlo.riskMetrics.probabilityOfLoss}%`);
    console.log(`Probability of Big Gain: ${monteCarlo.riskMetrics.probabilityOfBigGain}%`);
    
    console.log('\n💰 Position Sizing:');
    console.log(`Recommendation: ${monteCarlo.positionSizing.recommendation}`);
    console.log(`Multiplier: ${monteCarlo.positionSizing.multiplier}%`);
    console.log(`Reasoning: ${monteCarlo.positionSizing.reasoning}`);
    
    console.log('\n⏰ Entry Timing:');
    console.log(`Recommendation: ${monteCarlo.entryTiming.recommendation}`);
    console.log(`Reasoning: ${monteCarlo.entryTiming.reasoning}`);
    
    console.log('\n🎯 Target Levels:');
    console.log(`Conservative: ${monteCarlo.targetLevels.conservative}%`);
    console.log(`Moderate: ${monteCarlo.targetLevels.moderate}%`);
    console.log(`Aggressive: ${monteCarlo.targetLevels.aggressive}%`);
    
    // Check if this is live data or placeholder
    const isLiveData = monteCarlo.enabled && monteCarlo.confidence > 30 && monteCarlo.reliability !== 'LOW';
    
    console.log('\n🔍 Integration Status:');
    console.log(`Live Monte Carlo Data: ${isLiveData ? '✅ YES' : '❌ NO (placeholder data)'}`);
    
    if (isLiveData) {
      console.log('✅ Monte Carlo integration successful - returning live probabilistic analysis');
    } else {
      console.log('⚠️  Monte Carlo integration incomplete - still using placeholder data');
    }
    
    // Test other subsystems for completeness
    console.log('\n🔧 Other Subsystem Status:');
    const tailRisk = response.data.risk?.tailRisk;
    console.log(`Tail Risk Protection: ${tailRisk?.protectionActive ? '🛡️  ACTIVE' : '💤 INACTIVE'} (${tailRisk?.level})`);
    
    const microstructure = response.data.execution?.timing;
    console.log(`Market Microstructure: Score ${microstructure?.score}/100 (${microstructure?.recommendation})`);
    
    const decision = response.data.decision;
    console.log(`AI Decision: ${decision?.action} (Grade: ${decision?.grade}, ${decision?.confidencePct}% confidence)`);
    
    console.log('\n🎯 Test Summary:');
    console.log(`API Status: ✅ WORKING`);
    console.log(`Response Time: ${duration.toFixed(1)}s`);
    console.log(`Monte Carlo Integration: ${isLiveData ? '✅ COMPLETE' : '⚠️  NEEDS DEBUGGING'}`);
    
    return isLiveData;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server appears to be offline. Please start the server with: npm run start');
    } else if (error.response) {
      console.log(`\n📊 Server responded with status: ${error.response.status}`);
      console.log(`Error details: ${error.response.data?.error || 'Unknown error'}`);
    }
    
    return false;
  }
}

// Run the test
testMonteCarloIntegration()
  .then(success => {
    console.log(`\n🏁 Test ${success ? 'PASSED' : 'NEEDS ATTENTION'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
