// Start price refresh cron job (runs every 15 minutes during trading hours)
try {
  require('./refresh-prices-cron');
  console.log('✅ Price refresh cron job started successfully (11:30 AM - 6:30 PM SG Time)');
} catch (error) {
  console.error('❌ Failed to start price refresh cron job:', error.message);
}

// Start position alerts cron job (monitors open trades)
try {
  const PositionAlertsCron = require('./cron/positionAlertsCron');
  const positionAlerts = new PositionAlertsCron();
  positionAlerts.start();
  console.log('✅ Position alerts cron job started successfully (11:30 AM - 6:30 PM SG Time)');
} catch (error) {
  console.error('❌ Failed to start position alerts cron job:', error.message);
}

// Start watchlist cron job - SIMPLE DAILY SCAN
try {
  const WatchlistCron = require('./cron/watchlistCron');
  const watchlistCron = new WatchlistCron();
  watchlistCron.start();
  console.log('✅ Daily Watchlist cron job started successfully (9:30 AM IST)');
} catch (error) {
  console.error('❌ Failed to start watchlist cron job:', error.message);
}

// Start Entry Trigger Monitoring cron job
try {
  const EntryTriggerCron = require('./cron/EntryTriggerCron');
  const entryTriggerCron = new EntryTriggerCron();
  entryTriggerCron.start();
  console.log('✅ Entry Trigger Monitoring cron job started successfully (every 15 minutes)');
} catch (error) {
  console.error('❌ Failed to start entry trigger cron job:', error.message);
}

// Start Expert Analysis cron job (NIFTY 200 Core + Satellite)
// TEMPORARILY DISABLED - Deleted watchlistManager dependency
/*
try {
  const ExpertAnalysisCron = require('./cron/expert-analysis.cron');
  const expertCron = new ExpertAnalysisCron();
  expertCron.start();
  console.log('✅ Expert Analysis cron jobs started successfully');
} catch (error) {
  console.error('❌ Failed to start expert analysis cron jobs:', error.message);
}
*/

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = 8000;

// Yahoo Finance utility
const yahoo = require('./yahoo');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
const { expressjwt: jwt } = require('express-jwt');
const auth = jwt({ secret: process.env.JWT_SECRET || 'dev_secret', algorithms: ['HS256'] });

app.use('/api/trades', require('./routes/trade.routes'));
app.use('/api/journal', require('./routes/chart.routes'));


// Investment & Recommendation routes
app.use('/api/recommendations', require('./routes/recommendation.routes'));
app.use('/api/investments', require('./routes/investment.routes'));
app.use('/api/investments', require('./routes/investment-transactions.routes'));

// Market data routes
app.use('/api/market', require('./routes/market.routes'));

// Trading system routes (multi-system stock analysis)
app.use('/api/trading', require('./routes/signal-analysis.routes'));


// Capital management routes

app.use('/api/capital', require('./routes/capital.routes'));

// Watchlist routes
app.use('/api/watchlist', require('./routes/simpleWatchlistRoutes'));

// Alert routes

app.use('/api/alerts', require('./routes/simpleAlertRoutes'));

// Yahoo Finance API endpoints
app.get('/api/yahoo/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query' });
    const results = await yahoo.searchSymbol(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/yahoo/price', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
    const price = await yahoo.getCurrentPrice(symbol);
    res.json({ symbol, price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ATR calculation helper
// ATR = RMA (Wilder's smoothing) of TRs
function calculateATR(data, period = 14, returnSeries = false) {
  if (!data || data.length < period + 1) return null;
  let trs = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    trs.push(Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    ));
  }
  if (trs.length < period) return null;
  // First ATR is SMA of first 'period' TRs
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let atrs = [atr];
  // Wilder's smoothing for the rest
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    atrs.push(atr);
  }
  return returnSeries ? atrs : atr;
}

function getSupportResistance(quotes, lookback = 20) {
  const recent = quotes.slice(-lookback);

  const lows = recent.map(q => q.low).filter(v => v != null);
  const highs = recent.map(q => q.high).filter(v => v != null);

  if (!lows.length || !highs.length) return { support: null, resistance: null };

  const sortedLows = [...lows].sort((a, b) => a - b);
  const sortedHighs = [...highs].sort((a, b) => b - a);

  const support = sortedLows[Math.floor(sortedLows.length * 0.2)];
  const resistance = sortedHighs[Math.floor(sortedHighs.length * 0.2)];

  return {
    support: parseFloat(support.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(2))
  };
}

app.get('/api/yahoo/indicator', async (req, res) => {
  try {
    const { getLatestEMAValues } = require('./utils/technicalIndicators');

    const period1 = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000); // 90 days ago for EMA50
    const period2 = Math.floor(Date.now() / 1000); // now
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
    
    let hist;
    if (period1 && period2) {
      hist = await yahoo.getHistoricalForTrade(symbol, period1, period2);
    } else {
      hist = await yahoo.getHistoricalForTrade(symbol, '3mo'); // Increased from 2mo to 3mo
    }
    
    // Validate that hist is an array and has data
    if (!Array.isArray(hist) || hist.length === 0) {
      return res.status(404).json({ error: 'No historical data found for symbol' });
    }
    
    // Debug: log last date in historical data
    if (hist && hist.length > 0) {
      //console.log(`Indicator data for ${symbol}: last date =`, hist[hist.length - 1].date);
    }
    
    // Calculate ATR (14-day default) - keeping for internal use but not exposing
    let atr = calculateATR(hist, 14);
    if (atr !== null && atr !== undefined) {
      atr = Number(atr.toFixed(2)); // 2 decimals
    }
    
    // Calculate EMA values and other indicators
    const quotes = hist.map(quote => ({
      date: quote.date,
      close: quote.close || 0
    }));
    
    const emaValues = getLatestEMAValues(quotes);
    
    // Calculate support and resistance (last 20 periods)
    ({support, resistance} = getSupportResistance(hist));

    // Helper function for RSI signal (inline since we can't import from routes)
    function getRSISignalLocal(rsi) {
      if (!rsi || rsi === undefined) return 'insufficient_data';
      if (rsi >= 70) return 'overbought';
      if (rsi <= 30) return 'oversold';
      if (rsi >= 50) return 'bullish_momentum';
      return 'bearish_momentum';
    }
    
    // Helper function for EMA alignment (inline since we can't import from routes)
    function getEMAAlignmentLocal(values) {
      const { ema13, ema20, ema26, ema50 } = values;
      if (!ema13 || !ema20 || !ema26 || !ema50) return 'insufficient_data';
      const bullishAlignment = ema13 > ema20 && ema20 > ema26 && ema26 > ema50;
      const bearishAlignment = ema13 < ema20 && ema20 < ema26 && ema26 < ema50;
      if (bullishAlignment) return 'bullish_aligned';
      if (bearishAlignment) return 'bearish_aligned';
      return 'mixed_signals';
    }
    
    res.json({
      symbol: symbol.toUpperCase(),
      date: emaValues.date,
      currentPrice: emaValues.price,
      ema13: emaValues.ema13,
      ema20: emaValues.ema20,
      ema26: emaValues.ema26,
      ema50: emaValues.ema50,
      sma13: emaValues.sma13,
      sma20: emaValues.sma20,
      sma26: emaValues.sma26,
      sma50: emaValues.sma50,
      rsi14: emaValues.rsi14,
      support: support,
      resistance: resistance,
      atr14: atr,
      trend: {
        overall: emaValues.ema20 && emaValues.ema50 ? 
          (emaValues.ema20 > emaValues.ema50 ? 'bullish' : 'bearish') : 'insufficient_data',
        shortTerm: emaValues.price && emaValues.ema20 ?
          (emaValues.price > emaValues.ema20 ? 'above_ema20' : 'below_ema20') : 'insufficient_data',
        emaAlignment: getEMAAlignmentLocal(emaValues),
        rsiSignal: getRSISignalLocal(emaValues.rsi14)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});