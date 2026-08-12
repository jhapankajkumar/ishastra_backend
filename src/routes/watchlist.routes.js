/**
 * 🎯 SIMPLE WATCHLIST ROUTES - CLEAN & CLEAR
 * 
 * TWO ENDPOINTS. THAT'S IT.
 */

const express = require('express');
const router = express.Router();
const WatchlistController = require('../controllers/watchlist.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const controller = new WatchlistController();

// No guest concept for Watchlist — the whole router requires login.
router.use(requireAuth);

// GET current watchlist
router.get('/', controller.getWatchlist.bind(controller));

// POST trigger daily scan
router.post('/daily-scan', controller.runDailyScan.bind(controller));

// POST trigger breakout scan
router.post('/breakout-scan', controller.runBreakoutScan.bind(controller));

// DELETE from watchlist
router.post('/remove/', controller.deleteFromWatchlist.bind(controller));

// POST refresh stock
router.post('/refresh/', controller.refreshStock.bind(controller));

module.exports = router;
