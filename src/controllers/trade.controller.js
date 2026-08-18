const prisma = require('../db');
const TradeIdGenerator = require('../utils/tradeIdGenerator');
const CapitalManager = require('../utils/capitalManager');
const { getQuote } = require('../yahoo');
const { buildReadFilter, buildWriteFilter, buildCreateData } = require('../utils/ownershipFilter');

// Get all trades — authenticated users see only their own, guests see only
// the shared paper sandbox. The client no longer chooses via ?isPaperTrade=.
exports.getAllTrades = async (req, res) => {
  try {
    const where = buildReadFilter(req);

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
      // tradeId is no longer globally unique (Migration 3 scoped it to
      // @@unique([userId, tradeId])) — findFirst, not findUnique.
      const existing = await prisma.trade.findFirst({ where: { tradeId: professionalTradeId } });
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate a unique tradeId after multiple attempts.' });
    }

    // Validate and parse entry date (required field)
    if (!req.body.entryDate || req.body.entryDate === 'undefined' || req.body.entryDate.trim() === '') {
      return res.status(400).json({ error: 'Entry date is required. Please provide a valid date in YYYY-MM-DD format.' });
    }

    const entryDate = new Date(req.body.entryDate);
    if (isNaN(entryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid entry date format. Please use YYYY-MM-DD format (e.g., 2025-07-26).' });
    }

    // Calculate trade amount for capital allocation
    const tradeAmount = CapitalManager.calculateTradeAmount(entryPrice, quantity);

    // Capital has no guest concept at all — a guest's paper trade skips
    // allocation entirely rather than touching (or crashing against) a
    // Capital row that doesn't exist for them.
    if (req.user) {
      const hasSufficientCapital = await CapitalManager.hasSufficientCapital(req.user.id, currency, tradeAmount);
      if (!hasSufficientCapital) {
        const capital = await CapitalManager.getCapital(req.user.id, currency);
        return res.status(400).json({
          error: `Insufficient capital to open trade. Required: ${tradeAmount} ${currency}, Available: ${capital ? capital.remaining : 0} ${currency}`
        });
      }
    }

    const trade = await prisma.trade.create({
      data: buildCreateData(req, {
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
        trailingStopLoss: req.body.stopLoss ? Number(req.body.stopLoss) : 0,
        target1: req.body.target1 ? Number(req.body.target1) : 0,
        target2: req.body.target2 ? Number(req.body.target2) : 0,
        target3: req.body.target3 ? Number(req.body.target3) : 0,

        //Entry Details
        reasonForEntry: req.body.reasonForEntry,
        entryCommission: entryCommission,
        tradeSetupId: req.body.tradeSetup ? Number(req.body.tradeSetup) : 0,
        status: "Open",
        notes: req.body.notes || null,
        systemAnalysisResult: req.body.systemAnalysisResult || null
      })
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

    // Allocate capital after creating trade — only for authenticated users.
    if (req.user) {
      await CapitalManager.allocateCapital(req.user.id, currency, tradeAmount);
    }

    res.status(201).json({
      message: "Trade created successfully",
      trade,
      capitalAllocated: req.user ? {
        amount: tradeAmount,
        currency: currency.toUpperCase()
      } : null
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

// Add to (pyramid) an existing open/partial trade — merges the new tranche
// into the same Trade row (weighted-average entryPrice, additive quantity
// and commission) rather than creating a second independent row, and logs
// the tranche as an "Entry" TradeTransaction so the fill history survives
// the merge.
exports.addQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, price, quantity, commission } = req.body;
    const tradeId = Number(id);

    if (!tradeId || isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Missing entry date' });
    }

    const addPrice = Number(price);
    const addQty = Number(quantity);
    const addCommission = commission ? Number(commission) : 0;

    if (!addPrice || addPrice <= 0 || !addQty || addQty <= 0) {
      return res.status(400).json({ error: 'Price and quantity must be greater than 0' });
    }
    if (Number.isNaN(addCommission) || addCommission < 0) {
      return res.status(400).json({ error: 'Commission must be a non-negative number' });
    }

    const currentTrade = await prisma.trade.findFirst({
      where: { id: tradeId, ...buildWriteFilter(req) }
    });

    if (!currentTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const status = (currentTrade.status || '').toLowerCase();
    if (status === 'closed') {
      return res.status(400).json({ error: 'Cannot add to a closed trade' });
    }

    const oldQty = Number(currentTrade.quantity || 0);
    const oldRemaining = Number(currentTrade.remainingQuantity ?? oldQty);
    const oldEntryPrice = Number(currentTrade.entryPrice || 0);

    const newQty = oldQty + addQty;
    const newRemaining = oldRemaining + addQty;
    const newEntryPrice = (oldEntryPrice * oldQty + addPrice * addQty) / newQty;

    const currency = currentTrade.currency || 'USD';
    const addAmount = CapitalManager.calculateTradeAmount(addPrice, addQty);

    if (req.user) {
      const hasSufficientCapital = await CapitalManager.hasSufficientCapital(req.user.id, currency, addAmount);
      if (!hasSufficientCapital) {
        const capital = await CapitalManager.getCapital(req.user.id, currency);
        return res.status(400).json({
          error: `Insufficient capital to add to trade. Required: ${addAmount} ${currency}, Available: ${capital ? capital.remaining : 0} ${currency}`
        });
      }
    }

    await prisma.tradeTransaction.create({
      data: {
        tradeId: currentTrade.id,
        transactionType: 'Entry',
        quantity: addQty,
        price: addPrice,
        commission: addCommission,
        transactionDate: new Date(date),
      }
    });

    const existingEntryCommission = currentTrade.entryCommission ?? 0;
    const trade = await prisma.trade.update({
      where: { id: currentTrade.id },
      data: {
        quantity: newQty,
        remainingQuantity: newRemaining,
        entryPrice: newEntryPrice,
        entryCommission: existingEntryCommission + addCommission,
      }
    });

    if (req.user) {
      await CapitalManager.allocateCapital(req.user.id, currency, addAmount);
    }

    res.json({
      ...trade,
      message: 'Added to position',
      capitalAllocated: req.user ? { amount: addAmount, currency } : null
    });
  } catch (error) {
    console.error('Error adding to trade:', error);

    if (error.message.includes('capital') || error.message.includes('Capital')) {
      return res.status(400).json({ error: 'Capital allocation failed', details: error.message });
    }

    res.status(500).json({ error: 'Failed to add to trade', details: error.message });
  }
};

// Update only the trailing stop — never touches `stopLoss`, since R-multiple,
// targets, and risk-management math all key off the original stopLoss value.
exports.updateTrailingStop = async (req, res) => {
  try {
    const { id } = req.params;
    const tradeId = Number(id);

    if (!tradeId || isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }

    const trailingStopLoss = Number(req.body.trailingStopLoss);
    if (!req.body.trailingStopLoss || isNaN(trailingStopLoss) || trailingStopLoss <= 0) {
      return res.status(400).json({ error: 'trailingStopLoss must be a positive number' });
    }

    const currentTrade = await prisma.trade.findFirst({
      where: { id: tradeId, ...buildWriteFilter(req) }
    });

    if (!currentTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const status = (currentTrade.status || '').toLowerCase();
    if (status === 'closed') {
      return res.status(400).json({ error: 'Cannot update trailing stop on a closed trade' });
    }

    const trade = await prisma.trade.update({
      where: { id: currentTrade.id },
      data: { trailingStopLoss }
    });

    res.json({ ...trade, message: 'Trailing stop updated' });
  } catch (error) {
    console.error('Error updating trailing stop:', error);
    res.status(500).json({ error: 'Failed to update trailing stop', details: error.message });
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

    // Get current trade to validate — scoped to the caller's own rows
    // (or the shared sandbox for a guest).
    const currentTrade = await prisma.trade.findFirst({
      where: { id: tradeId, ...buildWriteFilter(req) },
      include: {
        tradeTransactions: true
      }
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

    // Release capital for the exited position — guests have no Capital row.
    if (req.user && releaseAmount > 0) {
      await CapitalManager.releaseCapital(req.user.id, currency, releaseAmount);
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
      where: { id: currentTrade.id },
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
    const currentTrade = await prisma.trade.findFirst({
      where: { id: tradeId, ...buildWriteFilter(req) },
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

    // Release capital for the exited position — guests have no Capital row.
    if (req.user) {
      await CapitalManager.releaseCapital(req.user.id, currency, releaseAmount);
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
      where: { id: currentTrade.id },
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

    const existing = await prisma.trade.findFirst({
      where: { id: Number(id), ...buildWriteFilter(req) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const trade = await prisma.trade.update({
      where: { id: existing.id },
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

// Edit existing trade entry details
exports.editTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const tradeId = Number(id);
    if (!tradeId || Number.isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }

    const currentTrade = await prisma.trade.findFirst({
      where: { id: tradeId, ...buildWriteFilter(req) }
    });

    if (!currentTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    if ((currentTrade.status || '').toLowerCase() === 'closed') {
      return res.status(400).json({ error: 'Closed trades cannot be edited' });
    }
    const nextEntryDate = req.body.entryDate ? new Date(req.body.entryDate) : currentTrade.entryDate;
    if (req.body.entryDate && Number.isNaN(nextEntryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid entry date format' });
    }

    const hasExitHistory = Array.isArray(currentTrade.tradeTransactions) && currentTrade.tradeTransactions.some(tx => tx.transactionType === 'Exit');

    const nextEntryPrice = req.body.entryPrice !== undefined && req.body.entryPrice !== ''
      ? Number(req.body.entryPrice)
      : currentTrade.entryPrice;
    const nextQuantity = req.body.quantity !== undefined && req.body.quantity !== ''
      ? Number(req.body.quantity)
      : currentTrade.quantity;
    const nextStopLoss = req.body.stopLoss !== undefined && req.body.stopLoss !== ''
      ? Number(req.body.stopLoss)
      : currentTrade.stopLoss;

    if (Number.isNaN(nextEntryPrice) || Number.isNaN(nextQuantity) || Number.isNaN(nextStopLoss)) {
      return res.status(400).json({ error: 'Entry price, quantity, and stop loss must be valid numbers' });
    }

    if (nextQuantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const currentCurrency = (currentTrade.currency || 'USD').toUpperCase();
    const currentEntryAmount = CapitalManager.calculateTradeAmount(Number(currentTrade.entryPrice || 0), Number(currentTrade.remainingQuantity || currentTrade.quantity || 0));
    const nextEntryAmount = CapitalManager.calculateTradeAmount(nextEntryPrice, nextQuantity);
    const amountDiff = nextEntryAmount - currentEntryAmount;

    if (hasExitHistory && nextQuantity !== Number(currentTrade.quantity || 0)) {
      return res.status(400).json({
        error: 'Quantity cannot be changed after exit transactions exist. Only entry price, entry date, and stop loss can be edited.'
      });
    }

    // Guests (sandbox rows, no Capital record) skip capital adjustment.
    if (req.user) {
      if (amountDiff > 0) {
        const hasSufficientCapital = await CapitalManager.hasSufficientCapital(req.user.id, currentCurrency, amountDiff);
        if (!hasSufficientCapital) {
          const capital = await CapitalManager.getCapital(req.user.id, currentCurrency);
          return res.status(400).json({
            error: `Insufficient capital to increase trade size. Required: ${amountDiff} ${currentCurrency}, Available: ${capital ? capital.remaining : 0} ${currentCurrency}`
          });
        }
        await CapitalManager.allocateCapital(req.user.id, currentCurrency, amountDiff);
      } else if (amountDiff < 0) {
        await CapitalManager.releaseCapital(req.user.id, currentCurrency, Math.abs(amountDiff));
      }
    }

    const updatedTrade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        entryDate: nextEntryDate,
        entryPrice: nextEntryPrice,
        quantity: nextQuantity,
        remainingQuantity: currentTrade.status === 'Closed' ? currentTrade.remainingQuantity : nextQuantity,
        stopLoss: nextStopLoss,
      }
    });

    res.json({
      message: 'Trade updated successfully',
      trade: updatedTrade
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    res.status(500).json({ error: 'Failed to update trade', details: error.message });
  }
};

// Get a single trade by ID with related data and Elder's Impulse analysis
exports.getTradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const trade = await prisma.trade.findFirst({
      where: { id: Number(id), ...buildReadFilter(req) },
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

// Delete trade and all related data. Route already applies requireAuth, so
// req.user is guaranteed here; scope strictly to the caller's own rows.
exports.deleteTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const tradeId = Number(id);

    // Validate trade ID
    if (!tradeId || isNaN(tradeId)) {
      return res.status(400).json({ error: 'Invalid trade ID' });
    }

    // Check if trade exists and belongs to the caller
    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, userId: req.user.id }
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
        await CapitalManager.releaseCapital(req.user.id, currency, releaseAmount);
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

    // Confirm ownership of the parent trade before returning its transactions.
    const trade = await prisma.trade.findFirst({ where: { id: tradeId, ...buildReadFilter(req) } });
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
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


// Refresh all trade prices (manual endpoint) — deliberately cross-user by
// design (this is the same job the price-refresh cron runs); the route lock
// (requireRole('SUPERUSER'), see trade.routes.js) is what restricts callers,
// not this query.
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

//Update the buy average after stock split — cross-user by design, same
// reasoning as refreshAllTradePrices above.
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
      await prisma.trade.update({
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
