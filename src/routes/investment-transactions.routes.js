const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all transactions for an investment
router.get('/:investmentId/transactions', async (req, res) => {
  try {
    const { investmentId } = req.params;
    
    const transactions = await prisma.investment_transactions.findMany({
      where: { investment_id: parseInt(investmentId) },
      orderBy: { transaction_date: 'desc' }
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

    // Check if investment exists
    const investment = await prisma.investments.findUnique({
      where: { id: parseInt(investmentId) }
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const transaction = await prisma.investment_transactions.create({
      data: {
        investment_id: parseInt(investmentId),
        transaction_type,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        reason_for_exit: reason_for_exit || null
      }
    });

    // If it's a sell transaction, update the remaining quantity
    if (transaction_type === 'Sell') {
      const remainingQty = (investment.remaining_qty || investment.qty) - parseInt(quantity);
      
      const updateData = {
        remaining_qty: remainingQty
      };

      // If fully sold, close the investment
      if (remainingQty <= 0) {
        updateData.status = 'closed';
        updateData.exit_date = transaction_date ? new Date(transaction_date) : new Date();
      }

      await prisma.investments.update({
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
