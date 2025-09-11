/**
 * 🎯 BACKTEST API ROUTES
 * 
 * REST API routes for the backtesting system
 */

const express = require('express');
const { BacktestController } = require('../controllers/backtest.controller');

const router = express.Router();
const backtestController = new BacktestController();

// 🚀 Run new backtest
router.post('/run', async (req, res) => {
  await backtestController.runBacktest(req, res);
});

// 📊 Check backtest status
router.get('/status/:id', async (req, res) => {
  await backtestController.getBacktestStatus(req, res);
});

// 📈 Get backtest results
router.get('/results/:id', async (req, res) => {
  await backtestController.getBacktestResults(req, res);
});

// 📚 Get historical backtest trades
router.get('/history', async (req, res) => {
  await backtestController.getBacktestHistory(req, res);
});

// 📊 Get backtest analytics
router.get('/analytics', async (req, res) => {
  await backtestController.getBacktestAnalytics(req, res);
});

// 🗑️ Clear backtest history (admin)
router.delete('/clear', async (req, res) => {
  await backtestController.clearBacktestHistory(req, res);
});

module.exports = router;
