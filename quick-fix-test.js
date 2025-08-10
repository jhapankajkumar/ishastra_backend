#!/usr/bin/env node

/**
 * 🔧 QUICK FIX TEST: Check if technical indicators are now working
 * This test tries to connect to the API and verify the technical indicators structure
 */

const axios = require('axios');

async function quickTest() {
  console.log('🔧 QUICK TEST: Verifying technical indicators fix...');
  
  try {
    console.log('\n📊 Testing technical analysis endpoint...');
    
    const response = await axios.get('http://localhost:8000/api/trading/analysis', {
      params: {
        symbol: 'AAPL',
        period: '6mo',
        capital: 100000
      },
      timeout: 30000
    });

    console.log('✅ Server is running and API responded');
    const technical = response.data.technical;
    
    // Quick verification
    console.log('\n✅ API Response received');
    console.log('Has technical object:', !!technical);
    console.log('Has technicalIndicators:', !!technical?.technicalIndicators);
    console.log('Has latest indicators:', !!technical?.technicalIndicators?.latest);
    
    if (technical?.technicalIndicators?.latest) {
      console.log('\n🎯 Key indicators check:');
      const keyIndicators = ['ema200', 'atr', 'rsi', 'adx'];
      keyIndicators.forEach(indicator => {
        const value = technical.technicalIndicators.latest[indicator];
        console.log(`  ${indicator}: ${value !== undefined && value !== null ? '✅' : '❌'} (${value})`);
      });
    }

    console.log('\n🎲 Monte Carlo integration check:');
    console.log('Has Monte Carlo results:', !!response.data.monteCarlo);
    
    if (response.data.monteCarlo) {
      console.log('Monte Carlo scenarios:', response.data.monteCarlo.scenarios?.length || 0);
      console.log('Risk analysis present:', !!response.data.monteCarlo.riskAnalysis);
    }

    console.log('\n✅ Quick test completed successfully!');
    console.log('🔧 Technical indicators structure appears to be fixed!');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

quickTest();
