const AdvancedTechnicalAnalysis = require('./src/utils/advancedTechnicalAnalysis');

async function debugSystemMapping() {
  console.log('🔍 Debugging Trading System Mapping...\n');
  
  // Test data generator - creates uptrending data
  function generateUpTrendData(days = 250) {
    const data = [];
    let price = 100;
    const date = new Date();
    
    for (let i = 0; i < days; i++) {
      const volatility = 0.015; // 1.5% volatility
      const trendComponent = 0.0008; // Slight uptrend
      const random = (Math.random() - 0.5) * 2 * volatility + trendComponent;
      
      const open = price;
      const close = price * (1 + random);
      const high = Math.max(open, close) * (1 + Math.random() * 0.008);
      const low = Math.min(open, close) * (1 - Math.random() * 0.008);
      
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
  
  try {
    const testData = generateUpTrendData(250);
    const analysis = await AdvancedTechnicalAnalysis.analyzeStock(testData, 'DEBUG_TEST');
    
    console.log('📊 Available Trading Systems:');
    console.log('===============================');
    
    const systemsAvailable = Object.keys(analysis.signals.systems);
    systemsAvailable.forEach(system => {
      const systemData = analysis.signals.systems[system];
      console.log(`🎯 ${system.toUpperCase()}:`);
      console.log(`   Signal: ${systemData.signal}`);
      console.log(`   Confidence: ${(systemData.confidence * 100).toFixed(1)}%`);
      if (systemData.criteriaType) {
        console.log(`   Type: ${systemData.criteriaType}`);
        console.log(`   Criteria Met: ${systemData.criteriaMetCount}/4`);
      }
      console.log('');
    });
    
    console.log('🔧 System Mapping for Backtesting:');
    console.log('==================================');
    
    // Map common system names to what's available
    const systemMap = {
      'sepa': 'sepa',
      'tripleScreen': 'tripleScreen', 
      'ema_cross': 'EMA_SYSTEM',
      'rsi_oversold': 'RSI_SYSTEM',
      'threeWeeksTight': 'threeWeeksTight',
      'cupHandle': 'cupHandle',
      'darvasBox': 'darvasBox'
    };
    
    Object.keys(systemMap).forEach(alias => {
      const actualSystem = systemMap[alias];
      const available = systemsAvailable.includes(actualSystem);
      console.log(`📋 "${alias}" → "${actualSystem}" ${available ? '✅' : '❌'}`);
    });
    
    console.log('\n🎯 Overall Analysis:');
    console.log('===================');
    console.log(`Overall Signal: ${analysis.signals.overall}`);
    console.log(`Direction: ${analysis.signals.direction}`);
    console.log(`Strength: ${(analysis.signals.strength * 100).toFixed(1)}%`);
    console.log(`Systems Analyzed: ${systemsAvailable.length}`);
    
    if (analysis.signals.alerts && analysis.signals.alerts.length > 0) {
      console.log('\n⚠️  Active Alerts:');
      analysis.signals.alerts.forEach(alert => console.log(`   • ${alert}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

debugSystemMapping();
