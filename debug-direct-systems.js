#!/usr/bin/env node

/**
 * Test systems directly without any controller pipeline to verify dynamic confidence
 */

const { ElderTripleScreen } = require('./src/systems/elder-triple-screen.js');
const MinerviniSEPA = require('./src/systems/minervini-sepa.js');
const CupWithHandle = require('./src/systems/cup-with-handle.js');
const RSIMeanReversion = require('./src/systems/rsi-mean-reversion.js');
const MACDDivergence = require('./src/systems/macd-divergence.js');

async function testDirectSystems() {
    console.log('🔍 DIRECT SYSTEM TESTING (NO CONTROLLER)');
    console.log('='.repeat(50));
    
    // Mock data similar to what systems receive
    const mockData = {
        series: {
            daily: Array.from({ length: 60 }, (_, i) => ({
                date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString(),
                open: 100 + Math.random() * 10 - 5,
                high: 105 + Math.random() * 10 - 5,
                low: 95 + Math.random() * 10 - 5,
                close: 100 + Math.random() * 10 - 5,
                volume: 1000000 + Math.random() * 500000
            }))
        },
        indicators: {
            base: {
                rsi14: 25, // Oversold
                rsi14_history: [35, 30, 28, 25],
                ema10: 102,
                ema20: 100,
                ema50: 98,
                sma150: 95,
                sma200: 90,
                macd: -1.2,
                macdSignal: -0.8,
                macdHistogram: -0.4,
                atr: 2.5
            },
            sepa_specific: {
                ema10: Array.from({ length: 60 }, (_, i) => 100 + i * 0.1),
                ema21: Array.from({ length: 60 }, (_, i) => 99 + i * 0.1)
            }
        }
    };
    
    const systems = [
        { name: 'Elder Triple Screen', instance: new ElderTripleScreen() },
        { name: 'Minervini SEPA', instance: new MinerviniSEPA() },
        { name: 'Cup-with-Handle', instance: new CupWithHandle() },
        { name: 'RSI Mean Reversion', instance: new RSIMeanReversion() },
        { name: 'MACD Divergence', instance: new MACDDivergence() }
    ];
    
    for (const system of systems) {
        console.log(`\n📊 Testing ${system.name}...`);
        
        try {
            const result = await system.instance.analyze(mockData);
            
            console.log(`  Decision: ${result.decision}`);
            console.log(`  Confidence: ${result.confidence} (${(result.confidence * 100).toFixed(1)}%)`);
            console.log(`  Type of confidence: ${typeof result.confidence}`);
            console.log(`  Reasoning: ${Array.isArray(result.reasoning) ? result.reasoning.join('; ') : result.reasoning}`);
            
            if (result.confidence === 0.3) {
                console.log('  ⚠️  HARDCODED 0.3 DETECTED!');
            } else {
                console.log('  ✅ Dynamic confidence working');
            }
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n🎯 DIRECT SYSTEM TESTING COMPLETE');
}

testDirectSystems().catch(console.error);
