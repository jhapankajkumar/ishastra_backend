// Quick API test for Monte Carlo
const fetch = require('node-fetch');

async function quickTest() {
  try {
    console.log('🔧 Quick API Test...');
    const response = await fetch('http://localhost:8000/api/trading/analysis?symbol=AAPL&period=3mo', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Working! Decision: ${data.decision?.action || 'UNKNOWN'}`);
      console.log(`🎲 Monte Carlo: ${data.scenarios?.monteCarlo ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`🛡️ Tail Risk: ${data.risk?.tailRisk ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`🔍 Microstructure: ${data.execution?.timing ? 'ACTIVE' : 'INACTIVE'}`);
    } else {
      console.log(`❌ API Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Connection Error: ${error.message}`);
  }
}

quickTest();
