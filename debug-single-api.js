#!/usr/bin/env node

/**
 * Test single stock analysis to debug where 30% confidence is coming from
 */

const axios = require('axios');

async function debugSingleStock() {
    console.log('🔍 DEBUGGING SINGLE STOCK API RESPONSE');
    console.log('='.repeat(50));
    
    try {
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['rsi_mean'], // Test just RSI system
            capital: 100000
        });
        
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const systems = result.systems || {};
            
            console.log('📊 AAPL RSI SYSTEM RESPONSE:');
            console.log('Raw result:', JSON.stringify(result, null, 2));
            
            console.log('\n🎯 SYSTEM DETAILS:');
            Object.entries(systems).forEach(([systemKey, system]) => {
                console.log(`\n${systemKey}:`);
                console.log(`  Decision: ${system.decision || system.action || 'UNKNOWN'}`);
                console.log(`  Confidence: ${system.confidence || 0}`);
                console.log(`  Raw confidence: ${JSON.stringify(system.confidence)}`);
                console.log(`  Reasoning: ${system.reasoning || 'No reasoning'}`);
            });
            
        } else {
            console.log('❌ No results returned');
        }
        
    } catch (error) {
        console.error('❌ API Error:', error.response?.data || error.message);
    }
}

debugSingleStock().catch(console.error);
