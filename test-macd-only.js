#!/usr/bin/env node

/**
 * Test MACD Divergence system specifically
 */

const axios = require('axios');

async function testMACDOnly() {
    console.log('🔍 TESTING MACD DIVERGENCE ONLY');
    console.log('='.repeat(50));
    
    try {
        console.log('📡 Making request for MACD Divergence...');
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['macd_divergence'],
            capital: 100000
        });
        
        console.log('✅ Response received');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            console.log('\n📊 RESULTS:');
            console.log('Symbol:', result.symbol);
            console.log('Decision:', result.decision.action);
            console.log('Systems analyzed:', result.decision.systemsAnalyzed);
            console.log('Systems keys:', Object.keys(result.systems || {}));
            
            if (result.systems) {
                Object.entries(result.systems).forEach(([key, system]) => {
                    console.log(`  📈 ${key}: ${system.decision || system.action} (${system.confidence})`);
                    if (system.error) console.log(`    ❌ Error: ${system.error}`);
                });
            }
            
            // Check if MACD divergence key is there
            if (result.systems.macdDivergence) {
                console.log('\n✅ MACD Divergence system found!');
                console.log('MACD Analysis:', result.systems.macdDivergence);
            } else {
                console.log('\n❌ MACD Divergence system NOT found in response');
                console.log('Available systems:', Object.keys(result.systems));
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testMACDOnly().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Failed:', error);
    process.exit(1);
});
