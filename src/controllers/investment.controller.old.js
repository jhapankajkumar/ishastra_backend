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

// Get single investment
const getInvestmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
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
      qty,
      buy_avg_price,
      buy_below,
      invested_on,
      remarks,
      source,
      recommendation_id
    } = req.body;

    // Validation
    if (!ticker || !qty || !buy_avg_price) {
      return res.status(400).json({
        success: false,
        message: 'Ticker, quantity, and buy average price are required'
      });
    }

    const investmentData = {
      ticker: ticker.toUpperCase(),
      qty: parseInt(qty),
      buy_avg_price: parseFloat(buy_avg_price),
      buy_below: buy_below ? parseFloat(buy_below) : null,
      invested_on: invested_on || new Date().toISOString().split('T')[0],
      remarks: remarks || '',
      source: source || '',
      recommendation_id: recommendation_id || null, // link to recommendation
      status: 'open', // open or closed
      current_price: null, // will be updated via price API
      created_at: new Date()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), investmentData);

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: {
        id: docRef.id,
        ...investmentData
      }
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
      qty,
      buy_avg_price,
      buy_below,
      invested_on,
      remarks,
      source,
      status,
      current_price,
      recommendation_id
    } = req.body;

    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const updateData = {
      updated_at: new Date()
    };

    if (ticker !== undefined) updateData.ticker = ticker.toUpperCase();
    if (qty !== undefined) updateData.qty = parseInt(qty);
    if (buy_avg_price !== undefined) updateData.buy_avg_price = parseFloat(buy_avg_price);
    if (buy_below !== undefined) updateData.buy_below = buy_below ? parseFloat(buy_below) : null;
    if (invested_on !== undefined) updateData.invested_on = invested_on;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;
    if (current_price !== undefined) updateData.current_price = current_price ? parseFloat(current_price) : null;
    if (recommendation_id !== undefined) updateData.recommendation_id = recommendation_id;

    await updateDoc(docRef, updateData);

    res.json({
      success: true,
      message: 'Investment updated successfully'
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
    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    await deleteDoc(docRef);

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

// Close investment
const closeInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const { close_price, close_date } = req.body;

    const docRef = doc(db, COLLECTION_NAME, id);
    
    // Check if document exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    await updateDoc(docRef, {
      status: 'closed',
      close_price: close_price ? parseFloat(close_price) : null,
      close_date: close_date || new Date().toISOString().split('T')[0],
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Investment closed successfully'
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

// Get investment summary/analytics
const getInvestmentSummary = async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const investments = [];
    
    snapshot.forEach((doc) => {
      investments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Calculate summary stats
    const totalInvestments = investments.length;
    const openInvestments = investments.filter(inv => inv.status === 'open').length;
    const closedInvestments = investments.filter(inv => inv.status === 'closed').length;
    
    const totalInvested = investments.reduce((sum, inv) => {
      return sum + (inv.qty * inv.buy_avg_price);
    }, 0);

    // Group by ticker
    const byTicker = investments.reduce((acc, inv) => {
      if (!acc[inv.ticker]) {
        acc[inv.ticker] = {
          ticker: inv.ticker,
          total_qty: 0,
          total_invested: 0,
          investments: []
        };
      }
      acc[inv.ticker].total_qty += inv.qty;
      acc[inv.ticker].total_invested += (inv.qty * inv.buy_avg_price);
      acc[inv.ticker].investments.push(inv);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          total_investments: totalInvestments,
          open_investments: openInvestments,
          closed_investments: closedInvestments,
          total_invested: totalInvested
        },
        by_ticker: Object.values(byTicker)
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
