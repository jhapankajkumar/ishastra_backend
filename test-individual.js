#!/usr/bin/env node

/**
 * Test individual new systems to see if they're working
 */

const axios = require('axios');

async function testIndividualSystems() {
    console.log('🔍 TESTING INDIVIDUAL NEW SYSTEMS');
    console.log('='.repeat(60));
    
    const systemsToTest = ['cup_handle', 'rsi_mean', 'macd_divergence'];
    
    for (const system of systemsToTest) {
        console.log(`\n🧪 Testing ${system.toUpperCase()}...`);
        console.log('-'.repeat(40));
        
        try {
            const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
                symbols: ['AAPL'],
                systems: [system],
                capital: 100000
            });
            
            console.log('✅ Status:', response.status);
            console.log('✅ Success:', response.data.success);
            
            if (response.data.results && response.data.results.length > 0) {
                const result = response.data.results[0];
                
                console.log('📊 Decision:', result.decision);
                console.log('🔧 Systems keys:', Object.keys(result.systems || {}));
                
                if (result.systems && Object.keys(result.systems).length > 0) {
                    Object.keys(result.systems).forEach(sysKey => {
                        const sys = result.systems[sysKey];
                        console.log(`  📈 ${sysKey}: ${sys.decision || sys.action} (${sys.confidence})`);
                        if (sys.error) console.log(`  ❌ Error: ${sys.error}`);
                    });
                } else {
                    console.log('❌ No systems found in result');
                }
            }
            
        } catch (error) {
            console.error('❌ Request failed:', error.message);
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Response:', error.response.data);
            }
        }
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testIndividualSystems().then(() => {
    console.log('\n✅ Individual system testing complete');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
});
