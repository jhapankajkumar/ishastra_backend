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
    [SYSTEM_IDS.TRIPLE_SCREEN, SYSTEM_IDS.MINERVINI_SEPA, SYSTEM_IDS.RSI_MEAN_REVERSION, 
     SYSTEM_IDS.MINERVINI_TEMPLATE_ADVANCED, SYSTEM_IDS.INSTITUTIONAL_MOMENTUM_CASCADE];

  req.body = { symbols, systems };
  await tradingController.analyzeTradingSystem(req, res);
});

router.get('/signal-analysis/single', async (req, res) => {
  // Convert query parameters to req.body format for compatibility with existing controller
  const symbol = req.query.symbol ? req.query.symbol.trim().toUpperCase() : '';
  const system = req.query.system ? req.query.system.trim() : SYSTEM_IDS.TRIPLE_SCREEN; // Default to Triple Screen system

  req.body = { symbol, system };
  await tradingController.analyzeSingleSystem(req, res);
});

router.get('/signal-analysis/system', async (req, res) => {
  // Convert query parameters to req.body format for compatibility with existing controller
  const system = req.query.system ? req.query.system.trim() : SYSTEM_IDS.TRIPLE_SCREEN; // Default to Triple Screen system
  const stockSize = req.query.stockSize ? parseInt(req.query.stockSize) : 50;
  
  // Validate that the requested system exists
  const validSystems = Object.values(SYSTEM_IDS);
  if (!validSystems.includes(system)) {
    return res.status(400).json({
      success: false,
      error: `Invalid system '${system}'. Valid systems: ${validSystems.join(', ')}`,
      availableSystems: validSystems
    });
  }
  
  req.body = { system, stockSize };
  await tradingController.testSystem(req, res);
});

/**
 * GET /api/trading/demo
 * Demo endpoint with pre-selected US stocks for quick testing
 */
router.get('/demo', async (req, res) => {
  const demoStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  const capital = req.query.capital ? parseInt(req.query.capital) : 100000;
  
  // Set demo request body with available systems only
  req.body = {
    symbols: demoStocks,
    capital,
    systems: [SYSTEM_IDS.TRIPLE_SCREEN, SYSTEM_IDS.MINERVINI_SEPA, SYSTEM_IDS.RSI_MEAN_REVERSION]
  };
  
  await tradingController.analyzeTradingSystem(req, res);
});

module.exports = router;
