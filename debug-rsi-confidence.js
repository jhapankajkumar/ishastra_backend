#!/usr/bin/env node

/**
 * Debug specific system confidence calculation
 */

const RSIMeanReversion = require('./src/systems/rsi-mean-reversion.js');

async function debugRSISystem() {
    console.log('🔍 DEBUGGING RSI SYSTEM CONFIDENCE CALCULATION');
    console.log('='.repeat(50));
    
    // Create mock data similar to what the system receives
    const mockData = {
        series: {
            daily: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
                open: 100 + Math.random() * 10,
                high: 105 + Math.random() * 10,
                low: 95 + Math.random() * 10,
                close: 100 + Math.random() * 10,
                volume: 1000000 + Math.random() * 500000
            }))
        },
        indicators: {
            base: {
                rsi14: 25, // Oversold condition
                rsi14_history: [30, 28, 25],
                ema20: 102,
                ema50: 98
            }
        }
    };
    
    console.log('📊 Mock Data Setup:');
    console.log(`  RSI14: ${mockData.indicators.base.rsi14}`);
    console.log(`  EMA20: ${mockData.indicators.base.ema20}`);
    console.log(`  EMA50: ${mockData.indicators.base.ema50}`);
    console.log(`  Daily data points: ${mockData.series.daily.length}`);
    console.log('');
    
    // Test RSI system
    const rsiSystem = new RSIMeanReversion();
    console.log('🚀 Running RSI System Analysis...');
    
    try {
        const result = await rsiSystem.analyze(mockData);
        
        console.log('\n📈 RSI SYSTEM RESULTS:');
        console.log(`  Decision: ${result.decision}`);
        console.log(`  Confidence: ${result.confidence} (${(result.confidence * 100).toFixed(1)}%)`);
        console.log(`  Reasoning: ${result.reasoning.join('; ')}`);
        
        console.log('\n🔧 DETAILED ANALYSIS BREAKDOWN:');
        if (result.analysis) {
            console.log(`  RSI Valid: ${result.analysis.rsi?.isValid}`);
            console.log(`  RSI Value: ${result.analysis.rsi?.currentRSI}`);
            console.log(`  Support Valid: ${result.analysis.support?.isValid}`);
            console.log(`  Candle Valid: ${result.analysis.candle?.isValid}`);
        }
        
        // Test the confidence calculation method directly
        console.log('\n🎯 TESTING DYNAMIC CONFIDENCE METHOD DIRECTLY:');
        const testAnalysis = {
            rsi: { currentRSI: 25, isRising: true },
            support: { hasNearbySupport: true, bestSupport: { strength: 0.8 } },
            candle: { isBullish: true, closePosition: 0.7, bodyToRangeRatio: 0.6 },
            signal: { signalStrength: 0.75 }
        };
        
        const directConfidence = rsiSystem.calculateRSIMeanConfidence(
            testAnalysis.rsi,
            testAnalysis.support,
            testAnalysis.candle,
            testAnalysis.signal,
            'BUY'
        );
        
        console.log(`  Direct confidence calc (BUY): ${directConfidence} (${(directConfidence * 100).toFixed(1)}%)`);
        
        const avoidConfidence = rsiSystem.calculateRSIMeanConfidence(
            { currentRSI: 25, isRising: false }, // Poor RSI conditions
            { hasNearbySupport: false, bestSupport: null }, // No support
            { isBullish: false, closePosition: 0.3, bodyToRangeRatio: 0.2 }, // Poor candle
            { signalStrength: 0 }, // Poor signal
            'AVOID'
        );
        
        console.log(`  Direct confidence calc (AVOID): ${avoidConfidence} (${(avoidConfidence * 100).toFixed(1)}%)`);
        
        console.log('\n✅ DEBUG COMPLETE');
        
    } catch (error) {
        console.error('❌ Error in RSI system analysis:', error);
    }
}

debugRSISystem().catch(console.error);
