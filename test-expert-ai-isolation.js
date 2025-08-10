// Test expert AI function in isolation
const { detectVolatilityRegime } = require('./src/utils/volatilityRegimeDetector');

// Mock analysis context
const mockContext = {
  technical: {
    currentPrice: 450.50,
    latestPrice: 450.50,
    ohlcData: [
      { close: 445, high: 455, low: 440, volume: 50000000 },
      { close: 448, high: 452, low: 442, volume: 45000000 },
      { close: 450.50, high: 455, low: 447, volume: 48000000 }
    ],
    technicalIndicators: {
      latest: {
        rsi: 55,
        sma200: 420,
        ema20: 448,
        ema50: 445,
        adx: 32,
        macd: 2.5,
        macdSignal: 2.2
      }
    }
  },
  backtest: { winRate: 65, profitFactor: 1.8, maxDrawdown: 12 },
  sentiment: { composite: 0.6, newsScore: 0.7 },
  capital: 50000,
  symbol: 'TEST',
  monteCarlo: null
};

async function testExpertAI() {
  console.log('🧪 Testing Expert AI Function In Isolation...');
  
  try {
    // First test volatility regime detector
    console.log('\n1. Testing Volatility Regime Detector...');
    const regimeResult = detectVolatilityRegime(mockContext.technical.ohlcData, mockContext.technical.technicalIndicators);
    console.log('✅ Volatility Regime:', regimeResult.regime, 'Confidence:', (regimeResult.confidence * 100).toFixed(1) + '%');
    
    // Now test the full expert AI function
    console.log('\n2. Testing Full Expert AI Function...');
    
    // Load the trade controller function
    const fs = require('fs');
    const path = require('path');
    
    // Read and execute the generateExpertAIDecision function
    const controllerCode = fs.readFileSync(path.join(__dirname, 'src/controllers/ai/trade.controller.js'), 'utf8');
    
    // Extract just the function we need
    const functionMatch = controllerCode.match(/async function generateExpertAIDecision\([\s\S]*?\n}\n(?=\n|async|function|$)/);
    
    if (functionMatch) {
      console.log('✅ Found generateExpertAIDecision function');
      // This is tricky - we need to execute the function in context
      console.log('⚠️  Function requires full context - testing via API instead');
    } else {
      console.log('❌ Could not find generateExpertAIDecision function');
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testExpertAI();
