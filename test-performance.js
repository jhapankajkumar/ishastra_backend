/**
 * Performance Test Script for Trading System API
 * Tests both original and optimized endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/trading';

async function testEndpoint(endpoint, data, label) {
  console.log(`\n🧪 Testing ${label}...`);
  console.log(`📊 Endpoint: ${endpoint}`);
  console.log(`📋 Data: ${JSON.stringify(data)}`);
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${API_BASE}${endpoint}`, data, {
      timeout: 30000 // 30 second timeout
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${label} SUCCESS`);
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📈 Symbols Analyzed: ${response.data.summary?.totalAnalyzed || 0}`);
    console.log(`🎯 Decisions: ${JSON.stringify(response.data.summary?.decisions || {})}`);
    console.log(`🔧 Mode: ${response.data.mode || 'STANDARD'}`);
    
    if (response.data.metadata?.actualResponseTime) {
      console.log(`📊 Server Reported Time: ${response.data.metadata.actualResponseTime}`);
    }
    
    return {
      success: true,
      duration,
      analyzedCount: response.data.summary?.totalAnalyzed || 0,
      mode: response.data.mode || 'STANDARD'
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ ${label} FAILED (${duration}ms)`);
    console.error(`🚨 Error: ${error.message}`);
    
    if (error.response?.data) {
      console.error(`📋 Server Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    return {
      success: false,
      duration,
      error: error.message,
      mode: 'FAILED'
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Trading System API Performance Tests');
  console.log('=====================================');
  
  const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];
  const testData = {
    symbols: testSymbols,
    capital: 100000
  };

  // Test 1: Fast Endpoint (Target: <1 second)
  const fastResult = await testEndpoint('/stock-analysis/fast', testData, 'FAST ENDPOINT');
  
  // Test 2: Original Endpoint (Should be slower but more comprehensive)
  const originalResult = await testEndpoint('/stock-analysis', testData, 'ORIGINAL ENDPOINT');
  
  // Results Summary
  console.log('\n📊 PERFORMANCE COMPARISON');
  console.log('=========================');
  
  console.log(`\n⚡ FAST ENDPOINT:`);
  console.log(`   Status: ${fastResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Time: ${fastResult.duration}ms`);
  console.log(`   Target: <1000ms`);
  console.log(`   Result: ${fastResult.duration < 1000 ? '🎯 TARGET MET' : '⚠️ TARGET MISSED'}`);
  
  console.log(`\n🔧 ORIGINAL ENDPOINT:`);
  console.log(`   Status: ${originalResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Time: ${originalResult.duration}ms`);
  console.log(`   Previous: ~5-10 seconds`);
  console.log(`   Improvement: ${originalResult.success ? `${Math.round((10000 - originalResult.duration) / 100)}% faster` : 'N/A'}`);
  
  // Performance Analysis
  if (fastResult.success && originalResult.success) {
    const speedup = Math.round(originalResult.duration / fastResult.duration * 10) / 10;
    console.log(`\n🚀 SPEED IMPROVEMENT:`);
    console.log(`   Fast vs Original: ${speedup}x faster`);
    console.log(`   Time Saved: ${originalResult.duration - fastResult.duration}ms`);
  }
  
  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (fastResult.duration < 1000) {
    console.log(`   ✅ Use /stock-analysis/fast for real-time trading`);
  } else {
    console.log(`   ⚠️ Fast endpoint needs more optimization`);
  }
  
  if (originalResult.success && originalResult.duration < 5000) {
    console.log(`   ✅ Use /stock-analysis for comprehensive analysis`);
  } else {
    console.log(`   ⚠️ Original endpoint still too slow`);
  }
}

// Error handling for the entire test suite
async function main() {
  try {
    await runPerformanceTests();
  } catch (error) {
    console.error('🚨 Test Suite Failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testEndpoint, runPerformanceTests };
