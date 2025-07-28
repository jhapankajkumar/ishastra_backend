const { PrismaClient } = require('@prisma/client');
const yahoo = require('../yahoo');
const prisma = new PrismaClient();

// Helper function to fetch current price
const fetchCurrentPrice = async (ticker) => {
  try {
    const price = await yahoo.getCurrentPrice(ticker);
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${ticker}:`, error.message);
    return null;
  }
};

// Helper function to calculate price difference and percentage for investments
const calculateInvestmentDifference = (avgBuyPrice, currentPrice) => {
  if (!avgBuyPrice || !currentPrice) {
    return { 
      difference: null, 
      differencePercentage: null,
      profitLoss: null,
      profitLossPercentage: null
    };
  }

  // Calculate profit/loss (positive if current price is above buy average)
  const profitLoss = currentPrice - avgBuyPrice;
  const profitLossPercentage = ((profitLoss / avgBuyPrice) * 100);

  return {
    difference: parseFloat(profitLoss.toFixed(2)), // For investments, this represents profit/loss
    differencePercentage: parseFloat(profitLossPercentage.toFixed(2)),
    profitLoss: parseFloat(profitLoss.toFixed(2)),
    profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
  };
};

// Get all investments
const getAllInvestments = async (req, res) => {
  try {
    const { status, ticker } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (ticker) where.ticker = ticker.toUpperCase();

    const investments = await prisma.investment.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      include: {
        transactions: {
          orderBy: { transaction_date: 'desc' }
        }
      }
    });

    // Fetch current prices for all investments
    const investmentsWithPrices = await Promise.all(
      investments.map(async (inv) => {
        const currentPrice = await fetchCurrentPrice(inv.ticker);
        
        // Update the current price in database if we got a valid price
        if (currentPrice !== null) {
          await prisma.investment.update({
            where: { id: inv.id },
            data: { currentPrice: currentPrice }
          });
        }

        const finalCurrentPrice = currentPrice !== null ? currentPrice : inv.currentPrice;
        const investmentDiff = calculateInvestmentDifference(inv.avgBuyPrice, finalCurrentPrice);

        // Calculate total profit/loss for the position
        const remainingQty = inv.remainingQty || inv.qty;
        const totalProfitLoss = investmentDiff.profitLoss ? (investmentDiff.profitLoss * remainingQty) : null;

        return {
          ...inv,
          currentPrice: finalCurrentPrice,
          difference: investmentDiff.difference,
          differencePercentage: investmentDiff.differencePercentage,
          profitLoss: investmentDiff.profitLoss,
          profitLossPercentage: investmentDiff.profitLossPercentage,
          totalProfitLoss: totalProfitLoss ? parseFloat(totalProfitLoss.toFixed(2)) : null
        };
      })
    );

    res.json({
      success: true,
      data: investmentsWithPrices
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
    
    const investment = await prisma.investment.findUnique({
      where: { id: parseInt(id) },
      include: {
        transactions: {
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

    // Fetch current price
    const currentPrice = await fetchCurrentPrice(investment.ticker);
    
    // Update the current price in database if we got a valid price
    if (currentPrice !== null) {
      await prisma.investment.update({
        where: { id: parseInt(id) },
        data: { currentPrice: currentPrice }
      });
    }

    const finalCurrentPrice = currentPrice !== null ? currentPrice : investment.currentPrice;
    const investmentDiff = calculateInvestmentDifference(investment.avgBuyPrice, finalCurrentPrice);

    // Calculate total profit/loss for the position
    const remainingQty = investment.remainingQty || investment.qty;
    const totalProfitLoss = investmentDiff.profitLoss ? (investmentDiff.profitLoss * remainingQty) : null;

    const updatedInvestment = {
      ...investment,
      currentPrice: finalCurrentPrice,
      difference: investmentDiff.difference,
      differencePercentage: investmentDiff.differencePercentage,
      profitLoss: investmentDiff.profitLoss,
      profitLossPercentage: investmentDiff.profitLossPercentage,
      totalProfitLoss: totalProfitLoss ? parseFloat(totalProfitLoss.toFixed(2)) : null
    };

    res.json({
      success: true,
      data: updatedInvestment
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
      buyBelow,
      currentPrice,
      qty,
      avgBuyPrice,
      notes,
      entryDate,
      source
    } = req.body;

    // Validation
    if (!ticker || !qty || !entryDate) {
      return res.status(400).json({
        success: false,
        message: 'Ticker, quantity and entry date are required'
      });
    }

    // Fetch current price from API if not provided
    let finalCurrentPrice = currentPrice ? parseFloat(currentPrice) : null;
    if (!finalCurrentPrice) {
      finalCurrentPrice = await fetchCurrentPrice(ticker.toUpperCase());
    }

    const investmentData = {
      ticker: ticker.toUpperCase(),
      buyBelow: buyBelow ? parseFloat(buyBelow) : null,
      currentPrice: finalCurrentPrice,
      qty: parseInt(qty),
      avgBuyPrice: avgBuyPrice ? parseFloat(avgBuyPrice) : null,
      notes: notes || null,
      entryDate: new Date(entryDate),
      remainingQty: parseInt(qty), // Initially, remaining qty = total qty
      source: source || null,
      status: 'open'
    };

    const investment = await prisma.investment.create({
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
      buyBelow,
      currentPrice,
      qty,
      avgBuyPrice,
      notes,
      entryDate,
      exitDate,
      remainingQty,
      source,
      status
    } = req.body;

    // Check if investment exists
    const existingInvestment = await prisma.investment.findUnique({
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
    if (buyBelow !== undefined) updateData.buyBelow = buyBelow ? parseFloat(buyBelow) : null;
    if (currentPrice !== undefined) updateData.currentPrice = currentPrice ? parseFloat(currentPrice) : null;
    if (qty !== undefined) updateData.qty = parseInt(qty);
    if (avgBuyPrice !== undefined) updateData.avgBuyPrice = avgBuyPrice ? parseFloat(avgBuyPrice) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (entryDate !== undefined) updateData.entryDate = new Date(entryDate);
    if (exitDate !== undefined) updateData.exitDate = exitDate ? new Date(exitDate) : null;
    if (remainingQty !== undefined) updateData.remainingQty = remainingQty ? parseInt(remainingQty) : null;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;

    const investment = await prisma.investment.update({
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
    const existingInvestment = await prisma.investment.findUnique({
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

    await prisma.investment.delete({
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
    const investment = await prisma.investment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const sellQuantity = parseInt(quantity);
    const remainingQty = investment.remainingQty || investment.qty;

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
      remainingQty: newRemainingQty
    };

    // If fully sold, close the investment
    if (newRemainingQty === 0) {
      updateData.status = 'closed';
      updateData.exitDate = transaction_date ? new Date(transaction_date) : new Date();
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        transactions: {
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
    const totalInvestments = await prisma.investment.count();
    const openInvestments = await prisma.investment.count({
      where: { status: 'open' }
    });
    const closedInvestments = await prisma.investment.count({
      where: { status: 'closed' }
    });

    // Get total invested amount (this would need avgBuyPrice * qty calculation)
    const investments = await prisma.investment.findMany({
      select: {
        avgBuyPrice: true,
        qty: true,
        status: true
      }
    });

    let totalInvestedAmount = 0;
    let openInvestedAmount = 0;

    investments.forEach(inv => {
      if (inv.avgBuyPrice && inv.qty) {
        const amount = inv.avgBuyPrice * inv.qty;
        totalInvestedAmount += amount;
        if (inv.status === 'open') {
          openInvestedAmount += amount;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalInvestments: totalInvestments,
        openInvestments: openInvestments,
        closedInvestments: closedInvestments,
        totalInvestedAmount: totalInvestedAmount,
        openInvestedAmount: openInvestedAmount
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
