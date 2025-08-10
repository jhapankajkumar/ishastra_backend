#!/usr/bin/env node

/**
 * 🔧 DIRECT TEST: Technical Indicators Structure
 * Test the getTechnicalAnalysisData function directly
 */

// Import the required modules
const path = require('path');
const { getTechnicalAnalysisData } = require('./src/controllers/ai/trade.controller.js');

async function testTechnicalIndicatorsDirectly() {
  try {
    console.log('🔧 DIRECT TEST: Testing getTechnicalAnalysisData function...\n');
    
    // Test the function directly
    const result = await getTechnicalAnalysisData('AAPL', '6mo');
    
    console.log('📊 Technical Analysis Structure:');
    console.log('================================');
    
    console.log('\n🔍 Root level properties:');
    console.log('Keys:', Object.keys(result));
    
    console.log('\n🔍 technicalIndicators structure:');
    if (result.technicalIndicators) {
      console.log('✅ Has technicalIndicators');
      console.log('technicalIndicators keys:', Object.keys(result.technicalIndicators));
      
      if (result.technicalIndicators.latest) {
        console.log('\n🎯 latest indicators available:');
        console.log('latest keys:', Object.keys(result.technicalIndicators.latest));
        
        // Test specific indicators we're looking for
        const testIndicators = ['ema200', 'ema50', 'ema20', 'atr', 'rsi', 'macd', 'macdSignal', 'adx', 'plusDI', 'minusDI'];
        testIndicators.forEach(indicator => {
          const value = result.technicalIndicators.latest[indicator];
          console.log(`  ${indicator}:`, value !== undefined && value !== null ? value : '❌ MISSING');
        });
      } else {
        console.log('❌ No latest indicators found!');
      }
    } else {
      console.log('❌ No technicalIndicators property found!');
    }
    
    console.log('\n🔍 levels structure:');
    if (result.levels) {
      console.log('✅ Has levels');
      console.log('levels:', result.levels);
    } else {
      console.log('❌ No levels property found!');
    }

    console.log('\n✅ Direct test complete!');
    
  } catch (error) {
    console.error('❌ Direct test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Check if we can import the function
try {
  console.log('🔍 Checking if we can import getTechnicalAnalysisData...');
  // We'll need to mock this properly since it's not exported directly
  console.log('⚠️ Function is not exported, need to test via API instead');
  console.log('Please start the server with: node src/server.js');
  console.log('Then run: node debug-technical-indicators.js');
} catch (error) {
  console.error('❌ Import failed:', error.message);
}
