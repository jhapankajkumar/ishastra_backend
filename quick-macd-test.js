#!/usr/bin/env node

/**
 * Quick test for MACD Divergence system response
 */

const axios = require('axios');

async function quickMACDTest() {
    try {
        console.log('🔍 Testing MACD Divergence API...');
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['macd_divergence'],
            capital: 100000
        });
        
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            console.log('\n✅ MACD DIVERGENCE SYSTEM WORKING!');
            console.log('Symbol:', result.symbol);
            console.log('Overall Decision:', result.decision.action);
            console.log('Systems Available:', Object.keys(result.systems || {}));
            
            if (result.systems.macdDivergence) {
                console.log('\n📊 MACD Divergence Details:');
                console.log('Decision:', result.systems.macdDivergence.decision || result.systems.macdDivergence.action);
                console.log('Confidence:', result.systems.macdDivergence.confidence);
                console.log('Analysis:', result.systems.macdDivergence.analysis);
            } else {
                console.log('\n⚠️  MACD system not found in systems object');
                console.log('Available systems:', Object.keys(result.systems || {}));
            }
        } else {
            console.log('❌ No results in response');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

quickMACDTest();
