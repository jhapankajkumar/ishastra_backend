/**
 * AI Trading System - Phase 3: Backtesting Routes
 * API routes for historical validation and system performance analysis
 */

const express = require('express');
const router = express.Router();
const backtestingController = require('../../controllers/ai/backtesting.controller');

/**
 * Single Symbol Backtesting
 * GET /api/trading/backtest?symbol=AAPL&period=2y&systems=all&capital=100000
 */
router.get('/backtest', backtestingController.backtestSymbol);

/**
 * Portfolio Backtesting
 * POST /api/trading/backtest-portfolio
 * Body: { "symbols": ["AAPL", "NVDA", "TSLA"], "period": "2y", "systems": ["all"] }
 */
router.post('/backtest-portfolio', backtestingController.backtestPortfolio);

/**
 * System Rankings and Performance Comparison
 * GET /api/trading/system-rankings?symbols=AAPL,NVDA,TSLA&period=1y
 */
router.get('/system-rankings', backtestingController.getSystemRankings);

module.exports = router;
