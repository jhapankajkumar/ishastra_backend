/**
 * Test Cup-with-Handle Trading System
 * Quick test to verify the system works correctly
 */

const CupWithHandle = require('./src/systems/cup-with-handle');

// Create test data with a valid cup-with-handle pattern
function createTestData() {
    const dailyData = [];
    const baseDate = new Date('2024-01-01');
    
    // Phase 1: Pre-cup base (20 days around $100)
    for (let i = 0; i < 20; i++) {
        dailyData.push({
            date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString(),
            open: 99 + Math.random() * 2,
            high: 100 + Math.random() * 2,
            low: 98 + Math.random() * 2,
            close: 99 + Math.random() * 2,
            volume: 1000000 + Math.random() * 200000
        });
    }
    
    // Phase 2: Cup formation (50 days)
    const cupPeak = 125;
    const cupBottom = 100; // 20% decline from peak
    
    // Left side of cup - rise to peak (10 days)
    for (let i = 0; i < 10; i++) {
        const price = 100 + (25 * i / 9); // Rise from $100 to $125
        dailyData.push({
            date: new Date(baseDate.getTime() + (20 + i) * 24 * 60 * 60 * 1000).toISOString(),
            open: price - 0.5,
            high: price + 1,
            low: price - 1,
            close: price,
            volume: 1200000 + Math.random() * 300000
        });
    }
    
    // Cup decline and recovery (40 days) - U-shaped
    for (let i = 0; i < 40; i++) {
        const progress = i / 39;
        // Create U-shape: decline first half, recover second half
        let cupFactor;
        if (progress <= 0.5) {
            // Decline phase
            cupFactor = 1 - (2 * progress); // From 1 to 0
        } else {
            // Recovery phase  
            cupFactor = 2 * (progress - 0.5); // From 0 to 1
        }
        const price = cupBottom + (cupPeak - cupBottom) * cupFactor;
        
        // Lower volume during cup formation
        const volumeFactor = 0.6 + 0.4 * Math.abs(0.5 - progress); // Lower in middle
        
        dailyData.push({
            date: new Date(baseDate.getTime() + (30 + i) * 24 * 60 * 60 * 1000).toISOString(),
            open: price - 0.5,
            high: price + 1,
            low: price - 1,
            close: price,
            volume: (800000 + Math.random() * 200000) * volumeFactor
        });
    }
    
    // Phase 3: Handle formation (10 days)
    for (let i = 0; i < 10; i++) {
        const handleHigh = 124;
        const handleLow = 116; // 6.5% decline 
        const progress = i / 9;
        const price = handleHigh - (handleHigh - handleLow) * Math.sin(progress * Math.PI * 0.5);
        
        dailyData.push({
            date: new Date(baseDate.getTime() + (70 + i) * 24 * 60 * 60 * 1000).toISOString(),
            open: price - 0.3,
            high: price + 0.5,
            low: price - 0.8,
            close: price,
            volume: 500000 + Math.random() * 100000 // Very light volume
        });
    }
    
    // Phase 4: Breakout day
    dailyData.push({
        date: new Date(baseDate.getTime() + 80 * 24 * 60 * 60 * 1000).toISOString(),
        open: 122,
        high: 130,
        low: 121.5,
        close: 129.2, // Close above resistance at $128 
        volume: 2000000 // Heavy volume breakout (2x average)
    });
    
    console.log(`📊 Generated test data: ${dailyData.length} days`);
    console.log(`📊 Cup peak: $125, bottom: $100 (20% decline)`);
    console.log(`📊 Handle: $124 to $116 (6.5% decline)`);
    console.log(`📊 Breakout: $129.2 with 2M volume (above $128 resistance)`);
    
    return {
        series: {
            daily: dailyData
        },
        indicators: {
            base: {
                rsi14: 67 // Strong RSI for breakout
            }
        },
        meta: {
            symbol: 'TEST',
            market: 'US'
        }
    };
}

// Test the system
async function testCupWithHandle() {
    console.log('🧪 Testing Cup-with-Handle Trading System...\n');
    
    const system = new CupWithHandle();
    const testData = createTestData();
    
    console.log(`📊 Test data: ${testData.series.daily.length} days of OHLCV data`);
    console.log(`💰 Final price: $${testData.series.daily[testData.series.daily.length - 1].close}`);
    console.log(`📈 RSI: ${testData.indicators.base.rsi14}\n`);
    
    const result = system.analyze(testData);
    
    console.log('🎯 ANALYSIS RESULT:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏆 System: ${result.systemName}`);
    console.log(`📊 Decision: ${result.decision}`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📝 Reasoning: ${result.reasoning.join('; ')}`);
    console.log(`⭐ Signal Quality: ${result.signalQuality.grade} (${result.signalQuality.percentage}%)`);
    
    if (result.pattern) {
        console.log(`\n🏺 PATTERN ANALYSIS:`);
        if (result.pattern.cup) {
            console.log(`  Cup: ${result.pattern.cup.isValid ? '✅ Valid' : '❌ Invalid'} (${result.pattern.cup.duration} days, ${(result.pattern.cup.depth * 100).toFixed(1)}% depth)`);
        }
        if (result.pattern.handle) {
            console.log(`  Handle: ${result.pattern.handle.isValid ? '✅ Valid' : '❌ Invalid'} (${result.pattern.handle.duration} days, ${(result.pattern.handle.depth * 100).toFixed(1)}% depth)`);
        }
        if (result.pattern.breakout) {
            console.log(`  Breakout: ${result.pattern.breakout.isBreakout ? '✅ Confirmed' : '❌ Pending'} (${result.pattern.breakout.volumeRatio.toFixed(1)}x volume)`);
        }
    }
    
    if (result.riskReward) {
        console.log(`\n💰 RISK/REWARD:`);
        console.log(`  Entry: $${result.riskReward.entryPrice}`);
        console.log(`  Stop Loss: $${result.riskReward.stopLoss}`);
        console.log(`  Targets: $${result.riskReward.targets.join(', $')}`);
        console.log(`  Risk/Reward: ${result.riskReward.riskReward}:1`);
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
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    return result;
}

// Run the test
if (require.main === module) {
    testCupWithHandle()
        .then(result => {
            console.log('✅ Cup-with-Handle system test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testCupWithHandle, createTestData };
