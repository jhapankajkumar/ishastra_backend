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
function calculateATR(data, period = 14) {
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
  // ATR = SMA of TRs
  const atrs = [];
  for (let i = 0; i <= trs.length - period; i++) {
    const slice = trs.slice(i, i + period);
    atrs.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return atrs.length > 0 ? atrs[atrs.length - 1] : null;
}

app.get('/api/yahoo/atr', async (req, res) => {
  try {
    const { symbol, period1, period2 } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
    let hist;
    if (period1 && period2) {
      hist = await yahoo.getHistorical(symbol, period1, period2);
    } else {
      hist = await yahoo.getHistorical(symbol, '2mo');
    }
    // Always use 14-day ATR
    let atr = calculateATR(hist, 14);
    if (atr !== null && atr !== undefined) {
      atr = Math.round(atr); // Remove decimals
    }
    res.json({ symbol, atr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});