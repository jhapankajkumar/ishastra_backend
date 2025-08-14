/**
 * Test RSI Mean Reversion Trading System
 * Quick test to verify the system works correctly
 */

const RSIMeanReversion = require('./src/systems/rsi-mean-reversion');

// Create test data with RSI mean reversion setup
function createTestData() {
    const dailyData = [];
    const baseDate = new Date('2024-01-01');
    
    // Phase 1: Create downtrend leading to oversold condition (25 days)
    for (let i = 0; i < 25; i++) {
        const basePrice = 100 - (i * 1.2); // Declining from $100 to $70
        const noise = (Math.random() - 0.5) * 2; // Add some volatility
        
        const close = basePrice + noise;
        const open = close + (Math.random() - 0.5) * 1;
        const high = Math.max(open, close) + Math.random() * 0.8;
        const low = Math.min(open, close) - Math.random() * 0.8;
        
        dailyData.push({
            date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: 800000 + Math.random() * 400000
        });
    }
    
    // Phase 2: Oversold bounce setup - bullish candle near support
    const supportPrice = 72; // EMA20 level
    const currentPrice = 72.5; // Slightly above support
    
    dailyData.push({
        date: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        open: 71.8,
        high: 73.2,
        low: 71.5,
        close: currentPrice, // Bullish candle closing in top 60% of range
        volume: 1200000 // Increased volume
    });
    
    return {
        series: {
            daily: dailyData
        },
        indicators: {
            base: {
                rsi14: 29, // Current oversold RSI
                rsi14_history: [32, 30, 28, 26], // Previous RSI was 26, current is 29 (rising)
                ema20: supportPrice, // Support level
                ema50: 75 // Medium-term support
            }
        },
        meta: {
            symbol: 'TEST',
            market: 'US'
        }
    };
}

// Test the system
async function testRSIMeanReversion() {
    console.log('🧪 Testing RSI Mean Reversion Trading System...\n');
    
    const system = new RSIMeanReversion();
    const testData = createTestData();
    
    console.log(`📊 Test data: ${testData.series.daily.length} days of OHLCV data`);
    console.log(`💰 Current price: $${testData.series.daily[testData.series.daily.length - 1].close}`);
    console.log(`📈 RSI: ${testData.indicators.base.rsi14}`);
    console.log(`🎯 EMA20 Support: $${testData.indicators.base.ema20}`);
    console.log(`🎯 EMA50 Support: $${testData.indicators.base.ema50}\n`);
    
    const result = system.analyze(testData);
    
    console.log('🎯 ANALYSIS RESULT:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📈 System: ${result.systemName}`);
    console.log(`📊 Decision: ${result.decision}`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📝 Reasoning: ${result.reasoning.join('; ')}`);
    console.log(`⭐ Signal Quality: ${result.signalQuality.grade} (${result.signalQuality.percentage}%)`);
    
    if (result.analysis) {
        console.log(`\n🔍 ANALYSIS BREAKDOWN:`);
        console.log(`  RSI: ${result.analysis.rsi.isValid ? '✅ Valid' : '❌ Invalid'} (Current: ${result.analysis.rsi.currentRSI}, Rising: ${result.analysis.rsi.isRising})`);
        console.log(`  Support: ${result.analysis.support.isValid ? '✅ Valid' : '❌ Invalid'} (Type: ${result.analysis.support.bestSupport?.type || 'None'})`);
        console.log(`  Candle: ${result.analysis.candle.isValid ? '✅ Valid' : '❌ Invalid'} (Bullish: ${result.analysis.candle.isBullish}, Close Pos: ${(result.analysis.candle.closePosition * 100).toFixed(0)}%)`);
    }
    
    if (result.riskReward) {
        console.log(`\n💰 RISK/REWARD:`);
        console.log(`  Entry: $${result.riskReward.entryPrice}`);
        console.log(`  Stop Loss: $${result.riskReward.stopLoss}`);
        console.log(`  Targets: $${result.riskReward.targets.join(', $')}`);
        console.log(`  Risk/Reward: ${result.riskReward.riskReward}:1`);
        if (result.riskReward.supportLevel) {
            console.log(`  Support Level: $${result.riskReward.supportLevel}`);
        }
    }
    
    if (result.executionPlan) {
        console.log(`\n📋 EXECUTION PLAN:`);
        console.log(`  Action: ${result.executionPlan.action}`);
        if (result.executionPlan.entryStrategy) {
            console.log(`  Entry: ${result.executionPlan.entryStrategy.method}`);
        }
        if (result.executionPlan.positionSizing) {
            console.log(`  Position Size: ${result.executionPlan.positionSizing.recommendation}`);
        }
        if (result.executionPlan.exitStrategy?.rsiExit) {
            console.log(`  RSI Exit: ${result.executionPlan.exitStrategy.rsiExit}`);
        }
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return result;
}

// Create a test for AVOID scenario
function createAvoidTestData() {
    const dailyData = [];
    const baseDate = new Date('2024-01-01');
    
    // Create data with RSI not oversold
    for (let i = 0; i < 26; i++) {
        const close = 100 + Math.sin(i * 0.2) * 5; // Sideways movement
        const open = close + (Math.random() - 0.5) * 1;
        const high = Math.max(open, close) + Math.random() * 0.8;
        const low = Math.min(open, close) - Math.random() * 0.8;
        
        dailyData.push({
            date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(close * 100) / 100,
            volume: 800000 + Math.random() * 400000
        });
    }
    
    return {
        series: { daily: dailyData },
        indicators: {
            base: {
                rsi14: 45, // Not oversold
                ema20: 100,
                ema50: 102
            }
        },
        meta: { symbol: 'AVOID_TEST', market: 'US' }
    };
}

async function testAvoidScenario() {
    console.log('🚫 Testing RSI Mean Reversion AVOID Scenario...\n');
    
    const system = new RSIMeanReversion();
    const testData = createAvoidTestData();
    
    const result = system.analyze(testData);
    
    console.log(`📊 Decision: ${result.decision} (Expected: AVOID)`);
    console.log(`📝 Reasoning: ${result.reasoning.join('; ')}`);
    console.log(`🎯 RSI Level: ${testData.indicators.base.rsi14} (Not oversold)\n`);
    
    return result;
}

// Run the tests
if (require.main === module) {
    Promise.all([testRSIMeanReversion(), testAvoidScenario()])
        .then(([buyResult, avoidResult]) => {
            console.log('✅ RSI Mean Reversion system tests completed!');
            console.log(`✅ BUY scenario: ${buyResult.decision === 'BUY' ? 'PASS' : 'FAIL'}`);
            console.log(`✅ AVOID scenario: ${avoidResult.decision === 'AVOID' ? 'PASS' : 'FAIL'}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testRSIMeanReversion, createTestData };
