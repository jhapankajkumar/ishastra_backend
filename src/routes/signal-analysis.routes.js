/**
 * Trading System API Routes - Multi-System Stock Analysis
 * Unified endpoints for comprehensive stock analysis using:
 * - Elder's Triple Screen System
 * - Minervini SEPA (Stage Analysis)
 * - Minervini Template Advanced
 * - Institutional Momentum Cascade
 * - Future systems
 */

const express = require('express');
const router = express.Router();
const { TradingSystemController } = require('../controllers/signal-analysis.controller');
const { AISetupReviewController } = require('../controllers/ai-setup-review.controller');
const { SYSTEM_IDS } = require('../utils/systemConstants');

// Initialize controllers
const tradingController = new TradingSystemController();
const aiSetupReviewController = new AISetupReviewController();

/**
 * GET /api/trading/signal-analysis
 * Analyze multiple US stocks using all available trading systems
 * 
 * Query Parameters:
 * - symbols: comma-separated list of stock symbols (e.g., "AAPL,MSFT,GOOGL")
 * - capital: portfolio capital (optional, default: 100000)
 * - systems: comma-separated list of systems (optional, default: all systems)
 * 
 * Example: /api/trading/signal-analysis?symbols=AAPL,MSFT&capital=50000
 * 
 * Response: Complete multi-system stock analysis with unified decisions
 */
router.get('/signal-analysis', async (req, res) => {
  // Convert query parameters to req.body format for compatibility with existing controller
  await tradingController.analyzeTradingSystem(req, res);
});

router.get('/chart', async (req, res) => {
  // Convert query parameters to req.body format for compatibility with existing controller
  await tradingController.getChartData(req, res);
});

router.post('/ai-setup-review', async (req, res) => {
  await aiSetupReviewController.reviewSetup(req, res);
});

router.post('/ai-setup-review/bulk', async (req, res) => {
  await aiSetupReviewController.reviewBulk(req, res);
});

module.exports = router;
