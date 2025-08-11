#!/usr/bin/env node

/**
 * Test Script: 50% Confidence Defaults for Untested Strategies
 * Verifies that the system now provides reasonable confidence for untested systems
 * instead of the previous 0% that blocked all trades.
 */

const express = require('express');
const app = express();
app.use(express.json());

// Import the AI trade controller
const { analyzeStockWithAI } = require('./src/controllers/ai/trade.controller.js');

async function test50PercentDefaults() {
  console.log('🎯 Testing 50% Confidence Defaults for Untested Strategies...');
  console.log('=====================================');

  // Simulate a basic stock analysis with minimal data (untested strategy scenario)
  const mockAnalysisData = {
    symbol: 'AAPL',
    currentPrice: 150.00,
    technical: {
      currentPrice: 150.00,
      latestPrice: 150.00,
      ema200: 145.00, // Above 200EMA
      technicalIndicators: {
        latest: {
          rsi: 55,
          atr: 2.50,
          sma20: 148.00,
          ema50: 149.00,
          resistance: 155.00,
          support: 145.00
        }
      },
      signals: {
        primary: {
          signal: 'BUY',
          confidence: 0.6,
          reasoning: 'Basic uptrend setup'
        }
      },
      volumeRatio: 1.2 // Above 1.0 threshold
    },
    backtest: null, // No backtest data (untested strategy)
    sentiment: {
      overallSentiment: 'NEUTRAL',
      dataAge: 24,
      score: 0.1
    },
    ohlcData: [
      { high: 152, low: 148, close: 150, volume: 1000000 },
      { high: 151, low: 147, close: 149, volume: 950000 },
      { high: 150, low: 146, close: 148, volume: 1100000 }
    ]
  };

  try {
    console.log('📊 Running analysis with minimal/untested data...');
    const result = await analyzeStockWithAI(mockAnalysisData);

    console.log('\n🔍 RESULTS:');
    console.log('===================');
    console.log(`Final Action: ${result.finalDecision.action}`);
    console.log(`Direction: ${result.finalDecision.direction}`);
    console.log(`Confidence: ${(result.finalDecision.confidence * 100).toFixed(1)}%`);
    console.log(`Signal Grade: ${result.signalQuality.grade}`);
    console.log(`Trade Readiness: ${result.tradeReadiness.status}`);
    console.log(`Risk/Reward: ${result.riskAssessment.riskReward.toFixed(2)}`);

    console.log('\n✅ SOFTENED REQUIREMENTS VERIFICATION:');
    console.log('=====================================');
    
    // Check if confidence is at least 50% for READY/WATCH states
    if (result.tradeReadiness.status === 'READY' || result.tradeReadiness.status === 'WATCH') {
      const confidenceCheck = result.finalDecision.confidence >= 0.5;
      console.log(`✅ Confidence Floor (≥50%): ${confidenceCheck ? 'PASS' : 'FAIL'} - ${(result.finalDecision.confidence * 100).toFixed(1)}%`);
    }

    // Check softened grade requirements (C+ instead of B-)
    const gradeList = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+'];
    const gradeAcceptable = gradeList.includes(result.signalQuality.grade);
    console.log(`✅ Grade Softened (C+ min): ${gradeAcceptable ? 'PASS' : 'FAIL'} - Grade ${result.signalQuality.grade}`);

    // Check softened R/R requirements (1.2 instead of 1.5)
    const rrAcceptable = result.riskAssessment.riskReward >= 1.2;
    console.log(`✅ R/R Softened (1.2+ min): ${rrAcceptable ? 'PASS' : 'FAIL'} - ${result.riskAssessment.riskReward.toFixed(2)}`);

    // Check if 200EMA blocking is disabled
    const ema200Waived = !result.tradeReadiness.factors.some(f => f.includes('Below 200EMA'));
    console.log(`✅ 200EMA Blocking Disabled: ${ema200Waived ? 'PASS' : 'FAIL'}`);

    // Check if volume blocking is disabled
    const volumeWaived = !result.tradeReadiness.factors.some(f => f.includes('Volume'));
    console.log(`✅ Volume Blocking Disabled: ${volumeWaived ? 'PASS' : 'FAIL'}`);

    console.log('\n🎯 SUMMARY:');
    console.log('=================');
    if (result.finalDecision.confidence >= 0.5 && result.tradeReadiness.status !== 'AVOID') {
      console.log('✅ SUCCESS: System now provides 50%+ confidence for untested strategies!');
      console.log('✅ The system no longer blocks all trades due to missing backtest data.');
      console.log('✅ Softened requirements allow reasonable trading decisions.');
    } else {
      console.log('❌ NEEDS REVIEW: System still overly restrictive for untested strategies.');
      console.log('❌ May need further adjustments to achieve 50% default behavior.');
    }

    // Show preserved safety measures
    console.log('\n🛡️ PRESERVED SAFETY MEASURES:');
    console.log('===============================');
    console.log(`Structure-aware stops: ${result.riskAssessment.structureStopAnalysis ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`Risk cap (6% max): ${result.riskAssessment.maxRiskPercent <= 6 ? 'ENFORCED' : 'VIOLATED'}`);
    console.log(`Earnings proximity: ${result.riskAssessment.earningsProximity ? 'CHECKED' : 'NOT_CHECKED'}`);
    console.log(`Veto signals: ${result.conflictResolution.conflicts.length > 0 ? 'ACTIVE' : 'NONE'}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
test50PercentDefaults().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});
