/**
 * 🎯 SIMPLE WATCHLIST ROUTES - CLEAN & CLEAR
 * 
 * TWO ENDPOINTS. THAT'S IT.
 */

const express = require('express');
const router = express.Router();
const SimpleWatchlistController = require('../controllers/simpleWatchlistController');

const controller = new SimpleWatchlistController();

// GET current watchlist
router.get('/', controller.getWatchlist.bind(controller));

// POST trigger daily scan
router.post('/daily-scan', controller.runDailyScan.bind(controller));

module.exports = router;
