
// Start Price Refresh cron job
try {
  const PriceRefreshCron = require('./cron/price.refresh.cron');
  const priceRefreshCron = new PriceRefreshCron();
  priceRefreshCron.start();
  console.log('✅ Daily Price Refresh cron job started successfully');
} catch (error) {
  console.error('❌ Failed to start price refresh cron job:', error.message);
}

//Start unified alert cron job (handles both position and watchlist alerts)
try {
  const AlertCron = require('./cron/alert.cron');
  const alertCronInstance = new AlertCron();
  alertCronInstance.start();
} catch (error) {
  console.error('❌ Failed to start unified alert cron job:', error);
}

// Start watchlist cron job - SIMPLE DAILY SCAN
try {
  const WatchlistCron = require('./cron/watchlist.cron');
  const watchlistCron = new WatchlistCron();
  watchlistCron.start();
  console.log('✅ Daily Watchlist cron job started successfully (9:30 AM IST)');
} catch (error) {
  console.error('❌ Failed to start watchlist cron job:', error.message);
}


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
app.use('/api/watchlist', require('./routes/watchlist.routes'));

// Alert routes
app.use('/api/alerts', require('./routes/alert.routes'));

// Email routes
app.use('/api/email', require('./routes/email.routes'));

// Backtest routes
app.use('/api/backtest', require('./routes/backtest.routes'));

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

app.get('/api/yahoo/quote', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
    const quote = await yahoo.getQuote(symbol);
    res.json({ symbol, quote });
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
    const { calculateBasicIndicators } = require('./utils/simpleTechnicalDataFetcher');

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
    
    const indicators = calculateBasicIndicators(hist);
    if (!indicators) {
      return res.status(500).json({ error: 'Failed to calculate indicators' });
    }
    
    res.json({
      symbol: symbol.toUpperCase(),
      date: indicators.date,
      currentPrice: indicators.price,
      ema13: indicators.latest.ema13,
      ema20: indicators.latest.ema20,
      ema26: indicators.latest.ema26,
      ema50: indicators.latest.ema50,
      sma13: indicators.latest.sma13,
      sma20: indicators.latest.sma20,
      sma26: indicators.latest.sma26,
      sma50: indicators.latest.sma50,
      rsi14: indicators.latest.rsi,
      support: indicators.support,
      resistance: indicators.resistance,
      atr14: indicators.atr
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});