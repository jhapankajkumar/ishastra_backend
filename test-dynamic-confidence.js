#!/usr/bin/env node

/**
 * Test dynamic confidence scoring across all 5 trading systems
 * Goal: Find varied confidence levels and BUY/WATCH signals
 */

const axios = require('axios');

// Select diverse stocks from tickerData for testing
const TEST_STOCKS = [
    'AAPL',  // Large cap tech
    'TSLA',  // Volatile growth
    'MSFT',  // Stable large cap
    'NVDA',  // High growth AI
    'META',  // Social media
    'GOOGL', // Search giant
    'AMZN',  // E-commerce
    'NFLX',  // Streaming
    'AMD',   // Semiconductor
    'V',     // Financial services
    'JPM',   // Banking
    'KO',    // Consumer staples
    'WMT',   // Retail
    'DIS',   // Entertainment
    'INTC'   // Traditional tech
];

async function testDynamicConfidence() {
    console.log('🚀 TESTING DYNAMIC CONFIDENCE ACROSS ALL SYSTEMS');
    console.log('='.repeat(70));
    console.log(`Testing ${TEST_STOCKS.length} stocks for varied confidence levels...\n`);
    
    let results = [];
    let buySignals = [];
    let watchSignals = [];
    
    for (let i = 0; i < TEST_STOCKS.length; i++) {
        const symbol = TEST_STOCKS[i];
        console.log(`📊 Testing ${symbol} (${i+1}/${TEST_STOCKS.length})`);
        
        try {
            const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
                symbols: [symbol],
                systems: ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean', 'macd_divergence'],
                capital: 100000
            });
            
            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                const systems = result.systems || {};
                
                // Collect confidence data
                const stockData = {
                    symbol: symbol,
                    overallDecision: result.decision.action,
                    systems: {}
                };
                
                Object.entries(systems).forEach(([systemKey, system]) => {
                    const confidence = system.confidence || 0;
                    const decision = system.decision || system.action || 'UNKNOWN';
                    
                    stockData.systems[systemKey] = {
                        decision: decision,
                        confidence: confidence,
                        grade: system.signalQuality?.grade || 'N/A'
                    };
                    
                    // Track BUY and WATCH signals
                    if (decision === 'BUY' || decision === 'STRONG_BUY') {
                        buySignals.push({
                            stock: symbol,
                            system: systemKey,
                            decision: decision,
                            confidence: confidence
                        });
                    } else if (decision === 'WATCH') {
                        watchSignals.push({
                            stock: symbol,
                            system: systemKey,
                            decision: decision,
                            confidence: confidence
                        });
                    }
                });
                
                results.push(stockData);
                
                // Display real-time results
                console.log(`  Overall: ${result.decision.action}`);
                Object.entries(stockData.systems).forEach(([sys, data]) => {
                    const conf = (data.confidence * 100).toFixed(1);
                    console.log(`  ${sys}: ${data.decision} (${conf}%)`);
                });
                console.log('');
                
            } else {
                console.log(`  ❌ No results for ${symbol}\n`);
            }
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`  ❌ Error testing ${symbol}:`, error.message);
        }
    }
    
    // Summary Analysis
    console.log('\n' + '='.repeat(70));
    console.log('📈 DYNAMIC CONFIDENCE ANALYSIS RESULTS');
    console.log('='.repeat(70));
    
    // BUY Signals Summary
    console.log(`\n🟢 BUY/STRONG_BUY SIGNALS FOUND: ${buySignals.length}`);
    if (buySignals.length > 0) {
        buySignals.sort((a, b) => b.confidence - a.confidence);
        buySignals.forEach(signal => {
            console.log(`  📈 ${signal.stock}: ${signal.system} - ${signal.decision} (${(signal.confidence * 100).toFixed(1)}%)`);
        });
    }
    
    // WATCH Signals Summary
    console.log(`\n🟡 WATCH SIGNALS FOUND: ${watchSignals.length}`);
    if (watchSignals.length > 0) {
        watchSignals.sort((a, b) => b.confidence - a.confidence);
        watchSignals.forEach(signal => {
            console.log(`  👀 ${signal.stock}: ${signal.system} - ${signal.decision} (${(signal.confidence * 100).toFixed(1)}%)`);
        });
    }
    
    // Confidence Range Analysis
    console.log(`\n📊 CONFIDENCE RANGE ANALYSIS:`);
    const allConfidences = [];
    
    results.forEach(stock => {
        Object.entries(stock.systems).forEach(([systemKey, systemData]) => {
            allConfidences.push({
                stock: stock.symbol,
                system: systemKey,
                decision: systemData.decision,
                confidence: systemData.confidence
            });
        });
    });
    
    // Group by decision type
    const byDecision = {};
    allConfidences.forEach(item => {
        if (!byDecision[item.decision]) byDecision[item.decision] = [];
        byDecision[item.decision].push(item.confidence);
    });
    
    Object.entries(byDecision).forEach(([decision, confidences]) => {
        const min = Math.min(...confidences);
        const max = Math.max(...confidences);
        const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        
        console.log(`  ${decision}: ${confidences.length} signals`);
        console.log(`    Range: ${(min * 100).toFixed(1)}% - ${(max * 100).toFixed(1)}%`);
        console.log(`    Average: ${(avg * 100).toFixed(1)}%`);
    });
    
    // Success Metrics
    console.log(`\n✅ DYNAMIC CONFIDENCE SUCCESS METRICS:`);
    console.log(`  Total stocks tested: ${results.length}`);
    console.log(`  Total signals analyzed: ${allConfidences.length}`);
    console.log(`  BUY signals found: ${buySignals.length}`);
    console.log(`  WATCH signals found: ${watchSignals.length}`);
    console.log(`  Dynamic confidence working: ${allConfidences.filter(c => c.confidence !== 0.3).length}/${allConfidences.length}`);
    
    const hasBuyOrWatch = buySignals.length > 0 || watchSignals.length > 0;
    console.log(`\n🎯 GOAL ACHIEVEMENT: ${hasBuyOrWatch ? '✅ SUCCESS' : '⏳ CONTINUE TESTING'}`);
    
    if (!hasBuyOrWatch) {
        console.log(`\n💡 SUGGESTION: Testing additional stocks to find BUY/WATCH signals...`);
    }
}

// Run the test
testDynamicConfidence().catch(console.error);
