/**
 * 🚀 TRADING ROUTES
 * Advanced AI trading system endpoints with leak-free backtesting
 */

const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/ai/stock.expert.controller');

// ✅ MAIN AI TRADING ANALYSIS ENDPOINT
// GET /api/trading/unified-analysis?symbol=HDFCBANK.NS&period=3mo
router.get('/analysis', tradeController.getAnalysis);

// 🛡️ LEAK-FREE BACKTESTING ENDPOINT
// GET /api/trading/leak-free-backtest?symbol=HDFCBANK.NS&period=2y&systems=sepa,tripleScreen
router.get('/leak-free-backtest', tradeController.getLeakFreeBacktest);

module.exports = router;