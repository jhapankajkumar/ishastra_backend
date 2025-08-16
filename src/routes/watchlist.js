const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlist.controller');

// Initialize controller
const watchlistController = new WatchlistController();

// GET Routes
router.get('/', watchlistController.getWatchlist.bind(watchlistController));
router.get('/stats', watchlistController.getWatchlistStats.bind(watchlistController));
router.get('/by-grade', watchlistController.getWatchlistByGrade.bind(watchlistController));
router.get('/:symbol', watchlistController.getWatchlistStock.bind(watchlistController));

// POST Routes
router.post('/populate', watchlistController.populateWatchlist.bind(watchlistController));
router.post('/update-now', watchlistController.updateWatchlistNow.bind(watchlistController));
router.post('/analyze/:symbol', watchlistController.analyzeAndAddStock.bind(watchlistController));
router.post('/cleanup', watchlistController.cleanupWatchlist.bind(watchlistController));

// PUT Routes
router.put('/:symbol/status', watchlistController.updateStockStatus.bind(watchlistController));

// DELETE Routes
router.delete('/:symbol', watchlistController.removeFromWatchlist.bind(watchlistController));

module.exports = router;
