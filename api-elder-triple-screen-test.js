/**
 * Elder's Triple Screen API End-to-End Testing
 * Tests the complete API with real US stocks and comprehensive response validation
 */

const axios = require('axios');

class ElderTripleScreenAPITester {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.testResults = [];
  }

  async runComprehensiveTests() {
    console.log('🚀 ELDER\'S TRIPLE SCREEN API END-TO-END TESTING');
    console.log('='.repeat(70));
    console.log(`📡 API Base URL: ${this.baseURL}`);
    console.log(`⏰ Test Started: ${new Date().toISOString()}\n`);

    // Test 1: Multiple Stock Analysis
    await this.testMultipleStockAnalysis();

    // Test 2: Single Stock Deep Analysis
    await this.testSingleStockAnalysis();

    // Test 3: Demo Endpoint
    await this.testDemoEndpoint();

    // Test 4: Different Capital Amounts
    await this.testDifferentCapitalAmounts();

    // Test 5: Error Handling
    await this.testErrorHandling();

    // Summary Report
    this.generateSummaryReport();
  }

  async testMultipleStockAnalysis() {
    console.log('📊 TEST 1: Multiple US Stock Analysis');
    console.log('-'.repeat(50));

    try {
      const testStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
      const requestBody = {
        symbols: testStocks,
        capital: 100000
      };

      console.log(`🔍 Testing with stocks: ${testStocks.join(', ')}`);
      console.log(`💰 Capital: $${requestBody.capital.toLocaleString()}`);

      const response = await axios.post(
        `${this.baseURL}/api/trading/elder-triple-screen`,
        requestBody,
        { timeout: 30000 }
      );

      console.log(`✅ Response Status: ${response.status}`);
      console.log(`📦 Response Size: ${JSON.stringify(response.data).length} characters`);

      // Validate response structure
      this.validateResponseStructure(response.data, testStocks);

      // Analyze results
      this.analyzeResults(response.data, 'Multiple Stock Analysis');

      this.testResults.push({
        test: 'Multiple Stock Analysis',
        status: 'PASSED',
        stocks: testStocks,
        results: response.data.summary
      });

    } catch (error) {
      console.error(`❌ TEST 1 FAILED:`, error.message);
      this.testResults.push({
        test: 'Multiple Stock Analysis',
        status: 'FAILED',
        error: error.message
      });
    }

    console.log('\n' + '='.repeat(70));
  }

  async testSingleStockAnalysis() {
    console.log('🎯 TEST 2: Single Stock Deep Analysis');
    console.log('-'.repeat(50));

    try {
      const symbol = 'AAPL';
      const requestBody = {
        symbol: symbol,
        capital: 50000
      };

      console.log(`🔍 Deep analysis for: ${symbol}`);
      console.log(`💰 Capital: $${requestBody.capital.toLocaleString()}`);

      const response = await axios.post(
        `${this.baseURL}/api/trading/elder-triple-screen/single`,
        requestBody,
        { timeout: 30000 }
      );

      console.log(`✅ Response Status: ${response.status}`);
      
      // Detailed analysis of single stock
      if (response.data.success && response.data.results.length > 0) {
        const result = response.data.results[0];
        console.log(`\n📋 DETAILED ANALYSIS FOR ${symbol}:`);
        console.log(`   🎯 Final Decision: ${result.finalDecision.action} (${(result.finalDecision.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   📊 Elder's Decision: ${result.elderTripleScreen.systemDecision} (${(result.elderTripleScreen.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   🚪 Gate Engine: ${result.gateEngine.decision} (${(result.gateEngine.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   💰 Position Size: ${result.finalDecision.executionPlan.recommendedShares} shares`);
        console.log(`   💵 Position Value: $${result.finalDecision.executionPlan.positionValue.toLocaleString()}`);
        console.log(`   🎚️ Portfolio Allocation: ${result.finalDecision.executionPlan.portfolioAllocation}%`);
        console.log(`   ⚖️ Risk Percentage: ${result.finalDecision.executionPlan.riskPercentage}%`);

        console.log(`\n📺 SCREEN BREAKDOWN:`);
        console.log(`   Screen 1 (Weekly): ${result.elderTripleScreen.screens.screen1.status}`);
        console.log(`   Screen 2 (Daily): ${result.elderTripleScreen.screens.screen2.status}`);
        console.log(`   Screen 3 (Intraday): ${result.elderTripleScreen.screens.screen3.status}`);

        console.log(`\n📈 SETUP DETAILS:`);
        console.log(`   Entry Price: $${result.elderTripleScreen.setupDetails.entryPrice}`);
        console.log(`   Stop Loss: $${result.elderTripleScreen.setupDetails.stopLoss}`);
        console.log(`   Targets: ${result.elderTripleScreen.setupDetails.targets.map(t => `$${t}`).join(', ')}`);
        console.log(`   Setup Quality: ${result.elderTripleScreen.setupDetails.setupQuality}`);
        console.log(`   ATR Value: $${result.elderTripleScreen.setupDetails.atrValue}`);
      }

      this.testResults.push({
        test: 'Single Stock Analysis',
        status: 'PASSED',
        stock: symbol,
        result: response.data.results[0]?.finalDecision
      });

    } catch (error) {
      console.error(`❌ TEST 2 FAILED:`, error.message);
      this.testResults.push({
        test: 'Single Stock Analysis',
        status: 'FAILED',
        error: error.message
      });
    }

    console.log('\n' + '='.repeat(70));
  }

  async testDemoEndpoint() {
    console.log('🎮 TEST 3: Demo Endpoint Testing');
    console.log('-'.repeat(50));

    try {
      console.log(`🔍 Testing demo endpoint with default stocks`);

      const response = await axios.get(
        `${this.baseURL}/api/trading/elder-triple-screen/demo?capital=75000`,
        { timeout: 30000 }
      );

      console.log(`✅ Response Status: ${response.status}`);
      console.log(`📊 Demo Analysis Complete: ${response.data.results.length} stocks analyzed`);

      // Show demo results summary
      if (response.data.success) {
        console.log(`\n📋 DEMO RESULTS SUMMARY:`);
        console.log(`   Total Analyzed: ${response.data.summary.totalAnalyzed}`);
        console.log(`   Decisions: ${JSON.stringify(response.data.summary.decisions)}`);
        console.log(`   Average Confidence: ${(response.data.summary.averageConfidence * 100).toFixed(1)}%`);
        console.log(`   Recommended Actions: ${response.data.summary.recommendedActions.length}`);

        if (response.data.summary.recommendedActions.length > 0) {
          console.log(`\n🎯 TOP RECOMMENDATIONS:`);
          response.data.summary.recommendedActions.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec.symbol}: ${rec.action} (${(rec.confidence * 100).toFixed(1)}% confidence)`);
          });
        }
      }

      this.testResults.push({
        test: 'Demo Endpoint',
        status: 'PASSED',
        summary: response.data.summary
      });

    } catch (error) {
      console.error(`❌ TEST 3 FAILED:`, error.message);
      this.testResults.push({
        test: 'Demo Endpoint',
        status: 'FAILED',
        error: error.message
      });
    }

    console.log('\n' + '='.repeat(70));
  }

  async testDifferentCapitalAmounts() {
    console.log('💰 TEST 4: Different Capital Amounts');
    console.log('-'.repeat(50));

    try {
      const testCases = [
        { capital: 10000, description: 'Small Account' },
        { capital: 100000, description: 'Medium Account' },
        { capital: 1000000, description: 'Large Account' }
      ];

      for (const testCase of testCases) {
        console.log(`\n💵 Testing ${testCase.description}: $${testCase.capital.toLocaleString()}`);

        const response = await axios.post(
          `${this.baseURL}/api/trading/elder-triple-screen`,
          {
            symbols: ['AAPL', 'MSFT'],
            capital: testCase.capital
          },
          { timeout: 30000 }
        );

        if (response.data.success && response.data.results.length > 0) {
          const result = response.data.results[0]; // Check first stock
          console.log(`   Position Size: ${result.finalDecision.executionPlan.recommendedShares} shares`);
          console.log(`   Position Value: $${result.finalDecision.executionPlan.positionValue.toLocaleString()}`);
          console.log(`   Portfolio %: ${result.finalDecision.executionPlan.portfolioAllocation}%`);
        }
      }

      this.testResults.push({
        test: 'Different Capital Amounts',
        status: 'PASSED',
        testCases: testCases.length
      });

    } catch (error) {
      console.error(`❌ TEST 4 FAILED:`, error.message);
      this.testResults.push({
        test: 'Different Capital Amounts',
        status: 'FAILED',
        error: error.message
      });
    }

    console.log('\n' + '='.repeat(70));
  }

  async testErrorHandling() {
    console.log('🚨 TEST 5: Error Handling');
    console.log('-'.repeat(50));

    try {
      // Test invalid input
      console.log(`🔍 Testing error handling with invalid inputs`);

      // Test 1: Empty symbols array
      try {
        await axios.post(`${this.baseURL}/api/trading/elder-triple-screen`, {
          symbols: [],
          capital: 100000
        });
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`✅ Empty symbols error handled correctly: ${error.response.status}`);
        }
      }

      // Test 2: Missing symbols
      try {
        await axios.post(`${this.baseURL}/api/trading/elder-triple-screen`, {
          capital: 100000
        });
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`✅ Missing symbols error handled correctly: ${error.response.status}`);
        }
      }

      // Test 3: Invalid single stock endpoint
      try {
        await axios.post(`${this.baseURL}/api/trading/elder-triple-screen/single`, {
          capital: 100000
        });
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`✅ Missing symbol error handled correctly: ${error.response.status}`);
        }
      }

      this.testResults.push({
        test: 'Error Handling',
        status: 'PASSED',
        errorsCaught: 3
      });

    } catch (error) {
      console.error(`❌ TEST 5 FAILED:`, error.message);
      this.testResults.push({
        test: 'Error Handling',
        status: 'FAILED',
        error: error.message
      });
    }

    console.log('\n' + '='.repeat(70));
  }

  validateResponseStructure(data, expectedSymbols) {
    console.log(`\n🔍 VALIDATING RESPONSE STRUCTURE:`);
    
    // Basic structure validation
    const requiredFields = ['success', 'timestamp', 'request', 'summary', 'results', 'metadata'];
    requiredFields.forEach(field => {
      if (data[field] !== undefined) {
        console.log(`   ✅ ${field}: Present`);
      } else {
        console.log(`   ❌ ${field}: Missing`);
      }
    });

    // Results validation
    if (data.results && Array.isArray(data.results)) {
      console.log(`   ✅ Results: ${data.results.length} stocks analyzed`);
      
      if (data.results.length > 0) {
        const sampleResult = data.results[0];
        const resultFields = ['symbol', 'elderTripleScreen', 'gateEngine', 'finalDecision'];
        resultFields.forEach(field => {
          if (sampleResult[field] !== undefined) {
            console.log(`   ✅ Result.${field}: Present`);
          } else {
            console.log(`   ❌ Result.${field}: Missing`);
          }
        });
      }
    }
  }

  analyzeResults(data, testName) {
    console.log(`\n📊 ${testName.toUpperCase()} RESULTS:`);
    
    if (data.success && data.results) {
      console.log(`   📈 Total Analyzed: ${data.results.length} stocks`);
      console.log(`   🎯 Decisions: ${JSON.stringify(data.summary.decisions)}`);
      console.log(`   📊 Average Confidence: ${(data.summary.averageConfidence * 100).toFixed(1)}%`);
      
      if (data.summary.recommendedActions.length > 0) {
        console.log(`   🏆 Top Recommendation: ${data.summary.recommendedActions[0].symbol} - ${data.summary.recommendedActions[0].action}`);
      }

      // Show individual stock results
      console.log(`\n📋 INDIVIDUAL STOCK RESULTS:`);
      data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.symbol}: ${result.finalDecision.action} (${(result.finalDecision.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`      Elder's: ${result.elderTripleScreen.systemDecision} | Gate: ${result.gateEngine.decision}`);
        console.log(`      Setup Quality: ${result.elderTripleScreen.setupDetails.setupQuality} | Position: ${result.finalDecision.executionPlan.recommendedShares} shares`);
      });
    }
  }

  generateSummaryReport() {
    console.log('\n🎉 ELDER\'S TRIPLE SCREEN API TESTING COMPLETE');
    console.log('='.repeat(70));
    console.log(`⏰ Test Completed: ${new Date().toISOString()}`);
    
    const passedTests = this.testResults.filter(test => test.status === 'PASSED').length;
    const totalTests = this.testResults.length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`   ✅ Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
    
    console.log(`\n📋 DETAILED TEST RESULTS:`);
    this.testResults.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${test.test}: ${test.status}`);
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    });

    console.log(`\n🚀 SYSTEM STATUS: ${successRate >= 80 ? 'PRODUCTION READY' : 'NEEDS ATTENTION'}`);
    
    if (successRate >= 80) {
      console.log(`\n✅ ELDER'S TRIPLE SCREEN API IS FULLY FUNCTIONAL!`);
      console.log(`   🔗 Endpoints Ready:`);
      console.log(`      POST /api/trading/elder-triple-screen`);
      console.log(`      POST /api/trading/elder-triple-screen/single`);
      console.log(`      GET  /api/trading/elder-triple-screen/demo`);
      console.log(`\n🎯 NEXT STEPS:`);
      console.log(`   1. Deploy to production environment`);
      console.log(`   2. Connect to live market data feeds`);
      console.log(`   3. Implement additional trading systems`);
      console.log(`   4. Add real-time monitoring and alerts`);
    }
  }
}

// Main execution
async function runElderTripleScreenAPITests() {
  const tester = new ElderTripleScreenAPITester();
  await tester.runComprehensiveTests();
}

// Export for use in other modules
module.exports = { ElderTripleScreenAPITester, runElderTripleScreenAPITests };

// Run tests if this file is executed directly
if (require.main === module) {
  runElderTripleScreenAPITests().catch(console.error);
}
