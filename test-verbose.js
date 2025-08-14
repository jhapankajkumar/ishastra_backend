#!/usr/bin/env node

/**
 * Test with verbose logging
 */

const axios = require('axios');

async function testWithLogging() {
    console.log('🔍 TESTING WITH CUP_HANDLE ONLY');
    console.log('='.repeat(50));
    
    try {
        console.log('📡 Making request...');
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['cup_handle'],
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
                });
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

testWithLogging().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Failed:', error);
    process.exit(1);
});
