const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlist.controller');

// Initialize controller
const watchlistController = new WatchlistController();

// GET Routes
router.get('/', watchlistController.getWatchlist.bind(watchlistController));
router.get('/expert-status', watchlistController.getExpertStatus.bind(watchlistController));
router.get('/:symbol', watchlistController.getWatchlistStock.bind(watchlistController));

// POST Routes
router.post('/populate', watchlistController.populateWatchlist.bind(watchlistController));
router.post('/cleanup', watchlistController.cleanupWatchlist.bind(watchlistController));
router.post('/expert-analysis', watchlistController.runExpertAnalysis.bind(watchlistController));

// PUT Routes
// (No PUT routes currently available)

// DELETE Routes
router.delete('/:symbol', watchlistController.removeFromWatchlist.bind(watchlistController));

module.exports = router;
