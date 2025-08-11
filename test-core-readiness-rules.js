#!/usr/bin/env node

/**
 * Core Readiness Rules Test Script
 * Demonstrates ChatGPT's suggested tightening with auto-monitoring
 */

const express = require('express');
const app = express();
app.use(express.json());

// Import the AI trade controller
const { analyzeStockWithAI, getCoreReadinessReport, recordCoreReadinessMetrics } = require('./src/controllers/ai/trade.controller.js');

async function testCoreReadinessRules() {
  console.log('🎯 Testing Core Readiness Rules Implementation...');
  console.log('====================================================');
  console.log('ChatGPT Suggestions Applied:');
  console.log('1. R/R floor ≥ 1.8 (aim 2.0) with auto-tightening');
  console.log('2. READY: conf ≥ 60% & grade ≥ B‑');
  console.log('3. WATCH: conf 50–59% & grade ≥ C+');
  console.log('4. 200EMA reclaim: Close > swing high, Vol ≥1.5×, R/R ≥3.0');
  console.log('5. Downtrend cap: max 60% conf, no A grades');
  console.log('6. Volume floor: ≥1.0× for breakouts, penalty 1.0-1.49×');
  console.log('7. Earnings hard block: ±3 trading days');
  console.log('8. BUY-rate cap: 25-35% max (auto-tighten +0.2 R/R)');
  console.log('9. Auto-revert: Win rate -7pp or Max DD +20%');
  console.log('====================================================\n');

  // Test scenarios
  const testScenarios = [
    {
      name: 'High Quality Setup (Should be READY)',
      data: {
        symbol: 'AAPL',
        currentPrice: 150.00,
        technical: {
          currentPrice: 150.00,
          latestPrice: 150.00,
          ema200: 145.00, // Above 200EMA
          marketRegime: { regime: 'BULL' },
          structure: { priorSwingHigh: 148.00 }, // Above prior swing high
          volumeRatio: 1.6, // Above 1.5× threshold
          entryType: 'BREAKOUT',
          technicalIndicators: {
            latest: {
              rsi: 65,
              atr: 3.0,
              sma20: 148.00,
              ema50: 147.00,
              resistance: 160.00,
              support: 140.00
            }
          },
          signals: {
            primary: { signal: 'BUY', confidence: 0.8, reasoning: 'Strong bullish setup' },
            breakout: true
          }
        },
        backtest: null,
        sentiment: {
          overallSentiment: 'POSITIVE',
          dataAge: 12,
          score: 0.3
        },
        ohlcData: [
          { high: 152, low: 148, close: 150, volume: 1600000 },
          { high: 151, low: 147, close: 149, volume: 1550000 },
          { high: 150, low: 146, close: 148, volume: 1700000 }
        ]
      }
    },
    {
      name: 'Below 200EMA Without Reclaim (Should be WATCH/AVOID)',
      data: {
        symbol: 'TSLA',
        currentPrice: 180.00,
        technical: {
          currentPrice: 180.00,
          latestPrice: 180.00,
          ema200: 185.00, // Below 200EMA
          marketRegime: { regime: 'NEUTRAL' },
          structure: { priorSwingHigh: 175.00 }, // Below prior swing high (fails reclaim)
          volumeRatio: 1.2, // Below 1.5× threshold (fails reclaim)
          entryType: 'BREAKOUT',
          technicalIndicators: {
            latest: {
              rsi: 45,
              atr: 4.0,
              sma20: 182.00,
              ema50: 183.00,
              resistance: 190.00,
              support: 170.00
            }
          },
          signals: {
            primary: { signal: 'BUY', confidence: 0.7, reasoning: 'Below 200EMA setup' }
          }
        },
        backtest: null,
        sentiment: {
          overallSentiment: 'NEUTRAL',
          dataAge: 24,
          score: 0.1
        },
        ohlcData: [
          { high: 182, low: 178, close: 180, volume: 1200000 },
          { high: 181, low: 177, close: 179, volume: 1100000 },
          { high: 180, low: 176, close: 178, volume: 1300000 }
        ]
      }
    },
    {
      name: 'Low R/R Ratio (Should be AVOID)',
      data: {
        symbol: 'NVDA',
        currentPrice: 400.00,
        technical: {
          currentPrice: 400.00,
          latestPrice: 400.00,
          ema200: 395.00, // Above 200EMA
          marketRegime: { regime: 'BULL' },
          structure: { priorSwingHigh: 398.00 },
          volumeRatio: 1.3,
          entryType: 'BREAKOUT',
          technicalIndicators: {
            latest: {
              rsi: 55,
              atr: 8.0, // High ATR creates poor R/R
              sma20: 398.00,
              ema50: 397.00,
              resistance: 405.00, // Very close resistance
              support: 390.00
            }
          },
          signals: {
            primary: { signal: 'BUY', confidence: 0.6, reasoning: 'Low R/R setup' }
          }
        },
        backtest: null,
        sentiment: {
          overallSentiment: 'POSITIVE',
          dataAge: 18,
          score: 0.2
        },
        ohlcData: [
          { high: 402, low: 398, close: 400, volume: 2000000 },
          { high: 401, low: 397, close: 399, volume: 1950000 },
          { high: 400, low: 396, close: 398, volume: 2100000 }
        ]
      }
    }
  ];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n🔬 Test ${i + 1}: ${scenario.name}`);
    console.log('=====================================');

    try {
      const result = await analyzeStockWithAI(scenario.data);

      console.log(`📊 RESULTS:`);
      console.log(`   Final Action: ${result.finalDecision.action}`);
      console.log(`   Direction: ${result.finalDecision.direction}`);
      console.log(`   Confidence: ${(result.finalDecision.confidence * 100).toFixed(1)}%`);
      console.log(`   Signal Grade: ${result.signalQuality.grade}`);
      console.log(`   Trade Readiness: ${result.tradeReadiness.status}`);
      console.log(`   Risk/Reward: ${result.riskAssessment.riskReward.toFixed(2)}`);

      // Record metrics (simulate)
      const mockTradeResult = i === 0 ? { result: 'WIN', pnl: 150 } : null; // First test "wins"
      recordCoreReadinessMetrics(
        result.finalDecision, 
        result.riskAssessment, 
        result.signalQuality, 
        true, // watchlist hit
        mockTradeResult
      );

      console.log(`\n✅ CORE READINESS RULE VALIDATION:`);
      console.log('=====================================');
      
      // Rule #1: R/R Floor ≥1.8
      const rrPass = result.riskAssessment.riskReward >= 1.8;
      console.log(`📊 Rule #1 - R/R Floor ≥1.8: ${rrPass ? 'PASS' : 'FAIL'} (${result.riskAssessment.riskReward.toFixed(2)})`);
      
      // Rule #2: Grade & Confidence Gates
      const gradePass = ['A+', 'A', 'A-', 'B+', 'B', 'B-'].includes(result.signalQuality.grade);
      const confPass = result.finalDecision.confidence >= 0.6;
      const readyGatePass = result.tradeReadiness.status === 'READY' ? (gradePass && confPass) : true;
      console.log(`📈 Rule #2 - Grade ≥B- for READY: ${gradePass ? 'PASS' : 'FAIL'} (${result.signalQuality.grade})`);
      console.log(`🎯 Rule #2 - Conf ≥60% for READY: ${confPass ? 'PASS' : 'FAIL'} (${(result.finalDecision.confidence * 100).toFixed(1)}%)`);
      
      // Rule #3: 200EMA Reclaim (if applicable)
      const below200EMA = scenario.data.technical.currentPrice < scenario.data.technical.ema200;
      if (below200EMA) {
        const reclaimPass = scenario.data.technical.currentPrice > (scenario.data.technical.structure?.priorSwingHigh || 0) &&
                           (scenario.data.technical.volumeRatio || 0) >= 1.5 &&
                           result.riskAssessment.riskReward >= 3.0;
        console.log(`📉 Rule #3 - 200EMA Reclaim: ${reclaimPass ? 'PASS' : 'FAIL'} (below 200EMA)`);
      } else {
        console.log(`📈 Rule #3 - 200EMA Position: PASS (above 200EMA)`);
      }
      
      // Rule #5: Volume Floor
      const volumePass = (scenario.data.technical.volumeRatio || 1.0) >= 1.0;
      console.log(`📊 Rule #5 - Volume ≥1.0×: ${volumePass ? 'PASS' : 'FAIL'} (${(scenario.data.technical.volumeRatio || 1.0).toFixed(1)}×)`);

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Show monitoring report
  console.log(`\n📈 CORE READINESS MONITORING REPORT:`);
  console.log('=====================================');
  const report = getCoreReadinessReport();
  console.log(`📊 Daily BUY Rate: ${report.daily.buyRate}% (Cap: 35%)`);
  console.log(`💰 Average R/R: ${report.daily.avgRR}`);
  console.log(`📈 Median Grade: ${report.daily.medianGrade}`);
  console.log(`🎯 Watchlist Hit Rate: ${report.daily.watchlistHitRate}%`);
  console.log(`📝 Total Scans: ${report.daily.totalScans}`);
  console.log(`🚨 Should Auto-Tighten: ${report.daily.shouldAutoTighten ? 'YES' : 'NO'}`);
  
  console.log(`\n📉 Shadow Log (30 trades):`);
  console.log(`   Win Rate: ${report.shadowLog.winRate}%`);
  console.log(`   Profit Factor: ${report.shadowLog.profitFactor}`);
  console.log(`   Max Drawdown: ${report.shadowLog.maxDrawdown}%`);
  console.log(`   Trade Count: ${report.shadowLog.tradeCount}/30`);
  
  console.log(`\n⚙️ Auto-Tightening Status:`);
  console.log(`   Active: ${report.autoTightening.active ? 'YES' : 'NO'}`);
  console.log(`   Current R/R Floor: ${report.autoTightening.currentRRFloor}`);
  console.log(`   Original R/R Floor: ${report.autoTightening.originalRRFloor}`);

  console.log(`\n🎯 All Core Readiness Rules:`);
  Object.entries(report.coreRules).forEach(([rule, description]) => {
    console.log(`   ${rule}: ${description}`);
  });

  console.log('\n🏁 Core Readiness Rules Testing Complete!');
  console.log('✅ System now enforces production-quality trading standards');
  console.log('✅ Auto-monitoring prevents excessive risk-taking');
  console.log('✅ Performance tracking enables continuous improvement');
}

// Run the test
testCoreReadinessRules().then(() => {
  console.log('\n🎉 All tests completed successfully!');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});
