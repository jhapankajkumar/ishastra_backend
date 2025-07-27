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
app.use('/api/tags', require('./routes/tag.routes'));
app.use('/api/exit-tactics', require('./routes/tactic.routes'));
app.use('/api/journals', require('./routes/journal.routes'));
app.use('/api/journal', require('./routes/chart.routes'));
app.use('/api/setups', require('./routes/setup.routes'));
// Authentication routes
app.use('/api/auth', require('./routes/auth.routes'));

// Technical indicators routes
app.use('/api/yahoo', require('./routes/indicators.routes'));

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

app.get('/api/yahoo/indicator', async (req, res) => {
  try {
    const { getLatestEMAValues } = require('./utils/technicalIndicators');
    const { getRSISignal, getEMAAlignment } = require('./routes/indicators.routes');
    const period1 = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000); // 90 days ago for EMA50
    const period2 = Math.floor(Date.now() / 1000); // now
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
    let hist;
    if (period1 && period2) {
      hist = await yahoo.getHistorical(symbol, period1, period2);
    } else {
      hist = await yahoo.getHistorical(symbol, '3mo'); // Increased from 2mo to 3mo
    }
    // Debug: log last date in historical data
    if (hist && hist.length > 0) {
      console.log(`Indicator data for ${symbol}: last date =`, hist[hist.length - 1].date);
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