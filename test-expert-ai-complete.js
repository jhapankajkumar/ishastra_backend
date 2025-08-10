const axios = require('axios');

async function testExpertAI() {
  console.log('🔬 Testing Expert AI System - Complete Fix Verification');
  
  try {
    console.log('\n1. Fetching MSFT data...');
    const response = await axios.get('http://localhost:8000/api/trading/analysis?symbol=MSFT&timeframe=daily&analysisType=comprehensive', {
      timeout: 30000
    });
    
    console.log('✅ API Response received');
    console.log('\n📊 Expert AI Analysis:');
    console.log('- Status:', response.data.expertAI?.status || 'MISSING');
    console.log('- Market Regime:', response.data.expertAI?.marketRegime?.regime || 'MISSING');
    console.log('- Regime Confidence:', response.data.expertAI?.marketRegime?.confidence || 'MISSING');
    console.log('- Signal Weights Count:', Object.keys(response.data.expertAI?.signalWeights || {}).length);
    console.log('- Monte Carlo Present:', response.data.expertAI?.monteCarlo ? 'YES' : 'NO');
    
    console.log('\n📋 Core Decision:');
    console.log('- Action:', response.data.decision?.action || response.data.action);
    console.log('- Grade:', response.data.decision?.grade || response.data.grade);
    console.log('- Confidence:', response.data.decision?.confidencePct || response.data.confidence);
    
    // Check if we have volatility regime data
    if (response.data.expertAI?.marketRegime?.volatilityRegimeDetails) {
      console.log('\n🌊 Volatility Regime Details:');
      const vrd = response.data.expertAI.marketRegime.volatilityRegimeDetails;
      console.log('- Regime:', vrd.regime);
      console.log('- ATR%:', vrd.atrPercent?.toFixed(2));
      console.log('- Confidence:', (vrd.confidence * 100).toFixed(1) + '%');
    } else {
      console.log('\n❌ Volatility Regime Details: MISSING');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response?.data) {
      console.error('Server Response:', error.response.data);
    }
  }
}

testExpertAI();
