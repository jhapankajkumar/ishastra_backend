const axios = require('axios');

async function debugDataLength() {
  console.log('🔍 Debugging Yahoo Finance Data Length...');
  
  try {
    // Make API request and capture response
    const response = await axios.get('http://localhost:8000/api/trading/analysis?symbol=MSFT&timeframe=daily&analysisType=comprehensive');
    
    // Check if there's more detailed info in the response
    console.log('\n📊 Response Structure:');
    console.log('- Symbol:', response.data.symbol);
    console.log('- Timeframe used:', response.data.timeframe?.used);
    console.log('- Context period:', response.data.timeframe?.context);
    
    // Look for any debug/data info
    if (response.data.market?.ohlcLength) {
      console.log('- OHLC Data Length:', response.data.market.ohlcLength);
    }
    
    if (response.data.diagnostics) {
      console.log('- Diagnostics present:', Object.keys(response.data.diagnostics));
    }
    
    // Test with a different stock that might have more data
    console.log('\n🔄 Testing with AAPL...');
    const aaplResponse = await axios.get('http://localhost:8000/api/trading/analysis?symbol=AAPL&timeframe=daily&analysisType=comprehensive');
    console.log('- AAPL Symbol:', aaplResponse.data.symbol);
    
    // Check what yahoo finance is actually returning
    console.log('\n📈 Direct Yahoo Finance Test...');
    const yahooFinance = require('yahoo-finance2');
    const historicalData = await yahooFinance.historical('MSFT', {
      period1: '2022-12-01',
      period2: new Date(),
      interval: '1d'
    });
    
    console.log('- Yahoo Finance Direct Data Points:', historicalData.length);
    console.log('- Sample Data Point:', {
      date: historicalData[0]?.date,
      close: historicalData[0]?.close,
      volume: historicalData[0]?.volume
    });
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

debugDataLength();
