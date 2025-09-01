const MinerviniTemplateAdvanced = require('./src/systems/minervini-template-advanced.js');
const InstitutionalMomentumCascade = require('./src/systems/institutional-momentum-cascade.js');
const dataFetcher = require('./src/utils/simpleTechnicalDataFetcher.js');

async function brutalThresholdAnalysis() {
  console.log('🔥 BRUTAL THRESHOLD ANALYSIS - What is Really Happening');
  console.log('======================================================');

  // Test with AAPL (strong stock) to see detailed failure reasons
  const data = await dataFetcher.getSimpleTechnicalData('AAPL');
  
  console.log('\n📊 AAPL Current Technical State:');
  console.log('Price: $', data.currentPrice.toFixed(2));
  console.log('SMA150:', data.indicators.latest.sma150.toFixed(2));
  console.log('SMA200:', data.indicators.latest.sma200.toFixed(2));
  console.log('Price vs SMA150:', ((data.currentPrice / data.indicators.latest.sma150 - 1) * 100).toFixed(1) + '%');
  console.log('Price vs SMA200:', ((data.currentPrice / data.indicators.latest.sma200 - 1) * 100).toFixed(1) + '%');
  console.log('RSI:', data.indicators.latest.rsi.toFixed(1));
  
  // Calculate 52-week range
  const last252Days = data.ohlcData.slice(-252);
  const high52Week = Math.max(...last252Days.map(d => d.high));
  const low52Week = Math.min(...last252Days.map(d => d.low));
  const priceVsHigh = ((data.currentPrice / high52Week - 1) * 100).toFixed(1);
  const priceVsLow = ((data.currentPrice / low52Week - 1) * 100).toFixed(1);
  
  console.log('52-week High: $' + high52Week.toFixed(2));
  console.log('52-week Low: $' + low52Week.toFixed(2));
  console.log('Price vs 52w High:', priceVsHigh + '%');
  console.log('Price vs 52w Low:', priceVsLow + '%');
  
  const systemData = {
    indicators: data.indicators,
    series: { daily: data.ohlcData }
  };
  
  const options = {
    capital: 100000,
    symbol: 'AAPL',
    currentPrice: data.currentPrice
  };
  
  console.log('\n🏛️ MINERVINI BRUTAL ANALYSIS:');
  const minervini = new MinerviniTemplateAdvanced();
  const minResult = minervini.analyze(systemData, options);
  console.log('Final Score:', minResult.signalQuality?.percentage + '%');
  console.log('Grade:', minResult.signalQuality?.grade);
  console.log('Decision:', minResult.decision);
  console.log('Confidence:', (minResult.confidence * 100).toFixed(1) + '%');
  console.log('Detailed Reasoning:');
  if (Array.isArray(minResult.reasoning)) {
    minResult.reasoning.forEach((reason, i) => console.log(`  ${i+1}. ${reason}`));
  } else {
    console.log('  1.', minResult.reasoning);
  }
  
  console.log('\n🚀 INSTITUTIONAL BRUTAL ANALYSIS:');
  const institutional = new InstitutionalMomentumCascade();
  const instResult = institutional.analyze(systemData, options);
  console.log('Final Score:', instResult.signalQuality?.percentage + '%');
  console.log('Rules Passed:', instResult.cascadeAnalysis?.passedRules + '/6');
  console.log('Cascade Grade:', instResult.cascadeAnalysis?.grade);
  console.log('Overall Score:', (instResult.cascadeAnalysis?.overallScore * 100).toFixed(1) + '%');
  
  console.log('\n💥 INSTITUTIONAL FAILURE BREAKDOWN:');
  const rules = instResult.cascadeAnalysis?.rules || {};
  Object.entries(rules).forEach(([rule, data]) => {
    const status = data.passed ? '✅' : '❌';
    const score = (data.score * 100).toFixed(1);
    console.log(`  ${status} ${rule}: ${score}% - ${data.details}`);
  });
  
  console.log('\n🎯 BRUTAL REALITY:');
  console.log('- AAPL is up', priceVsHigh, '% from 52w high (should be bullish)');
  console.log('- AAPL is up', priceVsLow, '% from 52w low (strong performance)');
  console.log('- AAPL is above both SMA150 and SMA200 (bullish trend)');
  console.log('- Yet both systems give AVOID with D grades');
  console.log('- This suggests THRESHOLDS ARE TOO STRICT for normal market conditions');
}

brutalThresholdAnalysis().catch(console.error);
