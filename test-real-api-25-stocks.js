/**
 * REAL API TESTING WITH 100-STOCK UNIVERSE
 * ========================================
 * 
 * Tests your excellent 100-stock collection with the ACTUAL trading API
 * to see real threshold configuration impact on live analysis.
 */

const axios = require('axios');
const { getActiveThresholds } = require('./src/config/trading-thresholds');

// Your excellent diverse stock collection
const testStocks = [
  "NVDA", "MSFT", "AAPL", "AMZN", "META", "AVGO", "GOOGL", "GOOG", "TSLA", "BRK.B",
    "LLY", "JPM", "UNH", "V", "XOM", "MA", "PG", "COST", "HD", "JNJ",
    "NFLX", "ABBV", "BAC", "CRM", "CVX", "KO", "AMD", "PEP", "TMO", "WMT",
    "CSCO", "ACN", "LIN", "ABT", "MRK", "ADBE", "IBM", "TXN", "PM", "CAT",
    "DHR", "ISRG", "GE", "QCOM", "NOW", "VZ", "UBER", "INTU", "COP", "RTX",
    
    // Next 50 - Large Cap Value & Diversified (High Priority - Daily Analysis)
    "AMGN", "AMAT", "HON", "PFE", "BKNG", "NEE", "T", "LOW", "SPGI", "BSX",
    "AXP", "SYK", "PGR", "TJX", "C", "LRCX", "BLK", "VRTX", "MS", "MDT",
    "ETN", "CB", "REGN", "ADI", "SCHW", "MU", "FI", "KKR", "GILD", "AON",
    "PANW", "CMG", "SO", "ICE", "APD", "DUK", "PLD", "MMC", "KLAC", "PYPL",
    "USB", "SHW", "ZTS", "ITW", "MCO", "WM", "EMR", "CDNS", "FCX", "MAR",         // Mixed sectors
];

// API endpoint discovery - try multiple possibilities
const possibleEndpoints = [
  'http://localhost:8000/api/trading/signal-analysis',
];

async function findWorkingEndpoint() {
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      const response = await axios.get(`${endpoint}?symbols=AAPL`, { timeout: 5000 });
      if (response.data?.results?.[0]) {
        console.log(`✅ Found working endpoint: ${endpoint}`);
        return endpoint;
      }
    } catch (error) {
      console.log(`❌ ${endpoint} failed: ${error.response?.status || error.message}`);
    }
  }
  throw new Error('No working API endpoint found. Make sure server is running.');
}

async function testStockWithAPI(symbol, apiEndpoint) {
  try {
    const response = await axios.get(`${apiEndpoint}?symbols=${symbol}`, { timeout: 10000 });
    
    if (response.data?.results?.[0]) {
      const result = response.data.results[0];
      return {
        symbol: result.symbol,
        decision: result.decision.action,
        confidence: Math.round(result.decision.confidence || 0),
        minerviniGrade: result.systems?.minerviniTemplateAdvanced?.decision?.grade || result.systems?.minervini_template_advanced?.decision?.grade || 'N/A',
        institutionalGrade: result.systems?.institutionalMomentumCascade?.decision?.grade || result.systems?.institutional_momentum_cascade?.decision?.grade || 'N/A'
      };
    } else {
      throw new Error('Invalid API response format');
    }
    
  } catch (error) {
    return {
      symbol: symbol,
      decision: 'ERROR',
      confidence: 0,
      error: error.message,
      minerviniGrade: 'N/A',
      institutionalGrade: 'N/A'
    };
  }
}

async function testAll25Stocks() {
  console.log('🧪 REAL API TEST WITH 100-STOCK UNIVERSE');
  console.log('=========================================');
  
  // Show current configuration
  const current = getActiveThresholds();
  console.log(`🎯 Current Configuration: ${current.activeConfig}`);
  console.log(`📝 Description: ${current.description}`);
  
  const minervini = current.minervini_template_advanced;
  const institutional = current.institutional_momentum_cascade;
  
  console.log('\n📈 ACTIVE THRESHOLDS:');
  console.log(`🏛️ Minervini: RS≥${minervini.criterion6_relative_strength}, Vol≥${minervini.criterion7_volume_multiplier}x, Fund≥${minervini.criterion8_fundamental_score}, Grades=${minervini.buy_allowed_grades.join(',')}`);
  console.log(`🌊 Institutional: Mom≥${institutional.weekly_momentum_threshold}%, Acc≥${institutional.accumulation_ratio_threshold}, Corr≥${institutional.correlation_threshold}, Win≥${institutional.win_ratio_threshold}, Cascades=${institutional.buy_allowed_cascades.join(',')}`);
  
  // Find working API endpoint
  console.log('\n🔍 FINDING API ENDPOINT:');
  console.log('========================');
  
  let apiEndpoint;
  try {
    apiEndpoint = await findWorkingEndpoint();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 TO START SERVER:');
    console.log('   npm start  # or node src/server.js');
    return;
  }
  
  console.log('\n🚀 TESTING ALL 100 STOCKS:');
  console.log('==========================');
  console.log('Stock  | Action | Conf | Min | Inst');
  console.log('-------|--------|------|-----|-----');
  
  let buyCount = 0;
  let watchCount = 0;
  let avoidCount = 0;
  let errorCount = 0;
  
  const results = [];
  
  for (const symbol of testStocks) {
    console.log(`📊 Testing ${symbol}...`);
    
    const result = await testStockWithAPI(symbol, apiEndpoint);
    results.push(result);
    
    if (result.decision === 'BUY') buyCount++;
    else if (result.decision === 'WATCH' || result.decision === 'HOLD') watchCount++;
    else if (result.decision === 'AVOID') avoidCount++;
    else errorCount++;
    
    const confidence = result.confidence ? Math.round(result.confidence) : 0;
    const minGrade = result.minerviniGrade || 'N/A';
    const instGrade = result.institutionalGrade || 'N/A';
    
    console.log(`${symbol.padEnd(6)} | ${result.decision.padEnd(6)} | ${confidence.toString().padEnd(3)} % | ${minGrade.padEnd(3)} | ${instGrade.padEnd(2)}`);
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 FINAL RESULTS:');
  console.log('=================');
  console.log(`📈 BUY: ${buyCount}/${testStocks.length} (${(buyCount/testStocks.length*100).toFixed(1)}%)`);
  console.log(`👀 WATCH/HOLD: ${watchCount}/${testStocks.length} (${(watchCount/testStocks.length*100).toFixed(1)}%)`);
  console.log(`🚫 AVOID: ${avoidCount}/${testStocks.length} (${(avoidCount/testStocks.length*100).toFixed(1)}%)`);
  if (errorCount > 0) {
    console.log(`❌ ERRORS: ${errorCount}/${testStocks.length} (${(errorCount/testStocks.length*100).toFixed(1)}%)`);
  }
  
  console.log('\n🎯 SECTOR BREAKDOWN:');
  console.log('====================');
  
  const sectors = {
    'Mega Caps': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
    'Tech Growth': ['NVDA', 'META', 'NFLX', 'AMD', 'CRM'],
    'Financials': ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
    'Defensive': ['JNJ', 'PG', 'KO', 'PFE', 'MRK'],
    'Mixed': ['XOM', 'CVX', 'WMT', 'HD', 'UNH']
  };
  
  for (const [sectorName, sectorStocks] of Object.entries(sectors)) {
    const sectorResults = results.filter(r => sectorStocks.includes(r.symbol));
    const sectorBuys = sectorResults.filter(r => r.decision === 'BUY').length;
    const sectorWatches = sectorResults.filter(r => r.decision === 'WATCH' || r.decision === 'HOLD').length;
    const sectorAvoids = sectorResults.filter(r => r.decision === 'AVOID').length;
    
    console.log(`${sectorName}: BUY=${sectorBuys}, WATCH=${sectorWatches}, AVOID=${sectorAvoids}`);
  }
  
  console.log('\n💡 TO TEST DIFFERENT CONFIGURATIONS:');
  console.log('====================================');
  console.log('1. Change ACTIVE_CONFIG in src/config/trading-thresholds.js');
  console.log('2. Run this script again: node test-real-api-25-stocks.js');
  console.log('3. Compare the results!');
  
  console.log(`\n✅ REAL API TEST COMPLETE WITH ${current.activeConfig} CONFIGURATION!`);
  
  return { buyCount, watchCount, avoidCount, errorCount, results };
}

// Run the real API test
testAll25Stocks().catch(console.error);
