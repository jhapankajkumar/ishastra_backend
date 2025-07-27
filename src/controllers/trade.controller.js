const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TradeIdGenerator = require('../utils/tradeIdGenerator');

// Get all trades with related data
exports.getAllTrades = async (req, res) => {
  try {
    const trades = await prisma.trades.findMany({
      include: {
        trade_fills: true,
        trade_images: true
      }
    });
    const tradeIds = trades.map(t => t.id);
    const exitTactics = await prisma.exit_tactics.findMany();
    const tradeImages = await prisma.trade_images.findMany({
      where: { trade_id: { in: tradeIds } }
    });
    const tradeSetups = await prisma.trade_setups.findMany();
    const tradeFills = await prisma.trade_fills.findMany({
      where: { trade_id: { in: tradeIds } }
    });

    const tradesWithRelations = trades.map(trade => ({
      ...trade,
      exit_tactics: exitTactics.find(e => e.id === trade.exit_tactic_id) || null,
      trade_images: tradeImages.filter(img => img.trade_id === trade.id),
      trade_setup: trade.trade_setup_id
        ? tradeSetups.find(setup => setup.trade_setup_id === trade.trade_setup_id)
        : null,
      trade_fills: tradeFills.filter(fill => fill.trade_id === trade.id),
    }));

    res.json(tradesWithRelations);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades', details: error.message });
  }
};

// Add Trade (Entry only)
exports.createTrade = async (req, res) => {
  try {
    console.log('🔍 Create Trade Request Body:', req.body);
    console.log('📁 Create Trade Files:', req.files);
    console.log('📅 Entry Date Value:', req.body.entryDate, typeof req.body.entryDate);
    
    const quantity = Number(req.body.entryFilledShares);
    
    // Generate professional trade ID
    const professionalTradeId = await TradeIdGenerator.generateTradeId();
    
    // Validate and parse entry date (required field)
    if (!req.body.entryDate || req.body.entryDate === 'undefined' || req.body.entryDate.trim() === '') {
      console.log('❌ Invalid entry date detected:', req.body.entryDate);
      return res.status(400).json({ error: 'Entry date is required. Please provide a valid date in YYYY-MM-DD format.' });
    }
    
    const entryDate = new Date(req.body.entryDate);
    if (isNaN(entryDate.getTime())) {
      console.log('❌ Date parsing failed for:', req.body.entryDate);
      return res.status(400).json({ error: 'Invalid entry date format. Please use YYYY-MM-DD format (e.g., 2025-07-26).' });
    }
    
    const trade = await prisma.trades.create({
      data: {
        trade_id: professionalTradeId, // Set professional trade ID
        ticker: req.body.ticker,
        reason_for_entry: req.body.reasonForEntry,
        entry_date: entryDate,
        entry_price: Number(req.body.entryOrderPrice),
        quantity: quantity,
        remaining_quantity: quantity, // Initialize remaining quantity
        direction: req.body.direction || "Long",
        instrument_type: req.body.instrumentType || "Stocks",
        trade_setup_id: req.body.tradeSetup ? Number(req.body.tradeSetup) : null,
        setup: req.body.setup || null,
        status: "Open", // Initialize status
        confidence_rating: req.body.setupConfidence ? Number(req.body.setupConfidence) : null,
        entry_commission: req.body.entryCommission ? Number(req.body.entryCommission) : null,
        stop_loss: req.body.stopLoss ? Number(req.body.stopLoss) : null,
        target_1: req.body.target1 ? Number(req.body.target1) : null,
        target_2: req.body.target2 ? Number(req.body.target2) : null,
        target_3: req.body.target3 ? Number(req.body.target3) : null,
        timeframe_used: req.body.timeframeUsed || null,
        notes: req.body.notes || null,
        atr_value: req.body.atrValue ? Number(req.body.atrValue) : null,
        risk_per_trade: req.body.riskPerTrade ? Number(req.body.riskPerTrade) : null,
      }
    });

    const tradeImages = [];
    if (req.files?.entryCharts) {
      req.files.entryCharts.forEach(file => {
        tradeImages.push({
          trade_id: trade.id,
          image_type: "entry",
          file_path: file.path,
        });
      });
    }
    if (req.files?.exitCharts) {
      req.files.exitCharts.forEach(file => {
        tradeImages.push({
          trade_id: trade.id,
          image_type: "exit",
          file_path: file.path,
        });
      });
    }
    if (req.files?.postTradeFiles) {
      req.files.postTradeFiles.forEach(file => {
        tradeImages.push({
          trade_id: trade.id,
          image_type: "post",
          file_path: file.path,
        });
      });
    }

    if (tradeImages.length > 0) {
      await Promise.all(
        tradeImages.map(imageData => 
          prisma.trade_images.create({ data: imageData })
        )
      );
    }

    res.status(201).json({ message: "Trade created successfully", trade });
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ error: 'Failed to create trade', details: error.message });
  }
};

// Update Trade (Exit only) - Now supports partial exits
exports.updateTradeExit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exitDate, exitOrderPrice, exitQuantity, reasonForExit, exitTactic
    } = req.body;

    if (!exitDate) {
      return res.status(400).json({ error: "Missing exit date" });
    }

    const tradeId = Number(id);
    
    // Get current trade to validate
    const currentTrade = await prisma.trades.findUnique({
      where: { id: tradeId }
    });

    if (!currentTrade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const exitQty = Number(exitQuantity) || currentTrade.remaining_quantity || currentTrade.quantity;
    const remainingAfterExit = (currentTrade.remaining_quantity || currentTrade.quantity) - exitQty;

    // Validate exit quantity
    if (exitQty <= 0) {
      return res.status(400).json({ error: "Exit quantity must be greater than 0" });
    }
    
    if (exitQty > (currentTrade.remaining_quantity || currentTrade.quantity)) {
      return res.status(400).json({ error: "Cannot exit more shares than remaining" });
    }

    // Create transaction record
    await prisma.trade_transactions.create({
      data: {
        trade_id: tradeId,
        transaction_type: "Exit",
        quantity: exitQty,
        price: Number(exitOrderPrice),
        transaction_date: new Date(exitDate),
        reason_for_exit: reasonForExit,
        exit_tactic_id: exitTactic ? Number(exitTactic) : null,
      }
    });

    // Determine new status
    let newStatus = "Open";
    if (remainingAfterExit === 0) {
      newStatus = "Closed";
    } else if (remainingAfterExit > 0) {
      newStatus = "Partial Closed";
    }

    // Update the main trade record
    const updateData = {
      remaining_quantity: remainingAfterExit,
      status: newStatus,
      reason_for_exit: reasonForExit,
      exit_tactic_id: exitTactic ? Number(exitTactic) : null,
    };

    // If this is a complete exit, set exit fields
    if (remainingAfterExit === 0) {
      updateData.exit_date = new Date(exitDate);
      updateData.exit_price = Number(exitOrderPrice);
    }

    const trade = await prisma.trades.update({
      where: { id: tradeId },
      data: updateData
    });

    // Handle file uploads
    if (req.files?.exitCharts) {
      const exitImages = req.files.exitCharts.map(file => ({
        trade_id: trade.id,
        image_type: "exit",
        file_path: file.path,
      }));
      await Promise.all(
        exitImages.map(imageData => 
          prisma.trade_images.create({ data: imageData })
        )
      );
    }

    res.json({
      ...trade,
      message: remainingAfterExit === 0 ? "Trade completely exited" : "Partial exit recorded"
    });
  } catch (err) {
    console.error('Error updating trade exit:', err);
    res.status(500).json({ error: 'Failed to update trade exit', details: err.message });
  }
};

// New method specifically for partial exits
exports.partialExitTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exitDate, exitOrderPrice, exitQuantity, reasonForExit, exitTactic
    } = req.body;

    if (!exitDate || !exitOrderPrice || !exitQuantity) {
      return res.status(400).json({ error: "Missing required fields: exitDate, exitOrderPrice, exitQuantity" });
    }

    const tradeId = Number(id);
    const exitQty = Number(exitQuantity);
    
    // Get current trade to validate
    const currentTrade = await prisma.trades.findUnique({
      where: { id: tradeId },
      // No trade_transactions include (invalid)
    });

    if (!currentTrade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const currentRemaining = currentTrade.remaining_quantity ?? currentTrade.quantity;
    const remainingAfterExit = currentRemaining - exitQty;

    // Validate exit quantity
    if (exitQty <= 0) {
      return res.status(400).json({ error: "Exit quantity must be greater than 0" });
    }
    
    if (exitQty > currentRemaining) {
      return res.status(400).json({ error: "Cannot exit more shares than remaining" });
    }

    // Create transaction record
    await prisma.trade_transactions.create({
      data: {
        trade_id: tradeId,
        transaction_type: "Exit",
        quantity: exitQty,
        price: Number(exitOrderPrice),
        transaction_date: new Date(exitDate),
        reason_for_exit: reasonForExit,
        exit_tactic_id: exitTactic ? Number(exitTactic) : null,
      }
    });

    // Determine new status
    let newStatus = "Open";
    if (remainingAfterExit === 0) {
      newStatus = "Closed";
    } else if (remainingAfterExit > 0) {
      newStatus = "Partial Closed";
    }

    // Update the main trade record
    const updateData = {
      remaining_quantity: remainingAfterExit,
      status: newStatus,
    };

    // If this is a complete exit, set exit fields
    if (remainingAfterExit === 0) {
      updateData.exit_date = new Date(exitDate);
      updateData.exit_price = Number(exitOrderPrice);
      updateData.reason_for_exit = reasonForExit;
      updateData.exit_tactic_id = exitTactic ? Number(exitTactic) : null;
    }

    const trade = await prisma.trades.update({
      where: { id: tradeId },
      data: updateData,
      // No trade_transactions include (invalid)
    });

    // Handle file uploads
    if (req.files?.exitCharts) {
      const exitImages = req.files.exitCharts.map(file => ({
        trade_id: trade.id,
        image_type: "exit",
        file_path: file.path,
      }));
      await Promise.all(
        exitImages.map(imageData => 
          prisma.trade_images.create({ data: imageData })
        )
      );
    }

    res.json({
      ...trade,
      message: remainingAfterExit === 0 ? "Trade completely exited" : "Partial exit recorded successfully"
    });
  } catch (err) {
    console.error('Error processing partial exit:', err);
    res.status(500).json({ error: 'Failed to process partial exit', details: err.message });
  }
};

// Add Post Trade Analysis (Review only)
exports.addPostAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { postTradeAnalysis } = req.body;

    const trade = await prisma.trades.update({
      where: { id: Number(id) },
      data: {
        post_trade_analysis: postTradeAnalysis,
      }
    });

    if (req.files?.postTradeFiles) {
      const postImages = req.files.postTradeFiles.map(file => ({
        trade_id: trade.id,
        image_type: "post",
        file_path: file.path,
      }));
      await Promise.all(
        postImages.map(imageData => 
          prisma.trade_images.create({ data: imageData })
        )
      );
    }

    res.json(trade);
  } catch (err) {
    console.error('Error adding post trade analysis:', err);
    res.status(500).json({ error: 'Failed to add post trade analysis', details: err.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const trades = await prisma.trades.findMany();

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.r_multiple > 0).length;
    const winRate = totalTrades ? Math.round((wins / totalTrades) * 100) : 0;
    const avgR = totalTrades
      ? (trades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / totalTrades).toFixed(2)
      : 0;

    const grossProfit = trades.filter(t => t.r_multiple > 0).reduce((sum, t) => sum + t.r_multiple, 0);
    const grossLoss = trades.filter(t => t.r_multiple < 0).reduce((sum, t) => sum + t.r_multiple, 0);
    const profitFactor = grossLoss !== 0 ? Math.abs(grossProfit / grossLoss).toFixed(2) : "∞";

    const expectancy = totalTrades
      ? (
          trades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / totalTrades
        ).toFixed(2)
      : 0;

    const avgHoldTimeMs =
      trades.reduce((sum, t) => {
        if (t.entry_date && t.exit_date) {
          return sum + (new Date(t.exit_date) - new Date(t.entry_date));
        }
        return sum;
      }, 0) / (totalTrades || 1);
    const avgHoldTimeDays = avgHoldTimeMs ? Math.round(avgHoldTimeMs / (1000 * 60 * 60 * 24)) : 0;

    res.json({
      totalTrades,
      winRate,
      avgR,
      profitFactor,
      expectancy,
      avgHoldTime: `${avgHoldTimeDays}d`
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    res.status(500).json({ error: 'Failed to generate dashboard summary', details: error.message });
  }
};

// Get a single trade by ID with related data
exports.getTradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await prisma.trades.findUnique({
      where: { id: Number(id) },
      include: {
        trade_fills: true,
        trade_images: true
      }
    });

    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const exit_tactic = trade.exit_tactic_id
      ? await prisma.exit_tactics.findUnique({ where: { id: trade.exit_tactic_id } })
      : null;
    const trade_images = await prisma.trade_images.findMany({ where: { trade_id: trade.id } });
    const trade_setup = trade.trade_setup_id
      ? await prisma.trade_setups.findFirst({ where: { trade_setup_id: trade.trade_setup_id } })
      : null;
    const trade_fills = await prisma.trade_fills.findMany({ where: { trade_id: trade.id } });

    res.json({
      ...trade,
      exit_tactics: exit_tactic,
      trade_images,
      trade_setup: trade_setup,
      trade_fills
    });
  } catch (error) {
    console.error('Error fetching trade by id:', error);
    res.status(500).json({ error: 'Failed to fetch trade', details: error.message });
  }
};

// Delete trade and all related data
exports.deleteTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const tradeId = Number(id);

    // Validate trade ID
    if (!tradeId || isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }

    // Check if trade exists
    const trade = await prisma.trades.findUnique({
      where: { id: tradeId }
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Delete related data first (due to foreign key constraints)
    // Delete trade transactions
    await prisma.trade_transactions.deleteMany({
      where: { trade_id: tradeId }
    });

    // Delete trade images
    await prisma.trade_images.deleteMany({
      where: { trade_id: tradeId }
    });

    // Delete trade fills
    await prisma.trade_fills.deleteMany({
      where: { trade_id: tradeId }
    });

    // Delete the main trade record
    await prisma.trades.delete({
      where: { id: tradeId }
    });

    console.log(`Trade with ID ${tradeId} and all related data deleted successfully`);
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Error deleting trade:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete trade', 
      details: error.message 
    });
  }
};

// Get trade transactions for a specific trade
exports.getTradeTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const tradeId = Number(id);

    if (!tradeId || isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }

    const transactions = await prisma.trade_transactions.findMany({
      where: { trade_id: tradeId },
      orderBy: { created_at: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching trade transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trade transactions', 
      details: error.message 
    });
  }
};
