const { PrismaClient } = require('@prisma/client');
const ProfessionalTradeId = require('../utils/professionalTradeId');
const prisma = new PrismaClient();

// Example: Enhanced getAllTrades with Professional IDs
exports.getAllTradesWithProfessionalIds = async (req, res) => {
  try {
    const trades = await prisma.trades.findMany({
      include: {
        trade_transactions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    // Transform trades to include professional IDs
    const tradesWithProfessionalIds = trades.map(trade => ({
      ...trade,
      // Add professional ID fields
      trade_id: ProfessionalTradeId.generateFromId(trade.id, trade.created_at),
      short_id: ProfessionalTradeId.generateShortId(trade.id, trade.created_at),
      
      // Transform related transactions to also have professional IDs
      trade_transactions: trade.trade_transactions.map(transaction => ({
        ...transaction,
        trade_id: ProfessionalTradeId.generateFromId(trade.id, trade.created_at),
        display_id: `${ProfessionalTradeId.generateFromId(trade.id, trade.created_at)}-TX${transaction.id}`
      }))
    }));

    res.json(tradesWithProfessionalIds);
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades', details: error.message });
  }
};

// Example: Enhanced getTradeById with Professional ID support
exports.getTradeByIdWithProfessionalId = async (req, res) => {
  try {
    let { id } = req.params;
    
    // Support both numeric and professional ID formats
    let numericId = id;
    if (ProfessionalTradeId.isValidFormat(id)) {
      numericId = ProfessionalTradeId.extractNumericId(id);
      if (!numericId) {
        return res.status(400).json({ error: 'Invalid professional trade ID format' });
      }
    }
    
    const trade = await prisma.trades.findUnique({
      where: { id: parseInt(numericId) },
      include: {
        trade_transactions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    // Enhance trade with professional IDs
    const enhancedTrade = {
      ...trade,
      trade_id: ProfessionalTradeId.generateFromId(trade.id, trade.created_at),
      short_id: ProfessionalTradeId.generateShortId(trade.id, trade.created_at),
      all_formats: ProfessionalTradeId.getAllFormats(trade.id, trade.created_at),
      
      // Enhance transactions
      trade_transactions: trade.trade_transactions.map(transaction => ({
        ...transaction,
        trade_id: ProfessionalTradeId.generateFromId(trade.id, trade.created_at),
        display_id: `${ProfessionalTradeId.generateFromId(trade.id, trade.created_at)}-TX${transaction.id}`
      }))
    };

    res.json(enhancedTrade);
  } catch (error) {
    console.error('Error fetching trade by id:', error);
    res.status(500).json({ error: 'Failed to fetch trade', details: error.message });
  }
};

// Example: Dashboard summary with professional ID context
exports.getDashboardSummaryWithProfessionalIds = async (req, res) => {
  try {
    const trades = await prisma.trades.findMany();

    const totalTrades = trades.length;
    const wins = trades.filter(t => t.r_multiple > 0).length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;

    // Recent trades with professional IDs
    const recentTrades = trades
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(trade => ({
        ...trade,
        trade_id: ProfessionalTradeId.generateFromId(trade.id, trade.created_at),
        short_id: ProfessionalTradeId.generateShortId(trade.id, trade.created_at)
      }));

    res.json({
      totalTrades,
      winRate,
      recentTrades,
      summary: {
        first_trade_id: totalTrades > 0 ? ProfessionalTradeId.generateFromId(trades[0].id, trades[0].created_at) : null,
        latest_trade_id: totalTrades > 0 ? ProfessionalTradeId.generateFromId(
          trades[trades.length - 1].id, 
          trades[trades.length - 1].created_at
        ) : null
      }
    });
  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    res.status(500).json({ error: 'Failed to generate dashboard summary', details: error.message });
  }
};

module.exports = {
  getAllTradesWithProfessionalIds,
  getTradeByIdWithProfessionalId,
  getDashboardSummaryWithProfessionalIds
};
