#!/usr/bin/env node

/**
 * 🔧 COMPREHENSIVE TEST: All Technical Indicators Properties
 * Validates that ALL properties accessed via technical?.technicalIndicators?.latest? are available
 */

const axios = require('axios');

async function testAllTechnicalProperties() {
  console.log('🔧 COMPREHENSIVE TEST: Validating ALL technical indicators properties...\n');
  
  // List of ALL properties that are accessed in the codebase
  const expectedProperties = [
    // Core technical indicators
    'ema200', 'ema50', 'ema20', 'atr', 'rsi', 'macd', 'macdSignal',
    'adx', 'plusDI', 'minusDI',
    // Volume properties  
    'volume', 'volumeRatio', 'avgVolume', 'avgVolume20DMA', 'vol20dma',
    // Price levels
    'resistance', 'support',
    // Base price
    'price'
  ];

  try {
    console.log('📊 Testing API endpoint for technical indicators...');
    
    const response = await axios.get('http://localhost:8000/api/trading/analysis', {
      params: {
        symbol: 'AAPL',
        period: '6mo', 
        capital: 100000
      },
      timeout: 30000
    });

    console.log('✅ API Response received successfully\n');
    
    const technical = response.data.technical;
    
    if (!technical) {
      console.error('❌ No technical object in response');
      return;
    }
    
    if (!technical.technicalIndicators) {
      console.error('❌ No technicalIndicators object in technical');
      return;
    }
    
    if (!technical.technicalIndicators.latest) {
      console.error('❌ No latest object in technicalIndicators');
      return;
    }
    
    console.log('🎯 PROPERTY AVAILABILITY CHECK:');
    console.log('================================');
    
    const latest = technical.technicalIndicators.latest;
    const availableProperties = Object.keys(latest);
    
    let allPropertiesAvailable = true;
    let missingProperties = [];
    let availableCount = 0;
    
    expectedProperties.forEach(prop => {
      const isAvailable = latest.hasOwnProperty(prop);
      const value = latest[prop];
      const status = isAvailable ? '✅' : '❌';
      
      console.log(`  ${status} ${prop}: ${isAvailable ? (value !== null && value !== undefined ? value : 'null/undefined') : 'MISSING'}`);
      
      if (isAvailable) {
        availableCount++;
      } else {
        allPropertiesAvailable = false;
        missingProperties.push(prop);
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log('=============');
    console.log(`✅ Available: ${availableCount}/${expectedProperties.length} properties`);
    console.log(`❌ Missing: ${missingProperties.length} properties`);
    
    if (missingProperties.length > 0) {
      console.log(`🚨 Missing properties: ${missingProperties.join(', ')}`);
    }
    
    console.log(`\n🔍 Extra properties found: ${availableProperties.filter(p => !expectedProperties.includes(p)).join(', ') || 'None'}`);
    
    if (allPropertiesAvailable) {
      console.log('\n🎉 SUCCESS: All expected properties are available!');
      console.log('✅ The technical?.technicalIndicators?.latest? access pattern should work correctly throughout the codebase.');
    } else {
      console.log('\n⚠️  WARNING: Some properties are missing!');
      console.log('🔧 These need to be added to prevent runtime errors.');
    }
    
    // Test some specific access patterns from the codebase
    console.log('\n🧪 TESTING REAL ACCESS PATTERNS:');
    console.log('==================================');
    
    const testPatterns = [
      { pattern: 'technical?.technicalIndicators?.latest?.ema200', value: technical?.technicalIndicators?.latest?.ema200 },
      { pattern: 'technical?.technicalIndicators?.latest?.atr', value: technical?.technicalIndicators?.latest?.atr },
      { pattern: 'technical?.technicalIndicators?.latest?.avgVolume20DMA', value: technical?.technicalIndicators?.latest?.avgVolume20DMA },
      { pattern: 'technical?.technicalIndicators?.latest?.resistance', value: technical?.technicalIndicators?.latest?.resistance },
      { pattern: 'technical?.technicalIndicators?.latest?.support', value: technical?.technicalIndicators?.latest?.support }
    ];
    
    testPatterns.forEach(test => {
      const status = test.value !== undefined && test.value !== null ? '✅' : '❌';
      console.log(`  ${status} ${test.pattern} = ${test.value}`);
    });
    
    console.log('\n✅ Comprehensive test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Server not running. Please start with: node src/server.js');
    }
  }
}

testAllTechnicalProperties();
