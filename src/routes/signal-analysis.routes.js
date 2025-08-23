/**
 * Trading System API Routes - Multi-System Stock Analysis
 * Unified endpoints for comprehensive stock analysis using:
 * - Elder's Triple Screen System
 * - Minervini SEPA (Stage Analysis)
 * - Future systems
 */

const express = require('express');
const router = express.Router();
const { TradingSystemController } = require('../controllers/signal-analysis.controller');

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
    ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean', 'macd_divergence'];

  req.body = { symbols, systems };
  await tradingController.analyzeTradingSystem(req, res);
});

router.get('/signal-analysis/single', async (req, res) => {
  // Convert query parameters to req.body format for compatibility with existing controller
  const symbol = req.query.symbol ? req.query.symbol.trim().toUpperCase() : '';
  const system = req.query.system ? req.query.system.trim() : '';

  req.body = { symbol, system };
  await tradingController.analyzeSingleSystem(req, res);
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
