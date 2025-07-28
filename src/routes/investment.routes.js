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

// Routes
router.get('/', getAllInvestments);
router.get('/summary', getInvestmentSummary);
router.get('/:id', getInvestmentById);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);
router.patch('/:id/close', closeInvestment);

module.exports = router;
