/**
 * Trading System API Routes - Multi-System Stock Analysis
 * Unified endpoints for comprehensive stock analysis using:
 * - Elder's Triple Screen System
 * - Minervini SEPA (Stage Analysis)
 * - Future systems
 */

const express = require('express');
const router = express.Router();
const { TradingSystemController } = require('../controllers/trading.system.controller');

// Initialize controllers
const tradingController = new TradingSystemController();

/**
 * POST /api/trading/stock-analysis
 * Analyze multiple US stocks using all available trading systems
 * 
 * Request Body:
 * {
 *   "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
 *   "capital": 100000
 * }
 * 
 * Response: Complete multi-system stock analysis with unified decisions
 */
router.post('/stock-analysis', async (req, res) => {
  // Always analyze with all available systems
  req.body.systems = ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean'];
  await tradingController.analyzeTradingSystem(req, res);
});

/**
 * POST /api/trading/stock-analysis/fast
 * OPTIMIZED: Fast stock analysis - target <1 second response time
 * 
 * Request Body:
 * {
 *   "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
 *   "capital": 100000
 * }
 * 
 * Response: Lightweight multi-system analysis optimized for speed
 */
router.post('/stock-analysis', async (req, res) => {
  await tradingController.analyzeTradingSystem(req, res);
});

/**
 * GET /api/trading/demo
 * Demo endpoint with pre-selected US stocks for quick testing
 */
router.get('/demo', async (req, res) => {
  const demoStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const capital = req.query.capital ? parseInt(req.query.capital) : 100000;
  
  // Set demo request body with all systems
  req.body = {
    symbols: demoStocks,
    capital,
    systems: ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean']
  };
  
  await tradingController.analyzeTradingSystem(req, res);
});

module.exports = router;
