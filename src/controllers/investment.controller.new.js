const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all investments
const getAllInvestments = async (req, res) => {
  try {
    const { status, ticker } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (ticker) where.ticker = ticker.toUpperCase();

    const investments = await prisma.investments.findMany({
      where,
      orderBy: { investment_date: 'desc' },
      include: {
        investment_transactions: {
          orderBy: { transaction_date: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: investments
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investments',
      error: error.message
    });
  }
};

// Get single investment
const getInvestmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const investment = await prisma.investments.findUnique({
      where: { id: parseInt(id) },
      include: {
        investment_transactions: {
          orderBy: { transaction_date: 'desc' }
        }
      }
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    res.json({
      success: true,
      data: investment
    });
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment',
      error: error.message
    });
  }
};

// Create new investment
const createInvestment = async (req, res) => {
  try {
    const {
      ticker,
      buy_below,
      current_price,
      qty,
      buy_average,
      remark,
      investment_date,
      investment_source
    } = req.body;

    // Validation
    if (!ticker || !qty || !investment_date) {
      return res.status(400).json({
        success: false,
        message: 'Ticker, quantity and investment date are required'
      });
    }

    const investmentData = {
      ticker: ticker.toUpperCase(),
      buy_below: buy_below ? parseFloat(buy_below) : null,
      current_price: current_price ? parseFloat(current_price) : null,
      qty: parseInt(qty),
      buy_average: buy_average ? parseFloat(buy_average) : null,
      remark: remark || null,
      investment_date: new Date(investment_date),
      remaining_qty: parseInt(qty), // Initially, remaining qty = total qty
      investment_source: investment_source || null,
      status: 'open'
    };

    const investment = await prisma.investments.create({
      data: investmentData
    });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create investment',
      error: error.message
    });
  }
};

// Update investment
const updateInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ticker,
      buy_below,
      current_price,
      qty,
      buy_average,
      remark,
      investment_date,
      exit_date,
      remaining_qty,
      investment_source,
      status
    } = req.body;

    // Check if investment exists
    const existingInvestment = await prisma.investments.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingInvestment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const updateData = {};
    if (ticker !== undefined) updateData.ticker = ticker.toUpperCase();
    if (buy_below !== undefined) updateData.buy_below = buy_below ? parseFloat(buy_below) : null;
    if (current_price !== undefined) updateData.current_price = current_price ? parseFloat(current_price) : null;
    if (qty !== undefined) updateData.qty = parseInt(qty);
    if (buy_average !== undefined) updateData.buy_average = buy_average ? parseFloat(buy_average) : null;
    if (remark !== undefined) updateData.remark = remark;
    if (investment_date !== undefined) updateData.investment_date = new Date(investment_date);
    if (exit_date !== undefined) updateData.exit_date = exit_date ? new Date(exit_date) : null;
    if (remaining_qty !== undefined) updateData.remaining_qty = remaining_qty ? parseInt(remaining_qty) : null;
    if (investment_source !== undefined) updateData.investment_source = investment_source;
    if (status !== undefined) updateData.status = status;

    const investment = await prisma.investments.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Investment updated successfully',
      data: investment
    });
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update investment',
      error: error.message
    });
  }
};

// Delete investment
const deleteInvestment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if investment exists
    const existingInvestment = await prisma.investments.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingInvestment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Delete related transactions first (cascade should handle this, but being explicit)
    await prisma.investment_transactions.deleteMany({
      where: { investment_id: parseInt(id) }
    });

    await prisma.investments.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Investment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete investment',
      error: error.message
    });
  }
};

// Close investment (partial or full)
const closeInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price, reason_for_exit, transaction_date } = req.body;

    // Validation
    if (!quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and price are required for closing investment'
      });
    }

    // Check if investment exists
    const investment = await prisma.investments.findUnique({
      where: { id: parseInt(id) }
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const sellQuantity = parseInt(quantity);
    const remainingQty = investment.remaining_qty || investment.qty;

    if (sellQuantity > remainingQty) {
      return res.status(400).json({
        success: false,
        message: 'Cannot sell more than remaining quantity'
      });
    }

    // Create sell transaction
    await prisma.investment_transactions.create({
      data: {
        investment_id: parseInt(id),
        transaction_type: 'Sell',
        quantity: sellQuantity,
        price: parseFloat(price),
        transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
        reason_for_exit: reason_for_exit || null
      }
    });

    // Update investment
    const newRemainingQty = remainingQty - sellQuantity;
    const updateData = {
      remaining_qty: newRemainingQty
    };

    // If fully sold, close the investment
    if (newRemainingQty === 0) {
      updateData.status = 'closed';
      updateData.exit_date = transaction_date ? new Date(transaction_date) : new Date();
    }

    const updatedInvestment = await prisma.investments.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        investment_transactions: {
          orderBy: { transaction_date: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      message: newRemainingQty === 0 ? 'Investment fully closed' : 'Partial investment closed',
      data: updatedInvestment
    });
  } catch (error) {
    console.error('Error closing investment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close investment',
      error: error.message
    });
  }
};

// Get investment summary
const getInvestmentSummary = async (req, res) => {
  try {
    const totalInvestments = await prisma.investments.count();
    const openInvestments = await prisma.investments.count({
      where: { status: 'open' }
    });
    const closedInvestments = await prisma.investments.count({
      where: { status: 'closed' }
    });

    // Get total invested amount (this would need buy_average * qty calculation)
    const investments = await prisma.investments.findMany({
      select: {
        buy_average: true,
        qty: true,
        status: true
      }
    });

    let totalInvestedAmount = 0;
    let openInvestedAmount = 0;

    investments.forEach(inv => {
      if (inv.buy_average && inv.qty) {
        const amount = inv.buy_average * inv.qty;
        totalInvestedAmount += amount;
        if (inv.status === 'open') {
          openInvestedAmount += amount;
        }
      }
    });

    res.json({
      success: true,
      data: {
        total_investments: totalInvestments,
        open_investments: openInvestments,
        closed_investments: closedInvestments,
        total_invested_amount: totalInvestedAmount,
        open_invested_amount: openInvestedAmount
      }
    });
  } catch (error) {
    console.error('Error fetching investment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investment summary',
      error: error.message
    });
  }
};

module.exports = {
  getAllInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  closeInvestment,
  getInvestmentSummary
};
