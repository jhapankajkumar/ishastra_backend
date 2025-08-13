/**
 * Debug Elder's data structure to understand validation issues
 */

const axios = require('axios');

// Test the getTechnicalAnalysisData method directly
async function debugElderDataStructure() {
  console.log('🔍 Debugging Elder\'s data structure...');
  
  try {
    // Test technical data fetch first
    console.log('\n1️⃣ Testing getAnalysis endpoint...');
    const response = await axios.get('http://localhost:8000/api/trading/analysis?symbol=AAPL&period=1y');
    
    if (response.data && response.data.technical) {
      const technical = response.data.technical;
      console.log('\n📊 Technical Data Structure:');
      console.log(`• OHLC Data Length: ${technical.ohlcData?.length || 'N/A'}`);
      console.log(`• Historical Data Length: ${technical.historicalData?.length || 'N/A'}`);
      console.log(`• Current Price: ${technical.currentPrice || 'N/A'}`);
      console.log(`• Indicators Available: ${Object.keys(technical.indicators || {}).join(', ') || 'None'}`);
      console.log(`• Technical Indicators: ${Object.keys(technical.technicalIndicators || {}).join(', ') || 'None'}`);
      
      // Sample a few data points
      const dataArray = technical.ohlcData || technical.historicalData || [];
      if (dataArray.length > 0) {
        console.log('\n📈 Sample Data Points:');
        console.log('First:', JSON.stringify(dataArray[0], null, 2));
        console.log('Latest:', JSON.stringify(dataArray[dataArray.length - 1], null, 2));
      }
      
      // Check indicator structure
      if (technical.indicators) {
        console.log('\n🔧 Indicators Structure:');
        Object.entries(technical.indicators).forEach(([key, value]) => {
          console.log(`• ${key}: ${Array.isArray(value) ? `Array[${value.length}]` : typeof value}`);
        });
      }
      
      if (technical.technicalIndicators) {
        console.log('\n🔧 Technical Indicators Structure:');
        Object.entries(technical.technicalIndicators).forEach(([key, value]) => {
          console.log(`• ${key}: ${Array.isArray(value) ? `Array[${value.length}]` : typeof value}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugElderDataStructure();
