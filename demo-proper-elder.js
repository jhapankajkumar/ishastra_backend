/**
 * Demo for Elder's Triple Screen with proper multi-timeframe data
 */

const ElderTripleScreenProper = require('./src/systems/systems/ElderTripleScreenProper');

async function demoProperElderSystem() {
  console.log('🏛️ Elder\'s Triple Screen - Proper Multi-Timeframe Demo');
  console.log('='.repeat(55));

  const system = new ElderTripleScreenProper();

  // Create proper multi-timeframe data
  const marketData = createRealisticMultiTimeframeData();

  console.log('\n📊 Data Structure Summary:');
  console.log(`Weekly data: ${marketData.weeklyData.length} weeks`);
  console.log(`Daily data: ${marketData.dailyData.length} trading days`);
  console.log(`Intraday data: ${marketData.intradayData.length} 4-hourly periods`);
  
  console.log('\n📈 Current Market Conditions:');
  console.log('Weekly Trend:', marketData.technicalIndicators.weekly.macd.histogram > 0 ? 'BULLISH' : 'BEARISH');
  console.log('Daily RSI:', marketData.technicalIndicators.daily.rsi, '(Oversold < 30, Overbought > 70)');
  console.log('Intraday Price:', marketData.technicalIndicators.intraday.price);
  console.log('Volume Ratio:', (marketData.technicalIndicators.intraday.volume / marketData.technicalIndicators.intraday.avgVolume).toFixed(2) + 'x');

  try {
    const result = await system.analyze(marketData);
    
    console.log('\n🎯 Elder Triple Screen Analysis:');
    console.log('Decision:', result.decision);
    console.log('Confidence:', result.confidence + '%');
    console.log('Risk/Reward:', result.riskReward);
    console.log('Entry Price:', result.indicatorReadings.entryPrice);
    console.log('Stop Loss:', result.stopLoss);
    console.log('Target:', result.target);
    
    console.log('\n📋 Screen Analysis:');
    console.log('Screen 1 (Weekly Trend):', {
      direction: result.metadata.screen1.direction,
      strength: result.metadata.screen1.strength + '%',
      pass: result.metadata.screen1.pass ? '✅' : '❌'
    });
    
    console.log('Screen 2 (Daily Oscillator):', {
      signal: result.metadata.screen2.signal,
      strength: result.metadata.screen2.strength + '%',
      pass: result.metadata.screen2.pass ? '✅' : '❌'
    });
    
    console.log('Screen 3 (Intraday Execution):', {
      signal: result.metadata.screen3.signal,
      strength: result.metadata.screen3.strength + '%',
      pass: result.metadata.screen3.pass ? '✅' : '❌'
    });
    
    console.log('\n💡 Key Reasons:');
    result.reasonCodes.forEach(reason => console.log(`  • ${reason}`));
    
    console.log('\n🔧 Applied Fixes:');
    result.metadata.fixes_applied.forEach(fix => console.log(`  ✅ ${fix}`));

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

function createRealisticMultiTimeframeData() {
  const baseDate = new Date('2024-01-01');
  const basePrice = 100;
  
  // 1. Weekly Data (52+ weeks) - Shows overall uptrend
  const weeklyData = [];
  for (let week = 0; week < 52; week++) {
    const weeklyPrice = basePrice + (week * 0.6) + Math.sin(week * 0.3) * 5; // Trend + cycles
    weeklyData.push({
      open: weeklyPrice - 0.5 + Math.random(),
      high: weeklyPrice + 1 + Math.random() * 2,
      low: weeklyPrice - 1 - Math.random() * 2,
      close: weeklyPrice + Math.random() - 0.5,
      volume: 45000 + Math.random() * 25000,
      date: new Date(baseDate.getTime() + (week * 7 * 24 * 60 * 60 * 1000)).toISOString()
    });
  }
  
  // 2. Daily Data (260 trading days) - Shows more detail
  const dailyData = [];
  for (let day = 0; day < 260; day++) {
    const dailyPrice = basePrice + (day * 0.12) + Math.sin(day * 0.1) * 2;
    dailyData.push({
      open: dailyPrice - 0.2 + Math.random() * 0.4,
      high: dailyPrice + 0.3 + Math.random() * 0.6,
      low: dailyPrice - 0.3 - Math.random() * 0.6,
      close: dailyPrice + Math.random() * 0.4 - 0.2,
      volume: 8000 + Math.random() * 4000,
      date: new Date(baseDate.getTime() + (day * 24 * 60 * 60 * 1000)).toISOString()
    });
  }
  
  // 3. Intraday Data (4-hourly for last 2 weeks = 70 periods)
  const intradayData = [];
  const currentPrice = basePrice + 30; // Current market level
  for (let period = 0; period < 70; period++) {
    const intradayPrice = currentPrice + (period * 0.05) + Math.random() * 0.5 - 0.25;
    intradayData.push({
      open: intradayPrice - 0.05 + Math.random() * 0.1,
      high: intradayPrice + 0.1 + Math.random() * 0.15,
      low: intradayPrice - 0.1 - Math.random() * 0.15,
      close: intradayPrice + Math.random() * 0.1 - 0.05,
      volume: 1500 + Math.random() * 800,
      date: new Date(Date.now() - ((70 - period) * 4 * 60 * 60 * 1000)).toISOString()
    });
  }
  
  // Set up a realistic bullish Elder setup with breakout
  const latestPrice = currentPrice + 3.5; // Breakout price
  const recentHigh = currentPrice + 3.0; // Recent 4H high that will be broken
  
  // Modify last few intraday periods to show breakout setup
  for (let i = 0; i < 5; i++) {
    intradayData[intradayData.length - 5 + i].high = recentHigh - 0.1 + (i * 0.02);
  }
  
  return {
    weeklyData,
    dailyData,
    intradayData,
    technicalIndicators: {
      weekly: {
        price: latestPrice,
        macd: {
          MACD: 1.2,
          signal: 0.8, 
          histogram: 0.4 // Positive = uptrend
        },
        ema10: latestPrice - 2, // Short EMA below price
        ema40: latestPrice - 5  // Long EMA well below
      },
      daily: {
        price: latestPrice,
        rsi: 28, // Oversold - perfect for pullback entry in uptrend
        stochastic: 22, // Also oversold
        atr: 2.2
      },
      intraday: {
        price: latestPrice, // This will be above recentHigh, triggering breakout
        volume: 2400, // 1.6x average volume for breakout confirmation
        avgVolume: 1500,
        atr: 0.75
      }
    }
  };
}

// Run demo
if (require.main === module) {
  demoProperElderSystem().catch(console.error);
}

module.exports = { demoProperElderSystem };
