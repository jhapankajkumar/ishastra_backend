const express = require('express');
const router = express.Router();

const {
  getAllInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  closeInvestment,
  getInvestmentSummary
} = require('../controllers/investment.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { guestWriteLimiter } = require('../middleware/rateLimit.middleware');
const { validateGuestWritableFields } = require('../middleware/validation.middleware');

// Routes
router.get('/', getAllInvestments);
// Cross-user aggregate (counts across ALL investments) — SUPERUSER only.
router.get('/summary', requireAuth, requireRole('SUPERUSER'), getInvestmentSummary);
router.get('/:id', getInvestmentById);
router.post('/', guestWriteLimiter, validateGuestWritableFields, createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', requireAuth, deleteInvestment);
router.patch('/:id/close', closeInvestment);

module.exports = router;
