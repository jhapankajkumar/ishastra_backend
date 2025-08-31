const path = require('path');

// Test the technical analysis directly 
async function testTechnicalAnalysis() {
  try {
    console.log('🔍 Testing Technical Analysis...');
    
    // Mock OHLC data that might be causing the issue
    const mockOHLCData = [
      { open: 100, high: 105, low: 95, close: 102, volume: 1000000 },
      { open: 102, high: 108, low: 100, close: 106, volume: 1200000 },
      { open: 106, high: 110, low: 104, close: 108, volume: 1100000 },
      // Add more data points...
    ];

    // Fill with more realistic data to meet the 50 minimum requirement
    for (let i = 3; i < 60; i++) {
      const prevClose = mockOHLCData[i-1].close;
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility * prevClose;
      const newClose = prevClose + change;
      const high = newClose + Math.random() * 0.01 * newClose;
      const low = newClose - Math.random() * 0.01 * newClose;
      const open = prevClose + (Math.random() - 0.5) * 0.005 * prevClose;
      
      mockOHLCData.push({
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(newClose.toFixed(2)),
        volume: Math.floor(800000 + Math.random() * 400000)
      });
    }

    console.log(`✅ Generated ${mockOHLCData.length} OHLC data points`);
    console.log('Sample data:', {
      first: mockOHLCData[0],
      last: mockOHLCData[mockOHLCData.length - 1]
    });

    // Test data arrays
    const closes = mockOHLCData.map(d => d.close);
    const highs = mockOHLCData.map(d => d.high);
    const lows = mockOHLCData.map(d => d.low);
    const volumes = mockOHLCData.map(d => d.volume || 0);
    
    console.log('📊 Arrays check:', {
      closesIsArray: Array.isArray(closes),
      closesLength: closes.length,
      closesType: typeof closes[0],
      highsIsArray: Array.isArray(highs),
      lowsIsArray: Array.isArray(lows),
      volumesIsArray: Array.isArray(volumes),
      allFinite: closes.every(c => Number.isFinite(c))
    });

    console.log('\n🚀 Now testing AdvancedTechnicalIndicators.calculateAllIndicators...');

    // Test the actual method that's failing
    try {
        console.log('🔍 Input validation before calling calculateAllIndicators:');
        console.log('- closes:', typeof closes, Array.isArray(closes), closes.length);
        console.log('- highs:', typeof highs, Array.isArray(highs), highs.length);
        console.log('- lows:', typeof lows, Array.isArray(lows), lows.length);
        console.log('- volumes:', typeof volumes, Array.isArray(volumes), volumes.length);
        console.log('- sample closes values:', closes.slice(0, 3), '...', closes.slice(-3));
        console.log('- sample highs values:', highs.slice(0, 3), '...', highs.slice(-3));
        console.log('- sample lows values:', lows.slice(0, 3), '...', lows.slice(-3));
        
        const AdvancedTechnicalIndicators = require('./src/utils/advancedTechnicalIndicators');
        const indicators = AdvancedTechnicalIndicators.calculateAllIndicators(
            closes, highs, lows, volumes
        );
        console.log('✅ calculateAllIndicators SUCCESS!');
        console.log('Indicators keys:', Object.keys(indicators));
        console.log('ADX value:', indicators.adx?.[indicators.adx.length - 1]);
    } catch (error) {
        console.log('❌ calculateAllIndicators FAILED:', error.message);
        console.log('Error stack:', error.stack);
    }

    // The issue might be in the data validation, so let's check what happens
    // when we call the analysis function
    console.log('\n🚀 This should help identify the exact issue causing:');
    console.log('- "ADX calc failed → Inputs not arrays. Using proxy."');
    console.log('- "Cannot read properties of undefined (reading \'length\')"');
    console.log('- "Cannot read properties of undefined (reading \'aiSignals\')"');
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTechnicalAnalysis();
