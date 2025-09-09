const yahoo = require('../yahoo');
const { PrismaClient } = require('@prisma/client');
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

/**
     * GET CURRENT ANALYSIS FOR STOCK
*/
const getTickerAnalysis = async (symbol) => {
    try {
        const response = await fetch(`http://localhost:8000/api/trading/signal-analysis?symbols=${symbol}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.results?.[0];
    } catch (error) {
        console.error(`❌ Error fetching current analysis for ${symbol}:`, error.message);
        return null;
    }
};

const refreshPrices = async () => {

    const trades = await prisma.trade.findMany({
        select: { ticker: true, id: true }
    });

    const watchlist = await prisma.watchlistStock.findMany({
        select: { symbol: true, id: true }
    });

    const investment = await prisma.investment.findMany({
        select: { ticker: true, id: true }
    });


    const recommendations = await prisma.recommendation.findMany({
        select: { ticker: true, id: true }
    });

    const allSymbols = new Set([
        ...trades.map(trade => trade.ticker),
        ...watchlist.map(item => item.symbol),
        ...investment.map(item => item.ticker),
        ...recommendations.map(item => item.ticker)
    ]);

   const prices = await Promise.all(
     Array.from(allSymbols).map(async (symbol) => {
       const price = await fetchCurrentPrice(symbol);
       return { symbol, price };
     })
   );

   for (const trade of trades) {
       const price = prices.find(p => p.symbol === trade.ticker)?.price || 0;
       await prisma.trade.update({
           where: { id: trade.id },
           data: { currentPrice: price }
       });
   }

   for (const inv of investment) {
       const price = prices.find(p => p.symbol === inv.ticker)?.price || 0;
       await prisma.investment.update({
           where: { id: inv.id },
           data: { currentPrice: price }
       });
   }

   for (const rec of recommendations) {
       const price = prices.find(p => p.symbol === rec.ticker)?.price || 0;
       await prisma.recommendation.update({
           where: { id: rec.id },
           data: { currentPrice: price }
       });
   }

   for (const item of watchlist) {
       const price = prices.find(p => p.symbol === item.symbol)?.price || 0;
       await prisma.watchlistStock.update({
           where: { id: item.id },
           data: { currentPrice: price }
       });
   }
   console.log('Prices refreshed:', prices);
};

module.exports = { fetchCurrentPrice, getTickerAnalysis, refreshPrices };