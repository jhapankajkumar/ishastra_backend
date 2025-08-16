const express = require('express');
const router = express.Router();
const {
  getAllCapital,
  getCapitalByCurrency,
  updateCapital,
  initializeCapital,
  checkCapitalAvailability
} = require('../controllers/capital.controller');

/**
 * Capital Management Routes
 * Base path: /api/capital
 */

// GET /api/capital - Get all capital information
router.get('/', getAllCapital);

// GET /api/capital/status - Alias for getting all capital
router.get('/status', getAllCapital);

// GET /api/capital/check - Check capital availability
// Query params: currency, amount
// Example: /api/capital/check?currency=USD&amount=1000
router.get('/check', checkCapitalAvailability);

// GET /api/capital/:currency - Get capital for specific currency
router.get('/:currency', getCapitalByCurrency);

// POST /api/capital/initialize - Initialize capital records
// Body: { initialCapitals: [{ currency: 'USD', total: 20000 }, { currency: 'INR', total: 2000000 }] }
router.post('/initialize', initializeCapital);

// PUT /api/capital/:currency - Update/Reset capital for a currency
// Body: { total: number, adjustRemaining?: boolean }
router.put('/:currency', updateCapital);

module.exports = router;
