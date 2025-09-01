const dataFetcher = require('./src/utils/simpleTechnicalDataFetcher.js');
const MinerviniTemplateAdvanced = require('./src/systems/minervini-template-advanced.js');

async function debugDataFormat() {
  console.log('🔍 DEBUGGING DATA FORMAT MISMATCH');
  console.log('=================================');

  const technicalData = await dataFetcher.getSimpleTechnicalData('AAPL');
  
  console.log('\n📊 Raw Technical Data Structure (what controller passes):');
  console.log('Keys:', Object.keys(technicalData));
  console.log('Has indicators?', !!technicalData.indicators);
  console.log('Has ohlcData?', !!technicalData.ohlcData);
  console.log('Has series?', !!technicalData.series);
  
  console.log('\n🎯 What Systems Expect:');
  console.log('Need: { indicators: {...}, series: { daily: [...] } }');
  
  console.log('\n🚨 TESTING BOTH FORMATS:');
  
  const minervini = new MinerviniTemplateAdvanced();
  const options = {
    capital: 100000,
    symbol: 'AAPL',
    currentPrice: technicalData.currentPrice
  };
  
  console.log('\n1️⃣ TESTING WITH RAW TECHNICAL DATA (controller format):');
  try {
    const resultRaw = minervini.analyze(technicalData, options);
    console.log('   Action:', resultRaw.decision);
    console.log('   Confidence:', (resultRaw.confidence * 100).toFixed(1) + '%');
  } catch (error) {
    console.log('   ERROR:', error.message);
  }
  
  console.log('\n2️⃣ TESTING WITH STRUCTURED DATA (working format):');
  const structuredData = {
    indicators: technicalData.indicators,
    series: { daily: technicalData.ohlcData }
  };
  try {
    const resultStructured = minervini.analyze(structuredData, options);
    console.log('   Action:', resultStructured.decision);
    console.log('   Confidence:', (resultStructured.confidence * 100).toFixed(1) + '%');
  } catch (error) {
    console.log('   ERROR:', error.message);
  }
}

debugDataFormat().catch(console.error);
