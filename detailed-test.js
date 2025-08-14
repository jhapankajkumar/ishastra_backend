#!/usr/bin/env node

/**
 * Detailed API test for trading systems with result analysis
 */

const axios = require('axios');

async function detailedTradingSystemsTest() {
    console.log('🔍 DETAILED TRADING SYSTEMS API TEST');
    console.log('='.repeat(60));
    
    const API_BASE = 'http://localhost:8000';
    
    // Test each system individually with detailed logging
    const testCases = [
        { name: 'Cup-with-Handle', systems: ['cup_handle'] },
        { name: 'RSI Mean Reversion', systems: ['rsi_mean'] },
        { name: 'MACD Divergence', systems: ['divergence'] }
    ];
    
    const testSymbols = ['AAPL', 'MSFT'];
    
    for (const testCase of testCases) {
        console.log(`\n📊 DETAILED TEST: ${testCase.name}`);
        console.log('='.repeat(50));
        
        try {
            const startTime = Date.now();
            const response = await axios.post(`${API_BASE}/api/trading/stock-analysis`, {
                symbols: testSymbols,
                systems: testCase.systems,
                capital: 100000
            }, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            console.log(`✅ Request completed in ${duration}s`);
            
            if (response.data.success && response.data.results) {
                for (const result of response.data.results) {
                    console.log(`\n📈 SYMBOL: ${result.symbol}`);
                    console.log('-'.repeat(30));
                    
                    if (result.systemResults) {
                        Object.keys(result.systemResults).forEach(systemKey => {
                            const sysResult = result.systemResults[systemKey];
                            console.log(`\n🔧 System: ${systemKey}`);
                            console.log(`   Decision: ${sysResult.decision}`);
                            console.log(`   Confidence: ${sysResult.confidence}`);
                            console.log(`   Reasoning: ${sysResult.reasoning ? sysResult.reasoning.slice(0, 100) : 'N/A'}...`);
                            
                            // System-specific details
                            if (systemKey === 'cup_handle' && sysResult.pattern) {
                                console.log(`   Cup Valid: ${sysResult.pattern.cup?.isValid || 'N/A'}`);
                                console.log(`   Handle Valid: ${sysResult.pattern.handle?.isValid || 'N/A'}`);
                                console.log(`   Breakout: ${sysResult.pattern.breakout?.isBreaking || 'N/A'}`);
                            }
                            
                            if (systemKey === 'rsi_mean' && sysResult.analysis) {
                                console.log(`   RSI Current: ${sysResult.analysis.rsi?.currentRSI || 'N/A'}`);
                                console.log(`   Is Oversold: ${sysResult.analysis.rsi?.isOversold || 'N/A'}`);
                                console.log(`   Support Found: ${sysResult.analysis.support?.hasSupport || 'N/A'}`);
                            }
                            
                            if (systemKey === 'divergence' && sysResult.analysis) {
                                console.log(`   Has Divergence: ${sysResult.analysis.divergence?.hasDivergence || 'N/A'}`);
                                console.log(`   Divergence Type: ${sysResult.analysis.divergence?.divergenceType || 'N/A'}`);
                                console.log(`   Signal Quality: ${sysResult.signalQuality?.grade || 'N/A'}`);
                            }
                            
                            if (sysResult.riskReward) {
                                console.log(`   Stop Loss: $${sysResult.riskReward.stopLoss || 'N/A'}`);
                                console.log(`   Risk/Reward: ${sysResult.riskReward.riskReward || 'N/A'}`);
                            }
                        });
                    }
                    
                    console.log(`\n💡 Expert AI Decision: ${result.expertDecision?.decision || 'N/A'}`);
                    console.log(`   AI Confidence: ${result.expertDecision?.confidence || 'N/A'}`);
                }
            } else {
                console.log('❌ No results in response');
                console.log('Response data:', JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Error data:', error.response.data);
            }
        }
    }
    
    console.log('\n🎯 COMPREHENSIVE SYSTEM TEST');
    console.log('='.repeat(50));
    
    try {
        const response = await axios.post(`${API_BASE}/api/trading/stock-analysis`, {
            symbols: ['AAPL'],
            systems: ['cup_handle', 'rsi_mean', 'divergence'],
            capital: 100000
        });
        
        if (response.data.success && response.data.results && response.data.results[0]) {
            const result = response.data.results[0];
            console.log(`\n📊 AAPL - All Systems Analysis:`);
            console.log(`Expert Decision: ${result.expertDecision?.decision} (${result.expertDecision?.confidence})`);
            console.log(`Systems Analyzed: ${Object.keys(result.systemResults || {}).length}`);
            console.log(`Systems: ${Object.keys(result.systemResults || {}).join(', ')}`);
            
            // Summary of all decisions
            if (result.systemResults) {
                console.log('\n🏆 System Decisions Summary:');
                Object.keys(result.systemResults).forEach(system => {
                    const sys = result.systemResults[system];
                    console.log(`   ${system}: ${sys.decision} (${sys.confidence})`);
                });
            }
        }
        
    } catch (error) {
        console.log(`❌ Comprehensive test failed: ${error.message}`);
    }
    
    console.log('\n✅ DETAILED TESTING COMPLETE');
}

detailedTradingSystemsTest().then(() => {
    console.log('\n🎉 All detailed tests completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Detailed tests failed:', error);
    process.exit(1);
});
