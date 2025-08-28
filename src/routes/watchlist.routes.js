/**
 * 📊 WATCHLIST ROUTES - Essential & Expert Analysis
 * Optimized to keep only necessary endpoints
 */

const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlist.controller');

// Initialize controller
const watchlistController = new WatchlistController();

// GET Routes
router.get('/', watchlistController.getWatchlist.bind(watchlistController));
router.get('/expert-status', watchlistController.getExpertStatus.bind(watchlistController));

// POST Routes  
router.post('/populate', watchlistController.populateWatchlist.bind(watchlistController));
router.post('/expert-analysis', watchlistController.runExpertAnalysis.bind(watchlistController));

// DELETE Routes
router.delete('/:symbol', watchlistController.removeFromWatchlist.bind(watchlistController));

module.exports = router;
