const yahoo = require('../yahoo');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment-timezone');
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

/**
     * GET CURRENT ANALYSIS FOR STOCK
*/
const getTickerAnalysis = async (symbol) => {
    try {
        const response = await fetch(`http://localhost:8000/api/trading/signal-analysis?symbol=${symbol}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error(`❌ Error fetching current analysis for ${symbol}:`, error.message);
        return null;
    }
};


const refreshOtherPrices = async () => {
  
    const investment = await prisma.investment.findMany({
        select: { ticker: true, id: true }
    });


    const recommendations = await prisma.recommendation.findMany({
        select: { ticker: true, id: true }
    });

    const allSymbols = new Set([
        ...investment.map(item => item.ticker),
        ...recommendations.map(item => item.ticker)
    ]);

   const prices = await Promise.all(
     Array.from(allSymbols).map(async (symbol) => {
       const quote = await yahoo.getQuote(symbol);
       return { symbol, quote };
     })
   );

   await Promise.all([
    ...investment.map(inv => {
      const quote = prices.find(p => p.symbol === inv.ticker)?.quote || {};
      const data = {};
      if (quote?.regularMarketPrice != null) {
        data.currentPrice = quote.regularMarketPrice;
      }
      if (quote?.regularMarketPreviousClose != null) {
        data.lastDayPrice = quote.regularMarketPreviousClose;
      }
      return prisma.investment.update({
        where: { id: inv.id },
        data
      });
    }),
    ...recommendations.map(rec => {
      const quote = prices.find(p => p.symbol === rec.ticker)?.quote || {};
      const data = {};
      if (quote?.regularMarketPrice != null) {
        data.currentPrice = quote.regularMarketPrice;
      }
      return prisma.recommendation.update({
        where: { id: rec.id },
        data
      });
    }),
  ]);

  const now = moment().tz('Asia/Singapore');

  console.log(`Investment Prices refreshed at : at ${now.format('YYYY-MM-DD HH:mm')} SGT`, prices.length, 'tickers updated.');
}

const refreshTradePrices = async () => {

    const trades = await prisma.trade.findMany({
        where: { status: { in: ['Open', 'Partial Closed'] } },
        select: { ticker: true, id: true }
    });

    const allSymbols = new Set([
        ...trades.map(trade => trade.ticker),
    ]);

   const prices = await Promise.all(
     Array.from(allSymbols).map(async (symbol) => {
       const quote = await yahoo.getQuote(symbol);
       return { symbol, quote };
     })
   );

   await Promise.all([
    ...trades.map(trade => {
      const quote = prices.find(p => p.symbol === trade.ticker)?.quote || {};
      const data = {};
        if (quote?.regularMarketPrice != null) {
          data.currentPrice = quote.regularMarketPrice;
        }
        if (quote?.regularMarketPreviousClose != null) {
          data.lastDayPrice = quote.regularMarketPreviousClose;
        }
      return prisma.trade.update({
        where: { id: trade.id },
        data
      });
    }),
    
  ]);

  const now = moment().tz('Asia/Singapore');

  console.log(`Trade Prices refreshed at : at ${now.format('YYYY-MM-DD HH:mm')} SGT`, prices.length, 'tickers updated.');

};
refreshTradePrices();
refreshOtherPrices();
module.exports = { fetchCurrentPrice, getTickerAnalysis, refreshTradePrices, refreshOtherPrices };