const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { buildReadFilter, buildWriteFilter } = require('../utils/ownershipFilter');

// Get all transactions for an investment — scoped through the parent
// Investment's ownership, since InvestmentTransaction carries no owner field
// of its own.
router.get('/:investmentId/transactions', async (req, res) => {
  try {
    const { investmentId } = req.params;

    const investment = await prisma.investment.findFirst({
      where: { id: parseInt(investmentId), ...buildReadFilter(req) }
    });
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    const transactions = await prisma.investmentTransaction.findMany({
      where: { investmentId: parseInt(investmentId) },
      orderBy: { transactionDate: 'desc' }
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching investment transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment transactions',
      error: error.message
    });
  }
});

// Create a new transaction (buy/sell)
router.post('/:investmentId/transactions', async (req, res) => {
  try {
    const { investmentId } = req.params;
    const { transaction_type, quantity, price, transaction_date, reason_for_exit } = req.body;

    // Validation
    if (!transaction_type || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type, quantity and price are required'
      });
    }

    // Check if investment exists and belongs to the caller (or sandbox for guests)
    const investment = await prisma.investment.findFirst({
      where: { id: parseInt(investmentId), ...buildWriteFilter(req) }
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const transaction = await prisma.investmentTransaction.create({
      data: {
        investmentId: parseInt(investmentId),
        transactionType,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        transactionDate: transaction_date ? new Date(transaction_date) : new Date(),
        reasonForExit: reason_for_exit || null
      }
    });

    // If it's a sell transaction, update the remaining quantity
    if (transaction_type === 'Sell') {
      const remainingQty = (investment.remainingQty || investment.quantity) - parseInt(quantity);
      
      const updateData = {
        remainingQty
      };

      // If fully sold, close the investment
      if (remainingQty <= 0) {
        updateData.status = 'closed';
        updateData.exitDate = transaction_date ? new Date(transaction_date) : new Date();
      }

      await prisma.investment.update({
        where: { id: parseInt(investmentId) },
        data: updateData
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating investment transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create investment transaction',
      error: error.message
    });
  }
});

module.exports = router;
