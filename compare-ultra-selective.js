const { TradingSystemController } = require('./src/controllers/signal-analysis.controller.js');

async function compareUltraSelectiveResults() {
  console.log('🧪 ULTRA-SELECTIVE VS PREVIOUS THRESHOLDS COMPARISON');
  console.log('====================================================');
  console.log('📊 PREVIOUS RESULTS (Relaxed Thresholds):');
  console.log('   📈 BUY: 8 stocks (32%)');
  console.log('   👀 WATCH: 8 stocks (32%)'); 
  console.log('   🚫 AVOID: 9 stocks (36%)');
  console.log('');
  
  const testStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',  // Mega caps
    'NVDA', 'META', 'NFLX', 'AMD', 'CRM',     // Tech growth
    'JPM', 'BAC', 'WFC', 'GS', 'MS',         // Financials
    'JNJ', 'PG', 'KO', 'PFE', 'MRK',         // Defensive
    'XOM', 'CVX', 'WMT', 'HD', 'UNH'         // Mixed sectors
  ];
  
  let buyCount = 0;
  let watchCount = 0;
  let avoidCount = 0;
  let holdCount = 0;
  let errorCount = 0;
  
  console.log('🔥 NEW ULTRA-SELECTIVE RESULTS:');
  console.log('Stock  | Action | Conf | Min | Inst');
  console.log('-------|--------|------|-----|-----');
  
  for (const symbol of testStocks) {
    try {
      const controller = new TradingSystemController();
      const response = await controller.getStockAnalysis([symbol]);
      const result = response.results[0];
      
      const action = result.decision.action;
      const confidence = result.decision.confidence;
      const minerviniGrade = result.systems?.minerviniTemplateAdvanced?.decision?.grade || 'NULL';
      const institutionalGrade = result.systems?.institutionalMomentumCascade?.decision?.grade || 'NULL';
      
      // Count actions
      if (action === 'BUY') buyCount++;
      else if (action === 'WATCH') watchCount++;
      else if (action === 'AVOID') avoidCount++;
      else if (action === 'HOLD') holdCount++;
      
      console.log(`${symbol.padEnd(6)} | ${action.padEnd(6)} | ${confidence.toString().padEnd(4)}% | ${minerviniGrade.padEnd(3)} | ${institutionalGrade.padEnd(3)}`);
      
    } catch (error) {
      errorCount++;
      console.log(`${symbol.padEnd(6)} | ERROR  | N/A  | N/A | N/A`);
    }
  }
  
  const total = testStocks.length - errorCount;
  console.log('');
  console.log('🔥 COMPARISON RESULTS:');
  console.log('=====================');
  console.log(`📈 BUY Signals: ${buyCount}/${total} (${((buyCount/total)*100).toFixed(1)}%) | CHANGE: ${buyCount - 8} (was 8)`);
  console.log(`👀 WATCH Signals: ${watchCount}/${total} (${((watchCount/total)*100).toFixed(1)}%) | CHANGE: ${watchCount - 8} (was 8)`);
  console.log(`🚫 AVOID/HOLD: ${avoidCount + holdCount}/${total} (${(((avoidCount + holdCount)/total)*100).toFixed(1)}%) | CHANGE: ${(avoidCount + holdCount) - 9} (was 9)`);
  console.log(`⚠️  Errors: ${errorCount}`);
  console.log('');
  
  console.log('🎯 ULTRA-SELECTIVE IMPACT:');
  const reductionInBuy = 8 - buyCount;
  const reductionPercentage = ((reductionInBuy / 8) * 100).toFixed(1);
  console.log(`📉 BUY Signal Reduction: ${reductionInBuy} signals (${reductionPercentage}% reduction)`);
  
  console.log('');
  console.log('🎯 PROJECTED FOR 500 STOCKS:');
  console.log(`📈 Expected BUY: ~${Math.round(500 * (buyCount/total))} stocks (was ~160) - REDUCTION: ${160 - Math.round(500 * (buyCount/total))}`);
  console.log(`👀 Expected WATCH: ~${Math.round(500 * (watchCount/total))} stocks (was ~160)`);
  console.log(`🚫 Expected AVOID: ~${Math.round(500 * ((avoidCount + holdCount)/total))} stocks (was ~180)`);
  console.log('');
  
  if (buyCount === 0) {
    console.log('🔥 ULTRA-STRICT: Zero BUY signals - System is extremely selective!');
    console.log('💡 This may be too strict for practical use. Consider slight relaxation.');
  } else if (buyCount <= 3) {
    console.log('✅ PERFECT: Ultra-selective achieving target (<5% BUY rate)!');
    console.log('🎯 Ideal for manual execution - no analysis paralysis.');
  } else if (buyCount <= 6) {
    console.log('✅ EXCELLENT: Very manageable watchlist for manual execution.');
  } else {
    console.log('⚠️  MODERATE: Still good but may want more selectivity.');
  }
}

compareUltraSelectiveResults().catch(console.error);
