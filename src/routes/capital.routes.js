const express = require('express');
const router = express.Router();
const {
  getAllCapital,
  getCapitalByCurrency,
  addCapital,
  removeCapital,
  updateCapital,
  initializeCapital,
  checkCapitalAvailability,
  deposit,
  withdraw,
  getTransactions
} = require('../controllers/capital.controller');
const { requireAuth } = require('../middleware/auth.middleware');

/**
 * Capital Management Routes
 * Base path: /api/capital
 * No guest concept here — the whole router requires login.
 */
router.use(requireAuth);

// GET /api/capital - Get all capital information
router.get('/', getAllCapital);

// GET /api/capital/transactions - Deposit/withdraw ledger, newest first
router.get('/transactions', getTransactions);

// POST /api/capital/deposit - Deposit into the user's own capital
router.post('/deposit', deposit);

// POST /api/capital/withdraw - Withdraw from the user's own capital
router.post('/withdraw', withdraw);

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

// POST /api/capital/:currency/add - Add capital for a currency
// Body: { amount: number }
router.post('/:currency/add', addCapital);

// POST /api/capital/:currency/remove - Remove capital for a currency
// Body: { amount: number }
router.post('/:currency/remove', removeCapital);

// PUT /api/capital/:currency - Update/Reset capital for a currency
// Body: { total: number, adjustRemaining?: boolean }
router.put('/:currency', updateCapital);

module.exports = router;
