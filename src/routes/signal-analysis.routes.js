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
const { SYSTEM_IDS } = require('../utils/systemConstants');

// Initialize controllers
const tradingController = new TradingSystemController();

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
  const symbols = req.query.symbols ? req.query.symbols.split(',').map(s => s.trim().toUpperCase()) : [];
  const systems = req.query.systems ? 
    req.query.systems.split(',').map(s => s.trim()) : 
    [SYSTEM_IDS.MINERVINI_TEMPLATE_ADVANCED, SYSTEM_IDS.INSTITUTIONAL_MOMENTUM_CASCADE];

  req.body = { symbols, systems };
  await tradingController.analyzeTradingSystem(req, res);
});

module.exports = router;
