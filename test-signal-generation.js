const AdvancedTechnicalAnalysis = require('./src/utils/advancedTechnicalAnalysis');

// Test data generator - creates synthetic OHLC data with trend
function generateTestData(days = 250, trend = 'uptrend') {
  const data = [];
  let price = 100;
  const date = new Date();
  
  for (let i = 0; i < days; i++) {
    const volatility = 0.02; // 2% daily volatility
    const random = (Math.random() - 0.5) * 2 * volatility;
    
    // Add trend component
    let trendComponent = 0;
    if (trend === 'uptrend') {
      trendComponent = 0.001; // 0.1% daily upward trend
    } else if (trend === 'downtrend') {
      trendComponent = -0.001; // 0.1% daily downward trend
    }
    
    const change = random + trendComponent;
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    
    data.push({
      date: new Date(date.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
    
    price = close;
  }
  
  return data;
}

async function testSignalGeneration() {
  console.log('Testing signal generation with synthetic data...\n');
  
  try {
    // Test with uptrend data
    console.log('=== Testing with UPTREND data ===');
    const uptrendData = generateTestData(250, 'uptrend');
    const uptrendAnalysis = await AdvancedTechnicalAnalysis.analyzeStock(uptrendData, 'TEST_UP');
    
    console.log('Uptrend signals:', {
      overall: uptrendAnalysis.signals.overall,
      strength: uptrendAnalysis.signals.strength,
      direction: uptrendAnalysis.signals.direction,
      alerts: uptrendAnalysis.signals.alerts
    });
    
    console.log('SEPA analysis:', uptrendAnalysis.signals.systems.sepa);
    
    // Test with downtrend data
    console.log('\n=== Testing with DOWNTREND data ===');
    const downtrendData = generateTestData(250, 'downtrend');
    const downtrendAnalysis = await AdvancedTechnicalAnalysis.analyzeStock(downtrendData, 'TEST_DOWN');
    
    console.log('Downtrend signals:', {
      overall: downtrendAnalysis.signals.overall,
      strength: downtrendAnalysis.signals.strength,
      direction: downtrendAnalysis.signals.direction,
      alerts: downtrendAnalysis.signals.alerts
    });
    
    console.log('SEPA analysis:', downtrendAnalysis.signals.systems.sepa);
    
    // Test with sideways data
    console.log('\n=== Testing with SIDEWAYS data ===');
    const sidewaysData = generateTestData(250, 'sideways');
    const sidewaysAnalysis = await AdvancedTechnicalAnalysis.analyzeStock(sidewaysData, 'TEST_SIDE');
    
    console.log('Sideways signals:', {
      overall: sidewaysAnalysis.signals.overall,
      strength: sidewaysAnalysis.signals.strength,
      direction: sidewaysAnalysis.signals.direction,
      alerts: sidewaysAnalysis.signals.alerts
    });
    
    console.log('SEPA analysis:', sidewaysAnalysis.signals.systems.sepa);
    
    console.log('\n=== Summary ===');
    console.log('Signal generation test completed. The system can generate signals with synthetic data.');
    
  } catch (error) {
    console.error('Error testing signal generation:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSignalGeneration();
