const { TradingSystemController } = require('./src/controllers/signal-analysis.controller.js');

async function testUltraSelective() {
  console.log('🔥 ULTRA-SELECTIVE SYSTEM TEST');
  console.log('===============================');
  
  const testStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  
  let buyCount = 0;
  let watchCount = 0;
  let avoidCount = 0;
  const results = [];
  
  console.log('🎯 ULTRA-SELECTIVE THRESHOLDS ACTIVE:');
  console.log('  • Minervini Relative Strength: 75+ (was 50+)');
  console.log('  • Minervini Volume Expansion: 1.8x+ (was 1.1x+)');
  console.log('  • Minervini Fundamental Proxy: 70+ (was 40+)');
  console.log('  • Institutional Weekly Momentum: 12%+ (was 4%+)');
  console.log('  • Institutional Accumulation: 0.75+ (was 0.55+)');
  console.log('  • Only A+ grades get BUY signals');
  console.log('');
  
  for (const symbol of testStocks) {
    try {
      const controller = new TradingSystemController();
      const response = await controller.getStockAnalysis([symbol]);
      
      if (response?.results?.[0]) {
        const result = response.results[0];
        const action = result.decision?.action;
        const confidence = result.decision?.confidence;
        const minerviniGrade = result.systems?.minerviniTemplateAdvanced?.decision?.grade;
        const institutionalGrade = result.systems?.institutionalMomentumCascade?.decision?.grade;
        
        results.push({ symbol, action, confidence, minerviniGrade, institutionalGrade });
        
        if (action === 'BUY') buyCount++;
        else if (action === 'WATCH') watchCount++;
        else avoidCount++;
        
        console.log(`${symbol.padEnd(5)} | ${action.padEnd(5)} | ${confidence}% | M:${minerviniGrade} | I:${institutionalGrade}`);
      }
    } catch (error) {
      console.log(`${symbol.padEnd(5)} | ERROR | ${error.message}`);
    }
  }
  
  const total = testStocks.length;
  const buyPercentage = ((buyCount / total) * 100).toFixed(1);
  
  console.log(`\n🔥 ULTRA-SELECTIVE RESULTS:`);
  console.log(`📈 BUY Signals: ${buyCount}/${total} (${buyPercentage}%)`);
  console.log(`👀 WATCH Signals: ${watchCount}/${total}`);
  console.log(`🚫 AVOID Signals: ${avoidCount}/${total}`);
  
  console.log(`\n🎯 PROJECTED FOR 500 STOCKS:`);
  console.log(`📈 Expected BUY: ~${Math.round(500 * (buyCount/total))} stocks`);
  console.log(`👀 Expected WATCH: ~${Math.round(500 * (watchCount/total))} stocks`);
  console.log(`🚫 Expected AVOID: ~${Math.round(500 * (avoidCount/total))} stocks`);
  
  if (buyCount === 0) {
    console.log(`\n⚠️  ULTRA-STRICT: No BUY signals detected`);
    console.log(`🔧 Consider allowing 'A' grades for BUY if needed`);
  } else if (buyCount <= 2) {
    console.log(`\n✅ PERFECT: Ultra-selective generating ${buyCount} high-conviction signals`);
    console.log(`🎯 This is ideal for manual analysis and execution`);
  } else {
    console.log(`\n📊 MODERATE: ${buyCount} signals - still manageable but could be more selective`);
  }
}

testUltraSelective().catch(console.error);
