const prisma = require('../db');
const { fetchAllInvestments } = require('../services/investment.service');
const { fetchCurrentPrice } = require('../services/comom.service');
const { getQuote } = require('../yahoo');
const { buildReadFilter, buildWriteFilter, buildCreateData } = require('../utils/ownershipFilter');


// Helper function to calculate price difference and percentage for investments
const calculateInvestmentDifference = (buyBelowPrice, currentPrice) => {
  if (!buyBelowPrice || !currentPrice) {
    return {
      difference: null,
      differencePercentage: null,
      profitLoss: null,
      profitLossPercentage: null
    };
  }

  // Calculate profit/loss (positive if current price is above buy average)
  const profitLoss = buyBelowPrice - currentPrice;
  const profitLossPercentage = ((profitLoss / buyBelowPrice) * 100);

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
    const investments = await fetchAllInvestments(req.query, buildReadFilter(req));
    const { isGroupByTicker } = req.query;
    // Fetch current prices for all investments
    const investmentsWithPrices = await Promise.all(
      investments.map(async (inv) => {
        const currentPrice = inv.currentPrice

        const finalCurrentPrice = currentPrice !== null ? currentPrice : inv.currentPrice;
        const investmentDiff = calculateInvestmentDifference(inv.buyBelow, finalCurrentPrice);

        // Calculate total profit/loss for the position
        const remainingQty = inv.remainingQty || inv.qty;
        const totalProfitLoss = investmentDiff.profitLoss ? (investmentDiff.profitLoss * remainingQty) : null;

        return {
          ...inv,
          difference: investmentDiff.difference,
          differencePercentage: investmentDiff.differencePercentage,
          profitLoss: investmentDiff.profitLoss,
          profitLossPercentage: investmentDiff.profitLossPercentage,
          totalProfitLoss: totalProfitLoss ? parseFloat(totalProfitLoss.toFixed(2)) : null
        };
      })
    );

    if (isGroupByTicker) {
      // Group by ticker if requested
      const groupedInvestments = investmentsWithPrices.reduce((acc, inv) => {
        const ticker = inv.ticker.toUpperCase();
        if (!acc[ticker]) {
          acc[ticker] = {
            ...inv,
            quantity: 0,
            totalInvestment: 0,
            remainingQty: 0,
            currentPrice: 0,
            profitLoss: 0,
            totalProfitLoss: 0,
            transactions: []
          };
        }
        // Ensure accumulation is robust to undefined values
        acc[ticker].quantity += inv.quantity || 0;
        acc[ticker].totalInvestment += ((inv.avgBuyPrice || 0) * (inv.quantity || 0));
        acc[ticker].remainingQty += inv.remainingQty || 0;
        acc[ticker].currentPrice = inv.currentPrice; // Assuming current price is same for all transactions of the same ticker
        acc[ticker].profitLoss += inv.profitLoss || 0;
        acc[ticker].totalProfitLoss += inv.totalProfitLoss || 0;
        acc[ticker].transactions.push(...inv.transactions);
        acc[ticker].avgBuyPrice = acc[ticker].quantity
          ? acc[ticker].totalInvestment / acc[ticker].quantity
          : 0;
        return acc;
      }, {});
      res.json({
        success: true,
        data: Object.values(groupedInvestments)
      });
    } else {
      res.json({
        success: true,
        data: investmentsWithPrices
      });
    }

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

    const investment = await prisma.investment.findFirst({
      where: { id: parseInt(id), ...buildReadFilter(req) },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' }
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
    const investmentDiff = calculateInvestmentDifference(investment.buyBelow, finalCurrentPrice);

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
      entryDate,
      currentPrice,
      quantity,
      avgBuyPrice,
      notes,
      isRecommended,
      buyBelow,
      marketCap,
      sector,
      currency
    } = req.body;

    // Validation
    if (!ticker || !quantity || !entryDate) {
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

    //console.log(`Creating investment for ${marketCap} with current price: ${sector}`);
    const investmentData = buildCreateData(req, {
      ticker: ticker.toUpperCase(),
      currency: (currency || 'INR').toUpperCase(),
      entryDate: new Date(entryDate),
      currentPrice: finalCurrentPrice,
      totalInvestment: avgBuyPrice ? (parseFloat(avgBuyPrice) * parseInt(quantity)) : 0,
      quantity: parseInt(quantity),
      avgBuyPrice: avgBuyPrice ? parseFloat(avgBuyPrice) : null,
      notes: notes || null,
      remainingQty: parseInt(quantity), // Initially, remaining qty = total qty
      status: 'open',
      isRecommended: isRecommended === 'true',
      buyBelow: buyBelow ? parseFloat(buyBelow) : null,
      sector: sector ? sector.toUpperCase() : null,
      marketCap: marketCap ? marketCap.toUpperCase() : null
    });

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
      quantity,
      avgBuyPrice,
      notes,
      entryDate,
      exitDate,
      remainingQty,
      status, sector, marketCap, currency
    } = req.body;

    // Check if investment exists and belongs to the caller
    const existingInvestment = await prisma.investment.findFirst({
      where: { id: parseInt(id), ...buildWriteFilter(req) }
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
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (avgBuyPrice !== undefined) updateData.avgBuyPrice = avgBuyPrice ? parseFloat(avgBuyPrice) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (entryDate !== undefined) updateData.entryDate = new Date(entryDate);
    if (exitDate !== undefined) updateData.exitDate = exitDate ? new Date(exitDate) : null;
    if (remainingQty !== undefined) updateData.remainingQty = remainingQty ? parseInt(remainingQty) : null;
    if (status !== undefined) updateData.status = status;
    if (sector !== undefined) updateData.sector = sector ? sector.toUpperCase() : null;
    if (marketCap !== undefined) updateData.marketCap = marketCap ? marketCap.toUpperCase() : null;
    if (currency !== undefined) updateData.currency = currency ? currency.toUpperCase() : null;

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

    // Check if investment exists and belongs to the caller (route requires auth)
    const existingInvestment = await prisma.investment.findFirst({
      where: { id: parseInt(id), userId: req.user.id }
    });

    if (!existingInvestment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Delete related transactions first (cascade should handle this, but being explicit)
    await prisma.investmentTransaction.deleteMany({
      where: { investmentId: parseInt(id) }
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

    // Check if investment exists and belongs to the caller (or sandbox for guests)
    const investment = await prisma.investment.findFirst({
      where: { id: parseInt(id), ...buildWriteFilter(req) }
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
    await prisma.investmentTransaction.create({
      data: {
        investmentId: parseInt(id),
        transaction_type: 'Sell',
        quantity: sellQuantity,
        price: parseFloat(price),
        transactionDate: transaction_date ? new Date(transaction_date) : new Date(),
        reasonForExit: reason_for_exit || null
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
        quantity: true,
        status: true
      }
    });

    let totalInvestedAmount = 0;
    let openInvestedAmount = 0;

    investments.forEach(inv => {
      if (inv.avgBuyPrice && inv.quantity) {
        const amount = inv.avgBuyPrice * inv.quantity;
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

// Refresh all investment prices (manual endpoint)
const refreshAllInvestmentPrices = async (req, res) => {
  try {
    const investments = await prisma.investment.findMany();
    let updatedCount = 0;

    const updates = investments.map(async (inv) => {
      try {
        const quote = await getQuote(inv.ticker);
        const data = {};
        if (quote?.regularMarketPrice != null) {
          data.currentPrice = quote.regularMarketPrice;
        }
        if (quote?.regularMarketPreviousClose != null) {
          data.lastDayPrice = quote.regularMarketPreviousClose;
        }
        if (data.currentPrice != null || data.lastDayPrice != null) {
          await prisma.investment.update({
            where: { id: inv.id },
            data,
          });
          updatedCount++;
        }
      } catch (err) {
        console.error(`[ERROR] Updating ${inv.ticker}:`, err.message);
      }
    });

    await Promise.allSettled(updates);
    //console.log(`[CRON] Updated ${updatedCount} investments`);


    res.json({
      success: true,
      message: `Prices refreshed for ${updatedCount} investments.`
    });
  } catch (error) {
    console.error('Error refreshing investment prices:', error);
    if (res?.status) {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh investment prices',
        error: error.message
      });
      return;
    }
  }
};

module.exports = {
  getAllInvestments,
  getInvestmentById,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  closeInvestment,
  getInvestmentSummary,
  refreshAllInvestmentPrices
};
