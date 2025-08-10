#!/usr/bin/env node

/**
 * 🔧 DEBUG: Technical Indicators Structure Investigation
 * Check what structure is actually returned by getTechnicalAnalysisData
 */

const axios = require('axios');

async function debugTechnicalIndicators() {
  try {
    console.log('🔧 DEBUG: Testing technical indicators structure...');
    
    const response = await axios.get('http://localhost:8000/api/trading/analysis', {
      params: {
        symbol: 'AAPL',
        period: '6mo',
        capital: 100000
      },
      timeout: 30000 // 30 second timeout
    });

    const technical = response.data.technical;
    
    console.log('\n📊 Technical Analysis Structure Debug:');
    console.log('=======================================');
    
    console.log('\n🔍 Root level properties:');
    console.log('Keys:', Object.keys(technical));
    
    console.log('\n🔍 technicalIndicators structure:');
    if (technical.technicalIndicators) {
      console.log('Has technicalIndicators:', true);
      console.log('technicalIndicators keys:', Object.keys(technical.technicalIndicators));
      
      if (technical.technicalIndicators.latest) {
        console.log('\n🎯 latest indicators available:');
        console.log('latest keys:', Object.keys(technical.technicalIndicators.latest));
        
        // Test specific indicators we're looking for
        const testIndicators = ['ema200', 'atr', 'rsi', 'macd', 'adx', 'ema20', 'ema50'];
        testIndicators.forEach(indicator => {
          const value = technical.technicalIndicators.latest[indicator];
          console.log(`  ${indicator}:`, value !== undefined ? value : 'MISSING');
        });
      } else {
        console.log('❌ No latest indicators found!');
      }
    } else {
      console.log('❌ No technicalIndicators property found!');
    }
    
    console.log('\n🔍 Legacy indicators structure:');
    if (technical.indicators) {
      console.log('Has indicators:', true);
      console.log('indicators keys:', Object.keys(technical.indicators));
      
      if (technical.indicators.latest) {
        console.log('legacy indicators latest keys:', Object.keys(technical.indicators.latest));
      }
    } else {
      console.log('❌ No indicators property found!');
    }
    
    console.log('\n🔍 levels structure:');
    if (technical.levels) {
      console.log('Has levels:', true);
      console.log('levels:', technical.levels);
    } else {
      console.log('❌ No levels property found!');
    }

    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run debug
debugTechnicalIndicators();
