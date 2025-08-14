#!/usr/bin/env node

/**
 * Test with all 5 systems including MACD Divergence
 */

const axios = require('axios');

async function testAll5Systems() {
    console.log('🔍 TESTING ALL 5 SYSTEMS INCLUDING MACD');
    console.log('='.repeat(55));
    
    try {
        console.log('📡 Making request for all 5 systems...');
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean', 'macd_divergence'],
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
            console.log('Systems count:', Object.keys(result.systems || {}).length);
            
            if (result.systems) {
                Object.entries(result.systems).forEach(([key, system]) => {
                    console.log(`  📈 ${key}: ${system.decision || system.action} (${system.confidence})`);
                    if (system.error) console.log(`    ❌ Error: ${system.error}`);
                });
            }
            
            // Check specifically for MACD divergence
            if (result.systems.macdDivergence) {
                console.log('\n✅ MACD Divergence system IS present!');
            } else {
                console.log('\n❌ MACD Divergence system NOT found');
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

testAll5Systems().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Failed:', error);
    process.exit(1);
});
