/**
 * Elder's Triple Screen API Routes
 * Complete system with real API endpoints using optimized data fetching
 */

const express = require('express');
const router = express.Router();
const { ElderTripleScreenController } = require('../controllers/elder-triple-screen.controller');

// Initialize controller
const elderController = new ElderTripleScreenController();

/**
 * POST /api/trading/elder-triple-screen
 * Analyze multiple US stocks using Elder's Triple Screen system
 * 
 * Request Body:
 * {
 *   "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
 *   "capital": 100000
 * }
 * 
 * Response: Complete analysis with system decisions and gate engine results
 */
router.post('/elder-triple-screen', async (req, res) => {
  await elderController.analyzeElderTripleScreen(req, res);
});

/**
 * GET /api/trading/elder-triple-screen/demo
 * Demo endpoint with pre-selected US stocks for quick testing
 */
router.get('/elder-triple-screen/demo', async (req, res) => {
  const demoStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const capital = req.query.capital ? parseInt(req.query.capital) : 100000;
  
  // Set demo request body
  req.body = {
    symbols: demoStocks,
    capital
  };
  
  await elderController.analyzeElderTripleScreen(req, res);
});

/**
 * POST /api/trading/elder-triple-screen/single
 * Analyze a single stock with detailed breakdown
 */
router.post('/elder-triple-screen/single', async (req, res) => {
  const { symbol, capital = 100000 } = req.body;
  
  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'symbol is required',
      example: { symbol: 'AAPL', capital: 100000 }
    });
  }
  
  // Convert to array for controller
  req.body.symbols = [symbol];
  await elderController.analyzeElderTripleScreen(req, res);
});

module.exports = router;
