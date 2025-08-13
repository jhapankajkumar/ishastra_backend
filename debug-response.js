/**
 * Quick debug test to check the actual response structure
 */

const axios = require('axios');

async function debugResponse() {
  try {
    console.log('🔍 Debug: Checking actual response structure...');
    
    const response = await axios.post('http://localhost:8000/api/trading/elder-triple-screen', {
      symbols: ['AAPL'],
      capital: 25000
    }, {
      timeout: 60000
    });
    
    console.log('\n✅ Response received successfully!');
    console.log('\n📋 Full Response Structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugResponse();
