/**
 * MACD Divergence System Test
 * Test the new MACD Divergence trading system with realistic scenarios
 */

const MACDDivergence = require('./src/systems/macd-divergence');

// Create realistic test data with MACD divergence scenarios
function createTestData(scenario = 'bullish_divergence') {
    const baseDate = new Date('2024-01-01');
    const dailyData = [];
    const indicators = {
        base: {
            macd: [],
            macd_signal: [],
            macd_histogram: []
        }
    };
    
    if (scenario === 'bullish_divergence') {
        // Create bullish divergence: price makes lower low, MACD makes higher low
        for (let i = 0; i < 40; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + i);
            
            let price, macd, signal, histogram;
            
            if (i < 15) {
                // First swing down
                price = 100 - (i * 1.5); // Price declining from 100 to 77.5
                macd = -2 - (i * 0.1); // MACD declining from -2 to -3.5
                signal = -1.8 - (i * 0.08);
                histogram = macd - signal;
            } else if (i < 25) {
                // Recovery phase
                price = 77.5 + ((i - 15) * 0.8); // Price recovering to 85.5
                macd = -3.5 + ((i - 15) * 0.15); // MACD recovering to -2.0
                signal = -3.3 + ((i - 15) * 0.12);
                histogram = macd - signal;
            } else if (i < 35) {
                // Second swing down (lower low in price)
                price = 85.5 - ((i - 25) * 1.2); // Price declining to 73.5 (lower than 77.5)
                macd = -2.0 - ((i - 25) * 0.08); // MACD declining to -2.8 (higher than -3.5)
                signal = -1.9 - ((i - 25) * 0.09);
                histogram = macd - signal;
            } else {
                // Potential reversal
                price = 73.5 + ((i - 35) * 0.6); // Price starting to recover
                macd = -2.8 + ((i - 35) * 0.1); // MACD starting to improve
                signal = -2.7 + ((i - 35) * 0.08);
                histogram = macd - signal;
            }
            
            dailyData.push({
                date: date.toISOString().split('T')[0],
                open: price - 0.5,
                high: i === 39 ? price + 1.5 : price + 0.8, // Bullish candle on last day
                low: price - 1.0,
                close: i === 39 ? price + 1.2 : price, // Bullish close on last day
                volume: 1000000 + (Math.random() * 500000)
            });
            
            indicators.base.macd.push(macd);
            indicators.base.macd_signal.push(signal);
            indicators.base.macd_histogram.push(histogram);
        }
        
    } else if (scenario === 'bearish_divergence') {
        // Create bearish divergence: price makes higher high, MACD makes lower high
        for (let i = 0; i < 40; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + i);
            
            let price, macd, signal, histogram;
            
            if (i < 15) {
                // First swing up
                price = 80 + (i * 1.2); // Price rising from 80 to 98
                macd = 1.5 + (i * 0.08); // MACD rising from 1.5 to 2.7
                signal = 1.3 + (i * 0.07);
                histogram = macd - signal;
            } else if (i < 25) {
                // Pullback phase
                price = 98 - ((i - 15) * 0.9); // Price pulling back to 89
                macd = 2.7 - ((i - 15) * 0.12); // MACD declining to 1.5
                signal = 2.6 - ((i - 15) * 0.11);
                histogram = macd - signal;
            } else if (i < 35) {
                // Second swing up (higher high in price)
                price = 89 + ((i - 25) * 1.3); // Price rising to 102 (higher than 98)
                macd = 1.5 + ((i - 25) * 0.05); // MACD rising to 2.0 (lower than 2.7) - fixed calculation
                signal = 1.4 + ((i - 25) * 0.06);
                histogram = macd - signal;
            } else {
                // Potential reversal
                price = 102 - ((i - 35) * 0.8); // Price starting to decline
                macd = 2.0 - ((i - 35) * 0.15); // MACD declining
                signal = 2.0 - ((i - 35) * 0.12);
                histogram = macd - signal;
            }
            
            dailyData.push({
                date: date.toISOString().split('T')[0],
                open: price + 0.5,
                high: price + 1.0,
                low: i === 39 ? price - 1.5 : price - 0.8, // Bearish candle on last day
                close: i === 39 ? price - 1.2 : price, // Bearish close on last day
                volume: 1000000 + (Math.random() * 500000)
            });
            
            indicators.base.macd.push(macd);
            indicators.base.macd_signal.push(signal);
            indicators.base.macd_histogram.push(histogram);
        }
        
    } else {
        // No divergence scenario
        for (let i = 0; i < 40; i++) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() + i);
            
            const price = 90 + Math.sin(i * 0.1) * 5; // Simple oscillation
            const macd = Math.sin(i * 0.08) * 1.5;
            const signal = Math.sin(i * 0.08 - 0.2) * 1.3;
            const histogram = macd - signal;
            
            dailyData.push({
                date: date.toISOString().split('T')[0],
                open: price - 0.3,
                high: price + 0.5,
                low: price - 0.7,
                close: price + 0.1,
                volume: 1000000
            });
            
            indicators.base.macd.push(macd);
            indicators.base.macd_signal.push(signal);
            indicators.base.macd_histogram.push(histogram);
        }
    }
    
    return {
        series: { daily: dailyData },
        indicators
    };
}

async function testMACDDivergenceSystem() {
    console.log('🧪 Testing MACD Divergence System\n');
    
    const system = new MACDDivergence();
    
    // Test 1: Bullish Divergence Scenario
    console.log('📊 Test 1: Bullish Divergence Scenario');
    const bullishData = createTestData('bullish_divergence');
    const bullishResult = system.analyze(bullishData);
    
    console.log('Decision:', bullishResult.decision);
    console.log('Confidence:', bullishResult.confidence);
    console.log('Signal Quality:', bullishResult.signalQuality);
    console.log('Reasoning:', bullishResult.reasoning);
    console.log('Risk/Reward:', bullishResult.riskReward?.riskReward || 'N/A');
    console.log('---');
    
    // Test 2: Bearish Divergence Scenario
    console.log('📊 Test 2: Bearish Divergence Scenario');
    const bearishData = createTestData('bearish_divergence');
    const bearishResult = system.analyze(bearishData);
    
    console.log('Decision:', bearishResult.decision);
    console.log('Confidence:', bearishResult.confidence);
    console.log('Signal Quality:', bearishResult.signalQuality);
    console.log('Reasoning:', bearishResult.reasoning);
    console.log('Risk/Reward:', bearishResult.riskReward?.riskReward || 'N/A');
    console.log('---');
    
    // Test 3: No Divergence Scenario
    console.log('📊 Test 3: No Divergence Scenario');
    const noData = createTestData('no_divergence');
    const noResult = system.analyze(noData);
    
    console.log('Decision:', noResult.decision);
    console.log('Confidence:', noResult.confidence);
    console.log('Signal Quality:', noResult.signalQuality);
    console.log('Reasoning:', noResult.reasoning);
    console.log('---');
    
    // Summary
    console.log('🎯 MACD Divergence System Test Summary:');
    console.log(`✅ Bullish Divergence: ${bullishResult.decision} (${bullishResult.confidence * 100}% confidence)`);
    console.log(`✅ Bearish Divergence: ${bearishResult.decision} (${bearishResult.confidence * 100}% confidence)`);
    console.log(`✅ No Divergence: ${noResult.decision} (${noResult.confidence * 100}% confidence)`);
    
    // Validate expected outcomes
    const isValid = 
        (bullishResult.decision === 'BUY' || bullishResult.decision === 'WATCH') &&
        (bearishResult.decision === 'SELL' || bearishResult.decision === 'WATCH') &&
        (noResult.decision === 'AVOID' || noResult.decision === 'HOLD');
        
    console.log(`\n${isValid ? '✅ All tests passed!' : '❌ Some tests failed'}`);
    
    return { bullishResult, bearishResult, noResult, isValid };
}

// Run the test
testMACDDivergenceSystem().catch(console.error);
