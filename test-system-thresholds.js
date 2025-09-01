/**
 * Test script to compare ultra-selective vs previous thresholds
 * Tests same 25 stocks that previously returned 8 BUY, 8 WATCH, 9 AVOID
 */

const { TradingSystemController } = require('./src/controllers/signal-analysis.controller.js');

const symbols = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',  // Mega caps
  'NVDA', 'META', 'NFLX', 'AMD', 'CRM',     // Tech growth
  'JPM', 'BAC', 'WFC', 'GS', 'MS',         // Financials
  'JNJ', 'PG', 'KO', 'PFE', 'MRK',         // Defensive
  'XOM', 'CVX', 'WMT', 'HD', 'UNH'         // Mixed sectors
];

async function testSystemThresholds() {
  console.log('🧪 ULTRA-SELECTIVE THRESHOLDS TEST - SAME 25 STOCKS');
  console.log('==================================================');
  console.log('📊 PREVIOUS RESULTS (Relaxed Thresholds):');
  console.log('   📈 BUY: 8 stocks (32%)');
  console.log('   👀 WATCH: 8 stocks (32%)'); 
  console.log('   🚫 AVOID: 9 stocks (36%)');
  console.log('');
  console.log('🔥 NEW ULTRA-SELECTIVE THRESHOLDS:');
  console.log('   • Minervini Relative Strength: 75+ (was 50+)');
  console.log('   • Minervini Volume Expansion: 1.8x+ (was 1.1x+)');
  console.log('   • Minervini Fundamental Proxy: 70+ (was 40+)');
  console.log('   • Institutional Weekly Momentum: 12%+ (was 4%+)');
  console.log('   • Institutional Accumulation: 0.75+ (was 0.55+)');
  console.log('   • Only A+ and A grades get BUY signals');
  console.log('');
  
  let buyCount = 0;
  let watchCount = 0;
  let avoidCount = 0;
  let holdCount = 0;
  let errorCount = 0;
  
  for (const symbol of symbols) {
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
      
      console.log(`${symbol.padEnd(6)} | ${action.padEnd(6)} | ${confidence}% | M:${minerviniGrade.padEnd(2)} | I:${institutionalGrade.padEnd(2)}`);
      
    } catch (error) {
      errorCount++;
      console.log(`${symbol.padEnd(6)} | ERROR  | ${error.message.substring(0, 40)}...`);
    }
  }
  
  const total = symbols.length - errorCount;
  console.log('');
  console.log('🔥 ULTRA-SELECTIVE RESULTS COMPARISON:');
  console.log('=====================================');
  console.log(`📈 BUY Signals: ${buyCount}/${total} (${((buyCount/total)*100).toFixed(1)}%) - was 8 (32%)`);
  console.log(`👀 WATCH Signals: ${watchCount}/${total} (${((watchCount/total)*100).toFixed(1)}%) - was 8 (32%)`);
  console.log(`🚫 AVOID/HOLD: ${avoidCount + holdCount}/${total} (${(((avoidCount + holdCount)/total)*100).toFixed(1)}%) - was 9 (36%)`);
  console.log(`⚠️  Errors: ${errorCount}`);
  console.log('');
  
  const changeInBuy = buyCount - 8;
  const changeInWatch = watchCount - 8;  
  const changeInAvoid = (avoidCount + holdCount) - 9;
  
  console.log('📊 CHANGE FROM PREVIOUS:');
  console.log(`📈 BUY Change: ${changeInBuy > 0 ? '+' : ''}${changeInBuy} signals`);
  console.log(`👀 WATCH Change: ${changeInWatch > 0 ? '+' : ''}${changeInWatch} signals`);
  console.log(`🚫 AVOID Change: ${changeInAvoid > 0 ? '+' : ''}${changeInAvoid} signals`);
  console.log('');
  
  console.log('🎯 PROJECTED FOR 500 STOCKS:');
  console.log(`📈 Expected BUY: ~${Math.round(500 * (buyCount/total))} stocks (was ~160)`);
  console.log(`👀 Expected WATCH: ~${Math.round(500 * (watchCount/total))} stocks (was ~160)`);
  console.log(`🚫 Expected AVOID: ~${Math.round(500 * ((avoidCount + holdCount)/total))} stocks (was ~180)`);
  console.log('');
  
  if (buyCount <= 5) {
    console.log('✅ PERFECT: Ultra-selective system achieving target (<5% BUY rate)!');
    console.log('🎯 Ideal for manual execution - no analysis paralysis.');
  } else if (buyCount <= 10) {
    console.log('✅ EXCELLENT: Still very manageable watchlist.');
  } else {
    console.log('⚠️  MODERATE: May want to increase selectivity further.');
  }
}

testSystemThresholds().catch(console.error);

async function testSystemThresholds() {
  console.log('🧪 ULTRA-SELECTIVE THRESHOLDS TEST - SAME 25 STOCKS');
  console.log('==================================================');
  console.log('📊 PREVIOUS RESULTS (Relaxed Thresholds):');
  console.log('   📈 BUY: 8 stocks (32%)');
  console.log('   👀 WATCH: 8 stocks (32%)'); 
  console.log('   🚫 AVOID: 9 stocks (36%)');
  console.log('');
  console.log('🔥 NEW ULTRA-SELECTIVE THRESHOLDS:');
  console.log('   • Minervini Relative Strength: 75+ (was 50+)');
  console.log('   • Minervini Volume Expansion: 1.8x+ (was 1.1x+)');
  console.log('   • Minervini Fundamental Proxy: 70+ (was 40+)');
  console.log('   • Institutional Weekly Momentum: 12%+ (was 4%+)');
  console.log('   • Institutional Accumulation: 0.75+ (was 0.55+)');
  console.log('   • Only A+ and A grades get BUY signals');
  console.log('');
  
  let buyCount = 0;
  let watchCount = 0;
  let avoidCount = 0;
  let holdCount = 0;
  let errorCount = 0;
  
  for (const symbol of symbols) {
    try {
      const response = await fetch(`http://localhost:3001/api/trading/signal-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [symbol] })
      });
      const data = await response.json();
      const result = data.results[0];
      
      const action = result.decision.action;
      const confidence = result.decision.confidence;
      const minerviniGrade = result.systems?.minerviniTemplateAdvanced?.decision?.grade || 'NULL';
      const institutionalGrade = result.systems?.institutionalMomentumCascade?.decision?.grade || 'NULL';
      
      // Count actions
      if (action === 'BUY') buyCount++;
      else if (action === 'WATCH') watchCount++;
      else if (action === 'AVOID') avoidCount++;
      else if (action === 'HOLD') holdCount++;
      
      console.log(`${symbol.padEnd(6)} | ${action.padEnd(6)} | ${confidence}% | M:${minerviniGrade.padEnd(2)} | I:${institutionalGrade.padEnd(2)}`);
      
    } catch (error) {
      errorCount++;
      console.log(`${symbol.padEnd(6)} | ERROR  | ${error.message.substring(0, 40)}...`);
    }
  }
  
  const total = symbols.length - errorCount;
  console.log('');
  console.log('🔥 ULTRA-SELECTIVE RESULTS COMPARISON:');
  console.log('=====================================');
  console.log(`📈 BUY Signals: ${buyCount}/${total} (${((buyCount/total)*100).toFixed(1)}%) - was 8 (32%)`);
  console.log(`👀 WATCH Signals: ${watchCount}/${total} (${((watchCount/total)*100).toFixed(1)}%) - was 8 (32%)`);
  console.log(`🚫 AVOID/HOLD: ${avoidCount + holdCount}/${total} (${(((avoidCount + holdCount)/total)*100).toFixed(1)}%) - was 9 (36%)`);
  console.log(`⚠️  Errors: ${errorCount}`);
  console.log('');
  
  console.log('🎯 PROJECTED FOR 500 STOCKS:');
  console.log(`📈 Expected BUY: ~${Math.round(500 * (buyCount/total))} stocks (was ~160)`);
  console.log(`👀 Expected WATCH: ~${Math.round(500 * (watchCount/total))} stocks (was ~160)`);
  console.log(`🚫 Expected AVOID: ~${Math.round(500 * ((avoidCount + holdCount)/total))} stocks (was ~180)`);
  console.log('');
  
  if (buyCount <= 5) {
    console.log('✅ SUCCESS: Ultra-selective system working perfectly!');
    console.log('🎯 Manageable number of high-conviction signals for manual execution.');
  } else if (buyCount <= 10) {
    console.log('✅ GOOD: Still manageable but could be more selective if needed.');
  } else {
    console.log('⚠️  MODERATE: May want to increase selectivity further.');
  }
}

testSystemThresholds();
