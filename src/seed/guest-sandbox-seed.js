/**
 * 🌱 GUEST SANDBOX SEED
 *
 * Wipes every ownerless (userId IS NULL) row across the four sandbox
 * models and replaces them with a small hand-picked demo dataset.
 *
 * Why this exists: guests can freely add/edit the shared sandbox with no
 * delete, so over time it's an ever-growing, never-shrinking pile of
 * anonymous edits. Resetting to a curated state nightly (see
 * src/cron/guest-sandbox-reset.cron.js) bounds any spam/abuse to at most
 * 24 hours and guarantees the app looks presentable at all times.
 */

const prisma = require('../db');

async function reseedGuestSandbox() {
  const deleted = {
    trade: (await prisma.trade.deleteMany({ where: { userId: null } })).count,
    investment: (await prisma.investment.deleteMany({ where: { userId: null } })).count,
    recommendation: (await prisma.recommendation.deleteMany({ where: { userId: null } })).count,
    chartAnalysis: (await prisma.chartAnalysis.deleteMany({ where: { userId: null } })).count,
  };

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const trades = await prisma.$transaction(
    [
      {
        tradeId: 'ISH-DEMO-000001',
        ticker: 'AAPL',
        tickerName: 'Apple Inc.',
        direction: 'LONG',
        instrumentType: 'Stocks',
        currency: 'USD',
        currentPrice: 232.5,
        entryDate: daysAgo(18),
        reasonForEntry: 'Breakout above VCP base with volume expansion.',
        quantity: 25,
        entryPrice: 210.4,
        stopLoss: 199.8,
        target1: 235,
        target2: 250,
        status: 'Open',
        isPaperTrade: true,
        userId: null,
      },
      {
        tradeId: 'ISH-DEMO-000002',
        ticker: 'NVDA',
        tickerName: 'NVIDIA Corp.',
        direction: 'LONG',
        instrumentType: 'Stocks',
        currency: 'USD',
        currentPrice: 138.2,
        entryDate: daysAgo(35),
        exitDate: daysAgo(5),
        reasonForEntry: 'Minervini Template Advanced setup, stage 2 uptrend.',
        reasonForExit: 'Hit target, trimmed into strength.',
        quantity: 40,
        entryPrice: 115.0,
        exitPrice: 138.2,
        stopLoss: 108.0,
        target1: 130,
        target2: 145,
        status: 'Closed',
        rMultiple: 3.3,
        isPaperTrade: true,
        userId: null,
      },
      {
        tradeId: 'ISH-DEMO-000003',
        ticker: 'RELIANCE.NS',
        tickerName: 'Reliance Industries',
        direction: 'LONG',
        instrumentType: 'Stocks',
        currency: 'INR',
        currentPrice: 2985,
        entryDate: daysAgo(9),
        reasonForEntry: 'Big base recovery, reclaimed 50-day MA on volume.',
        quantity: 15,
        entryPrice: 2870,
        stopLoss: 2740,
        target1: 3100,
        status: 'Open',
        isPaperTrade: true,
        userId: null,
      },
    ].map((data) => prisma.trade.create({ data }))
  );

  const investments = await prisma.$transaction(
    [
      {
        ticker: 'MSFT',
        currency: 'USD',
        quantity: 10,
        avgBuyPrice: 405.2,
        totalInvestment: 4052,
        currentPrice: 421.6,
        status: 'open',
        entryDate: daysAgo(60),
        remainingQty: 10,
        notes: 'Core long-term compounder position, added on a pullback to the 20-week line.',
        isPaperTrade: true,
        userId: null,
      },
      {
        ticker: 'INFY.NS',
        currency: 'INR',
        quantity: 30,
        avgBuyPrice: 1540,
        totalInvestment: 46200,
        currentPrice: 1615,
        status: 'open',
        entryDate: daysAgo(40),
        remainingQty: 30,
        notes: 'IT sector allocation, steady earnings growth.',
        isPaperTrade: true,
        userId: null,
      },
    ].map((data) => prisma.investment.create({ data }))
  );

  const recommendations = await prisma.$transaction(
    [
      {
        ticker: 'AMD',
        buyBelow: 145,
        currentPrice: 141.3,
        sector: 'Semiconductors',
        source: 'Scan — Minervini Template',
        marketCap: 'Large Cap',
        isPaperTrade: true,
        userId: null,
      },
      {
        ticker: 'TCS.NS',
        buyBelow: 4150,
        currentPrice: 4082,
        sector: 'IT Services',
        source: 'Scan — Momentum System',
        marketCap: 'Large Cap',
        isPaperTrade: true,
        userId: null,
      },
    ].map((data) => prisma.recommendation.create({ data }))
  );

  const chartAnalyses = await prisma.$transaction(
    [
      {
        entryDate: daysAgo(6),
        ticker: 'GOOGL',
        tickerName: 'Alphabet Inc.',
        trend: 'Uptrend',
        candleType: 'Bullish Engulfing',
        nearSupport: true,
        nearResistance: false,
        supportLevel: 172.5,
        resistanceLevel: 190.0,
        emaTouch: true,
        volumeSpike: true,
        rsiValue: 58.4,
        entryConsidered: true,
        actionPlan: 'Watch for follow-through above 182 with volume before entering.',
        entryNotes: 'Reclaimed 21-EMA on above-average volume after a shallow pullback.',
        setupConfidence: 'High',
        isPaperTrade: true,
        userId: null,
      },
    ].map((data) => prisma.chartAnalysis.create({ data }))
  );

  return {
    deleted,
    created: {
      trade: trades.length,
      investment: investments.length,
      recommendation: recommendations.length,
      chartAnalysis: chartAnalyses.length,
    },
  };
}

module.exports = { reseedGuestSandbox };

if (require.main === module) {
  reseedGuestSandbox()
    .then((result) => {
      console.log('✅ Guest sandbox reseeded:', JSON.stringify(result, null, 2));
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error('❌ Guest sandbox reseed failed:', error);
      process.exit(1);
    });
}
