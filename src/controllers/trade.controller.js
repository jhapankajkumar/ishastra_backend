const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('✅ Prisma instance created:', !!prisma);
const TradeIdGenerator = require('../utils/tradeIdGenerator');

// Get all trades with related data
exports.getAllTrades = async (req, res) => {
  try {
    console.log('🔍 Checking prisma.trade:', typeof prisma?.trade);
    const trades = await prisma.trade.findMany({
      include: {
        tradeFills: true,
        tradeImages: true
      }
    });
    const tradeIds = trades.map(t => t.id);
    const tradeImages = await prisma.tradeImage.findMany({
      where: { tradeId: { in: tradeIds } }
    });
    const tradeFills = await prisma.tradeFill.findMany({
      where: { tradeId: { in: tradeIds } }
    });

    const tradesWithRelations = trades.map(trade => ({
      ...trade,
      tradeImages: tradeImages.filter(img => img.tradeId === trade.id),
      tradeFills: tradeFills.filter(fill => fill.tradeId === trade.id),
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

    const trade = await prisma.trade.create({
      data: {
        tradeId: professionalTradeId,
        ticker: req.body.ticker,
        tickerName: req.body.tickerName,
        reasonForEntry: req.body.reasonForEntry,
        entryDate: entryDate,
        entryPrice: Number(req.body.entryOrderPrice),
        quantity: quantity,
        remainingQuantity: quantity,
        direction: req.body.direction || "Long",
        instrumentType: req.body.instrumentType || "Stocks",
        tradeSetupId: req.body.tradeSetup ? Number(req.body.tradeSetup) : null,
        status: "Open",
        confidenceRating: req.body.setupConfidence ? Number(req.body.setupConfidence) : null,
        entryCommission: req.body.entryCommission ? Number(req.body.entryCommission) : null,
        stopLoss: req.body.stopLoss ? Number(req.body.stopLoss) : null,
        target1: req.body.target1 ? Number(req.body.target1) : null,
        target2: req.body.target2 ? Number(req.body.target2) : null,
        target3: req.body.target3 ? Number(req.body.target3) : null,
        timeframeUsed: req.body.timeframesUsed || null,
        notes: req.body.notes || null,
        atrValue: req.body.atrValue ? Number(req.body.atrValue) : null,
        riskPerTrade: req.body.riskPerTrade,
        riskPerTradeValue: req.body.riskPerTradeValue ? Number(req.body.riskPerTradeValue) : 0,
      }
    });

    const tradeImages = [];
    if (req.files?.entryCharts) {
      req.files.entryCharts.forEach(file => {
        tradeImages.push({
          tradeId: trade.id,
          imageType: "entry",
          filePath: file.path,
        });
      });
    }
    if (req.files?.exitCharts) {
      req.files.exitCharts.forEach(file => {
        tradeImages.push({
          tradeId: trade.id,
          imageType: "exit",
          filePath: file.path,
        });
      });
    }
    if (req.files?.postTradeFiles) {
      req.files.postTradeFiles.forEach(file => {
        tradeImages.push({
          tradeId: trade.id,
          imageType: "post",
          filePath: file.path,
        });
      });
    }

    if (tradeImages.length > 0) {
      await Promise.all(
        tradeImages.map(imageData =>
          prisma.tradeImage.create({ data: imageData })
        )
      );
    }

    res.status(201).json({ message: "Trade created successfully", trade });

  } catch (error) {
    console.error('❌ Error creating trade:', error);
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
    const currentTrade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    if (!currentTrade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const exitQty = Number(exitQuantity) || currentTrade.remainingQuantity || currentTrade.quantity;
    const remainingAfterExit = (currentTrade.remainingQuantity || currentTrade.quantity) - exitQty;

    // Validate exit quantity
    if (exitQty <= 0) {
      return res.status(400).json({ error: "Exit quantity must be greater than 0" });
    }
    
    if (exitQty > (currentTrade.remainingQuantity || currentTrade.quantity)) {
      return res.status(400).json({ error: "Cannot exit more shares than remaining" });
    }

    // Create transaction record
    await prisma.tradeTransaction.create({
      data: {
        tradeId: tradeId,
        transactionType: "Exit",
        quantity: exitQty,
        price: Number(exitOrderPrice),
        transactionDate: new Date(exitDate),
        reasonForExit: reasonForExit,
        exitTacticId: exitTactic ? Number(exitTactic) : null,
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
      remainingQuantity: remainingAfterExit,
      status: newStatus,
      reasonForExit: reasonForExit,
      exitTacticId: exitTactic ? Number(exitTactic) : null,
    };

    // If this is a complete exit, set exit fields
    if (remainingAfterExit === 0) {
      updateData.exitDate = new Date(exitDate);
      updateData.exitPrice = Number(exitOrderPrice);
    }

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: updateData
    });

    // Handle file uploads
    if (req.files?.exitCharts) {
      const exitImages = req.files.exitCharts.map(file => ({
        tradeId: trade.id,
        imageType: "exit",
        filePath: file.path,
      }));
      await Promise.all(
        exitImages.map(imageData => 
          prisma.tradeImage.create({ data: imageData })
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
    const currentTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!currentTrade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const currentRemaining = currentTrade.remainingQuantity ?? currentTrade.quantity;
    const remainingAfterExit = currentRemaining - exitQty;

    // Validate exit quantity
    if (exitQty <= 0) {
      return res.status(400).json({ error: "Exit quantity must be greater than 0" });
    }
    
    if (exitQty > currentRemaining) {
      return res.status(400).json({ error: "Cannot exit more shares than remaining" });
    }

    // Create transaction record
    await prisma.tradeTransaction.create({
      data: {
        tradeId: tradeId,
        transactionType: "Exit",
        quantity: exitQty,
        price: Number(exitOrderPrice),
        transactionDate: new Date(exitDate),
        reasonForExit: reasonForExit,
        exitTacticId: exitTactic ? Number(exitTactic) : null,
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
      remainingQuantity: remainingAfterExit,
      status: newStatus,
    };

    // If this is a complete exit, set exit fields
    if (remainingAfterExit === 0) {
      updateData.exitDate = new Date(exitDate);
      updateData.exitPrice = Number(exitOrderPrice);
      updateData.reasonForExit = reasonForExit;
      updateData.exitTacticId = exitTactic ? Number(exitTactic) : null;
    }

    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: updateData,
    });

    // Handle file uploads
    if (req.files?.exitCharts) {
      const exitImages = req.files.exitCharts.map(file => ({
        tradeId: trade.id,
        imageType: "exit",
        filePath: file.path,
      }));
      await Promise.all(
        exitImages.map(imageData => 
          prisma.tradeImage.create({ data: imageData })
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
    const { postTradeAnalysis, lessonLearned, emotionalState } = req.body;

    const trade = await prisma.trade.update({
      where: { id: Number(id) },
      data: {
        postTradeAnalysis: postTradeAnalysis,
        lessonLearned: lessonLearned,
        emotionalState: emotionalState
      }
    });

    if (req.files?.reviewCharts) {
      const postImages = req.files.reviewCharts.map(file => ({
        tradeId: trade.id,
        imageType: "post",
        filePath: file.path,
      }));
      await Promise.all(
        postImages.map(imageData => 
          prisma.tradeImage.create({ data: imageData })
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
    console.log('🔍 Checking prisma.trade:', typeof prisma?.trade);
    const trades = await prisma.trade.findMany();

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.rMultiple > 0).length;
    const winRate = totalTrades ? Math.round((wins / totalTrades) * 100) : 0;
    const avgR = totalTrades
      ? (trades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / totalTrades).toFixed(2)
      : 0;

    const grossProfit = trades.filter(t => t.rMultiple > 0).reduce((sum, t) => sum + t.rMultiple, 0);
    const grossLoss = trades.filter(t => t.rMultiple < 0).reduce((sum, t) => sum + t.rMultiple, 0);
    const profitFactor = grossLoss !== 0 ? Math.abs(grossProfit / grossLoss).toFixed(2) : "∞";

    const expectancy = totalTrades
      ? (
          trades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / totalTrades
        ).toFixed(2)
      : 0;

    const avgHoldTimeMs =
      trades.reduce((sum, t) => {
        if (t.entryDate && t.exitDate) {
          return sum + (new Date(t.exitDate) - new Date(t.entryDate));
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
    const trade = await prisma.trade.findUnique({
      where: { id: Number(id) },
      include: {
        tradeFills: true,
        tradeImages: true
      }
    });

    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const exitTactic = trade.exitTacticId

    const tradeImages = await prisma.tradeImage.findMany({ where: { tradeId: trade.id } });
    const tradeSetup = trade.tradeSetupId
    const tradeFills = await prisma.tradeFill.findMany({ where: { tradeId: trade.id } });

    res.json({
      ...trade,
      exitTactic: exitTactic,
      tradeImages,
      tradeSetup: tradeSetup,
      tradeFills: tradeFills
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
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    });

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Delete related data first (due to foreign key constraints)
    // Delete trade transactions
    await prisma.tradeTransaction.deleteMany({
      where: { tradeId: tradeId }
    });

    // Delete trade images
    await prisma.tradeImage.deleteMany({
      where: { tradeId: tradeId }
    });

    // Delete trade fills
    await prisma.tradeFill.deleteMany({
      where: { tradeId: tradeId }
    });

    // Delete the main trade record
    await prisma.trade.delete({
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

    const transactions = await prisma.tradeTransaction.findMany({
      where: { tradeId: tradeId },
      orderBy: { createdAt: 'desc' }
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
