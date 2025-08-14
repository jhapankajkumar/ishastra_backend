#!/usr/bin/env node

/**
 * Direct API test for trading systems
 */

const axios = require('axios');

async function testTradingSystemsAPI() {
    console.log('🧪 TESTING TRADING SYSTEMS API');
    console.log('='.repeat(50));
    
    const API_BASE = 'http://localhost:8000';
    
    // Test data - focus on one system at a time to debug
    const testRequests = [
        {
            name: 'Cup-with-Handle Only',
            data: {
                symbols: ['AAPL'],
                systems: ['cup_handle'],
                capital: 100000
            }
        },
        {
            name: 'RSI Mean Reversion Only',
            data: {
                symbols: ['AAPL'],
                systems: ['rsi_mean'],
                capital: 100000
            }
        },
        {
            name: 'MACD Divergence Only',
            data: {
                symbols: ['AAPL'],
                systems: ['divergence'],
                capital: 100000
            }
        },
        {
            name: 'All Three Systems',
            data: {
                symbols: ['AAPL'],
                systems: ['cup_handle', 'rsi_mean', 'divergence'],
                capital: 100000
            }
        }
    ];
    
    for (const request of testRequests) {
        console.log(`\n🧪 Testing: ${request.name}`);
        console.log('-'.repeat(30));
        
        try {
            const startTime = Date.now();
            const response = await axios.post(`${API_BASE}/api/trading/stock-analysis`, request.data, {
                timeout: 60000, // 60 second timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            
            console.log(`✅ Success (${duration}s)`);
            console.log('Status:', response.status);
            console.log('Response keys:', Object.keys(response.data));
            
            if (response.data.success) {
                console.log('Analysis completed successfully');
                if (response.data.results && response.data.results.length > 0) {
                    const result = response.data.results[0];
                    console.log(`Symbol: ${result.symbol}`);
                    if (result.systemResults) {
                        console.log('System Results:');
                        Object.keys(result.systemResults).forEach(system => {
                            const sysResult = result.systemResults[system];
                            console.log(`  - ${system}: ${sysResult.decision} (${sysResult.confidence})`);
                        });
                    }
                }
            } else {
                console.log('❌ Analysis failed:', response.data.error);
            }
            
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Response:', error.response.data);
            }
        }
    }
    
    console.log('\n🎉 API Testing Complete');
}

// Run the test
testTradingSystemsAPI().then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
