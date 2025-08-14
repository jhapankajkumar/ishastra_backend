#!/usr/bin/env node

/**
 * Test each system individually to identify hardcoded 0.3 sources
 */

const axios = require('axios');

async function debugEachSystem() {
    console.log('🔍 DEBUGGING EACH SYSTEM INDIVIDUALLY');
    console.log('='.repeat(50));
    
    const systems = ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean', 'macd_divergence'];
    
    for (const system of systems) {
        console.log(`\n📊 Testing ${system.toUpperCase()} system...`);
        
        try {
            const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
                symbols: ['AAPL'],
                systems: [system],
                capital: 100000
            });
            
            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                const systemData = Object.values(result.systems)[0];
                
                if (systemData) {
                    console.log(`  Decision: ${systemData.decision}`);
                    console.log(`  Confidence: ${systemData.confidence} (${(systemData.confidence * 100).toFixed(1)}%)`);
                    
                    if (systemData.confidence === 0.3) {
                        console.log('  ⚠️  HARDCODED 0.3 DETECTED!');
                    } else {
                        console.log('  ✅ Dynamic confidence working');
                    }
                } else {
                    console.log('  ❌ No system data returned');
                }
            } else {
                console.log('  ❌ No results returned');
            }
            
        } catch (error) {
            console.error(`  ❌ Error testing ${system}:`, error.response?.data?.message || error.message);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎯 INDIVIDUAL SYSTEM TEST COMPLETE');
}

debugEachSystem().catch(console.error);
