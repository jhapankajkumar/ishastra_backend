const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
//console.log('✅ Prisma instance created:', !!prisma);
const TradeIdGenerator = require('../utils/tradeIdGenerator');
const CapitalManager = require('../utils/capitalManager');
const { getQuote } = require('../yahoo');
const { re } = require('mathjs');

// Get all trades with related data (optionally filter by paper trade flag)
// /trades?isPaperTrade=true|false
exports.getAllTrades = async (req, res) => {
  try {
    const { isPaperTrade } = req.query;
    // console.log('🔍 Get All Trades - isPaperTrade Query Param:', isPaperTrade);
    // Build Prisma where clause only when query param is provided
    const where = {};
    where.isPaperTrade = false; // Default to real trades
    if (typeof isPaperTrade !== 'undefined') {
      // Accept boolean directly
      if (typeof isPaperTrade === 'boolean') {
        where.isPaperTrade = isPaperTrade;
      }
      // Accept string values (Express commonly provides query params as strings)
      else if (typeof isPaperTrade === 'string' && isPaperTrade.trim() !== '') {
        const normalized = isPaperTrade.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
          where.isPaperTrade = true;
        } else if (normalized === 'false' || normalized === '0') {
          where.isPaperTrade = false;
        } else {
          return res.status(400).json({
            error: 'Invalid isPaperTrade query param. Use true/false (or 1/0).'
          });
        }
      }
      // Any other type is invalid
      else {
        return res.status(400).json({
          error: 'Invalid isPaperTrade query param. Use true/false.'
        });
      }
    }

    const trades = await prisma.trade.findMany({
      where,
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
    //console.log('📁 Create Trade Files:', req.files);
    //console.log('📅 Entry Date Value:', req.body.entryDate, typeof req.body.entryDate);

    const currency = req.body.currency || "INR"; // Default to INR if not specified
    const entryPrice = Number(req.body.entryPrice)
    const quantity = Number(req.body.quantity);
    const entryCommission = req.body.entryCommission ? Number(req.body.entryCommission) : 0
    // Generate a unique professional trade ID
    let professionalTradeId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    while (!isUnique && attempts < maxAttempts) {
      professionalTradeId = await TradeIdGenerator.generateTradeId();
      console.log(`Generated Trade ID Attempt ${attempts + 1}:`, professionalTradeId);
      const existing = await prisma.trade.findUnique({ where: { tradeId: professionalTradeId } });
      console.log(`Trade ID ${professionalTradeId} exists:`, !!existing);
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    console.log('Final Trade ID:', professionalTradeId, 'Is Unique:', isUnique);
    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate a unique tradeId after multiple attempts.' });
    }


    // Validate and parse entry date (required field)
    if (!req.body.entryDate || req.body.entryDate === 'undefined' || req.body.entryDate.trim() === '') {
      //console.log('❌ Invalid entry date detected:', req.body.entryDate);
      return res.status(400).json({ error: 'Entry date is required. Please provide a valid date in YYYY-MM-DD format.' });
    }

    const entryDate = new Date(req.body.entryDate);
    if (isNaN(entryDate.getTime())) {
      //console.log('❌ Date parsing failed for:', req.body.entryDate);
      return res.status(400).json({ error: 'Invalid entry date format. Please use YYYY-MM-DD format (e.g., 2025-07-26).' });
    }

    // Calculate trade amount for capital allocation
    const tradeAmount = CapitalManager.calculateTradeAmount(entryPrice, quantity);
    //console.log(`💰 Trade amount calculated: ${tradeAmount} ${currency}`);

    // Check if sufficient capital is available
    const hasSufficientCapital = await CapitalManager.hasSufficientCapital(currency, tradeAmount);
    if (!hasSufficientCapital) {
      const capital = await CapitalManager.getCapital(currency);
      return res.status(400).json({
        error: `Insufficient capital to open trade. Required: ${tradeAmount} ${currency}, Available: ${capital ? capital.remaining : 0} ${currency}`
      });
    }



    const trade = await prisma.trade.create({
      data: {
        tradeId: professionalTradeId,

        //Ticker
        ticker: req.body.ticker,
        tickerName: req.body.tickerName,
        direction: req.body.direction || "Long",
        instrumentType: req.body.instrumentType || "Stocks",
        currency: currency.toUpperCase(),
        confidence: req.body.setupConfidence ? Number(req.body.setupConfidence) : 60,
        grade: req.body.grade || "A",

        //Execution
        entryDate: entryDate,
        entryPrice: entryPrice,
        quantity: quantity,
        remainingQuantity: quantity,
        stopLoss: req.body.stopLoss ? Number(req.body.stopLoss) : 0,
        target1: req.body.target1 ? Number(req.body.target1) : 0,
        target2: req.body.target2 ? Number(req.body.target2) : 0,
        target3: req.body.target3 ? Number(req.body.target3) : 0,

        //Entry Details
        reasonForEntry: req.body.reasonForEntry,
        entryCommission: entryCommission,
        tradeSetupId: req.body.tradeSetup ? Number(req.body.tradeSetup) : 0,
        status: "Open",
        notes: req.body.notes || null,
        isPaperTrade: false,
        systemAnalysisResult: req.body.systemAnalysisResult || null
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

    // Allocate capital after creating trade
    await CapitalManager.allocateCapital(currency, tradeAmount);

    res.status(201).json({
      message: "Trade created successfully",
      trade,
      capitalAllocated: {
        amount: tradeAmount,
        currency: currency.toUpperCase()
      }
    });

  } catch (error) {
    console.error('❌ Error creating trade:', error);

    // If it's a capital allocation error, provide specific message
    if (error.message.includes('capital') || error.message.includes('Capital')) {
      return res.status(400).json({
        error: 'Capital allocation failed',
        details: error.message
      });
    }

    res.status(500).json({ error: 'Failed to create trade', details: error.message });
  }
};

// Update Trade (Exit only) - Now supports partial exits
exports.updateTradeExit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exitDate,
      exitOrderPrice,
      exitQuantity,
      reasonForExit,
      exitTactic
    } = req.body;
    const exitCommission = req.body.exitCommission ? Number(req.body.exitCommission) : 0;
    if (!exitDate) {
      return res.status(400).json({ error: "Missing exit date" });
    }

    if (Number.isNaN(exitCommission) || exitCommission < 0) {
      return res.status(400).json({ error: "Exit commission must be a non-negative number" });
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
    const entryPrice = currentTrade.entryPrice;
    const exitPrice = Number(exitOrderPrice);

    // Validate exit quantity
    if (exitQty <= 0) {
      return res.status(400).json({ error: "Exit quantity must be greater than 0" });
    }

    if (exitQty > (currentTrade.remainingQuantity || currentTrade.quantity)) {
      return res.status(400).json({ error: "Cannot exit more shares than remaining" });
    }

    // Calculate capital to release for this exit
    const releaseAmount = CapitalManager.calculateTradeAmount(entryPrice, exitQty);
    const currency = currentTrade.currency || 'USD';

    // Create transaction record
    await prisma.tradeTransaction.create({
      data: {
        tradeId: tradeId,
        transactionType: "Exit",
        quantity: exitQty,
        price: exitPrice,
        transactionDate: new Date(exitDate),
        reasonForExit: reasonForExit,
        exitTacticId: exitTactic ? Number(exitTactic) : null,
      }
    });

    // Release capital for the exited position
    if (releaseAmount > 0) {
      await CapitalManager.releaseCapital(currency, releaseAmount);
    }

    // Determine new status
    let newStatus = "Open";
    if (remainingAfterExit === 0) {
      newStatus = "Closed";
    } else if (remainingAfterExit > 0) {
      newStatus = "Partial Closed";
    }

    // Update the main trade record
    const existingExitCommission = currentTrade.exitCommission ?? 0;
    const updateData = {
      remainingQuantity: remainingAfterExit,
      status: newStatus,
      reasonForExit: reasonForExit,
      exitTacticId: exitTactic ? Number(exitTactic) : null,
      exitCommission: existingExitCommission + exitCommission,
    };

    // If this is a complete exit, set exit fields
    if (remainingAfterExit === 0) {
      updateData.exitDate = new Date(exitDate);
      updateData.exitPrice = exitPrice;
      updateData.reasonForExit = reasonForExit;
      updateData.exitTacticId = exitTactic ? Number(exitTactic) : null;
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
      message: remainingAfterExit === 0 ? "Trade completely exited" : "Partial exit recorded",
      capitalReleased: {
        amount: releaseAmount,
        currency: currency
      }
    });
  } catch (err) {
    console.error('Error updating trade exit:', err);

    // If it's a capital release error, provide specific message
    if (err.message.includes('capital') || err.message.includes('Capital')) {
      return res.status(400).json({
        error: 'Capital release failed',
        details: err.message
      });
    }

    res.status(500).json({ error: 'Failed to update trade exit', details: err.message });
  }
};

// New method specifically for partial exits
exports.partialExitTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exitDate,
      exitOrderPrice,
      exitQuantity,
      reasonForExit,
      exitTactic
    } = req.body;

    const exitCommission = req.body.exitCommission ? Number(req.body.exitCommission) : 0;
    if (!exitDate || !exitOrderPrice || !exitQuantity) {
      return res.status(400).json({ error: "Missing required fields: exitDate, exitOrderPrice, exitQuantity" });
    }


    const tradeId = Number(id);
    const exitQty = Number(exitQuantity);
    const exitPrice = Number(exitOrderPrice);

    // Get current trade to validate
    const currentTrade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!currentTrade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const currentRemaining = currentTrade.remainingQuantity ?? currentTrade.quantity;
    const remainingAfterExit = currentRemaining - exitQty;
    const entryPrice = currentTrade.entryPrice;

    // Validate exit quantity
    if (exitQty <= 0) {
      return res.status(400).json({ error: "Exit quantity must be greater than 0" });
    }

    if (exitQty > currentRemaining) {
      return res.status(400).json({ error: "Cannot exit more shares than remaining" });
    }

    // Calculate capital to release for this exit
    const releaseAmount = CapitalManager.calculateTradeAmount(entryPrice, exitQty);
    if (exitCommission > releaseAmount) {
      return res.status(400).json({ error: "Exit commission cannot exceed exit amount" });
    }

    const currency = currentTrade.currency || 'USD';

    // Create transaction record
    await prisma.tradeTransaction.create({
      data: {
        tradeId: tradeId,
        transactionType: "Exit",
        quantity: exitQty,
        price: exitPrice,
        transactionDate: new Date(exitDate),
        reasonForExit: reasonForExit,
        exitTacticId: exitTactic ? Number(exitTactic) : null,
      }
    });

    // Release capital for the exited position
    await CapitalManager.releaseCapital(currency, releaseAmount);

    // Determine new status
    let newStatus = "Open";
    if (remainingAfterExit === 0) {
      newStatus = "Closed";
    } else if (remainingAfterExit > 0) {
      newStatus = "Partial Closed";
    }

    // Update the main trade record
    const existingExitCommission = currentTrade.exitCommission ?? 0;
    const updateData = {
      remainingQuantity: remainingAfterExit,
      status: newStatus,
      exitCommission: existingExitCommission + exitCommission,
    };

    // If this is a complete exit, set exit fields
    if (remainingAfterExit === 0) {
      updateData.exitDate = new Date(exitDate);
      updateData.exitPrice = exitPrice;
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
      message: remainingAfterExit === 0 ? "Trade completely exited" : "Partial exit recorded successfully",
      capitalReleased: {
        amount: releaseAmount,
        currency: currency
      }
    });
  } catch (err) {
    console.error('Error processing partial exit:', err);

    // If it's a capital release error, provide specific message
    if (err.message.includes('capital') || err.message.includes('Capital')) {
      return res.status(400).json({
        error: 'Capital release failed',
        details: err.message
      });
    }

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

// Get a single trade by ID with related data and Elder's Impulse analysis
exports.getTradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await prisma.trade.findUnique({
      where: { id: Number(id) },
      include: {
        tradeFills: true,
        tradeImages: true,
        tradeTransactions: true  // 🔧 Include transaction history for partial trades
      }
    });

    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const exitTactic = trade.exitTacticId;
    const tradeImages = await prisma.tradeImage.findMany({ where: { tradeId: trade.id } });
    const tradeSetup = trade.tradeSetupId;
    const tradeFills = await prisma.tradeFill.findMany({ where: { tradeId: trade.id } });

    // Base response structure
    let response = {
      ...trade,
      exitTactic: exitTactic,
      tradeImages,
      tradeSetup: tradeSetup,
      tradeFills: tradeFills
    };
    res.json(response);

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

    // Release allocated capital before deleting trade
    const remainingQty = trade.remainingQuantity || trade.quantity;
    if (remainingQty > 0) {
      const releaseAmount = CapitalManager.calculateTradeAmount(trade.entryPrice, remainingQty);
      const currency = trade.currency || 'USD';

      try {
        await CapitalManager.releaseCapital(currency, releaseAmount);
        //console.log(`💰 Released capital: ${releaseAmount} ${currency} for deleted trade ${trade.tradeId}`);
      } catch (capitalError) {
        console.error('⚠️  Warning: Failed to release capital during trade deletion:', capitalError.message);
      }
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

    //console.log(`Trade with ID ${tradeId} and all related data deleted successfully`);
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


// Refresh all trade prices (manual endpoint)
exports.refreshAllTradePrices = async (req, res) => {
  try {
    const trades = await prisma.trade.findMany();
    let updatedCount = 0;

    const updates = trades.map(async (trade) => {
      try {
        const quote = await getQuote(trade.ticker);
        const data = {};
        if (quote?.regularMarketPrice != null) {
          data.currentPrice = quote.regularMarketPrice;
        }
        if (data.currentPrice != null || data.lastDayPrice != null) {
          await prisma.trade.update({
            where: { id: trade.id },
            data,
          });
          updatedCount++;
        }
      } catch (err) {
        console.error(`[ERROR] Updating ${trade.ticker}:`, err.message);
      }
    });

    await Promise.allSettled(updates);
    //console.log(`[CRON] Updated ${updatedCount} investments`);


    res.json({
      success: true,
      message: `Prices refreshed for ${updatedCount} trades.`
    });
  } catch (error) {
    console.error('Error refreshing trade prices:', error);
    if (res?.status) {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh trade prices',
        error: error.message
      });
      return;
    }
  }
};

//Update the buy average after stock split
exports.updateStockSplit = async (req, res) => {
  try {
    const { symbol, splitRatio } = req.body;


    if (!splitRatio || isNaN(splitRatio) || splitRatio <= 0) {
      return res.status(400).json({ error: 'Invalid split ratio' });
    }

    const trades = await prisma.trade.findMany({
      where: { ticker: symbol.toUpperCase(), status: 'Open' }
    });

    if (!trades || trades.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    for (const t of trades) {
      // Calculate new entry price and quantity
      const newEntryPrice = t.entryPrice / splitRatio;
      const newQuantity = t.quantity * splitRatio;
      const newRemainingQuantity = t.remainingQuantity ? t.remainingQuantity * splitRatio : newQuantity;
      const target1 = t.target1 ? t.target1 / splitRatio : null;
      const target2 = t.target2 ? t.target2 / splitRatio : null;
      const target3 = t.target3 ? t.target3 / splitRatio : null;
      const stopLoss = t.stopLoss ? t.stopLoss / splitRatio : null;
      // Log the changes
      // console.log(`  🔄 Trade ${t.tradeId}: Price ${t.entryPrice} -> ${newEntryPrice.toFixed(2)}, Qty ${t.quantity} -> ${newQuantity}, Remaining Qty: ${t.remainingQuantity} -> ${newRemainingQuantity}`);
      const updatedTrade = await prisma.trade.update({
        where: { id: t.id },
        data: {
          entryPrice: newEntryPrice,
          quantity: newQuantity,
          remainingQuantity: newRemainingQuantity,
          target1: target1,
          target2: target2,
          target3: target3,
          stopLoss: stopLoss
        }
      });
    }

    res.json({
      message: 'Trade updated for stock split',
      trade: "updatedTrade"
    });
  } catch (error) {
    console.error('Error updating trade for stock split:', error);
    res.status(500).json({ error: 'Failed to update trade', details: error.message });
  }
};
