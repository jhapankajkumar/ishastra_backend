#!/usr/bin/env node

/**
 * Deep inspection of systems field in API response
 */

const axios = require('axios');

async function inspectSystemsField() {
    console.log('🔍 DEEP INSPECTION OF SYSTEMS FIELD');
    console.log('='.repeat(60));
    
    try {
        const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
            symbols: ['AAPL'],
            systems: ['cup_handle', 'rsi_mean', 'macd_divergence'],
            capital: 100000
        });
        
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            
            console.log('\n📊 MAIN DECISION:', {
                action: result.decision.action,
                confidence: result.decision.confidence,
                reasoning: result.decision.reasoning,
                systemsAnalyzed: result.decision.systemsAnalyzed
            });
            
            if (result.systems) {
                console.log('\n🔧 SYSTEMS FIELD FOUND:');
                console.log('Systems keys:', Object.keys(result.systems));
                
                Object.keys(result.systems).forEach(systemKey => {
                    const system = result.systems[systemKey];
                    console.log(`\n  📊 ${systemKey.toUpperCase()}:`);
                    console.log('    Keys:', Object.keys(system));
                    
                    // Log the important fields
                    if (system.decision) console.log('    Decision:', system.decision);
                    if (system.action) console.log('    Action:', system.action);
                    if (system.confidence !== undefined) console.log('    Confidence:', system.confidence);
                    if (system.reasoning) {
                        const reasoning = Array.isArray(system.reasoning) ? system.reasoning.slice(0, 2) : [system.reasoning];
                        console.log('    Reasoning:', reasoning);
                    }
                    if (system.signals) console.log('    Signals:', Object.keys(system.signals));
                    if (system.analysis) console.log('    Analysis keys:', Object.keys(system.analysis));
                    if (system.error) console.log('    ERROR:', system.error);
                });
            } else {
                console.log('\n❌ No systems field found');
                console.log('Available keys:', Object.keys(result));
            }
        }
        
    } catch (error) {
        console.error('❌ Request failed:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        }
    }
}

inspectSystemsField().then(() => {
    console.log('\n✅ Deep inspection complete');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Inspection failed:', error);
    process.exit(1);
});
