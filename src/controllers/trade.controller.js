const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all trades with related data
exports.getAllTrades = async (req, res) => {
  try {
    const trades = await prisma.trades.findMany({});
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
    const trade = await prisma.trades.create({
      data: {
        ticker: req.body.ticker,
        reason_for_entry: req.body.reasonForEntry,
        entry_date: new Date(req.body.entryDate),
        entry_price: Number(req.body.entryOrderPrice),
        quantity: Number(req.body.entryFilledShares),
        direction: req.body.direction || "Long",
        trade_setup_id: req.body.tradeSetup ? Number(req.body.tradeSetup) : null,
        setup: req.body.setup || null,
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

// Update Trade (Exit only)
exports.updateTradeExit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exitDate, exitOrderPrice, reasonForExit, exitTactic
    } = req.body;

    if (!exitDate) {
      return res.status(400).json({ error: "Missing exit date" });
    }

    const trade = await prisma.trades.update({
      where: { id: Number(id) },
      data: {
        exit_date: new Date(exitDate),
        exit_price: Number(exitOrderPrice),
        reason_for_exit: reasonForExit,
        exit_tactic_id: exitTactic ? Number(exitTactic) : null,
      }
    });

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

    res.json(trade);
  } catch (err) {
    console.error('Error updating trade exit:', err);
    res.status(500).json({ error: 'Failed to update trade exit', details: err.message });
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
      where: { id: Number(id) }
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
