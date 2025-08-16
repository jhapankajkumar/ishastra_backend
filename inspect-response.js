#!/usr/bin/env node

/**
 * Simple test to inspect actual API response structure
 */

const axios = require('axios');

async function inspectAPIResponse() {
    //console.log('🔍 INSPECTING API RESPONSE STRUCTURE');
    //console.log('='.repeat(60));
    
    try {
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['cup_handle'],
            capital: 100000
        });
        
        //console.log('\n📊 RESPONSE STRUCTURE:');
        //console.log('Status:', response.status);
        //console.log('Success:', response.data.success);
        //console.log('\n🔑 Top-level keys:', Object.keys(response.data));
        
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            //console.log('\n📈 RESULT STRUCTURE for', result.symbol);
            //console.log('Result keys:', Object.keys(result));
            
            if (result.systemResults) {
                //console.log('\n🔧 SYSTEM RESULTS:');
                Object.keys(result.systemResults).forEach(systemKey => {
                    const sysResult = result.systemResults[systemKey];
                    //console.log(`\n  📊 ${systemKey}:`);
                    //console.log(`    Keys: ${Object.keys(sysResult).join(', ')}`);
                    //console.log(`    Decision: ${sysResult.decision || 'N/A'}`);
                    //console.log(`    Confidence: ${sysResult.confidence || 'N/A'}`);
                    //console.log(`    System: ${sysResult.system || 'N/A'}`);
                    //console.log(`    SystemName: ${sysResult.systemName || 'N/A'}`);
                    
                    if (sysResult.reasoning) {
                        //console.log(`    Reasoning: ${Array.isArray(sysResult.reasoning) ? sysResult.reasoning[0] : sysResult.reasoning}`);
                    }
                });
            } else {
                //console.log('\n❌ No systemResults found');
            }
            
            if (result.expertDecision) {
                //console.log('\n🤖 EXPERT DECISION:');
                //console.log('Expert decision keys:', Object.keys(result.expertDecision));
                //console.log('Decision:', result.expertDecision.decision || result.expertDecision.action);
                //console.log('Confidence:', result.expertDecision.confidence);
            } else {
                //console.log('\n❌ No expertDecision found');
            }
        } else {
            //console.log('\n❌ No results array found');
        }
        
        // Log full response for debugging (truncated)
        //console.log('\n📋 FULL RESPONSE (first 1000 chars):');
        //console.log(JSON.stringify(response.data, null, 2).substring(0, 1000) + '...');
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        if (error.response) {
            //console.log('Status:', error.response.status);
            //console.log('Response:', error.response.data);
        }
    }
}

inspectAPIResponse().then(() => {
    //console.log('\n✅ Inspection complete');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Inspection failed:', error);
    process.exit(1);
});
