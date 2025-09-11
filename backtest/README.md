# 🎯 Ishastra Backtesting System

Complete backtesting framework for Ishastra trading strategies using real signal analysis.

## 📦 File Structure

```
backtest/
├── runBacktest.js              # Main entry point
├── backtestConfig.json         # Configuration file
├── package.json                # Dependencies
├── engine/
│   ├── signalGenerator.js      # Wrapper to call real signal analysis
│   ├── tradeSimulator.js       # Trade execution simulation
│   ├── loader.js               # Historical data loader
│   └── logger.js               # Logging and reporting
├── data/
│   └── candles/
│       ├── AAPL.json          # Historical OHLCV data per symbol
│       ├── MSFT.json
│       └── ...
└── logs/                       # Generated backtest logs
```

## 🚀 Quick Start

### 1. Prepare Historical Data
Place 5-year OHLCV data in JSON format:
```json
[
  {
    "date": "2019-01-02",
    "open": 154.89,
    "high": 158.85,
    "low": 154.23,
    "close": 157.92,
    "volume": 37039737
  }
]
```

### 2. Run Backtest

```bash
# Basic usage with default symbols
node runBacktest.js

# Custom symbols and date range
node runBacktest.js AAPL,MSFT,GOOGL 2020-01-01 2024-01-01

# Single symbol test
node runBacktest.js AAPL 2023-01-01 2024-01-01
```

### 3. Programmatic Usage

```javascript
const { IshastraBacktest } = require('./runBacktest');

const backtest = new IshastraBacktest();

const config = {
  symbols: ['AAPL', 'MSFT', 'GOOGL'],
  startDate: '2020-01-01',
  endDate: '2024-01-01'
};

const results = await backtest.runBacktest(config);
console.log(results.summary);
```

## ⚙️ How It Works

### Step 1: Signal Generation
- Uses real `getStockAnalysis()` method from `signal-analysis.controller.js`
- Analyzes each historical candle as if trading in real-time
- Only processes BUY/STRONG_BUY signals

### Step 2: Trade Simulation
- Entry: `execution.entryStrategy.entryZone.optimal`
- Stop Loss: `execution.exitStrategy.stopLoss.initial` 
- Target: `execution.targets.moderate`
- Position Size: `execution.positionSizing.shares`

### Step 3: Exit Conditions
- **STOP**: Price hits stop loss → Exit immediately
- **TARGET**: Price hits target → Exit immediately  
- **TIME**: 22 days elapsed → Exit at market close

### Step 4: Metrics Calculation
- **R-Multiple**: `(Exit - Entry) / (Entry - Stop)`
- **P&L**: `(Exit - Entry) × Shares`
- **Win Rate**: `Winning Trades / Total Trades`

## 📊 Database Schema

Trades are saved to `BacktestTrade` table:

```sql
CREATE TABLE BacktestTrade (
  id          SERIAL PRIMARY KEY,
  symbol      VARCHAR(20) NOT NULL,
  entryDate   TIMESTAMP NOT NULL,
  exitDate    TIMESTAMP NOT NULL,
  entryPrice  DECIMAL(10,2) NOT NULL,
  exitPrice   DECIMAL(10,2) NOT NULL,
  stopLoss    DECIMAL(10,2) NOT NULL,
  target      DECIMAL(10,2) NOT NULL,
  reason      VARCHAR(10) NOT NULL, -- 'STOP' | 'TARGET' | 'TIME'
  RMultiple   DECIMAL(8,2) NOT NULL,
  system      VARCHAR(50) NOT NULL
);
```

## 💰 Capital Allocation

- **US Market**: $100,000 USD
- **India Market (.NS)**: ₹10,000,000 INR

## 📈 Sample Output

```
🎯 BACKTEST SUMMARY
==================================================
Duration: 45s
Total Trades: 127
Symbols Processed: 5
Date Range: 2020-01-01 to 2024-01-01

📊 PERFORMANCE METRICS
------------------------------
Win Rate: 68.5%
Avg R-Multiple: 1.34R
Best Trade: 8.2R
Worst Trade: -1.0R
Total P&L: $45,230
Avg P&L per Trade: $356

🎲 EXIT REASONS
--------------------
Target Hits: 45 (35.4%)
Stop Losses: 40 (31.5%)
Time Exits: 42 (33.1%)

📈 SYSTEM BREAKDOWN
--------------------
minervini_template_advanced: 127 trades, 1.34R avg
```

## 🔧 Configuration Options

Edit `backtestConfig.json`:

```json
{
  "backtest": {
    "symbols": ["AAPL", "MSFT", "GOOGL"],
    "dateRange": {
      "startDate": "2019-01-01",
      "endDate": "2024-12-31"
    },
    "execution": {
      "maxHoldDays": 22
    }
  }
}
```

## 🚨 Requirements

1. **Historical Data**: 5-year OHLCV data in JSON format
2. **Database**: Prisma with `BacktestTrade` model
3. **Signal System**: Working `getStockAnalysis()` method
4. **Memory**: ~1GB RAM for large backtests

## 🎯 Usage Examples

### Test Single Stock
```bash
node runBacktest.js AAPL 2023-01-01 2024-01-01
```

### Batch Test US Market
```bash
node runBacktest.js AAPL,MSFT,GOOGL,AMZN,TSLA 2020-01-01 2024-01-01
```

### Test Indian Market
```bash
node runBacktest.js RELIANCE.NS,TCS.NS,HDFCBANK.NS 2020-01-01 2024-01-01
```

## 📋 TODO / Future Improvements

- [ ] Multi-threading for faster processing
- [ ] Portfolio-level position sizing
- [ ] Advanced risk management rules
- [ ] CSV export functionality
- [ ] Real-time progress monitoring
- [ ] Performance attribution analysis
- [ ] Drawdown analysis
- [ ] Monte Carlo simulation

## 🐛 Troubleshooting

**No trades generated?**
- Check if historical data exists in `/data/candles/`
- Verify signal system is working: `getStockAnalysis(['AAPL'])`
- Ensure date range has sufficient data (>252 candles)

**Database errors?**
- Verify Prisma client is configured
- Check `BacktestTrade` model exists
- Ensure database connection works

**Out of memory?**
- Reduce symbol count or date range
- Process in smaller batches
- Check for memory leaks in signal generation
