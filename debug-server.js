const express = require('express');
const cors = require('cors');
const axios = require('axios');

console.log('🚀 Starting isolated test server...');

const app = express();
app.use(cors());
app.use(express.json());

// Import the trading controller
let tradeController;
try {
  tradeController = require('./src/controllers/ai/trade.controller.js');
  console.log('✅ Trade controller loaded successfully');
} catch (err) {
  console.error('❌ Failed to load trade controller:', err.message);
  process.exit(1);
}

// Simple route to test expert AI
app.get('/test-expert-ai', async (req, res) => {
  console.log('\n🧪 TEST ROUTE: Starting Expert AI test...');
  
  try {
    // Call the main trading analysis function
    const mockReq = {
      query: {
        symbol: 'MSFT',
        timeframe: 'daily',
        analysisType: 'comprehensive'
      }
    };
    
    const mockRes = {
      json: (data) => {
        console.log('✅ Response generated successfully');
        console.log('Expert AI Status:', data.expertAI?.status || 'MISSING');
        console.log('Market Regime:', data.expertAI?.marketRegime?.regime || 'MISSING');
        res.json(data);
      },
      status: (code) => ({
        json: (data) => {
          console.log('❌ Error response:', code, data);
          res.status(code).json(data);
        }
      })
    };
    
    // Call the controller
    await tradeController.getAnalysis(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ Test route error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`🌟 Test server running on port ${PORT}`);
  console.log('   Test endpoint: http://localhost:8001/test-expert-ai');
});
