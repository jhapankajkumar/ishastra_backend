/**
 * Test script to verify new trading systems are available in getAnalysis API
 */

const AdvancedTechnicalAnalysis = require('./src/utils/advancedTechnicalAnalysis');

async function testAnalysisAPI() {
  console.log('🔍 Testing if new systems are available in Analysis API...\n');
  
  try {
    // Generate test data to ensure we have signals
    function generateTestData(days = 200) {
      const data = [];
      let price = 3000;
      const date = new Date();
      
      for (let i = 0; i < days; i++) {
        const volatility = 0.02;
        const trendComponent = 0.001; // Slight uptrend
        const random = (Math.random() - 0.5) * 2 * volatility + trendComponent;
        
        const open = price;
        const close = price * (1 + random);
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        
        data.push({
          date: new Date(date.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000) + 500000
        });
        
        price = close;
      }
      
      return data;
    }
    
    const testData = generateTestData(200);
    console.log(`📊 Generated ${testData.length} data points`);
    
    // Call the same function used by getAnalysis API
    const analysis = await AdvancedTechnicalAnalysis.analyzeStock(testData, 'TCS.NS');
    
    console.log('🎯 Available Systems in Raw Analysis:');
    console.log('=====================================');
    
    const systems = analysis.signals.systems;
    Object.keys(systems).forEach(systemName => {
      const system = systems[systemName];
      console.log(`✅ ${systemName.toUpperCase()}:`);
      console.log(`   Signal: ${system.signal}`);
      console.log(`   Confidence: ${(system.confidence * 100).toFixed(1)}%`);
      if (system.reasoning) {
        console.log(`   Reasoning: ${system.reasoning}`);
      }
      console.log('');
    });
    
    console.log('🔍 System Verification:');
    console.log('=======================');
    console.log(`✅ SEPA System: ${systems.sepa ? '✅ AVAILABLE' : '❌ MISSING'}`);
    console.log(`✅ Triple Screen: ${systems.tripleScreen ? '✅ AVAILABLE' : '❌ MISSING'}`);
    console.log(`✅ EMA System: ${systems.EMA_SYSTEM ? '✅ AVAILABLE' : '❌ MISSING'}`);
    console.log(`✅ RSI System: ${systems.RSI_SYSTEM ? '✅ AVAILABLE' : '❌ MISSING'}`);
    console.log(`✅ Darvas Box: ${systems.darvasBox ? '✅ AVAILABLE' : '❌ MISSING'}`);
    
    console.log('\n📋 Overall Analysis:');
    console.log('===================');
    console.log(`Overall Signal: ${analysis.signals.overall}`);
    console.log(`Direction: ${analysis.signals.direction}`);
    console.log(`Strength: ${(analysis.signals.strength * 100).toFixed(1)}%`);
    
    console.log('\n🎯 CONCLUSION:');
    console.log('==============');
    if (systems.EMA_SYSTEM && systems.RSI_SYSTEM) {
      console.log('✅ NEW SYSTEMS SUCCESSFULLY INTEGRATED!');
      console.log('✅ Both EMA_SYSTEM and RSI_SYSTEM are available');
      console.log('✅ getAnalysis API will include these systems');
    } else {
      console.log('❌ Systems not properly integrated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAnalysisAPI();
